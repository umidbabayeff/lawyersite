"use client";

import { useState } from "react";
import { seedDatabase, clearDatabase } from "@/lib/services";
import { useRouter } from "next/navigation";

export default function SetupPage() {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("");
    const router = useRouter();

    const handleSeed = async () => {
        setLoading(true);
        setStatus("Initializing database with sample data...");
        try {
            await seedDatabase();
            setStatus("Success! Database populated.");
            setTimeout(() => {
                router.push('/');
            }, 1000);
        } catch (error: unknown) {
            const err = error as Error;
            console.error(err);
            setStatus("Error: " + err.message);
            if ((err as { code?: string }).code === 'PGRST116') {
                setStatus("Error: Service Unavailable. Please ensure Supabase database and RLS policies are correctly configured via the SQL Editor.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async () => {
        if (!confirm("Are you sure? This will delete ALL users and lawyers!")) return;
        setLoading(true);
        setStatus("Clearing all data...");
        try {
            await clearDatabase();
            await seedDatabase();
            setStatus("Success! Database reset and repopulated.");
            setTimeout(() => {
                router.push('/');
            }, 1000);
        } catch (error: unknown) {
            const err = error as Error;
            console.error(err);
            setStatus("Error: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
                <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                </div>

                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Initialize Database</h1>
                    <p className="text-gray-500 mt-2">
                        Your database is empty. Click below to create the necessary collections and add sample data (Lawyers, Reviews, etc.).
                    </p>
                </div>

                {status && (
                    <div className={`p-4 rounded-lg text-sm font-medium ${status.includes("Error") ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
                        {status}
                    </div>
                )}

                <div className="space-y-3">
                    <button
                        onClick={handleSeed}
                        disabled={loading}
                        className="w-full py-3 px-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Processing...
                            </>
                        ) : (
                            "Populate Database"
                        )}
                    </button>

                    <button
                        onClick={handleReset}
                        disabled={loading}
                        className="w-full py-3 px-4 bg-white border-2 border-red-100 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-all disabled:opacity-50"
                    >
                        Hard Reset (Delete All & Restart)
                    </button>
                </div>

                <p className="text-xs text-gray-400">
                    Note: This requires proper RLS policies and table structures in Supabase.
                </p>
            </div>
        </div>
    );
}
