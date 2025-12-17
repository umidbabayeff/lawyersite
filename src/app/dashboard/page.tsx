"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useForm } from "react-hook-form";
import { getLawyerProfile, updateLawyerProfile, LawyerProfile } from "@/lib/firebase/services";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();
    const [saving, setSaving] = useState(false);

    const { register, handleSubmit, setValue, formState: { errors } } = useForm<LawyerProfile>();

    useEffect(() => {
        if (!loading && (!user || userProfile?.role !== 'lawyer')) {
            router.push('/');
            return;
        }

        if (user) {
            // Load detailed lawyer data
            getLawyerProfile(user.uid).then(data => {
                if (data) {
                    setValue("name", userProfile?.name || "");
                    setValue("city", userProfile?.city || "");
                    setValue("price", data.price);
                    setValue("description", data.description);
                    // Specializations is array, handle appropriately. 
                    // For simplified MVP form, maybe comma separated string?
                    // Or just use multiselect if we had UI for it. 
                    // Let's use comma separated for text input for now or just register specific indexes.
                    // Actually `register` works with arrays but input needs mapping.
                    // Let's cheat and use a temp field for specs joining.
                }
            });
        }
    }, [user, userProfile, loading, router, setValue]);

    // Handle specializations as comma-separated string for simple editing
    const [specsString, setSpecsString] = useState("");
    useEffect(() => {
        if (user?.uid) {
            getLawyerProfile(user.uid).then(data => {
                if (data?.specializations) {
                    setSpecsString(data.specializations.join(", "));
                }
            })
        }
    }, [user]);

    const onSubmit = async (data: LawyerProfile) => {
        if (!user) return;
        setSaving(true);
        try {
            const specs = specsString.split(",").map(s => s.trim()).filter(s => s);

            await updateLawyerProfile(user.uid, {
                name: data.name,
                city: data.city,
                price: Number(data.price),
                description: data.description,
                specializations: specs
            });
            alert("Profile updated!");
        } catch (e) {
            console.error(e);
            alert("Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

    if (loading || !user) return <div className="p-8">Loading...</div>;

    return (
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
            <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Lawyer Dashboard</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Edit your public profile.</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            {...register("name", { required: true })}
                            type="text"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">City</label>
                        <input
                            {...register("city", { required: true })}
                            type="text"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Hourly Rate ($)</label>
                        <input
                            {...register("price", { required: true })}
                            type="number"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Specializations (comma separated)</label>
                        <div className="mt-1">
                            <input
                                type="text"
                                value={specsString}
                                onChange={(e) => setSpecsString(e.target.value)}
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                                placeholder="e.g. Criminal, Family, Corporate"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description / Bio</label>
                        <div className="mt-1">
                            <textarea
                                {...register("description")}
                                rows={5}
                                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {saving ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
