import { db } from "./config";
import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    query,
    where,
    getDocs,
    DocumentData
} from "firebase/firestore";

// User Types
export type UserRole = 'client' | 'lawyer' | 'admin';

export interface UserProfile {
    uid: string;
    role: UserRole;
    name: string;
    email: string;
    city?: string;
    photoUrl?: string;
}

export interface LawyerProfile extends UserProfile {
    specializations: string[];
    description: string;
    price: number;
    verified: boolean;
    rating: number;
}

// User Services
export const createUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, data, { merge: true });
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    return snap.exists() ? snap.data() as UserProfile : null;
};

// Lawyer Services
export const createLawyerProfile = async (uid: string, data: Partial<LawyerProfile>) => {
    // Initial creation of lawyer-specific data
    const lawyerRef = doc(db, "lawyers", uid);
    await setDoc(lawyerRef, {
        userId: uid,
        verified: false,
        rating: 0,
        ...data
    }, { merge: true });
}

export const getLawyerProfile = async (uid: string): Promise<LawyerProfile | null> => {
    const lawyerRef = doc(db, "lawyers", uid);
    const snap = await getDoc(lawyerRef);
    if (!snap.exists()) return null;

    // Merge with user data for convenience if needed, 
    // but for now returning lawyer specific data + we might need to fetch user data separately or duplicate some info.
    // The prompt says "Lawyer" store has specific fields. 
    // Let's assume we fetch user basic info from 'users' and combined it or store everything in 'users' for simplicity?
    // Prompt structure:
    // users -> uid -> role, name, email, city, photoUrl
    // lawyers -> uid -> userId, specializations, description, price, verified, rating

    const lawyerData = snap.data();
    return lawyerData as LawyerProfile;
};

export const getVerifiedLawyers = async (city?: string, specialization?: string) => {
    let q = query(collection(db, "lawyers"), where("verified", "==", true));

    // Note: complex queries in Firestore require indexes. 
    // For MVP client-side filtering might be easier if dataset is small, 
    // but let's try to compose query.
    // Filtering by city requires city to be in 'lawyers' collection or join. 
    // The prompt structure puts 'city' in 'users'. 
    // This makes filtering lawyers by city hard without duplication or client-side join.
    // I will assume for MVP we duplicate 'city' to lawyer record or just fetch all verified lawyers and filter in UI.
    // Or maybe we can't filter by city in query easily.

    const snap = await getDocs(q);
    return snap.docs.map(d => d.data() as LawyerProfile);
};

export const updateLawyerProfile = async (uid: string, data: Partial<LawyerProfile>) => {
    const lawyerRef = doc(db, "lawyers", uid);
    // Also update user profile common fields if present in data
    // For MVP simple update.
    await updateDoc(lawyerRef, data);

    // If name/city changed, update 'users' collection too.
    if (data.name || data.city) {
        const userUpdate: any = {};
        if (data.name) userUpdate.name = data.name;
        if (data.city) userUpdate.city = data.city;
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, userUpdate);
    }
};

// Admin Services
export const getAllUsers = async () => {
    // This is expensive for large datasets, OK for MVP.
    const userSnap = await getDocs(collection(db, "users"));
    return userSnap.docs.map(d => d.data() as UserProfile);
};

export const getAllLawyersForAdmin = async () => {
    const lawyerSnap = await getDocs(collection(db, "lawyers"));
    return lawyerSnap.docs.map(d => d.data() as LawyerProfile);
}

export const toggleLawyerVerification = async (uid: string, currentStatus: boolean) => {
    const lawyerRef = doc(db, "lawyers", uid);
    await updateDoc(lawyerRef, { verified: !currentStatus });
};

// For blocking, we might just add a 'blocked' field to user profile.
// Auth blocking requires Admin SDK (backend). 
// Since we are frontend only (Firebase Web SDK), we can only mark strict flag in DB and check it in rules/UI.
export const toggleUserBlock = async (uid: string, currentStatus: boolean) => {
    // Assume we add 'blocked' field to user profile
    // Note: UserProfile interface needs update to support 'blocked'
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, { blocked: !currentStatus }, { merge: true });
};

