"use client";

import { useLanguage } from "@/lib/i18n_context";

export default function PrivacyPage() {
    const { t } = useLanguage();

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-8 border-b border-gray-200 dark:border-slate-800 pb-4">
                {t("privacy.title")}
            </h1>

            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">
                {t("privacy.lastUpdated")}: {new Date().toLocaleDateString()}
            </p>

            <div className="prose prose-lg dark:prose-invert max-w-none space-y-12">
                <section>
                    <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
                        {t("privacy.intro")}
                    </p>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                        <span className="bg-primary/10 text-primary p-2 rounded-lg text-lg">1</span>
                        {t("privacy.collection")}
                    </h2>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                        <p className="text-gray-600 dark:text-gray-300">
                            {t("privacy.collectionText")}
                        </p>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                        <span className="bg-primary/10 text-primary p-2 rounded-lg text-lg">2</span>
                        {t("privacy.usage")}
                    </h2>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                        <p className="text-gray-600 dark:text-gray-300">
                            {t("privacy.usageText")}
                        </p>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                        <span className="bg-primary/10 text-primary p-2 rounded-lg text-lg">3</span>
                        {t("privacy.sharing")}
                    </h2>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                        <p className="text-gray-600 dark:text-gray-300">
                            {t("privacy.sharingText")}
                        </p>
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                        <span className="bg-primary/10 text-primary p-2 rounded-lg text-lg">4</span>
                        {t("privacy.contact")}
                    </h2>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/50">
                        <p className="text-blue-800 dark:text-blue-300 font-medium">
                            {t("privacy.contactText")}
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
}
