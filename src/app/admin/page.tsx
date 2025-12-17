"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { getAllLawyersForAdmin, LawyerProfile, toggleLawyerVerification, toggleUserBlock } from "@/lib/firebase/services"; // Assumes we update services
import { useRouter } from "next/navigation";

export default function AdminPage() {
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();

    const [lawyers, setLawyers] = useState<LawyerProfile[]>([]);
    const [refresh, setRefresh] = useState(0);

    useEffect(() => {
        if (!loading && (!user || userProfile?.role !== 'admin')) {
            router.push('/');
            return;
        }

        if (userProfile?.role === 'admin') {
            getAllLawyersForAdmin().then(data => {
                // In real app we might want to join with user data to get names if they are not in lawyer doc
                // My implementation of createLawyerProfile didn't put name in lawyer doc automatically 
                // but updateLawyerProfile does try to sync.
                // If name is missing, we might see empty names. 
                // Ideally we fetch user for each lawyer or duplicate name on creation.
                // Let's assume for MVP names are synced or accessible.
                setLawyers(data);
            });
        }
    }, [user, userProfile, loading, router, refresh]);

    const handleVerify = async (uid: string, status: boolean) => {
        await toggleLawyerVerification(uid, status);
        setRefresh(prev => prev + 1);
    };

    if (loading || userProfile?.role !== 'admin') return <div className="p-8">Loading or unauthorized...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Lawyers Management</h3>
                </div>
                <ul className="divide-y divide-gray-200">
                    {lawyers.map((lawyer) => (
                        <li key={lawyer.uid} className="px-4 py-4 sm:px-6 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-indigo-600 truncate">{lawyer.userId}</p>
                                <div className="ml-2 flex-shrink-0 flex">
                                    <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                        {lawyer.verified ? 'Verified' : 'Pending'}
                                    </p>
                                </div>
                                <p className="mt-1 text-sm text-gray-500">{lawyer.description ? lawyer.description.substring(0, 50) + "..." : "No description"}</p>
                            </div>
                            <div className="ml-5 flex-shrink-0">
                                <button
                                    onClick={() => handleVerify(lawyer.uid, lawyer.verified)}
                                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${lawyer.verified ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                                >
                                    {lawyer.verified ? 'Unverify' : 'Verify'}
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
