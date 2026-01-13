"use client";

import { useEffect, useState } from "react";
import { getAllUsers, updateUserRole, deleteUser, UserProfile, UserRole } from "@/lib/services";
import { FaTrash, FaUser } from "react-icons/fa";
import Image from "next/image";

import { useLanguage } from "@/lib/i18n_context";

export default function UserList() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    useEffect(() => {
        const fetchUsers = async () => {
            const data = await getAllUsers();
            setUsers(data);
            setLoading(false);
        };
        fetchUsers();
    }, []);

    const handleRoleChange = async (uid: string, newRole: string) => {
        if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) return;

        try {
            await updateUserRole(uid, newRole);
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole as UserRole } : u));
        } catch (error) {
            console.error(error);
            alert("Failed to update role");
        }
    };

    const handleDelete = async (uid: string) => {
        if (!confirm(t("admin.deleteConfirm"))) return;

        try {
            await deleteUser(uid);
            setUsers(prev => prev.filter(u => u.uid !== uid));
        } catch (error) {
            console.error(error);
            alert("Failed to delete user");
        }
    };

    if (loading) return <div className="text-center py-8 text-gray-500">{t("common.loading")}</div>;

    return (
        <div className="bg-white dark:bg-slate-900 shadow overflow-hidden sm:rounded-lg border border-gray-200 dark:border-slate-800">
            <ul className="divide-y divide-gray-200 dark:divide-slate-800">
                {users.map((user) => (
                    <li key={user.uid} className="px-4 py-4 sm:px-6 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 overflow-hidden relative">
                                {user.photoUrl ? (
                                    <Image src={user.photoUrl} alt={user.name} fill className="object-cover" />
                                ) : (
                                    <FaUser />
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.name || "No Name"}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <select
                                value={user.role}
                                onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                                aria-label={t("auth.role")}
                                className="text-sm border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md py-1 pl-2 pr-8 focus:ring-primary focus:border-primary dark:text-gray-300"
                            >
                                <option value="client">{t("auth.client")}</option>
                                <option value="lawyer">{t("auth.lawyer")}</option>
                                <option value="admin">Admin</option>
                            </select>

                            <button
                                onClick={() => handleDelete(user.uid)}
                                title={t("admin.delete")}
                                className="text-red-600 hover:text-red-900 dark:hover:text-red-400 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                <FaTrash />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
