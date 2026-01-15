"use client";

import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from "react-icons/fa";
import { useEffect, useState } from "react";
import { getSiteSettings, SiteSettings } from "@/lib/services";

export default function Footer() {
    const [settings, setSettings] = useState<SiteSettings | null>(null);

    useEffect(() => {
        getSiteSettings().then(setSettings);
    }, []);

    const social = settings?.socialLinks || {};

    return (
        <footer className="bg-white dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 py-8 pb-32 sm:pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    {/* Brand */}
                    <div className="flex items-center gap-2">
                        <div className="bg-primary text-primary-foreground p-2 rounded-lg">
                            <span className="font-bold text-xl">LF</span>
                        </div>
                        <span className="font-bold text-xl text-gray-900 dark:text-white">LawyerFind</span>
                    </div>

                    {/* Socials */}
                    <div className="flex gap-4">
                        {social.facebook && <a href={social.facebook} aria-label="Facebook" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-primary transition-colors"><FaFacebook size={20} /></a>}
                        {social.twitter && <a href={social.twitter} aria-label="Twitter" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-primary transition-colors"><FaTwitter size={20} /></a>}
                        {social.instagram && <a href={social.instagram} aria-label="Instagram" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-primary transition-colors"><FaInstagram size={20} /></a>}
                        {social.linkedin && <a href={social.linkedin} aria-label="LinkedIn" target="_blank" rel="noreferrer" className="text-gray-400 hover:text-primary transition-colors"><FaLinkedin size={20} /></a>}
                    </div>

                    {/* Copyright */}
                    <p className="text-gray-400 text-sm">
                        © {new Date().getFullYear()} LawyerFind. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
