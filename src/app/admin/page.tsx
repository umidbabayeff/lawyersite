"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getAllLawyersForAdmin, LawyerProfile, toggleLawyerVerification } from "@/lib/services";
import { useRouter } from "next/navigation";
import UserList from "@/components/admin/UserList";
import DataManager from "@/components/admin/DataManager";
import SiteSettingsForm from "@/components/admin/SiteSettings";
import { useLanguage } from "@/lib/i18n_context";

export default function AdminPage() {
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'lawyers' | 'users' | 'data' | 'settings'>('users');
    const { t } = useLanguage();

    // Lawyer State (Existing)
    const [lawyers, setLawyers] = useState<LawyerProfile[]>([]);
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        if (!loading && (!user || userProfile?.role !== 'admin')) {
            router.push('/');
            return;
        }

        if (userProfile?.role === 'admin' && activeTab === 'lawyers') {
            getAllLawyersForAdmin().then(setLawyers);
        }
    }, [user, userProfile, loading, router, refresh, activeTab]);

    const handleVerify = async (uid: string, status: boolean) => {
        await toggleLawyerVerification(uid, status);
        setRefresh(prev => prev + 1);
    };

    if (loading || userProfile?.role !== 'admin') return <div className="p-8">{t("admin.loading")}</div>;

    return (
        <div className="space-y-6 container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t("admin.dashboard")}</h1>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-slate-800">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`${activeTab === 'users'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        {t("admin.users")}
                    </button>

                    <button
                        onClick={() => setActiveTab('data')}
                        className={`${activeTab === 'data'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        {t("admin.data")}
                    </button>

                    <button
                        onClick={() => setActiveTab('lawyers')}
                        className={`${activeTab === 'lawyers'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        {t("admin.verification")}
                    </button>

                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`${activeTab === 'settings'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
                    >
                        {t("admin.settings") || "Settings"}
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div className="pt-4">
                {activeTab === 'users' && <UserList />}

                {activeTab === 'data' && <DataManager />}

                {activeTab === 'settings' && <SiteSettingsForm />}

                {activeTab === 'lawyers' && (
                    <div className="bg-white dark:bg-slate-900 shadow overflow-hidden sm:rounded-md border border-gray-200 dark:border-slate-800">
                        <ul className="divide-y divide-gray-200 dark:divide-slate-800">
                            {lawyers.map((lawyer) => (
                                <li key={lawyer.uid} className="px-4 py-4 sm:px-6 flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 truncate">{lawyer.name || lawyer.uid}</p>
                                        <div className="ml-2 flex-shrink-0 flex items-center gap-2 mt-1">
                                            <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${lawyer.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {lawyer.verified ? t("admin.verified") : t("admin.pending")}
                                            </p>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{lawyer.description ? lawyer.description.substring(0, 50) + "..." : t("admin.noDesc")}</p>

                                        {lawyer.verificationDocuments && lawyer.verificationDocuments.length > 0 && (
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {lawyer.verificationDocuments.map((doc, idx) => (
                                                    <a
                                                        key={idx}
                                                        href={doc.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                                                    >
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                        </svg>
                                                        {doc.name}
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="ml-5 flex-shrink-0">
                                        <button
                                            onClick={() => handleVerify(lawyer.uid, lawyer.verified)}
                                            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${lawyer.verified ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                                        >
                                            {lawyer.verified ? t("admin.unverify") : t("admin.verify")}
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}
