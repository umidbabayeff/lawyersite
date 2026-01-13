"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { getOpenCommunityRequests, getConstants, CommunityRequest } from "@/lib/services";
// date-fns removed
import { FaMapMarkerAlt, FaMoneyBillWave } from "react-icons/fa";
import SearchableSelect from "@/components/ui/SearchableSelect";

export default function RequestFeedPage() {
    const { user, userProfile } = useAuth();
    const [requests, setRequests] = useState<CommunityRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [city, setCity] = useState("");
    const [specialty, setSpecialty] = useState("");
    const [cities, setCities] = useState<string[]>([]);
    const [specializations, setSpecializations] = useState<string[]>([]);

    useEffect(() => {
        getConstants("locations").then(setCities);
        getConstants("specializations").then(setSpecializations);
    }, []);

    useEffect(() => {
        setLoading(true);
        getOpenCommunityRequests({
            city: city || undefined,
            specialty: specialty || undefined
        })
            .then(setRequests)
            .finally(() => setLoading(false));
    }, [city, specialty]);

    if (!user || userProfile?.role !== 'lawyer') return <div className="p-8 text-center bg-gray-50 dark:bg-slate-950 min-h-screen">Access restricted to lawyers.</div>;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-gray-50 dark:bg-slate-950 min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
                        Client Request Feed
                    </h2>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Browse and respond to open legal requests from clients.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-end md:items-center">
                <div className="w-full md:w-1/3">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                    <SearchableSelect
                        items={cities}
                        value={city}
                        onChange={setCity}
                        placeholder="All Cities"
                    />
                </div>
                <div className="w-full md:w-1/3">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Specialty</label>
                    <SearchableSelect
                        items={specializations}
                        value={specialty}
                        onChange={setSpecialty}
                        placeholder="All Specializations"
                    />
                </div>
                <div className="w-full md:w-auto">
                    <button onClick={() => { setCity(""); setSpecialty(""); }} className="text-sm text-primary hover:underline">
                        Clear Filters
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading requests...</div>
            ) : requests.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-lg shadow">
                    <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No requests found</h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Try adjusting your filters to see more results.</p>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {requests.map((request) => (
                        <div key={request.id} className="bg-white dark:bg-slate-900 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-100 dark:border-slate-800 flex flex-col">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="inline-flex items-center rounded-full bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-700/10 dark:ring-blue-400/20">
                                        {request.specialty}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : '...'}
                                    </span>
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                                    <Link href={`/requests/feed/${request.id}`} className="hover:text-primary transition-colors">
                                        {request.title}
                                    </Link>
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                                    {request.description}
                                </p>

                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-auto">
                                    <div className="flex items-center gap-1">
                                        <FaMapMarkerAlt /> {request.location}
                                    </div>
                                    <div className="flex items-center gap-1 font-medium text-gray-700 dark:text-gray-200">
                                        <FaMoneyBillWave className="text-green-600 dark:text-green-500" />
                                        {request.budget ? `$${request.budget}` : 'Negotiable'}
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 rounded-b-lg flex justify-between items-center">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                    {request.proposalCount} proposals
                                </span>
                                <Link
                                    href={`/requests/feed/${request.id}`}
                                    className="text-sm font-medium text-primary hover:text-primary/80"
                                >
                                    View Details &rarr;
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
