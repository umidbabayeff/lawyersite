"use client";

import { useEffect, useState, useCallback } from "react";
import { getLawyerProfile, getUserProfile, LawyerProfile, getConnectionStatus, sendConnectionRequest, getChatRoom, getLawyerReviews, addReview, Review } from "@/lib/firebase/services";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import { FaCheckCircle, FaStar, FaEnvelope, FaPhone, FaMapMarkerAlt, FaUniversity } from "react-icons/fa";
import { MdVerified } from "react-icons/md";
import FavoriteButton from "@/components/ui/FavoriteButton";
import { useLanguage } from "@/lib/i18n_context";
import Image from "next/image";

export default function LawyerProfilePage() {
    const params = useParams();
    const id = params?.id as string;
    const { t } = useLanguage();

    const [lawyer, setLawyer] = useState<LawyerProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'accepted' | 'rejected'>('none');
    const { user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        async function load() {
            if (!id) return;
            try {
                const lawyerData = await getLawyerProfile(id);
                const userData = await getUserProfile(id);

                if (lawyerData && userData) {
                    setLawyer({ ...userData, ...lawyerData });
                } else if (lawyerData) {
                    setLawyer(lawyerData);
                }

                if (user) {
                    const status = await getConnectionStatus(user.uid, id);
                    setConnectionStatus(status);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [id, user]);

    const handleConnect = async () => {
        if (!user || !lawyer) return;
        await sendConnectionRequest(user.uid, lawyer.uid);
        setConnectionStatus('pending');
    };

    const handleMessage = async () => {
        if (!user || !lawyer) return;
        // Check if chat exists, if so go there
        const chat = await getChatRoom(user.uid, lawyer.uid);
        if (chat) {
            router.push(`/chat/${chat.id}`);
        } else {
            // Should have been created on accept, but fallback or waiting
            console.log("Chat room not found or not created yet");
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center py-32">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
    );

    if (!lawyer) return (
        <div className="text-center py-32">
            <h2 className="text-2xl font-bold text-gray-900">{t("lawyer.notFound")}</h2>
            <p className="text-gray-500 mt-2">{t("lawyer.notFoundDesc")}</p>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto pb-24 sm:pb-8">
            {/* Header Profile Card */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden mb-8 border border-gray-100 dark:border-slate-800">
                <div className="h-48 bg-primary relative overflow-hidden">
                    {lawyer.bannerUrl && (
                        <Image src={lawyer.bannerUrl} alt="Cover Image" fill className="object-cover" priority />
                    )}
                    <div className={`absolute inset-0 ${lawyer.bannerUrl ? 'bg-black/30' : 'bg-gradient-to-r from-primary to-slate-800 opacity-90'}`}></div>
                    {!lawyer.bannerUrl && <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>}
                </div>
                <div className="px-8 pb-8 relative">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start mb-6 gap-6">
                        <div className="-mt-16 sm:-mt-20 h-32 w-32 sm:h-40 sm:w-40 rounded-2xl border-4 border-white dark:border-slate-900 shadow-xl bg-white dark:bg-slate-800 overflow-hidden flex-shrink-0 relative z-10">
                            {lawyer.photoUrl ? (
                                <Image src={lawyer.photoUrl} alt={lawyer.name} fill className="object-cover" />
                            ) : (
                                <div className="h-full w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600">
                                    <span className="text-5xl font-bold">{lawyer.name?.[0]}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex-grow pt-2 text-center sm:text-left">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    {lawyer.name}
                                    {lawyer.verified && (
                                        <MdVerified className="text-blue-500 text-2xl" title="Verified Lawyer" />
                                    )}
                                </h1>

                                <div className="flex items-center gap-2 justify-center sm:justify-start">
                                    <FavoriteButton lawyerId={lawyer.uid} />
                                    {lawyer.verified && (
                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 border border-green-200">
                                            <FaCheckCircle /> {t("home.verified")}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4 text-gray-500 dark:text-slate-400 text-sm mb-5">
                                <span className="flex items-center gap-1.5"><FaMapMarkerAlt className="text-accent" /> {lawyer.city || t("lawyer.locationNA")}</span>
                                <span className="hidden sm:inline text-gray-300 dark:text-slate-600">|</span>
                                <span className="flex items-center gap-1.5"><FaStar className="text-yellow-400" /> <span className="font-medium text-gray-900 dark:text-white">{lawyer.rating || "New"}</span> Rating</span>
                            </div>

                            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                {lawyer.specializations?.map(s => (
                                    <span key={s} className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wide border border-slate-200 dark:border-slate-700">
                                        {s}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex-shrink-0 w-full sm:w-auto mt-4 sm:self-center">
                            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 text-center sm:text-right shadow-sm">
                                <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2">{t("lawyer.consultation")}</p>
                                <p className="text-3xl font-extrabold text-primary">${lawyer.price}<span className="text-sm font-medium text-slate-400">{t("lawyer.perHour")}</span></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-8">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center justify-center sm:justify-start gap-2">
                            <FaUniversity className="text-accent" /> {t("lawyer.about")}
                        </h3>
                        <div className="prose prose-slate dark:prose-invert max-w-none text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {lawyer.description || t("lawyer.noBio")}
                        </div>
                    </div>

                    {/* Reviews Section */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-8">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center justify-center sm:justify-start gap-2">
                            <FaStar className="text-yellow-400" /> {t("lawyer.reviews") || "Client Feedback"}
                        </h3>

                        <LawyerReviews lawyerId={lawyer.uid} />
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 text-center sm:text-left">{t("lawyer.contactInfo")}</h3>
                        <div className="space-y-4">
                            {connectionStatus === 'accepted' ? (
                                <button
                                    onClick={handleMessage}
                                    className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2"
                                >
                                    <FaEnvelope /> {t("lawyer.sendMessage")}
                                </button>
                            ) : connectionStatus === 'pending' ? (
                                <button disabled className="w-full bg-slate-100 dark:bg-slate-800 text-slate-400 py-3 rounded-xl font-semibold cursor-not-allowed flex items-center justify-center gap-2">
                                    <FaEnvelope /> {t("lawyer.requestSent")}
                                </button>
                            ) : (
                                <button
                                    onClick={handleConnect}
                                    className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all flex items-center justify-center gap-2"
                                >
                                    <FaEnvelope /> {t("lawyer.connect")}
                                </button>
                            )}

                            <button className="w-full bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-700 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                                <FaPhone className="text-accent" /> {t("lawyer.showNumber")}
                            </button>

                            <div className="pt-4 mt-4 border-t border-gray-100">
                                <p className="text-xs text-center text-gray-400">
                                    {t("lawyer.responseTime")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}



function LawyerReviews({ lawyerId }: { lawyerId: string }) {
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, userProfile } = useAuth();
    const [isAdding, setIsAdding] = useState(false);
    const [newRating, setNewRating] = useState(5);
    const [newComment, setNewComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const loadReviews = useCallback(() => {
        getLawyerReviews(lawyerId).then(setReviews).catch(console.error).finally(() => setLoading(false));
    }, [lawyerId]);

    useEffect(() => {
        loadReviews();
    }, [loadReviews]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || submitting) return;

        setSubmitting(true);
        try {
            await addReview({
                lawyerId,
                clientId: user.uid,
                clientName: userProfile?.name || "Anonymous Client",
                rating: newRating,
                comment: newComment
            });
            setIsAdding(false);
            setNewComment("");
            setNewRating(5);
            loadReviews(); // Refresh list
        } catch (err) {
            console.error(err);
            alert("Failed to submit review");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-center text-sm text-gray-500">Loading reviews...</div>;

    return (
        <div className="space-y-6">
            {/* Add Review Button for Clients */}
            {user && userProfile?.role === 'client' && !isAdding && (
                <button
                    onClick={() => setIsAdding(true)}
                    className="text-primary hover:text-primary/80 font-medium text-sm flex items-center gap-2"
                >
                    + Add Feedback
                </button>
            )}

            {/* Add Review Form */}
            {isAdding && (
                <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-slate-800 p-4 rounded-xl mb-6">
                    <h4 className="font-bold text-gray-900 dark:text-white mb-3">Write a Review</h4>
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Rating</label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setNewRating(star)}
                                    aria-label={`Rate ${star} Stars`}
                                    className="focus:outline-none"
                                >
                                    <FaStar className={star <= newRating ? "text-yellow-400 text-xl" : "text-gray-300 text-xl"} />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-500 mb-1">Comment</label>
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            className="w-full p-3 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:ring-2 focus:ring-primary outline-none"
                            rows={3}
                            placeholder="Share your experience..."
                            required
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setIsAdding(false)}
                            className="px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-3 py-1.5 text-xs font-bold text-white bg-primary rounded-lg hover:bg-primary/90 disabled:opacity-50"
                        >
                            {submitting ? "Submitting..." : "Submit Review"}
                        </button>
                    </div>
                </form>
            )}

            {/* Reviews List */}
            {reviews.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                    <p className="text-gray-500 dark:text-slate-400">No reviews yet.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-100 dark:border-slate-800 last:border-0 pb-6 last:pb-0 animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex items-center justify-between mb-2">
                                <div className="font-semibold text-gray-900 dark:text-white">{review.clientName}</div>
                                <span className="text-xs text-gray-400">
                                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                                </span>
                            </div>
                            <div className="flex text-yellow-400 text-sm mb-2">
                                {[...Array(5)].map((_, i) => (
                                    <FaStar key={i} className={i < review.rating ? "text-yellow-400" : "text-gray-200 dark:text-slate-700"} />
                                ))}
                            </div>
                            <p className="text-gray-600 dark:text-slate-300 text-sm leading-relaxed">
                                {review.comment}
                            </p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
