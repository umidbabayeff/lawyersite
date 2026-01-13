"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { getCommunityRequestById, getProposalsForRequest, acceptProposal, CommunityRequest, RequestProposal } from "@/lib/services";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/i18n_context";
// date-fns removed
import { FaUser, FaCheckCircle, FaMoneyBillWave, FaClock } from "react-icons/fa";

export default function RequestDetailPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const router = useRouter();
    const { t } = useLanguage();
    const [request, setRequest] = useState<CommunityRequest | null>(null);
    const [proposals, setProposals] = useState<RequestProposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        if (id && user) {
            // Fetch request and proposals
            Promise.all([
                getCommunityRequestById(id as string),
                getProposalsForRequest(id as string)
            ]).then(([reqData, propData]) => {
                setRequest(reqData);
                setProposals(propData);
                setLoading(false);
            });
        }
    }, [id, user]);

    const handleAccept = async (proposal: RequestProposal) => {
        if (!confirm(`Are you sure you want to accept the proposal from ${proposal.lawyerName}? This will close the request.`)) return;

        setProcessingId(proposal.id);
        try {
            await acceptProposal(request!.id, proposal.id, proposal.lawyerId);
            // Refresh data
            const updatedReq = await getCommunityRequestById(request!.id);
            const updatedProps = await getProposalsForRequest(request!.id);
            setRequest(updatedReq);
            setProposals(updatedProps);
            alert("Proposal accepted successfully!");
        } catch (error) {
            console.error("Error accepting proposal:", error);
            alert("Failed to accept proposal.");
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading details...</div>;
    if (!request) return <div className="p-8 text-center">Request not found.</div>;
    if (user?.uid !== request.clientId) return <div className="p-8 text-center">Unauthorized access.</div>;

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Request Header */}
            <div className="bg-white dark:bg-slate-900 shadow overflow-hidden sm:rounded-lg mb-8 border border-gray-100 dark:border-slate-800">
                <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
                    <div>
                        <h3 className="text-2xl font-bold leading-6 text-gray-900 dark:text-white">{request.title}</h3>
                        <p className="mt-1 max-w-2xl text-sm text-gray-500 dark:text-slate-400">
                            {t("requests.posted_on")} {request.createdAt?.toDate ? request.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString()}
                        </p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${request.status === 'open' ? 'bg-green-100 text-green-800' :
                        request.status === 'accepted' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                        {t(`requests.status_${request.status}` as any).toUpperCase()}
                    </span>
                </div>
                <div className="border-t border-gray-200 dark:border-slate-800 px-4 py-5 sm:px-6">
                    <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500 dark:text-slate-400">{t("requests.location")}</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{request.location}</dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500 dark:text-slate-400">{t("requests.practice_area")}</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{request.specialty}</dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500 dark:text-slate-400">{t("requests.budget")}</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">{request.budget ? `$${request.budget}` : t("requests.negotiable")}</dd>
                        </div>
                        <div className="sm:col-span-2">
                            <dt className="text-sm font-medium text-gray-500 dark:text-slate-400">{t("requests.description")}</dt>
                            <dd className="mt-1 text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{request.description}</dd>
                        </div>
                    </dl>
                </div>
            </div>

            {/* Proposals Section */}
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t("requests.proposals")} ({proposals.length})</h3>

            {proposals.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 shadow rounded-lg p-6 text-center text-gray-500 dark:text-slate-400 border border-gray-100 dark:border-slate-800">
                    {t("requests.no_proposals")}
                </div>
            ) : (
                <div className="space-y-4">
                    {proposals.map((proposal) => (
                        <div key={proposal.id} className={`bg-white dark:bg-slate-900 shadow rounded-lg p-6 border-l-4 border-gray-100 dark:border-slate-800 ${proposal.status === 'accepted' ? 'border-l-blue-500 ring-2 ring-blue-500' : 'border-l-transparent dark:border-l-transparent'
                            }`}>
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-4">
                                    {proposal.lawyerPhotoUrl ? (
                                        <Image
                                            src={proposal.lawyerPhotoUrl}
                                            alt={proposal.lawyerName}
                                            width={48}
                                            height={48}
                                            className="rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                                            <FaUser className="text-gray-500" />
                                        </div>
                                    )}
                                    <div>
                                        <h4 className="text-lg font-medium text-gray-900 dark:text-white">{proposal.lawyerName}</h4>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">
                                            {t("requests.submitted")} {proposal.createdAt?.toDate ? proposal.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-gray-900 dark:text-white">${proposal.proposedPrice}</div>
                                    {proposal.estimatedDuration && (
                                        <div className="text-sm text-gray-500 dark:text-slate-400 flex items-center justify-end gap-1">
                                            <FaClock className="h-3 w-3" /> {proposal.estimatedDuration}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 bg-gray-50 dark:bg-slate-800 rounded p-4 text-sm text-gray-800 dark:text-slate-200 whitespace-pre-wrap border border-gray-100 dark:border-slate-700">
                                {proposal.message}
                            </div>

                            <div className="mt-6 flex justify-end">
                                {proposal.status === 'accepted' ? (
                                    <span className="inline-flex items-center gap-1 px-3 py-2 rounded-md bg-green-100 text-green-800 text-sm font-medium">
                                        <FaCheckCircle /> {t("requests.accepted")}
                                    </span>
                                ) : request.status === 'open' ? (
                                    <button
                                        onClick={() => handleAccept(proposal)}
                                        disabled={!!processingId}
                                        className="inline-flex items-center gap-2 rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:opacity-50"
                                    >
                                        {processingId === proposal.id ? t("auth.processing") : t("requests.accept_proposal")}
                                    </button>
                                ) : (
                                    <span className="text-sm text-gray-500 italic">Request closed</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
