"use client";

import { useEffect, useState } from "react";
import { getSiteSettings, updateSiteSettings, SiteSettings } from "@/lib/services";
import { useLanguage } from "@/lib/i18n_context";
import { FaSave, FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";

export default function SiteSettingsForm() {
    const { t } = useLanguage();
    const [settings, setSettings] = useState<SiteSettings>({
        maintenanceMode: false,
        allowSignups: true,
        welcomeMessage: "",
        contactPhone: "",
        contactEmail: "",
        address: "",
        socialLinks: {}
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        getSiteSettings().then(data => {
            setSettings(data);
            setLoading(false);
        });
    }, []);

    const handleChange = (field: keyof SiteSettings, value: string) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    };

    const handleSocialChange = (platform: string, value: string) => {
        setSettings(prev => ({
            ...prev,
            socialLinks: {
                ...prev.socialLinks,
                [platform]: value
            }
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await updateSiteSettings(settings);
            alert(t("admin.settings.success"));
        } catch (error) {
            console.error(error);
            alert(t("admin.settings.error"));
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center">{t("common.loading")}</div>;

    return (
        <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 shadow overflow-hidden sm:rounded-lg border border-gray-200 dark:border-slate-800 p-6 space-y-6">
            <div>
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">{t("admin.settings.title")}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {t("admin.settings.subtitle")}
                </p>
            </div>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                    <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("admin.settings.phone")}</label>
                    <div className="mt-1">
                        <input
                            id="contactPhone"
                            type="text"
                            value={settings.contactPhone}
                            placeholder="+994..."
                            onChange={(e) => handleChange('contactPhone', e.target.value)}
                            className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white dark:placeholder-gray-500 py-2 px-3"
                        />
                    </div>
                </div>

                <div className="sm:col-span-3">
                    <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("admin.settings.email")}</label>
                    <div className="mt-1">
                        <input
                            id="contactEmail"
                            type="email"
                            value={settings.contactEmail}
                            placeholder="email@example.com"
                            onChange={(e) => handleChange('contactEmail', e.target.value)}
                            className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white dark:placeholder-gray-500 py-2 px-3"
                        />
                    </div>
                </div>

                <div className="sm:col-span-6">
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t("admin.settings.address")}</label>
                    <div className="mt-1">
                        <input
                            id="address"
                            type="text"
                            value={settings.address}
                            placeholder="Street, City, Country"
                            onChange={(e) => handleChange('address', e.target.value)}
                            className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white dark:placeholder-gray-500 py-2 px-3"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-6 border-t border-gray-200 dark:border-slate-800">
                <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">{t("admin.settings.social")}</h3>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
                    <div className="col-span-1">
                        <label htmlFor="facebook" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <FaFacebook className="text-blue-600" /> Facebook
                        </label>
                        <input
                            id="facebook"
                            type="text"
                            value={settings.socialLinks?.facebook || ""}
                            onChange={(e) => handleSocialChange('facebook', e.target.value)}
                            placeholder="https://facebook.com/..."
                            className="mt-1 shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white dark:placeholder-gray-500 py-2 px-3"
                        />
                    </div>

                    <div className="col-span-1">
                        <label htmlFor="twitter" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <FaTwitter className="text-blue-400" /> Twitter (X)
                        </label>
                        <input
                            id="twitter"
                            type="text"
                            value={settings.socialLinks?.twitter || ""}
                            onChange={(e) => handleSocialChange('twitter', e.target.value)}
                            placeholder="https://twitter.com/..."
                            className="mt-1 shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white dark:placeholder-gray-500 py-2 px-3"
                        />
                    </div>

                    <div className="col-span-1">
                        <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <FaInstagram className="text-pink-600" /> Instagram
                        </label>
                        <input
                            id="instagram"
                            type="text"
                            value={settings.socialLinks?.instagram || ""}
                            onChange={(e) => handleSocialChange('instagram', e.target.value)}
                            placeholder="https://instagram.com/..."
                            className="mt-1 shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white dark:placeholder-gray-500 py-2 px-3"
                        />
                    </div>

                    <div className="col-span-1">
                        <label htmlFor="linkedin" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <FaLinkedin className="text-blue-700" /> LinkedIn
                        </label>
                        <input
                            id="linkedin"
                            type="text"
                            value={settings.socialLinks?.linkedin || ""}
                            onChange={(e) => handleSocialChange('linkedin', e.target.value)}
                            placeholder="https://linkedin.com/in/..."
                            className="mt-1 shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 dark:border-slate-700 rounded-md bg-white dark:bg-slate-800 text-gray-900 dark:text-white dark:placeholder-gray-500 py-2 px-3"
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 flex items-center gap-2"
                >
                    <FaSave />
                    {saving ? t("profile.saving") : t("profile.saveChanges")}
                </button>
            </div>
        </form>
    );
}
