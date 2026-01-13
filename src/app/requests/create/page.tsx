"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { createCommunityRequest } from "@/lib/firebase/services";
import { getConstants } from "@/lib/firebase/services";
import SearchableSelect from "@/components/ui/SearchableSelect";

export default function CreateRequestPage() {
    const { user, userProfile } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form state
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [city, setCity] = useState("");
    const [specialty, setSpecialty] = useState("");
    const [budget, setBudget] = useState("");

    // Data state
    const [cities, setCities] = useState<string[]>([]);
    const [specializations, setSpecializations] = useState<string[]>([]);

    useEffect(() => {
        getConstants("locations").then(setCities);
        getConstants("specializations").then(setSpecializations);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        try {
            await createCommunityRequest({
                clientId: user.uid,
                clientName: userProfile?.name || user.displayName || "Anonymous Client",
                title,
                description,
                location: city,
                specialty,
                budget: budget ? parseFloat(budget) : undefined
            });

            // Redirect to "My Requests"
            router.push("/requests/client");
        } catch (error) {
            console.error("Error creating request:", error);
            alert("Failed to create request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="p-8 text-center">Please log in to post a request.</div>;

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 dark:text-white sm:truncate sm:text-3xl sm:tracking-tight">
                        Post a Legal Request
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Describe your case and receive proposals from qualified lawyers.
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 shadow-sm ring-1 ring-gray-900/5 dark:ring-white/10 sm:rounded-xl md:col-span-2">
                <div className="px-4 py-6 sm:p-8">
                    <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">

                        <div className="sm:col-span-4">
                            <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                                Request Title
                            </label>
                            <div className="mt-2">
                                <input
                                    type="text"
                                    name="title"
                                    id="title"
                                    required
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="e.g. Need help with property contract"
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-slate-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-slate-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                                City
                            </label>
                            <div className="mt-2">
                                <SearchableSelect
                                    items={cities}
                                    value={city}
                                    onChange={setCity}
                                    placeholder="Select a city..."
                                    className="block w-full"
                                />
                            </div>
                        </div>

                        <div className="sm:col-span-3">
                            <label className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                                Practice Area
                            </label>
                            <div className="mt-2">
                                <SearchableSelect
                                    items={specializations}
                                    value={specialty}
                                    onChange={setSpecialty}
                                    placeholder="Select specialty..."
                                    className="block w-full"
                                />
                            </div>
                        </div>

                        <div className="col-span-full">
                            <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                                Description
                            </label>
                            <div className="mt-2">
                                <textarea
                                    id="description"
                                    name="description"
                                    rows={4}
                                    required
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-slate-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-slate-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3"
                                    placeholder="Provide details about your legal situation..."
                                />
                            </div>
                            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-400">
                                Please do not include sensitive personal information.
                            </p>
                        </div>

                        <div className="sm:col-span-3">
                            <label htmlFor="budget" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                                Budget (Optional)
                            </label>
                            <div className="mt-2">
                                <div className="flex rounded-md shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-slate-700 focus-within:ring-2 focus-within:ring-inset focus-within:ring-primary sm:max-w-md bg-white dark:bg-slate-800">
                                    <span className="flex select-none items-center pl-3 text-gray-500 dark:text-gray-400 sm:text-sm">$</span>
                                    <input
                                        type="number"
                                        name="budget"
                                        id="budget"
                                        value={budget}
                                        onChange={(e) => setBudget(e.target.value)}
                                        className="block flex-1 border-0 bg-transparent py-1.5 pl-1 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
                <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 dark:border-white/10 px-4 py-4 sm:px-8">
                    <button type="button" className="text-sm font-semibold leading-6 text-gray-900 dark:text-white" onClick={() => router.back()}>
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50"
                    >
                        {loading ? "Posting..." : "Post Request"}
                    </button>
                </div>
            </form>
        </div>
    );
}
