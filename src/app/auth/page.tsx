"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { auth } from "@/lib/firebase/config";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from "firebase/auth";
import { createUserProfile, createLawyerProfile, UserRole } from "@/lib/firebase/services";
import { useRouter } from "next/navigation";

type AuthMode = 'signin' | 'signup';

export default function AuthPage() {
    const [mode, setMode] = useState<AuthMode>('signin');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const { register, handleSubmit, formState: { errors } } = useForm();

    // Custom form handling because types are dynamic based on mode
    const onSubmit = async (data: any) => {
        setLoading(true);
        setError("");

        try {
            if (mode === 'signup') {
                const { email, password, name, role } = data;
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                await updateProfile(user, { displayName: name });

                // Create User Profile in Firestore
                await createUserProfile(user.uid, {
                    uid: user.uid,
                    name,
                    email,
                    role: role as UserRole,
                    city: data.city || "", // Optional initial city
                });

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
                await signInWithEmailAndPassword(auth, email, password);
                router.push('/');
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                        {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
                    </h2>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
                    <div className="rounded-md shadow-sm -space-y-px">

                        {mode === 'signup' && (
                            <div className="mb-4">
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
                                <input
                                    {...register("name", { required: mode === 'signup' })}
                                    id="name"
                                    type="text"
                                    className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                    placeholder="Full Name"
                                />
                            </div>
                        )}

                        <div className="mb-4">
                            <label htmlFor="email-address" className="block text-sm font-medium text-gray-700">Email address</label>
                            <input
                                {...register("email", { required: true })}
                                id="email-address"
                                type="email"
                                autoComplete="email"
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Email address"
                            />
                        </div>

                        <div className="mb-4">
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                            <input
                                {...register("password", { required: true, minLength: 6 })}
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                placeholder="Password"
                            />
                        </div>

                        {mode === 'signup' && (
                            <>
                                <div className="mb-4">
                                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">I am a:</label>
                                    <select
                                        {...register("role")}
                                        id="role"
                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                                    >
                                        <option value="client">Client (looking for a lawyer)</option>
                                        <option value="lawyer">Lawyer (looking for clients)</option>
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="city" className="block text-sm font-medium text-gray-700">City (Optional)</label>
                                    <input
                                        {...register("city")}
                                        id="city"
                                        type="text"
                                        className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                                        placeholder="Your City"
                                    />
                                </div>
                            </>
                        )}

                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                        >
                            {loading ? 'Processing...' : (mode === 'signin' ? 'Sign in' : 'Sign up')}
                        </button>
                    </div>

                    <div className="text-center">
                        <button
                            type="button"
                            className="text-sm text-indigo-600 hover:text-indigo-500"
                            onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                        >
                            {mode === 'signin' ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
