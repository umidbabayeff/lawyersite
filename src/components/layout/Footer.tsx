"use client";

import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaPhone, FaEnvelope, FaMapMarkerAlt } from "react-icons/fa";
import { useEffect, useState } from "react";
import { getSiteSettings, SiteSettings } from "@/lib/services";

export default function Footer() {
    const [settings, setSettings] = useState<SiteSettings | null>(null);

    useEffect(() => {
        getSiteSettings().then(setSettings);
    }, []);

    const social = settings?.socialLinks || {};

    return (
        <footer className="bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 pt-12 pb-28 md:pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    {/* Brand & Description */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                                <span className="font-bold text-xl">LF</span>
                            </div>
                            <span className="font-bold text-xl text-gray-900 dark:text-white">LawyerFind</span>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed max-w-xs">
                            LawyerFind connects you with top-rated legal professionals. fast, secure, and reliable.
                        </p>
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-col gap-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Contact Us</h3>
                        <div className="flex flex-col gap-3 text-sm text-gray-500 dark:text-gray-400">
                            {settings?.address && (
                                <div className="flex items-start gap-3">
                                    <FaMapMarkerAlt className="mt-1 text-primary shrink-0" />
                                    <span>{settings.address}</span>
                                </div>
                            )}
                            {settings?.contactPhone && (
                                <div className="flex items-center gap-3">
                                    <FaPhone className="text-primary shrink-0" />
                                    <a href={`tel:${settings.contactPhone}`} className="hover:text-primary transition-colors">
                                        {settings.contactPhone}
                                    </a>
                                </div>
                            )}
                            {settings?.contactEmail && (
                                <div className="flex items-center gap-3">
                                    <FaEnvelope className="text-primary shrink-0" />
                                    <a href={`mailto:${settings.contactEmail}`} className="hover:text-primary transition-colors">
                                        {settings.contactEmail}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Socials */}
                    <div className="flex flex-col gap-4">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Follow Us</h3>
                        <div className="flex flex-wrap gap-4">
                            {social.facebook && (
                                <a href={social.facebook} aria-label="Facebook" target="_blank" rel="noreferrer"
                                    className="bg-gray-100 dark:bg-slate-800 p-3 rounded-full text-gray-600 dark:text-gray-400 hover:bg-blue-600 hover:text-white transition-all transform hover:-translate-y-1">
                                    <FaFacebook size={20} />
                                </a>
                            )}
                            {social.twitter && (
                                <a href={social.twitter} aria-label="Twitter" target="_blank" rel="noreferrer"
                                    className="bg-gray-100 dark:bg-slate-800 p-3 rounded-full text-gray-600 dark:text-gray-400 hover:bg-blue-400 hover:text-white transition-all transform hover:-translate-y-1">
                                    <FaTwitter size={20} />
                                </a>
                            )}
                            {social.instagram && (
                                <a href={social.instagram} aria-label="Instagram" target="_blank" rel="noreferrer"
                                    className="bg-gray-100 dark:bg-slate-800 p-3 rounded-full text-gray-600 dark:text-gray-400 hover:bg-pink-600 hover:text-white transition-all transform hover:-translate-y-1">
                                    <FaInstagram size={20} />
                                </a>
                            )}
                            {social.linkedin && (
                                <a href={social.linkedin} aria-label="LinkedIn" target="_blank" rel="noreferrer"
                                    className="bg-gray-100 dark:bg-slate-800 p-3 rounded-full text-gray-600 dark:text-gray-400 hover:bg-blue-700 hover:text-white transition-all transform hover:-translate-y-1">
                                    <FaLinkedin size={20} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-gray-200 dark:border-slate-800 pt-8 mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-500 text-center md:text-left">
                    <p>© {new Date().getFullYear()} LawyerFind. All rights reserved.</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
