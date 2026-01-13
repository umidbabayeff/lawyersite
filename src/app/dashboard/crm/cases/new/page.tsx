"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { createCase, getUserChats } from "@/lib/firebase/services";

export default function NewCasePage() {
    const { user, userProfile } = useAuth();
    const router = useRouter();
    const [clients, setClients] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        clientName: "",
        clientId: "",
        description: ""
    });

    useEffect(() => {
        const fetchClients = async () => {
            if (user) {
                try {
                    const chats = await getUserChats(user.uid);
                    // Extract unique clients from chats
                    const uniqueClientsMap = new Map();
                    chats.forEach(chat => {
                        if (chat.otherUser) {
                            uniqueClientsMap.set(chat.otherUser.uid, {
                                id: chat.otherUser.uid,
                                name: chat.otherUser.name || "Unknown Client"
                            });
                        }
                    });
                    setClients(Array.from(uniqueClientsMap.values()));
                } catch (error) {
                    console.error("Error fetching clients:", error);
                }
            }
        };
        fetchClients();
    }, [user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || userProfile?.role !== 'lawyer') return;

        setLoading(true);
        try {
            await createCase({
                lawyerId: user.uid,
                title: formData.title,
                clientName: formData.clientName,
                clientId: formData.clientId || undefined,
                description: formData.description
            });
            router.push("/dashboard/crm");
        } catch (error) {
            console.error(error);
            alert("Failed to create case");
        } finally {
            setLoading(false);
        }
    };

    const handleClientSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        if (!selectedId) {
            setFormData({ ...formData, clientId: "", clientName: "" });
            return;
        }
        const client = clients.find(c => c.id === selectedId);
        if (client) {
            setFormData({ ...formData, clientId: client.id, clientName: client.name });
        }
    };

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create New Case</h1>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 shadow-sm rounded-xl p-6 border border-gray-100 dark:border-slate-800 space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Case Title</label>
                    <input
                        required
                        type="text"
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        placeholder="e.g. Divorce Settlement - Smith"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Select Client</label>
                    <select
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        value={formData.clientId}
                        aria-label="Select Client"
                        onChange={handleClientSelect}
                    >
                        <option value="">-- Manual Entry --</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>
                                {client.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Fallback for manual entry if needed, or non-chat clients */}
                {!formData.clientId && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Client Name (Manual)</label>
                        <input
                            required={!formData.clientId}
                            type="text"
                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            placeholder="Client Full Name"
                            value={formData.clientName}
                            onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                        />
                    </div>
                )}


                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">Description</label>
                    <textarea
                        required
                        rows={4}
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        placeholder="Case details, notes, and objectives..."
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Creating..." : "Create Case"}
                    </button>
                </div>
            </form>
        </div>
    );
}
