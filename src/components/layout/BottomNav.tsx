"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n_context";
import { FaHome, FaSearch, FaHeart, FaUser, FaComments, FaBriefcase } from "react-icons/fa";
import clsx from "clsx";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";

export default function BottomNav() {
    const { user, userProfile } = useAuth();
    const { t } = useLanguage();
    const unreadCount = useUnreadMessages();
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 sm:hidden pb-safe shadow-2xl">
            <div className="flex justify-around items-center h-16 px-2">
                {/* 1. Home */}
                <BottomNavItem
                    href="/"
                    active={isActive('/')}
                    icon={<FaHome size={20} />}
                    label={t("nav.findLawyer").split(" ")[0]}
                />

                {/* 2. Requests */}
                {user && userProfile?.role === 'client' && (
                    <BottomNavItem
                        href="/requests/client"
                        active={isActive('/requests/client')}
                        icon={<FaBriefcase size={20} />} // Reusing briefcase or finding another
                        label="Requests"
                    />
                )}
                {user && userProfile?.role === 'lawyer' && (
                    <BottomNavItem
                        href="/requests/feed"
                        active={isActive('/requests/feed')}
                        icon={<FaSearch size={20} />}
                        label="Requests"
                    />
                )}

                {/* 3. Favorites (Client) or CRM (Lawyer) */}
                {user && userProfile?.role === 'client' && (
                    <BottomNavItem
                        href="/favorites"
                        active={isActive('/favorites')}
                        icon={<FaHeart size={20} />}
                        label={t("nav.saved")}
                    />
                )}

                {user && userProfile?.role === 'lawyer' && (
                    <BottomNavItem
                        href="/dashboard/crm"
                        active={pathname?.startsWith('/dashboard/crm')}
                        icon={<FaBriefcase size={20} />}
                        label="CRM"
                    />
                )}

                {/* 3. Messages / Chat */}
                <BottomNavItem
                    href="/chat"
                    active={isActive('/chat')}
                    icon={<FaComments size={20} />}
                    label={t("chat.messages") || "Chat"}
                    badge={unreadCount > 0 ? unreadCount : undefined}
                />

                {/* 4. Profile / Dashboard */}
                <BottomNavItem
                    href={user && userProfile?.role === 'lawyer' ? "/dashboard" : (user && userProfile?.role === 'admin' ? "/admin" : "/profile")}
                    active={isActive('/profile') || isActive('/dashboard') || isActive('/admin') || isActive('/auth')}
                    icon={user && userProfile?.role === 'lawyer' ? <FaUser size={20} /> : <FaUser size={20} />}
                    label={t("nav.profile")}
                />
            </div>
        </div>
    );
}

function BottomNavItem({ href, active, icon, label, badge }: { href: string, active: boolean, icon: React.ReactNode, label: string, badge?: number }) {
    return (
        <Link
            href={href}
            className={clsx(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-all relative",
                active
                    ? "text-primary"
                    : "text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            )}
        >
            <div className={clsx("transition-transform duration-200 relative", active && "scale-110")}>
                {icon}
                {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center border-2 border-white dark:border-slate-900">
                        {badge > 99 ? '99+' : badge}
                    </span>
                )}
            </div>
            <span className="text-[10px] font-medium truncate max-w-[64px]">{label}</span>
        </Link>
    );
}
