"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    User as FirebaseUser,
    signOut as firebaseSignOut
} from "firebase/auth";
import { auth } from "./firebase/config";
import { getUserProfile, UserProfile } from "./firebase/services";

interface AuthContextType {
    user: FirebaseUser | null;
    userProfile: UserProfile | null;
    loading: boolean;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    loading: true,
    logout: async () => { },
    refreshProfile: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (uid: string) => {
        try {
            console.log(`[Auth] Fetching profile for ${uid}...`);
            const profile = await getUserProfile(uid);
            console.log(`[Auth] Profile fetched:`, profile ? "Found" : "NOT FOUND", profile);
            setUserProfile(profile);
        } catch (error) {
            console.error("Error fetching user profile:", error);
            setUserProfile(null);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);

            if (firebaseUser) {
                await fetchProfile(firebaseUser.uid);
            } else {
                setUserProfile(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        await firebaseSignOut(auth);
        setUser(null);
        setUserProfile(null);
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.uid);
        }
    };

    return (
        <AuthContext.Provider value={{ user, userProfile, loading, logout, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
