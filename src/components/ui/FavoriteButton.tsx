"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { toggleFavorite } from "@/lib/firebase/services";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { clsx } from "clsx";

interface FavoriteButtonProps {
    lawyerId: string;
    className?: string;
}

export default function FavoriteButton({ lawyerId, className }: FavoriteButtonProps) {
    const { user, userProfile, refreshProfile } = useAuth();
    const [isFavorite, setIsFavorite] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (userProfile?.favorites?.includes(lawyerId)) {
            setIsFavorite(true);
        } else {
            setIsFavorite(false);
        }
    }, [userProfile, lawyerId]);

    const handleToggle = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent navigating if inside a Link
        e.stopPropagation();

        if (!user) {
            alert("Please sign in to save lawyers.");
            return;
        }

        if (loading) return;
        setLoading(true);

        if (!lawyerId) {
            console.error("Cannot toggle favorite: lawyerId is undefined");
            return;
        }

        try {
            await toggleFavorite(user.uid, lawyerId, isFavorite);
            // Optimistic update
            setIsFavorite(!isFavorite);
            // Refresh profile to keep local state in sync for other components
            await refreshProfile();
        } catch (error) {
            console.error("Failed to toggle favorite", error);
            // Revert
            setIsFavorite(isFavorite);
        } finally {
            setLoading(false);
        }
    };

    // Hide for lawyers, show for clients and guests
    if (userProfile?.role === 'lawyer') return null;

    return (
        <button
            onClick={handleToggle}
            className={clsx(
                "p-2 rounded-full transition-all duration-300 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-accent/50",
                isFavorite ? "text-red-500 bg-red-50 hover:bg-red-100" : "text-gray-400 bg-gray-100 hover:bg-gray-200 hover:text-red-400",
                loading && "opacity-70 cursor-wait",
                className
            )}
            title={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
            {isFavorite ? <FaHeart className="w-5 h-5" /> : <FaRegHeart className="w-5 h-5" />}
        </button>
    );
}
