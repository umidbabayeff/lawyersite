"use client";

import Image from "next/image";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { updateUserProfile, UserProfile, uploadProfilePhoto } from "@/lib/services";
import { useRouter } from "next/navigation";
import { FaUser, FaCity, FaCamera } from "react-icons/fa";
import { useLanguage } from "@/lib/i18n_context";

export default function ClientProfilePage() {
    const { user, userProfile, loading, refreshProfile } = useAuth();
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);
    const { t } = useLanguage();

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<UserProfile>();
    const photoUrlValue = watch("photoUrl");

    useEffect(() => {
        if (!loading && (!user || userProfile?.role !== 'client')) {
            router.push('/');
            return;
        }

        if (userProfile) {
            setValue("name", userProfile.name);
            setValue("city", userProfile.city || "");
            setValue("photoUrl", userProfile.photoUrl || "");
        }
    }, [user, userProfile, loading, router, setValue]);

    const onSubmit = async (data: UserProfile) => {
        if (!user) return;
        setSaving(true);
        try {
            await updateUserProfile(user.id, {
                name: data.name,
                city: data.city,
                photoUrl: data.photoUrl
            });
            await refreshProfile();
            await refreshProfile();
            alert(t("profile.success"));
        } catch (e) {
            console.error(e);
            alert(t("profile.error"));
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !e.target.files[0] || !user) return;
        setUploadingPhoto(true);
        try {
            const file = e.target.files[0];
            const url = await uploadProfilePhoto(user.id, file);
            setValue("photoUrl", url);
        } catch (error) {
            console.error(error);
            alert("Failed to upload photo");
        } finally {
            setUploadingPhoto(false);
        }
    };

    if (loading || !user) {
        return (
            <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-10">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">{t("profile.title")}</h1>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    {/* Photo URL Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t("profile.photoUrl")}</label>
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 relative">
                                {photoUrlValue || userProfile?.photoUrl ? (
                                    <Image src={photoUrlValue || userProfile?.photoUrl || ''} alt="Avatar" fill className="object-cover" />
                                ) : (
                                    <FaUser className="text-slate-300 dark:text-slate-600 text-2xl" />
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <FaCamera />
                                        </div>
                                        <input
                                            {...register("photoUrl")}
                                            readOnly
                                            type="text"
                                            placeholder="https://example.com/photo.jpg"
                                            className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-slate-700 rounded-xl leading-5 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 placeholder-gray-400 focus:outline-none focus:border-primary sm:text-sm transition-all"
                                        />
                                    </div>
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
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{t("profile.pasteUrl")}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("profile.fullName")}</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <FaUser />
                                </div>
                                <input
                                    {...register("name", { required: "Name is required" })}
                                    type="text"
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-slate-700 rounded-xl leading-5 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
                                />
                            </div>
                            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("profile.city")}</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                    <FaCity />
                                </div>
                                <input
                                    {...register("city")}
                                    type="text"
                                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 dark:border-slate-700 rounded-xl leading-5 bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent sm:text-sm transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all disabled:opacity-70"
                        >
                            {saving ? t("profile.saving") : t("profile.saveChanges")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
