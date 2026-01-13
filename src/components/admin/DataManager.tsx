"use client";

import { useEffect, useState, useCallback } from "react";
import { getConstants, addConstant, removeConstant } from "@/lib/services";
import { useLanguage } from "@/lib/i18n_context";
import { FaTimes, FaPlus } from "react-icons/fa";

export default function DataManager() {
    const { language, t } = useLanguage();
    const [locations, setLocations] = useState<string[]>([]);
    const [specializations, setSpecializations] = useState<string[]>([]);

    const [newLocation, setNewLocation] = useState("");
    const [newSpec, setNewSpec] = useState("");

    const refreshData = useCallback(async () => {
        const locs = await getConstants('locations', language);
        const specs = await getConstants('specializations', language);
        setLocations(locs);
        setSpecializations(specs);
    }, [language]);

    useEffect(() => {
        const load = async () => {
            await refreshData();
        };
        load();
    }, [language, refreshData]);

    const handleAdd = async (type: 'locations' | 'specializations', value: string) => {
        if (!value.trim()) return;
        await addConstant(type, value);
        if (type === 'locations') setNewLocation("");
        else setNewSpec("");
        await refreshData();
    };

    const handleRemove = async (type: 'locations' | 'specializations', value: string) => {
        if (!confirm(`${t("admin.remove")} "${value}"?`)) return;
        await removeConstant(type, value);
        await refreshData();
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Cities Manager */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-gray-100 dark:border-slate-800">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">{t("admin.cities")} ({language.toUpperCase()})</h3>

                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newLocation}
                        onChange={(e) => setNewLocation(e.target.value)}
                        placeholder={t("admin.addCity") + "..."}
                        className="flex-1 rounded-md border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm px-3 py-2 text-gray-900 dark:text-white"
                    />
                    <button
                        onClick={() => handleAdd('locations', newLocation)}
                        aria-label={t("admin.addCity")}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
                    >
                        <FaPlus />
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {locations.map(loc => (
                        <div key={loc} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-full text-sm">
                            <span>{loc}</span>
                            <button
                                onClick={() => handleRemove('locations', loc)}
                                aria-label={`${t("admin.remove")} ${loc}`}
                                className="text-slate-400 hover:text-red-500"
                            >
                                <FaTimes size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Specializations Manager */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-lg shadow border border-gray-100 dark:border-slate-800">
                <h3 className="font-bold text-gray-900 dark:text-white mb-4">{t("admin.specs")} ({language.toUpperCase()})</h3>

                <div className="flex gap-2 mb-4">
                    <input
                        type="text"
                        value={newSpec}
                        onChange={(e) => setNewSpec(e.target.value)}
                        placeholder={t("admin.addSpec") + "..."}
                        className="flex-1 rounded-md border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm px-3 py-2 text-gray-900 dark:text-white"
                    />
                    <button
                        onClick={() => handleAdd('specializations', newSpec)}
                        aria-label={t("admin.addSpec")}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
                    >
                        <FaPlus />
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    {specializations.map(spec => (
                        <div key={spec} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-full text-sm">
                            <span>{spec}</span>
                            <button
                                onClick={() => handleRemove('specializations', spec)}
                                aria-label={`${t("admin.remove")} ${spec}`}
                                className="text-slate-400 hover:text-red-500"
                            >
                                <FaTimes size={12} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
