"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { auth } from "@/lib/firebase/config";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from "firebase/auth";
import { createUserProfile, createLawyerProfile, UserRole, getConstants } from "@/lib/firebase/services";
import { useRouter } from "next/navigation";
import { FaEnvelope, FaLock, FaUser, FaCity } from "react-icons/fa";
import { useLanguage } from "@/lib/i18n_context";
import SearchableSelect from "@/components/ui/SearchableSelect";

type AuthMode = 'signin' | 'signup';

interface AuthFormData {
    name?: string;
    email: string;
    password: string;
    role: UserRole;
    city?: string;
}

export default function AuthPage() {
    const [mode, setMode] = useState<AuthMode>('signin');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();
    const { t, language } = useLanguage();
    const [locations, setLocations] = useState<string[]>([]);

    const { register, handleSubmit, setValue, watch } = useForm<AuthFormData>();
    const cityValue = watch("city");

    useEffect(() => {
        getConstants('locations', language).then(setLocations);
    }, [language]);

    const onSubmit = async (data: AuthFormData) => {
        setLoading(true);
        setError("");

        try {
            if (mode === 'signup') {
                const { email, password, name, role } = data;
                console.log("Starting Sign Up...", { email, role });

                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                console.log("Firebase Auth User Created:", user.uid);

                await updateProfile(user, { displayName: name });

                console.log("Creating Firestore Profile...");
                await createUserProfile(user.uid, {
                    uid: user.uid,
                    name,
                    email,
                    role: role as UserRole,
                    city: data.city || "",
                });
                console.log("Firestore Profile Created.");

                if (role === 'lawyer') {
                    await createLawyerProfile(user.uid, {
                        description: "",
                        price: 0,
                        specializations: [],
                        verified: false,
                        rating: 0
                    });
                }

                router.push(role === 'lawyer' ? '/dashboard' : '/');

            } else {
                const { email, password } = data;
                console.log("Starting Sign In...");
                await signInWithEmailAndPassword(auth, email, password);
                console.log("Sign In successful. Redirecting...");
                router.push('/');
            }
        } catch (err: unknown) {
            console.error("Auth Process Error:", err);
            // Clean up firebase error messages
            let msg = (err as Error).message || "An error occurred";
            if (msg.includes("auth/invalid-credential")) {
                msg = "Invalid email or password. If you are new, please Create an Account.";
                // Don't console.error expected auth errors to avoid confusion
                console.warn("Auth error:", msg);
            } else if (msg.includes("auth/email-already-in-use")) {
                msg = "Email already in use. Please Sign In instead.";
                console.warn("Auth error:", msg);
            } else {
                console.error(err);
                if (msg.includes("unavailable")) msg = "Network error. Please check your connection or Firestore setup.";
            }
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-100 dark:bg-slate-950">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-10 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-800">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-primary rounded-xl flex items-center justify-center text-primary-foreground text-2xl font-serif font-bold mb-4 shadow-lg shadow-primary/30">
                        L
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                        {mode === 'signin' ? t("auth.welcome") : t("auth.createAccount")}
                    </h2>
                    <p className="mt-2 text-sm text-gray-500 dark:text-slate-400">
                        {mode === 'signin' ? t("auth.signinDesc") : t("auth.signupDesc")}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm font-medium animate-pulse" role="alert">
                        {error}
                    </div>
                )}

                <form className="mt-8 space-y-5" onSubmit={handleSubmit(onSubmit)}>

                    {mode === 'signup' && (
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                <FaUser />
                            </div>
                            <input
                                {...register("name", { required: mode === 'signup' })}
                                type="text"
                                className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-slate-700 rounded-xl leading-5 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
                                placeholder={t("auth.name")}
                            />
                        </div>
                    )}

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FaEnvelope />
                        </div>
                        <input
                            {...register("email", { required: true })}
                            type="email"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-slate-700 rounded-xl leading-5 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
                            placeholder={t("auth.email")}
                        />
                    </div>

                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                            <FaLock />
                        </div>
                        <input
                            {...register("password", { required: true, minLength: 6 })}
                            type="password"
                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-slate-700 rounded-xl leading-5 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
                            placeholder={t("auth.password")}
                        />
                    </div>

                    {mode === 'signup' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <select
                                        {...register("role")}
                                        className="block w-full pl-3 pr-10 py-3 border border-gray-200 dark:border-slate-700 rounded-xl leading-5 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all appearance-none"
                                    >
                                        <option value="client">{t("auth.client")}</option>
                                        <option value="lawyer">{t("auth.lawyer")}</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-gray-400">
                                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                    </div>
                                </div>
                                <div className="relative">
                                    <SearchableSelect
                                        items={locations}
                                        value={cityValue || ""}
                                        onChange={(val) => setValue("city", val)}
                                        placeholder={t("auth.city")}
                                        icon={<FaCity />}
                                        className="w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-slate-700 rounded-xl leading-5 bg-gray-50 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-900 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all flex items-center justify-between cursor-pointer text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-primary-foreground bg-primary hover:bg-slate-800 dark:hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    {t("auth.processing")}
                                </span>
                            ) : (mode === 'signin' ? t("auth.signin") : t("auth.signup"))}
                        </button>
                    </div>

                    <div className="text-center pt-2">
                        <button
                            type="button"
                            className="text-sm font-medium text-primary hover:text-accent transition-colors"
                            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                        >
                            {mode === 'signin' ? t("auth.newHere") : t("auth.haveAccount")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
