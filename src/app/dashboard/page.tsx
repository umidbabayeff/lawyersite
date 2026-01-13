"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { getLawyerProfile, updateLawyerProfile, LawyerProfile, getIncomingRequests, respondToConnectionRequest, ConnectionRequest, getConstants, uploadVerificationDocument, uploadProfilePhoto, uploadBannerPhoto } from "@/lib/services";
import SearchableSelect from "@/components/ui/SearchableSelect";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n_context";
import Image from "next/image";

export default function Dashboard() {
    const { user, userProfile, loading, refreshProfile } = useAuth();
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const { t, language } = useLanguage();

    const { register, handleSubmit, setValue, watch } = useForm<LawyerProfile>();
    const cityValue = watch("city");
    const photoUrlValue = watch("photoUrl");

    // Handle specializations as comma-separated string for simple editing
    const [specsString, setSpecsString] = useState("");
    const [locations, setLocations] = useState<string[]>([]);
    const [specializationsList, setSpecializationsList] = useState<string[]>([]);

    const [requests, setRequests] = useState<ConnectionRequest[]>([]);
    const [verifiedDocs, setVerifiedDocs] = useState<{ name: string; url: string; type: string; uploadedAt: string }[]>([]);
    const [uploadingDoc, setUploadingDoc] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const [uploadingBanner, setUploadingBanner] = useState(false);

    useEffect(() => {
        getConstants('locations', language).then(setLocations);
        getConstants('specializations', language).then(setSpecializationsList);
    }, [language]);

    useEffect(() => {
        if (user && userProfile?.role === 'lawyer') {
            getIncomingRequests(user.id).then(setRequests);
        }
    }, [user, userProfile]);

    const handleRequest = async (id: string, status: 'accepted' | 'rejected') => {
        await respondToConnectionRequest(id, status);
        setRequests(prev => prev.filter(r => r.id !== id));
        // If accepted, maybe notify or redirect?
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !user) return;
        setUploadingDoc(true);
        try {
            const file = e.target.files[0];
            const newDoc = await uploadVerificationDocument(user.id, file);
            setVerifiedDocs(prev => [...prev, newDoc]);
        } catch (error) {
            console.error(error);
            alert("Failed to upload document");
        } finally {
            setUploadingDoc(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !user) return;
        setUploadingPhoto(true);
        try {
            const file = e.target.files[0];
            const url = await uploadProfilePhoto(user.id, file);
            setValue("photoUrl", url);
            // Optionally save immediately or let user save form
        } catch (error) {
            console.error(error);
            alert("Failed to upload photo");
        } finally {
            setUploadingPhoto(false);
        }
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !user) return;
        setUploadingBanner(true);
        try {
            const file = e.target.files[0];
            const url = await uploadBannerPhoto(user.id, file);
            setValue("bannerUrl", url);
        } catch (error) {
            console.error(error);
            alert("Failed to upload banner");
        } finally {
            setUploadingBanner(false);
        }
    };

    useEffect(() => {
        if (!loading && (!user || userProfile?.role !== 'lawyer')) {
            router.push('/');
            return;
        }

        if (user) {
            getLawyerProfile(user.id).then(data => {
                if (data) {
                    setValue("name", userProfile?.name || "");
                    setValue("city", userProfile?.city || "");
                    setValue("photoUrl", userProfile?.photoUrl || ""); // Add photoUrl
                    setValue("price", data.price);
                    setValue("description", data.description);
                    setValue("bannerUrl", data.bannerUrl || "");
                    if (data.specializations) {
                        setSpecsString(data.specializations.join(", "));
                    }
                    if (data.verificationDocuments) {
                        setVerifiedDocs(data.verificationDocuments);
                    }
                    if (data.verificationDocuments) {
                        setVerifiedDocs(data.verificationDocuments);
                    }
                }
            });
        }
    }, [user, userProfile, loading, router, setValue]);

    const onSubmit = async (data: LawyerProfile) => {
        if (!user) return;
        setSaving(true);
        try {
            const specs = specsString.split(",").map(s => s.trim()).filter(s => s);

            // Update Lawyer specific data
            await updateLawyerProfile(user.id, {
                name: data.name,
                city: data.city,
                price: Number(data.price),
                description: data.description,
                specializations: specs,
                bannerUrl: data.bannerUrl,
                photoUrl: data.photoUrl // Pass photoUrl so it syncs
            });

            // Services updateLawyerProfile now syncs photoUrl/name/city to Users collection automatically.

            await refreshProfile();

            await refreshProfile();
            alert("Profile updated!");
        } catch (e) {
            console.error(e);
            alert("Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    if (loading || !user) return (
        <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto py-10">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground dark:text-white">{t("dashboard.title")}</h1>
                <p className="text-muted-foreground dark:text-gray-400 mt-2">{t("dashboard.subtitle")}</p>
            </div>

            {/* Requests Section */}
            {requests.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden mb-8">
                    <div className="p-6 border-b border-gray-100 dark:border-slate-800">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t("dashboard.requests.title")}</h2>
                    </div>
                    <div className="divide-y divide-gray-100 dark:divide-slate-800">
                        {requests.map(req => (
                            <div key={req.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-primary/10 dark:bg-slate-800 rounded-full flex items-center justify-center text-primary dark:text-primary-foreground font-bold">
                                        {req.senderName?.[0] || "?"}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 dark:text-white">{req.senderName || "Unknown User"}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{t("dashboard.requests.subtitle")}</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleRequest(req.id, 'accepted')}
                                        className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                                    >
                                        {t("dashboard.requests.accept")}
                                    </button>
                                    <button
                                        onClick={() => handleRequest(req.id, 'rejected')}
                                        className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                                    >
                                        {t("dashboard.requests.reject")}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                <div className="p-8">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                        {/* Photo Section */}
                        <div className="pb-8 border-b border-gray-100 dark:border-slate-800">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t("dashboard.profileImage")}</h3>
                            <div className="flex items-center gap-6">
                                <div className="h-24 w-24 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                                    {photoUrlValue || userProfile?.photoUrl ? (
                                        <Image src={photoUrlValue || userProfile?.photoUrl || ""} alt="Profile" fill className="object-cover" />
                                    ) : (
                                        <span className="text-2xl font-bold text-slate-300 dark:text-slate-600">{userProfile?.name?.[0]}</span>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("dashboard.imageUrl")}</label>
                                    <div className="flex gap-2">
                                        <input
                                            {...register("photoUrl")}
                                            readOnly
                                            type="text"
                                            placeholder="https://..."
                                            className="block w-full border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 focus:ring-primary focus:border-primary sm:text-sm"
                                        />
                                        <label className={`cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 whitespace-nowrap ${uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            {uploadingPhoto ? '...' : 'Upload'}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept="image/*"
                                                onChange={handlePhotoUpload}
                                                disabled={uploadingPhoto}
                                            />
                                        </label>
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t("dashboard.imageHint")}</p>
                                </div>
                            </div>
                        </div>

                        {/* Verification Documents Section */}
                        <div className="pb-8 border-b border-gray-100 dark:border-slate-800">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Verification Documents</h3>
                            <div className="space-y-4">
                                <div className="flex flex-col gap-4">
                                    {verifiedDocs.map((doc, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                                <div className="truncate">
                                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{doc.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 text-sm font-medium px-3">
                                                View
                                            </a>
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Upload Bar License or ID</label>
                                    <div className="flex items-center gap-4">
                                        <label className={`cursor-pointer bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${uploadingDoc ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                            {uploadingDoc ? (
                                                <span className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></span>
                                            ) : (
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                </svg>
                                            )}
                                            {uploadingDoc ? 'Uploading...' : 'Choose File'}
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept=".pdf,.jpg,.jpeg,.png"
                                                onChange={handleFileChange}
                                                disabled={uploadingDoc}
                                            />
                                        </label>
                                        <span className="text-xs text-gray-500 dark:text-gray-400">PDF, JPG or PNG</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Banner Section */}
                        <div className="pb-8 border-b border-gray-100 dark:border-slate-800">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t("dashboard.bannerImage")}</h3>
                            <div className="space-y-4">
                                <div className="flex flex-col gap-4">
                                    <label className={`cursor-pointer bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto ${uploadingBanner ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        {uploadingBanner ? (
                                            <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                            </svg>
                                        )}
                                        {uploadingBanner ? 'Uploading...' : 'Upload Banner Image'}
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleBannerUpload}
                                            disabled={uploadingBanner}
                                        />
                                    </label>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("dashboard.bannerHint")}</p>

                                    {watch("bannerUrl") && (
                                        <div className="relative h-48 w-full rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                                            <Image src={watch("bannerUrl") || ""} alt="Banner Preview" fill className="object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setValue("bannerUrl", "")}
                                                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1 rounded-full text-xs"
                                                title="Remove Banner"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("dashboard.fullName")}</label>
                                <input
                                    {...register("name", { required: true })}
                                    type="text"
                                    className="block w-full border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-primary focus:border-primary sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("dashboard.city")}</label>
                                <SearchableSelect
                                    items={locations}
                                    value={cityValue || ""}
                                    onChange={(val) => setValue("city", val)}
                                    placeholder={t("auth.city") || "Select City"}
                                    className="block w-full border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-primary focus:border-primary sm:text-sm flex items-center justify-between bg-white dark:bg-slate-800 text-gray-900 dark:text-white cursor-pointer"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("dashboard.hourlyRate")}</label>
                                <input
                                    {...register("price", { required: true })}
                                    type="number"
                                    className="block w-full border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-primary focus:border-primary sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("dashboard.specializations")}</label>
                                <SearchableSelect
                                    items={specializationsList}
                                    value={specsString}
                                    onChange={(val) => setSpecsString(val)}
                                    placeholder="Select Specialization"
                                    className="block w-full border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2 focus:ring-primary focus:border-primary sm:text-sm flex items-center justify-between bg-white dark:bg-slate-800 text-gray-900 dark:text-white cursor-pointer"
                                />
                            </div>
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("dashboard.bio")}</label>
                            <textarea
                                {...register("description")}
                                rows={6}
                                className="block w-full border border-gray-300 dark:border-slate-700 rounded-xl px-4 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-primary focus:border-primary sm:text-sm"
                                placeholder={t("dashboard.bioPlaceholder")}
                            />
                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-slate-800">
                            <button
                                type="submit"
                                disabled={saving}
                                className="bg-primary text-primary-foreground px-8 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all disabled:opacity-70"
                            >
                                {saving ? t("dashboard.saving") : t("dashboard.save")}
                            </button>
                        </div>
                    </form>
                </div>
            </div >
        </div >
    );
}
