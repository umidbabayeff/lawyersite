"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { CallSignal, subscribeToCallEvents, getUserProfile, UserProfile } from "@/lib/services";
import VideoCall from "./VideoCall";
import Image from "next/image";

export default function GlobalCallManager() {
    const { user, userProfile } = useAuth();

    const [isIncomingCall, setIsIncomingCall] = useState(false);
    const [isCallActive, setIsCallActive] = useState(false);
    const [incomingSignal, setIncomingSignal] = useState<CallSignal | undefined>(undefined);
    const [callerProfile, setCallerProfile] = useState<UserProfile | null>(null);

    // If we are starting a call, we need to know who we are calling. 
    // Usually, we start a call from a Chat Page. 
    // The Chat Page should tell US to start the call.
    // For now, let's keep "Start Call" logic in ChatPage, BUT ChatPage should communicate with this Manager?
    // OR: Chat Page just renders VideoCall?
    // Problem: If I navigate away from Chat Page during a call, the call dies.
    // Ideally, Call Manager handles ALL calls.

    // SIMPLE FIX FIRST: Call Manager handles INCOMING calls.
    // OUTGOING calls are still handled by Chat Page for now (unless we move that too).
    // If we want persistent calls during navigation, we MUST move outgoing to here.
    // Let's focus on INCOMING first as that's the user complaint.

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [iceCandidates, setIceCandidates] = useState<any[]>([]);

    // Use refs to track state without triggering re-subscription
    const isCallActiveRef = useRef(isCallActive);
    const isIncomingCallRef = useRef(isIncomingCall);

    useEffect(() => {
        isCallActiveRef.current = isCallActive;
        isIncomingCallRef.current = isIncomingCall;
    }, [isCallActive, isIncomingCall]);

    useEffect(() => {
        if (!user) return;

        console.log("GlobalCallManager: Subscribing to events for", user.id);
        const unsubscribe = subscribeToCallEvents(user.id, async (signal) => {
            console.log("GlobalCallManager received:", signal.type);

            if (signal.type === 'offer') {
                if (isCallActiveRef.current) return;

                setIncomingSignal(signal);
                setIceCandidates([]); // Clear previous candidates

                // Fetch caller profile
                const profile = await getUserProfile(signal.senderId);
                setCallerProfile(profile);
                setIsIncomingCall(true);

            } else if (signal.type === 'ice-candidate') {
                // Buffer candidates while ringing
                if (!isCallActiveRef.current) {
                    setIceCandidates(prev => [...prev, signal.payload]);
                }
            } else if (signal.type === 'end-call') {
                setIsCallActive(false);
                setIsIncomingCall(false);
                setIncomingSignal(undefined);
                setIceCandidates([]);
            }
        });

        return () => unsubscribe();
    }, [user]); // Only subscribe once on mount (per user)

    const handleAcceptCall = () => {
        setIsIncomingCall(false);
        setIsCallActive(true);
    };

    const handleRejectCall = () => {
        setIsIncomingCall(false);
        setIncomingSignal(undefined);
    };

    const handleEndCall = () => {
        setIsCallActive(false);
        setIsIncomingCall(false);
        setIncomingSignal(undefined);
    };

    // If Call is Active (because we accepted), we render VideoCall.
    // BUT: VideoCall needs to receive ICE candidates that come in AFTER the offer.
    // Since `subscribeToCallEvents` is here, WE receive them.
    // We need to pass them to VideoCall. 
    // Use a context? Or just pass "lastSignal"?
    // Let's refactor VideoCall to handle its own subscription? 
    // No, multiple subscriptions to same channel might be duplicative/messy.
    // Better: Helper function in VideoCall to subscribe?

    // Actually, for the "Missing ICE Candidates" issue:
    // WebRTC connection usually fails if ICE candidates aren't exchanged.
    // My previous ChatPage implementation also had this flaw? 
    // "answer and ice-candidate are handled by the VideoCall component directly" -- I wrote this in comments but did I implement it?
    // Checking VideoCall.tsx... NO. It only takes `incomingSignal`.
    // It does NOT have a subscription.

    // DECISION: Move subscription INTO VideoCall.tsx.
    // Only "Offer" needs to be caught globally to SHOW the component.
    // Once `VideoCall` is mounted, IT should manage the subscription for the duration of the call.
    // This is much cleaner.

    // So GlobalCallManager listens for OFFER.
    // on Accept -> Mounts VideoCall.
    // VideoCall mounts -> Subscribes to `call:${myId}` -> Handles ICE/Answer/End.

    return (
        <>
            {isIncomingCall && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-xl max-w-sm w-full mx-4 border border-gray-100 dark:border-slate-800 animate-in fade-in zoom-in duration-300">
                        <div className="text-center">
                            <div className="w-20 h-20 bg-primary/10 dark:bg-slate-800 rounded-full mx-auto flex items-center justify-center mb-4 text-3xl font-bold text-primary dark:text-primary-foreground overflow-hidden">
                                {callerProfile?.photoUrl ? (
                                    <Image src={callerProfile.photoUrl} alt="Caller" fill className="object-cover" />
                                ) : (
                                    callerProfile?.name?.[0] || "?"
                                )}
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{callerProfile?.name || "Unknown Caller"}</h3>
                            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">Incoming Video Call...</p>

                            <div className="flex gap-3 justify-center">
                                <button
                                    onClick={handleRejectCall}
                                    className="px-6 py-2 rounded-full bg-red-100 text-red-600 font-semibold hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 transition-colors"
                                >
                                    Decline
                                </button>
                                <button
                                    onClick={handleAcceptCall}
                                    className="px-6 py-2 rounded-full bg-green-500 text-white font-semibold hover:bg-green-600 shadow-lg shadow-green-500/20 transition-colors"
                                >
                                    Accept
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isCallActive && incomingSignal && user && (
                <VideoCall
                    chatId={incomingSignal.senderId} // The caller is the other person
                    myId={user.id}
                    myName={userProfile?.name || "User"}
                    isCaller={false} // We are accepting
                    otherUser={callerProfile}
                    incomingSignal={incomingSignal}
                    bufferedCandidates={iceCandidates}
                    onEndCall={handleEndCall}
                />
            )}
        </>
    );
}
