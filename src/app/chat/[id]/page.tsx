"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { subscribeToMessages, sendMessage, ChatMessage, markChatRead, uploadChatAttachment } from "@/lib/firebase/services";
import { FaPaperPlane, FaArrowLeft, FaPaperclip, FaFile } from "react-icons/fa";
import Image from "next/image";

export default function ChatPage() {
    const { user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const chatId = params?.id as string;

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState("");
    // const [otherUser, setOtherUser] = useState<UserProfile | null>(null); // This was commented out, keeping it that way.

    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (!user || !chatId) return;

        // Subscribe to messages
        const unsubscribe = subscribeToMessages(chatId, (msgs) => {
            setMessages(msgs);
            markChatRead(chatId, user.uid); // Mark as read when messages load/update
            // Scroll to bottom
            setTimeout(() => {
                scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        });

        return () => unsubscribe();
    }, [chatId, user]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        try {
            await sendMessage(chatId, user.uid, newMessage);
            setNewMessage("");
        } catch (error) {
            console.error(error);
        }
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !user) return;

        setIsUploading(true);
        try {
            const file = e.target.files[0];
            const url = await uploadChatAttachment(file, chatId);
            const type = file.type.startsWith('image/') ? 'image' : 'file';

            await sendMessage(chatId, user.uid, type === 'image' ? 'Sent an image' : 'Sent a file', {
                type,
                url,
                name: file.name
            });
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload file");
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.20))] max-w-3xl mx-auto bg-white dark:bg-slate-900 shadow-sm sm:rounded-2xl sm:my-8 overflow-hidden border border-gray-100 dark:border-slate-800">
            {/* Header */}
            <div className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 p-4 flex items-center gap-4 shadow-sm z-10">
                <button onClick={() => router.back()} aria-label="Go Back" className="text-gray-500 dark:text-gray-400 hover:text-primary transition-colors">
                    <FaArrowLeft />
                </button>
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 dark:bg-slate-800 rounded-full flex items-center justify-center text-primary dark:text-primary-foreground font-bold">
                        {/* Placeholder for other user avatar */}
                        C
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900 dark:text-white">Chat</h2>
                        <p className="text-xs text-green-500 flex items-center gap-1">
                            <span className="block h-2 w-2 rounded-full bg-green-500"></span> Online
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
                {messages.map((msg) => {
                    const isMe = msg.senderId === user?.uid;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${isMe
                                ? 'bg-primary text-primary-foreground rounded-br-none'
                                : 'bg-white dark:bg-slate-900 text-gray-800 dark:text-gray-200 border border-gray-100 dark:border-slate-800 rounded-bl-none'
                                }`}>
                                {msg.type === 'image' && msg.fileUrl ? (
                                    <div className="mb-2 relative h-60 w-full">
                                        <Image src={msg.fileUrl} alt="Attachment" fill className="rounded-lg object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                                    </div>
                                ) : msg.type === 'file' && msg.fileUrl ? (
                                    <div className="mb-2">
                                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-black/5 dark:bg-white/10 p-2 rounded-lg hover:bg-black/10 dark:hover:bg-white/20 transition-colors">
                                            <div className="bg-white dark:bg-slate-800 p-2 rounded-full text-primary dark:text-primary-foreground">
                                                <FaFile />
                                            </div>
                                            <span className="text-xs underline truncate max-w-[150px]">{msg.fileName || 'Document'}</span>
                                        </a>
                                    </div>
                                ) : null}
                                <p className="text-sm">{msg.text}</p>
                                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-primary-foreground/70' : 'text-gray-400 dark:text-gray-500'}`}>
                                    {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '...'}
                                </p>
                            </div>
                        </div>
                    );
                })}
                <div ref={scrollRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
                <form onSubmit={handleSend} className="flex gap-2">
                    <input
                        type="text"
                        value={newMessage}
                        aria-label="Type a message"
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 border border-gray-200 dark:border-slate-700 rounded-full px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all placeholder-gray-400"
                    />
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        aria-label="Upload File"
                        onChange={handleFileSelect}
                        accept="image/*,.pdf,.doc,.docx"
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        aria-label="Attach File"
                        className="bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 h-10 w-10 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                        {isUploading ? <div className="animate-spin h-4 w-4 border-2 border-gray-400 border-t-transparent rounded-full" /> : <FaPaperclip />}
                    </button>
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        aria-label="Send Message"
                        className="bg-primary text-primary-foreground h-10 w-10 rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/20"
                    >
                        <FaPaperPlane className="text-sm" />
                    </button>
                </form>
            </div>
        </div >
    );
}
