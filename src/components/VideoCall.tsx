"use client";

import { useEffect, useRef, useState } from "react";
import { FaMicrophone, FaMicrophoneSlash, FaPhoneSlash, FaVideo, FaVideoSlash } from "react-icons/fa";
import { CallSignal, signalCall, subscribeToCallEvents } from "@/lib/services"; // We will update imports
import { UserProfile } from "@/lib/services";

interface VideoCallProps {
    chatId: string; // The other user's ID
    myId: string;
    myName: string; // Passed for caller ID
    isCaller: boolean;
    onEndCall: () => void;
    otherUser: UserProfile | null;
    incomingSignal?: CallSignal; // If we are answering
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bufferedCandidates?: any[];
}

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ]
};

export default function VideoCall({ chatId, myId, myName, isCaller, onEndCall, otherUser, incomingSignal, bufferedCandidates }: VideoCallProps) {
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [status, setStatus] = useState(isCaller ? "Calling..." : "Connecting...");

    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const peerRef = useRef<RTCPeerConnection | null>(null);

    // Queue for candidates arriving before remote description
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pendingCandidates = useRef<any[]>([]);

    const [debugLogs, setDebugLogs] = useState<string[]>([]);
    const [iceState, setIceState] = useState<RTCIceConnectionState>('new');

    const addLog = (msg: string) => {
        console.log(msg);
        setDebugLogs(prev => [...prev.slice(-50), msg]); // Keep last 50 logs
    };

    useEffect(() => {
        // Initialize PeerConnection immediately
        const peer = new RTCPeerConnection(ICE_SERVERS);
        peerRef.current = peer;

        addLog(`Init Peer. IceServers: ${ICE_SERVERS.iceServers.length}`);

        // Helper to process queued candidates
        const processPendingCandidates = async () => {
            if (peer.signalingState === 'closed') return;
            addLog(`Processing ${pendingCandidates.current.length} queued candidates`);
            while (pendingCandidates.current.length > 0) {
                const candidate = pendingCandidates.current.shift();
                try {
                    await peer.addIceCandidate(new RTCIceCandidate(candidate));
                    addLog("Added queued candidate success");
                } catch (e) {
                    addLog(`Error adding queued candidate: ${e}`);
                }
            }
        };

        // Handle ICE candidates
        peer.onicecandidate = (event) => {
            if (event.candidate) {
                const candidateStr = event.candidate.candidate;
                if (candidateStr.includes('127.0.0.1') || candidateStr.includes('::1') || candidateStr.includes('0.0.0.0')) {
                    addLog("⚠️ WARNING: You are broadcasting 'localhost' IP!");
                    addLog("Remote cannot connect to this.");
                    addLog("👉 Open this site via your LAN IP (e.g. 192.168.x.x) instead of localhost.");
                }

                addLog(`Sending ICE candidate (${event.candidate.type})`);
                signalCall(chatId, { type: 'ice-candidate', payload: event.candidate, senderId: myId });
            } else {
                addLog("Finished gathering ICE candidates");
            }
        };

        // Handle remote track
        peer.ontrack = (event) => {
            addLog(`Remote track received: ${event.track.kind} (${event.track.enabled ? 'enabled' : 'disabled'})`);
            const remoteStream = event.streams[0] || new MediaStream([event.track]);
            setRemoteStream(remoteStream);
            setStatus("Connected");
        };

        peer.oniceconnectionstatechange = () => {
            addLog(`ICE State: ${peer.iceConnectionState}`);
            setIceState(peer.iceConnectionState);
        };

        peer.onconnectionstatechange = () => {
            addLog(`Connection State: ${peer.connectionState}`);
            if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed') {
                onEndCall();
            }
        };

        // Pre-fill queue with prop-buffered candidates (for Receiver)
        if (bufferedCandidates && bufferedCandidates.length > 0) {
            addLog(`Buffered candidates from props: ${bufferedCandidates.length}`);
            pendingCandidates.current.push(...bufferedCandidates);
        }

        // Subscribe to signaling events for THIS active call
        const unsubscribe = subscribeToCallEvents(myId, async (signal: CallSignal) => {
            addLog(`Signal raw: ${signal.type} from ${signal.senderId}`);

            // Filter: Ignore signals not from our peer
            if (signal.senderId !== chatId) {
                addLog(`⚠️ Ignored signal from mismatched ID: ${signal.senderId} (Expected: ${chatId})`);
                return;
            }

            addLog(`Signal received: ${signal.type}`);

            try {
                if (signal.type === 'end-call') {
                    onEndCall();
                } else if (signal.type === 'ice-candidate') {
                    // Critical: Only add if remote description is set. Otherwise queue.
                    if (peer.remoteDescription) {
                        addLog(`Adding ICE candidate (${signal.payload.candidate.split(' ')[4]})`); // Log the IP part
                        try {
                            await peer.addIceCandidate(new RTCIceCandidate(signal.payload));
                        } catch (e) { addLog("Error adding candidate: " + e); }
                    } else {
                        addLog("Queueing candidate (no remote desc)");
                        pendingCandidates.current.push(signal.payload);
                    }
                } else if (signal.type === 'answer' && isCaller) {
                    addLog("Setting Remote Desc (Answer)");
                    await peer.setRemoteDescription(new RTCSessionDescription(signal.payload));
                    if ((peer.signalingState as string) === 'closed') return;
                    await processPendingCandidates(); // Flush queue
                }
            } catch (e) {
                addLog(`Error signal ${signal.type}: ${e}`);
            }
        });

        // Start Media and Negotiation
        const setupMediaAndSignaling = async () => {
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                    setStatus("Error: HTTPS/Localhost required");
                    addLog("Error: No mediaDevices");
                    alert("Camera blocked. Use localhost or HTTPS.");
                    return;
                }

                addLog("Requesting User Media...");
                const localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                addLog(`Got Local Stream: ${localStream.getTracks().length} tracks`);

                // Check if peer was closed during the await (e.g. user cancelled/unmounted)
                if ((peer.signalingState as string) === 'closed') {
                    console.log("Peer closed while getting media, aborting.");
                    localStream.getTracks().forEach(t => t.stop()); // Stop the stream we just got
                    return;
                }

                setStream(localStream);
                if (localVideoRef.current) localVideoRef.current.srcObject = localStream;

                // Add tracks to peer
                localStream.getTracks().forEach(track => {
                    peer.addTrack(track, localStream);
                    addLog(`Added local track: ${track.kind}`);
                });

                // Negotiation Logic
                if (isCaller) {
                    addLog("Creating Offer...");
                    const offer = await peer.createOffer();
                    if ((peer.signalingState as string) === 'closed') return; // Double check
                    await peer.setLocalDescription(offer);
                    addLog("Local Desc Set (Offer)");
                    await signalCall(chatId, { type: 'offer', payload: offer, senderId: myId, senderName: myName });
                    addLog("Sent Offer");
                } else if (incomingSignal?.type === 'offer') {
                    // We are answering
                    addLog("Setting Remote Desc (Offer)");
                    await peer.setRemoteDescription(new RTCSessionDescription(incomingSignal.payload));
                    if ((peer.signalingState as string) === 'closed') return;

                    // Process candidates that were queued (from prop + any that arrived just now)
                    await processPendingCandidates();

                    addLog("Creating Answer...");
                    const answer = await peer.createAnswer();
                    if ((peer.signalingState as string) === 'closed') return;
                    await peer.setLocalDescription(answer);
                    addLog("Local Desc Set (Answer)");
                    await signalCall(chatId, { type: 'answer', payload: answer, senderId: myId });
                    addLog("Sent Answer");
                }
            } catch (err) {
                console.error("Error prioritizing media:", err);
                addLog(`Setup Error: ${err}`);
                setStatus("Failed to access media");
            }
        };

        setupMediaAndSignaling();

        return () => {
            unsubscribe();
            endCallCleanup();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Helper for cleanup (removed startCall since it's now inline)
    function endCallCleanup() {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (peerRef.current) {
            peerRef.current.close();
        }
    }

    // Sync remote stream to video element
    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            addLog(`Attaching remote stream: ${remoteStream.id} (${remoteStream.getVideoTracks().length} video tracks)`);
            remoteVideoRef.current.srcObject = remoteStream;
            remoteVideoRef.current.play().then(() => addLog("Video playing")).catch(e => addLog("Autoplay failed: " + e));
        }
    }, [remoteStream]);

    // Monitor Video Playback Stats
    useEffect(() => {
        const interval = setInterval(() => {
            if (remoteVideoRef.current) {
                const v = remoteVideoRef.current;
                addLog(`Video Stats: ${v.videoWidth}x${v.videoHeight}, readyState:${v.readyState}, paused:${v.paused}, muted:${v.muted}`);
                if (v.paused && v.readyState >= 2) {
                    addLog("Attempting periodic play()...");
                    v.play().catch(e => addLog("Periodic play failed: " + e));
                }
            }
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // Expose a method to handle incoming signals (ice candidates, answer) from parent
    // But since this is a component, the parent will receive signals.
    // We need a way to pass them down.
    // ACTUALLY: The parent ChatPage subscribes. It should pass new signals to this component.
    // FOR SIMPLICITY: We will export a helper or just listen to a window event?
    // Better: use an effect dependent on a 'lastSignal' prop.

    // Let's rely on the parent updating a `lastSignal` prop?
    // Or, since we broke out the component, maybe we should move subscription INSIDE here?
    // No, ChatPage needs to listen for "request-call" to even MOUNT this component.
    // Once mounted, this component can handle the rest of the 'offer/answer/ice' exchange?
    // YES. If we move subscription here, we might miss signals sent before mount.
    // BUT, the 'offer' is passed as initial prop.
    // Subsequent signals (ICE, Answer) will come to ChatPage.
    // ChatPage should pass them down.

    return (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center">
            {/* Debug Overlay */}
            <div className="absolute top-4 left-4 bg-black/50 text-green-400 text-xs p-2 rounded z-50 pointer-events-none max-w-sm overflow-hidden font-mono">
                {debugLogs.map((log, i) => <div key={i}>{log}</div>)}
            </div>

            <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-gray-800">
                {/* Remote Video */}
                <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    muted // Critical for autoplay!
                    className="w-full h-full object-cover"
                    onLoadedMetadata={() => {
                        if (remoteVideoRef.current && remoteStream) {
                            addLog("Metadata loaded, attempting play");
                            remoteVideoRef.current.play().catch(e => addLog("Play failed on metadata: " + e));
                        }
                    }}
                />

                {/* Status Overlay */}
                {!remoteStream && (
                    <div className="absolute inset-0 flex items-center justify-center flex-col gap-4">
                        <div className="h-24 w-24 rounded-full bg-gray-800 flex items-center justify-center text-4xl font-bold text-white">
                            {otherUser?.name?.[0] || "?"}
                        </div>
                        <p className="text-white text-xl animate-pulse">{status}</p>
                    </div>
                )}

                {/* Local Video (PIP) */}
                <div className="absolute bottom-4 right-4 w-48 aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-700 shadow-lg">
                    <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Secure Origin / Media Error Help */}
                {status.includes("Error: HTTPS") && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 p-8 text-center overflow-y-auto">
                        <div className="bg-gray-900 border border-blue-500 p-6 rounded-xl max-w-lg w-full text-left">
                            <h3 className="text-xl font-bold text-blue-400 mb-4">📸 Camera Access Blocked</h3>
                            <p className="text-white mb-4">
                                Browsers block camera access on <b>http://</b> sites (except localhost).
                                To test this on your network, you must tell Chrome to trust this connection.
                            </p>

                            <div className="bg-gray-800 p-4 rounded mb-4 text-sm font-mono text-gray-300">
                                <ol className="list-decimal pl-4 space-y-2">
                                    <li>Open a new tab and go to: <br /><span className="text-yellow-400 select-all">chrome://flags/#unsafely-treat-insecure-origin-as-secure</span></li>
                                    <li>Enable the flag named <b>&quot;Insecure origins treated as secure&quot;</b>.</li>
                                    <li>In the text box below it, enter your current URL:<br />
                                        <span className="text-green-400 select-all font-bold">{typeof window !== 'undefined' ? window.location.origin : 'http://192.x.x.x:3000'}</span>
                                    </li>
                                    <li>Click <b>Relaunch</b> at the bottom right.</li>
                                </ol>
                            </div>

                            <p className="text-gray-400 text-xs text-center">
                                After relaunching, return here and refresh the page.
                            </p>
                        </div>
                    </div>
                )}


                {/* Localhost Warning */}
                {typeof window !== 'undefined' && window.location.hostname === 'localhost' && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-8 text-center">
                        <div className="bg-red-900/50 border border-red-500 p-6 rounded-xl max-w-md">
                            <h3 className="text-xl font-bold text-red-200 mb-2">⚠️ Connection Issue Detected</h3>
                            <p className="text-white mb-4">
                                Video calls <b>will not work</b> on <code>localhost</code> when connecting with other devices.
                            </p>
                            <p className="text-gray-300 text-sm">
                                Please change the URL in your browser to use your computer IP address (e.g. <code>192.168.x.x:3000</code>).
                            </p>
                        </div>
                    </div>
                )}

                {/* Connection Status Warning */}
                {(iceState === 'checking' || iceState === 'failed' || iceState === 'disconnected') && (
                    <div className={`absolute top-20 left-1/2 -translate-x-1/2 ${iceState === 'failed' ? 'bg-red-900/90 border-red-500' : 'bg-yellow-900/80 border-yellow-500'} border text-white px-6 py-4 rounded-xl z-50 text-center shadow-lg backdrop-blur max-w-[90%]`}>
                        <p className="font-bold mb-1">
                            {iceState === 'failed' ? '❌ Connection Failed' : '📡 Connecting...'}
                        </p>
                        <p className="text-sm border-b border-white/20 pb-2 mb-2">
                            {iceState === 'failed' ? 'The network is blocking the video.' : 'Stuck connecting? Try these:'}
                        </p>
                        <ul className="text-xs text-left list-disc pl-4 mt-2 space-y-1 mb-3">
                            <li><b>Solution 1:</b> Turn off <b>&quot;Private Firewall&quot;</b> on PC.</li>
                            <li><b>Solution 2:</b> Use a <b>Mobile Hotspot</b> (Connect PC to Phone&apos;s Hotspot). This bypasses router blocks.</li>
                            <li><b>Solution 3:</b> Disable <b>VPNs</b> or <b>Antivirus Firewall</b>.</li>
                        </ul>
                        <button
                            onClick={() => peerRef.current?.restartIce()}
                            className="bg-white/20 hover:bg-white/30 text-white text-xs px-3 py-1.5 rounded transition"
                        >
                            🔄 Retry Connection
                        </button>
                    </div>
                )}

                {/* Controls */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 z-40 bg-gray-900/80 p-4 rounded-full backdrop-blur-md">
                    <button
                        aria-label={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                        onClick={() => {
                            const enabled = !isMuted;
                            setIsMuted(enabled);
                        }}
                        className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                        {isMuted ? <FaMicrophoneSlash className="text-white" /> : <FaMicrophone className="text-white" />}
                    </button>

                    <button
                        aria-label="End Call"
                        onClick={() => {
                            // End call signal
                            signalCall(chatId, { type: 'end-call', senderId: myId });
                            onEndCall();
                        }}
                        className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
                    >
                        <FaPhoneSlash className="text-white text-xl" />
                    </button>

                    <button
                        aria-label={isVideoOff ? "Turn Video On" : "Turn Video Off"}
                        onClick={() => {
                            const enabled = !isVideoOff;
                            setIsVideoOff(enabled);
                            stream?.getVideoTracks().forEach(track => track.enabled = !enabled);
                        }}
                        className={`p-4 rounded-full transition-colors ${isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                    >
                        {isVideoOff ? <FaVideoSlash className="text-white" /> : <FaVideo className="text-white" />}
                    </button>
                </div>
            </div>
        </div>
    );


}
