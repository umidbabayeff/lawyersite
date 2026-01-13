"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getCommunityRequestById, createProposal, getProposalsForRequest, CommunityRequest, RequestProposal } from "@/lib/firebase/services";
// date-fns removed
import { FaUser, FaMapMarkerAlt, FaGavel, FaMoneyBillWave, FaPaperPlane } from "react-icons/fa";

export default function LawyerRequestDetailPage() {
    const { id } = useParams();
    const { user, userProfile } = useAuth();
    const router = useRouter();
    const [request, setRequest] = useState<CommunityRequest | null>(null);
    const [existingProposal, setExistingProposal] = useState<RequestProposal | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [message, setMessage] = useState("");
    const [price, setPrice] = useState("");
    const [duration, setDuration] = useState("");

    useEffect(() => {
        if (id && user) {
            Promise.all([
                getCommunityRequestById(id as string),
                getProposalsForRequest(id as string) // Fetch all to check for existing
            ]).then(([reqData, proposals]) => {
                setRequest(reqData);
                // Check if this lawyer already submitted
                const myProposal = proposals.find(p => p.lawyerId === user.uid);
                setExistingProposal(myProposal || null);
                setLoading(false);
            });
        }
    }, [id, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !request) return;

        setSubmitting(true);
        try {
            await createProposal({
                requestId: request.id,
                lawyerId: user.uid,
                lawyerName: userProfile?.name || user.displayName || "Lawyer",
                lawyerPhotoUrl: userProfile?.photoUrl || user.photoURL || null,
                message,
                proposedPrice: parseFloat(price),
                estimatedDuration: duration
            });
            alert("Proposal submitted successfully!");
            router.push("/requests/feed");
        } catch (error) {
            console.error("Error submitting proposal:", error);
            alert("Failed to submit proposal.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center bg-gray-50 dark:bg-slate-950 min-h-screen">Loading details...</div>;
    if (!request) return <div className="p-8 text-center bg-gray-50 dark:bg-slate-950 min-h-screen">Request not found.</div>;
    if (userProfile?.role !== 'lawyer') return <div className="p-8 text-center bg-gray-50 dark:bg-slate-950 min-h-screen">Access restricted.</div>;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-gray-50 dark:bg-slate-950 min-h-screen">
            {/* Request Details */}
            <div className="bg-white dark:bg-slate-900 shadow overflow-hidden sm:rounded-lg mb-8 border border-gray-200 dark:border-slate-800">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-2xl font-bold leading-6 text-gray-900 dark:text-white">{request.title}</h3>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><FaUser /> {request.clientName}</span>
                        <span className="flex items-center gap-1"><FaMapMarkerAlt /> {request.location}</span>
                        <span className="flex items-center gap-1"><FaGavel /> {request.specialty}</span>
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-500 font-medium">
                            <FaMoneyBillWave /> {request.budget ? `$${request.budget}` : 'Negotiable'}
                        </span>
                    </div>
                </div>
                <div className="border-t border-gray-200 dark:border-slate-800 px-4 py-5 sm:px-6">
                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{request.description}</p>
                </div>
            </div>

            {/* Proposal Form or Status */}
            <div className="bg-white dark:bg-slate-900 shadow overflow-hidden sm:rounded-lg border border-gray-200 dark:border-slate-800">
                <div className="px-4 py-5 sm:px-6">
                    <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">Your Proposal</h3>
                </div>
                <div className="border-t border-gray-200 dark:border-slate-800 px-4 py-5 sm:p-6">
                    {existingProposal ? (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 dark:border-blue-500 p-4">
                            <div className="flex">
                                <div className="flex-shrink-0">
                                    <FaPaperPlane className="h-5 w-5 text-blue-400 dark:text-blue-500" aria-hidden="true" />
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        You submitted a proposal on {existingProposal.createdAt?.toDate ? existingProposal.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString()}
                                    </p>
                                    <p className="mt-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
                                        Status: <span className="uppercase">{existingProposal.status}</span>
                                    </p>
                                    <div className="mt-4 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 p-3 rounded bg-opacity-50">
                                        <p><strong>Price:</strong> ${existingProposal.proposedPrice}</p>
                                        <p><strong>Message:</strong> {existingProposal.message}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : request.status !== 'open' ? (
                        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                            This request is no longer accepting proposals.
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                                    Cover Letter / Proposal
                                </label>
                                <div className="mt-2">
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={4}
                                        required
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-slate-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-slate-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3"
                                        placeholder="Explain how you can help..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2">
                                <div>
                                    <label htmlFor="price" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                                        Proposed Price ($)
                                    </label>
                                    <div className="mt-2">
                                        <input
                                            type="number"
                                            name="price"
                                            id="price"
                                            required
                                            min="0"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-slate-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-slate-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3"
                                            placeholder="500"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="duration" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-200">
                                        Estimated Duration
                                    </label>
                                    <div className="mt-2">
                                        <input
                                            type="text"
                                            name="duration"
                                            id="duration"
                                            value={duration}
                                            onChange={(e) => setDuration(e.target.value)}
                                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-white dark:bg-slate-800 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-slate-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 px-3"
                                            placeholder="e.g. 1 week, 3 days"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50"
                                >
                                    {submitting ? "Submitting..." : "Submit Proposal"}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
