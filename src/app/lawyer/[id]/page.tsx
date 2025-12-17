"use client";

import { useEffect, useState } from "react";
import { getLawyerProfile, getUserProfile, LawyerProfile, UserProfile } from "@/lib/firebase/services";
import { useParams } from "next/navigation";

export default function LawyerProfilePage() {
    // We need to unwrap params because it's a Promise in newer Next.js versions or just standard object in older App router?
    // In Next 15+ params is a promise. In 14 it's an object. 
    // User Prompt says Next 14. 
    // But usage of `useParams()` hook is safer for client components.
    const params = useParams();
    const id = params?.id as string;

    const [lawyer, setLawyer] = useState<LawyerProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            if (!id) return;
            try {
                // Retrieve lawyer specific data
                const lawyerData = await getLawyerProfile(id);
                // Retrieve basic user data (name, city, photo)
                const userData = await getUserProfile(id);

                if (lawyerData && userData) {
                    // Merge
                    setLawyer({ ...userData, ...lawyerData });
                } else if (lawyerData) { // Fallback if user profile missing (unlikely)
                    setLawyer(lawyerData);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id]);

    if (loading) return <div className="p-8">Loading...</div>;
    if (!lawyer) return <div className="p-8">Lawyer not found.</div>;

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {lawyer.name}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        {lawyer.city}
                    </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-semibold ${lawyer.verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {lawyer.verified ? 'Verified' : 'Unverified'}
                </div>
            </div>
            <div className="border-t border-gray-200">
                <dl>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">
                            Specializations
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            <div className="flex gap-2 flex-wrap">
                                {lawyer.specializations?.map(s => (
                                    <span key={s} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs">{s}</span>
                                ))}
                            </div>
                        </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">
                            Consultation Price
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            ${lawyer.price} / hr
                        </dd>
                    </div>
                    <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">
                            About
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">
                            {lawyer.description}
                        </dd>
                    </div>
                    <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">
                            Contact
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            <button className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">
                                Contact Lawyer
                            </button>
                            <p className="mt-2 text-xs text-gray-500">Contact functionality generic placeholder.</p>
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    );
}
