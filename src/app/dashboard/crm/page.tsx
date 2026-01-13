"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import Link from "next/link";
import { FaBriefcase, FaClock, FaFolder } from "react-icons/fa";
import { getLawyerCases } from "@/lib/services";
import { useLanguage } from "@/lib/i18n_context";

export default function CRMDashboard() {
    const { userProfile } = useAuth();
    const { t } = useLanguage();
    const [cases, setCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (userProfile?.uid && userProfile.role === 'lawyer') {
            getLawyerCases(userProfile.uid)
                .then(setCases)
                .catch(err => {
                    console.error(err);
                    setError(err.message);
                })
                .finally(() => setLoading(false));
        }
    }, [userProfile]);

    if (userProfile?.role !== 'lawyer') {
        return <div className="p-8 text-center text-red-500">{t("common.access_denied")}</div>;
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("crm.title")}</h1>
                    <p className="text-gray-500 dark:text-slate-400">{t("crm.subtitle")}</p>
                </div>
                <Link href="/dashboard/crm/cases/new" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors">
                    + {t("crm.new_case")}
                </Link>
            </div>

            {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-xl mb-8">
                    <p className="font-semibold">{t("crm.error_loading")}</p>
                    <p className="text-sm">{error}</p>
                    {error.includes("index") && (
                        <p className="mt-2 text-sm">
                            <span className="font-bold">{t("common.action_required")}</span> Firestore needs an index for this query.
                            Open your browser console (F12) and click the link provided in the error message to create it.
                        </p>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                            <FaBriefcase size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-slate-400">{t("crm.active_cases")}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{cases.length}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl">
                            <FaClock size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-slate-400">{t("crm.hours_billed")}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">0.0</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl">
                            <FaFolder size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-slate-400">{t("crm.documents")}</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">0</p>
                        </div>
                    </div>
                </div>
            </div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t("crm.recent_cases")}</h2>

            {loading ? (
                <div className="text-center py-10 text-gray-500">{t("common.loading")}</div>
            ) : cases.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-8 text-center text-gray-500 dark:text-slate-400">
                    <p>{t("crm.no_cases_found")}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {cases.map((c) => (
                        <Link key={c.id} href={`/dashboard/crm/cases/${c.id}`} className="block">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 hover:border-primary/50 transition-all flex justify-between items-center group">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">{c.title}</h3>
                                    <p className="text-gray-500 dark:text-slate-400 text-sm">{c.clientName} • {c.status}</p>
                                </div>
                                <div className="text-right">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${c.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`}>
                                        {t(`crm.status.${c.status}`)}
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
