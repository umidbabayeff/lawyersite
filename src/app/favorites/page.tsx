"use client";

import { useEffect, useState } from "react";
import { getFavoriteLawyers, LawyerProfile } from "@/lib/services";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { FaMapMarkerAlt, FaSearch } from "react-icons/fa";
import Image from "next/image";
import { MdVerified } from "react-icons/md";
import FavoriteButton from "@/components/ui/FavoriteButton";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n_context";

export default function FavoritesPage() {
    const { user, loading: authLoading } = useAuth();
    const [favorites, setFavorites] = useState<LawyerProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { t } = useLanguage();

    useEffect(() => {
        if (!authLoading && !user) {
            router.push("/auth");
            return;
        }

        async function fetchFavorites() {
            if (!user) return;
            try {
                const data = await getFavoriteLawyers(user.id);
                setFavorites(data);
            } catch (e) {
                console.error("Failed to fetch favorites", e);
            } finally {
                setLoading(false);
            }
        }

        if (user) {
            fetchFavorites();
        }
    }, [user, authLoading, router]);

    if (authLoading || loading) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between border-b border-gray-200 pb-5">
                <h1 className="text-3xl font-bold text-foreground">{t("favorites.title")}</h1>
                <span className="text-sm text-muted-foreground">{favorites.length} {t("favorites.count")}</span>
            </div>

            {favorites.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-3xl border border-dashed border-slate-200">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 text-slate-400 mb-4">
                        <FaSearch className="text-xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">{t("favorites.emptyTitle")}</h3>
                    <p className="text-gray-500 mt-1 mb-6">{t("favorites.emptyDesc")}</p>
                    <Link href="/" className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold shadow-lg hover:shadow-xl transition-all">
                        {t("favorites.findBtn")}
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                    {favorites.map((lawyer) => (
                        <div key={lawyer.uid} className="group bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col">
                            <div className="h-24 bg-gradient-to-r from-slate-100 to-slate-200 relative">
                                {lawyer.bannerUrl && (
                                    <Image src={lawyer.bannerUrl} alt="Banner" fill className="object-cover" sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                                )}
                                <div className={`absolute inset-0 ${lawyer.bannerUrl ? 'bg-black/20' : ''}`}></div>
                                <div className="absolute top-4 right-4 flex gap-2 z-10">
                                    <FavoriteButton lawyerId={lawyer.uid} />
                                    {lawyer.verified && (
                                        <div className="bg-white/90 backdrop-blur text-xs font-bold px-3 py-1 rounded-full text-green-700 shadow-sm flex items-center gap-1">
                                            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></span> {t("home.verified")}
                                        </div>
                                    )}
                                </div>
                                <div className="absolute -bottom-10 left-6 z-10">
                                    <div className="h-20 w-20 rounded-2xl bg-white p-1 shadow-md">
                                        {lawyer.photoUrl ? (
                                            <div className="relative w-full h-full">
                                                <Image src={lawyer.photoUrl} alt={lawyer.name} fill className="object-cover rounded-xl" sizes="80px" />
                                            </div>
                                        ) : (
                                            <div className="h-full w-full bg-primary/10 dark:bg-primary/20 rounded-xl flex items-center justify-center text-primary font-bold text-2xl">
                                                {lawyer.name?.[0]?.toUpperCase() || 'L'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-12 px-6 pb-6 flex-grow flex flex-col">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors flex items-center gap-2">
                                        {lawyer.name}
                                        {lawyer.verified && (
                                            <MdVerified className="text-blue-500 text-xl" title="Verified Lawyer" />
                                        )}
                                    </h3>
                                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        <FaMapMarkerAlt className="mr-1.5 text-accent" />
                                        {lawyer.city || t("lawyer.locationNA")}
                                    </div>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2">
                                    {lawyer.specializations.slice(0, 3).map((spec, idx) => (
                                        <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                            {spec}
                                        </span>
                                    ))}
                                </div>

                                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                                    {lawyer.description || "Experienced legal professional ready to assist with your case."}
                                </p>

                                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">{t("home.rate")}</p>
                                        <p className="text-lg font-bold text-gray-900 dark:text-white">${lawyer.price}<span className="text-sm font-normal text-gray-500 dark:text-gray-400">{t("lawyer.perHour")}</span></p>
                                    </div>
                                    <Link href={`/lawyer/${lawyer.uid}`} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all">
                                        {t("home.viewProfile")}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
