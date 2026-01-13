"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getUserChats, ChatRoom, UserProfile } from "@/lib/services";
import Link from "next/link";
import Image from "next/image";
import { FaComments } from "react-icons/fa";
import { useLanguage } from "@/lib/i18n_context";

export default function ChatListPage() {
    const { user, loading } = useAuth();
    const { t } = useLanguage();
    const [chats, setChats] = useState<(ChatRoom & { otherUser?: UserProfile })[]>([]);
    const [chatsLoading, setChatsLoading] = useState(true);

    useEffect(() => {
        if (!loading && user) {
            getUserChats(user.id)
                .then((data) => {
                    setChats(data);
                })
                .catch(err => {
                    console.error("Error fetching chats:", err);
                })
                .finally(() => {
                    setChatsLoading(false);
                });
        }
    }, [user, loading]);

    const pageLoading = loading || (!!user && chatsLoading);

    if (pageLoading || loading) return (
        <div className="flex justify-center items-center h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    if (!user) return (
        <div className="text-center py-20 px-4">
            <h2 className="text-xl font-bold text-gray-900 mb-2">{t("chat.loginRequired")}</h2>
            <Link href="/auth" className="text-primary hover:underline">{t("nav.login")}</Link>
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto py-8 px-4 h-full">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white flex items-center gap-2">
                <FaComments className="text-primary dark:text-primary-foreground" /> {t("chat.messages")}
            </h1>

            {chats.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 dark:bg-slate-900 rounded-2xl border border-dashed border-gray-200 dark:border-slate-800">
                    <p className="text-gray-500 dark:text-gray-400 mb-4">{t("chat.noMessages")}</p>
                    <Link href="/" className="bg-white dark:bg-slate-800 text-gray-900 dark:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors shadow-sm font-medium text-sm">
                        {t("nav.findLawyer")}
                    </Link>
                </div>
            ) : (
                <div className="space-y-3">
                    {chats.map(chat => (
                        <Link href={`/chat/${chat.id}`} key={chat.id} className="block group" aria-label={`Chat with ${chat.otherUser?.name || "Unknown User"}`}>
                            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex items-center gap-4 group-hover:border-primary/20 dark:group-hover:border-slate-700">
                                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                                    {chat.otherUser?.photoUrl ? (
                                        <Image src={chat.otherUser.photoUrl} alt={chat.otherUser.name || "User profile picture"} fill sizes="48px" className="object-cover" />
                                    ) : (
                                        <span className="text-lg font-bold text-slate-400">{chat.otherUser?.name?.[0] || "?"}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline mb-1">
                                        <h3 className="font-semibold text-gray-900 dark:text-white truncate pr-2 group-hover:text-primary transition-colors">
                                            {chat.otherUser?.name || "Unknown User"}
                                        </h3>
                                        {chat.updatedAt && (
                                            <span className="text-xs text-gray-400 flex-shrink-0">
                                                {new Date(chat.updatedAt.seconds * 1000).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                        {chat.lastMessage || <span className="italic text-gray-400">No messages yet</span>}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
