"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n_context";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useState, useEffect } from "react";

import { useUnreadMessages } from "@/hooks/useUnreadMessages";

export default function Navbar() {
    const { user, userProfile, logout } = useAuth();
    const { language, setLanguage, t } = useLanguage();
    const unreadCount = useUnreadMessages();
    const pathname = usePathname();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setTimeout(() => setMounted(true), 0);
    }, []);

    const isActive = (path: string) => pathname === path;

    return (
        <>
            <nav className="glass-nav sticky top-0 z-50 transition-all duration-300">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-20 items-center">
                        {/* Logo */}
                        <div className="flex items-center">
                            <Link href="/" className="flex-shrink-0 flex items-center gap-1.5 sm:gap-2 group">
                                <div className="h-7 w-7 sm:h-8 sm:w-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-serif font-bold text-lg sm:text-xl group-hover:bg-accent transition-colors duration-300">
                                    L
                                </div>
                                <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground group-hover:text-primary/90 transition-colors">
                                    LawyerFind
                                </span>
                            </Link>
                        </div>

                        <div className="flex items-center sm:hidden gap-4">
                            <div className="flex items-center gap-0.5 sm:gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 sm:p-1 text-[10px] sm:text-xs font-bold text-slate-600 dark:text-slate-300">
                                <button onClick={() => setLanguage('en')} className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md transition-all ${language === 'en' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary dark:text-white' : 'hover:text-primary dark:hover:text-white'}`}>EN</button>
                                <button onClick={() => setLanguage('ru')} className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md transition-all ${language === 'ru' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary dark:text-white' : 'hover:text-primary dark:hover:text-white'}`}>RU</button>
                                <button onClick={() => setLanguage('az')} className={`px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md transition-all ${language === 'az' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary dark:text-white' : 'hover:text-primary dark:hover:text-white'}`}>AZ</button>
                            </div>
                            <ThemeToggle />
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden sm:flex sm:items-center sm:space-x-8">
                            {(!user || userProfile?.role !== 'lawyer') && (
                                <NavLink href="/" active={isActive('/')}>{t("nav.findLawyer")}</NavLink>
                            )}
                            {mounted && user && userProfile?.role === 'client' && (
                                <>
                                    <NavLink href="/favorites" active={isActive('/favorites')}>{t("nav.saved")}</NavLink>
                                    <NavLink href="/requests/client" active={isActive('/requests/client')}>{t("nav.requests")}</NavLink>
                                    <NavLink href="/profile" active={isActive('/profile')}>{t("nav.profile")}</NavLink>
                                </>
                            )}
                            {mounted && user && userProfile?.role === 'lawyer' && (
                                <>
                                    <NavLink href="/dashboard" active={isActive('/dashboard')}>{t("nav.dashboard")}</NavLink>
                                    <NavLink href="/requests/feed" active={isActive('/requests/feed')}>{t("nav.requests")}</NavLink>
                                    <NavLink href="/dashboard/crm" active={isActive('/dashboard/crm')}>CRM</NavLink>
                                </>
                            )}
                            {mounted && (
                                <NavLink href="/chat" active={isActive('/chat')}>
                                    {t("chat.messages") || "Chat"}
                                    {unreadCount > 0 && (
                                        <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-block min-w-[1.25rem] text-center align-middle">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                </NavLink>
                            )}
                            {mounted && user && userProfile?.role === 'admin' && (
                                <NavLink href="/admin" active={isActive('/admin')}>{t("nav.admin")}</NavLink>
                            )}
                        </div>

                        <div className="hidden sm:flex items-center gap-4">
                            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 text-xs font-bold text-slate-600 dark:text-slate-300">
                                <button onClick={() => setLanguage('en')} className={`px-2 py-1 rounded-md transition-all ${language === 'en' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary dark:text-white' : 'hover:text-primary dark:hover:text-white'}`}>EN</button>
                                <button onClick={() => setLanguage('ru')} className={`px-2 py-1 rounded-md transition-all ${language === 'ru' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary dark:text-white' : 'hover:text-primary dark:hover:text-white'}`}>RU</button>
                                <button onClick={() => setLanguage('az')} className={`px-2 py-1 rounded-md transition-all ${language === 'az' ? 'bg-white dark:bg-slate-700 shadow-sm text-primary dark:text-white' : 'hover:text-primary dark:hover:text-white'}`}>AZ</button>
                            </div>
                            <ThemeToggle />
                            {user ? (
                                <div className="flex items-center gap-4 pl-4 border-l border-border">
                                    <div className="text-right hidden md:block">
                                        <p className="text-sm font-semibold text-foreground leading-none">{userProfile?.name || "User"}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5 capitalize">{userProfile?.role}</p>
                                    </div>
                                    <button
                                        onClick={() => logout()}
                                        className="text-sm font-medium text-muted-foreground hover:text-accent transition-colors"
                                    >
                                        {t("nav.logout")}
                                    </button>
                                </div>

                            ) : (
                                <div className="flex items-center gap-3">
                                    <Link href="/auth" className="text-sm font-medium text-foreground hover:text-primary/80 transition-colors">
                                        {t("nav.login")}
                                    </Link>
                                    <Link href="/auth" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2.5 rounded-lg hover:bg-primary/90 hover:shadow-lg transition-all transform hover:-translate-y-0.5">
                                        {t("nav.getStarted")}
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </nav >

        </>
    );
}



function NavLink({ href, active, children }: { href: string, active: boolean, children: React.ReactNode }) {
    return (
        <Link
            href={href}
            className={clsx(
                "inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors border-b-2",
                active
                    ? "border-accent text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
        >
            {children}
        </Link>
    )
}
