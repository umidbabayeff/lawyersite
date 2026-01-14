"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { FaEnvelope, FaLock, FaShieldAlt } from "react-icons/fa";

import { getUserProfile } from "@/lib/services";

export default function AdminLoginPage() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    // const { t } = useLanguage(); // Unused for now
    const supabase = createClient();

    const { register, handleSubmit } = useForm<{ email: string; password: string }>({
        defaultValues: {
            email: "",
            password: ""
        }
    });

    const onSubmit = async (data: { email: string; password: string }) => {
        setLoading(true);
        setError("");

        try {
            // 1. Sign In
            const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
                email: data.email,
                password: data.password
            });

            if (signInError) throw signInError;
            if (!authData.user) throw new Error("No user returned");

            // 2. Check Role
            const profile = await getUserProfile(authData.user.id);
            if (profile?.role !== 'admin') {
                await supabase.auth.signOut();
                throw new Error("Access Denied: You do not have administrator privileges.");
            }

            // 3. Redirect
            router.push('/admin');

        } catch (err: unknown) {
            console.error(err);
            const message = err instanceof Error ? err.message : "Invalid credentials";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 px-4">
            <div className="max-w-md w-full space-y-8 bg-slate-800 p-10 rounded-3xl shadow-2xl border border-slate-700">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-red-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg shadow-red-500/30 mb-6">
                        <FaShieldAlt />
                    </div>
                    <h2 className="text-3xl font-extrabold text-white tracking-tight">
                        Admin Portal
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Restricted access. Authorized personnel only.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-900/50 border border-red-800 text-red-200 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="space-y-4">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                <FaEnvelope />
                            </div>
                            <input
                                {...register("email", { required: true })}
                                type="email"
                                className="block w-full pl-10 pr-3 py-3 border border-slate-600 rounded-xl leading-5 bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent sm:text-sm transition-all"
                                placeholder="Admin Email"
                            />
                        </div>

                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                                <FaLock />
                            </div>
                            <input
                                {...register("password", { required: true })}
                                type="password"
                                className="block w-full pl-10 pr-3 py-3 border border-slate-600 rounded-xl leading-5 bg-slate-900 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent sm:text-sm transition-all"
                                placeholder="Password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-red-500 transition-all shadow-lg shadow-red-600/30 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        ) : (
                            "Access Dashboard"
                        )}
                    </button>

                    <div className="text-center">
                        <button type="button" onClick={() => router.push('/')} className="text-slate-500 hover:text-slate-300 text-sm">
                            Return to Website
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
