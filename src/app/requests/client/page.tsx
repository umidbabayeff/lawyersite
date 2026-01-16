"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n_context";
import { getMyClientRequests, CommunityRequest } from "@/lib/services";
// date-fns removed
import { FaPlus, FaMapMarkerAlt, FaGavel } from "react-icons/fa";

export default function MyRequestsPage() {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [requests, setRequests] = useState<CommunityRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            getMyClientRequests(user.id)
                .then(setRequests)
                .finally(() => setLoading(false));
        }
    }, [user]);

    if (!user) return <div className="p-8 text-center">Please log in to view your requests.</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
                    {t("requests.my_requests")}
                </h2>
                <Link
                    href="/requests/create"
                    className="inline-flex items-center gap-x-2 rounded-md bg-green-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                >
                    <FaPlus className="-ml-0.5 h-5 w-5" aria-hidden="true" />
                    {t("requests.post")}
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-10">{t("common.loading")}</div>
            ) : requests.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-lg shadow ring-1 ring-gray-900/5 dark:ring-white/10">
                    <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">{t("favorites.emptyTitle")}</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t("requests.subtitle")}</p>
                    <div className="mt-6">
                        <Link
                            href="/requests/create"
                            className="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600"
                        >
                            <FaPlus className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
                            {t("requests.post")}
                        </Link>
                    </div>
                </div>
            ) : (
                <ul role="list" className="divide-y divide-gray-100 dark:divide-slate-800 bg-white dark:bg-slate-900 shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 rounded-2xl">
                    {requests.map((request) => (
                        <li key={request.id} className="relative flex flex-col sm:flex-row justify-between gap-x-6 px-4 py-5 hover:bg-gray-50 dark:hover:bg-slate-800/50 sm:px-6 gap-y-4">
                            <div className="flex min-w-0 gap-x-4">
                                <div className="min-w-0 flex-auto">
                                    <p className="text-sm font-semibold leading-6 text-gray-900 dark:text-white">
                                        <Link href={`/requests/client/${request.id}`}>
                                            <span className="absolute inset-x-0 -top-px bottom-0" />
                                            {request.title}
                                        </Link>
                                    </p>
                                    <p className="mt-1 flex flex-wrap text-xs leading-5 text-gray-500 dark:text-gray-400 gap-y-1">
                                        <span className="truncate flex items-center gap-1"><FaMapMarkerAlt /> {request.location}</span>
                                        <span className="mx-2 hidden sm:inline">•</span>
                                        <span className="truncate flex items-center gap-1"><FaGavel /> {request.specialty}</span>
                                    </p>
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center sm:items-end gap-x-4 sm:flex-col sm:gap-y-1 mt-2 sm:mt-0 justify-between sm:justify-start">
                                <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-0">
                                    <p className="text-sm leading-6 text-gray-900 dark:text-gray-300">
                                        {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '...'}
                                    </p>
                                    <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
                                        <span className="sm:hidden mr-1">{t("crm.status")}:</span>
                                        <span className={`capitalize font-medium ${request.status === 'open' ? 'text-green-600 dark:text-green-400' :
                                            request.status === 'accepted' ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'
                                            }`}>{t(`requests.status_${request.status}` as "requests.status_open" | "requests.status_accepted" | "requests.status_closed")}</span>
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="min-w-[60px] text-right">
                                        <div className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-400/20">
                                            {request.proposalCount} {t("requests.proposals")}
                                        </div>
                                    </div>
                                    <svg className="h-5 w-5 flex-none text-gray-400 hidden sm:block" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.16 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                                    </svg>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
