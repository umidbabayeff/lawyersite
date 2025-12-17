"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function Navbar() {
    const { user, userProfile, logout } = useAuth();

    return (
        <nav className="bg-white shadow-sm border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <Link href="/" className="flex-shrink-0 flex items-center text-xl font-bold text-gray-800">
                            LawyerFind
                        </Link>
                        <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                            <Link href="/" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                Home
                            </Link>
                            {user && userProfile?.role === 'lawyer' && (
                                <Link href="/dashboard" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    Dashboard
                                </Link>
                            )}
                            {user && userProfile?.role === 'admin' && (
                                <Link href="/admin" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                                    Admin
                                </Link>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center">
                        {user ? (
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-gray-600">
                                    {userProfile?.name || user.email} ({userProfile?.role})
                                </span>
                                <button
                                    onClick={() => logout()}
                                    className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                                >
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <Link href="/auth" className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
                                Sign In / Register
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
