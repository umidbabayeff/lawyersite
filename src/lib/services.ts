
import { createClient } from './supabase/client';

const supabase = createClient();



// --- Types ---
export type UserRole = 'client' | 'lawyer' | 'admin';

export interface UserProfile {
    uid: string;
    role: UserRole;
    name: string;
    email: string;
    city?: string;
    photoUrl?: string;
    favorites?: string[];
}

export interface LawyerProfile extends UserProfile {
    specializations: string[];
    description: string;
    price: number;
    verified: boolean;
    rating: number;
    bannerUrl?: string;
    verificationDocuments?: { name: string; url: string; type: string; uploadedAt: string }[];
}

export interface Review {
    id: string;
    lawyerId: string;
    clientId: string;
    clientName: string;
    rating: number;
    comment: string;
    createdAt: string;
}

export interface ConnectionRequest {
    id: string;
    senderId: string;
    receiverId: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
    senderName?: string;
    senderPhotoUrl?: string;
}

export interface ChatMessage {
    id: string;
    senderId: string;
    text: string;
    createdAt: string | Date;
    type?: 'text' | 'image' | 'file';
    fileUrl?: string;
    fileName?: string;
}

export interface ChatRoom {
    id: string;
    participants: string[];
    lastMessage?: string;
    updatedAt: string | Date;
    unreadCounts?: { [userId: string]: number };
    otherUser?: UserProfile;
}

export interface SiteSettings {
    maintenanceMode: boolean;
    allowSignups: boolean;
    welcomeMessage: string;
    contactPhone?: string;
    contactEmail?: string;
    address?: string;
    socialLinks?: {
        facebook?: string;
        twitter?: string;
        instagram?: string;
        linkedin?: string;
    };
}

export interface CommunityRequest {
    id: string;
    clientId: string;
    title: string;
    description: string;
    status: 'open' | 'accepted' | 'closed';
    createdAt: string | Date;
    clientName: string;
    location?: string;
    specialty?: string;
    budget?: number;
    proposalCount?: number;
}

export interface RequestProposal {
    id: string;
    requestId: string;
    lawyerId: string;
    message: string;
    price: number;
    createdAt: string | Date;
    lawyerName: string;
    lawyerPhotoUrl?: string;
    status: 'pending' | 'accepted' | 'rejected';
    proposedPrice: number;
    estimatedDuration?: string;
}

// CRM Types
export interface Case {
    id: string;
    clientId: string;
    clientName: string;
    title: string;
    status: 'new' | 'in_progress' | 'court' | 'completed';
    createdAt: string | Date;
    description?: string;
    lawyerId?: string;
}

export interface TimeEntry {
    id: string;
    caseId: string;
    durationMinutes: number;
    startTime: string | Date;
    endTime?: string | Date;
    totalAmount: number;
    description?: string;
}

export interface CRMDocument {
    id: string;
    fileName: string;
    fileUrl: string;
    uploadedAt: string | Date;
    source?: 'chat' | 'upload';
}


// --- Helpers ---
function mapProfileToUser(row: Record<string, unknown> | null): UserProfile {
    if (!row) return { uid: '', role: 'client', name: '', email: '' };
    return {
        uid: (row.id as string) || '',
        role: (row.role as UserRole) || 'client',
        name: (row.full_name as string) || '',
        email: '',
        city: row.city as string,
        photoUrl: row.avatar_url as string,
    };
}

// --- User Services ---
export const createUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    const updates: Record<string, unknown> = { updated_at: new Date() };
    if (data.name) updates.full_name = data.name;
    if (data.city) updates.city = data.city;
    if (data.photoUrl) updates.avatar_url = data.photoUrl;
    if (data.role) updates.role = data.role;

    const { error } = await supabase.from('user_profiles').update(updates).eq('id', uid);
    if (error) console.error("Error updating profile:", error);
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {

    // Fetch profile
    const { data, error } = await supabase.from('user_profiles').select('*').eq('id', uid).single();
    if (error) return null;

    // Fetch favorites
    const { data: favs } = await supabase.from('favorites').select('lawyer_id').eq('user_id', uid);
    const favoriteIds = favs ? favs.map((f: { lawyer_id: string }) => f.lawyer_id) : [];

    return {
        ...mapProfileToUser(data as Record<string, unknown>),
        favorites: favoriteIds
    };
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
    const updates: Record<string, unknown> = {};
    if (data.name) updates.full_name = data.name;
    if (data.city) updates.city = data.city;
    if (data.photoUrl) updates.avatar_url = data.photoUrl;
    const { error } = await supabase.from('user_profiles').update(updates).eq('id', uid);
    if (error) throw error;
};

// --- Lawyer Services ---
export const getLawyerProfile = async (uid: string): Promise<LawyerProfile | null> => {
    const { data: user } = await supabase.from('user_profiles').select('*').eq('id', uid).single();
    if (!user) return null;

    const { data: lawyer } = await supabase.from('lawyer_profiles').select('*').eq('id', uid).single();
    const { data: docs } = await supabase.from('verification_documents').select('*').eq('lawyer_id', uid);

    const l = lawyer as Record<string, unknown> | null;
    return {
        ...mapProfileToUser(user as Record<string, unknown>),
        specializations: (l?.specializations as string[]) || [],
        description: (l?.description as string) || '',
        price: Number(l?.price) || 0,
        verified: (l?.verified as boolean) || false,
        rating: Number(l?.rating) || 0,
        bannerUrl: l?.banner_url as string,
        verificationDocuments: (docs as Array<Record<string, unknown>>)?.map((d) => ({
            name: d.file_name as string,
            url: d.file_url as string,
            type: 'unknown',
            uploadedAt: d.created_at as string
        })) || []
    };
};

export const updateLawyerProfile = async (uid: string, data: Partial<LawyerProfile>) => {
    // Update user base
    const userUpdates: Record<string, unknown> = {};
    if (data.name) userUpdates.full_name = data.name;
    if (data.city) userUpdates.city = data.city;
    if (data.photoUrl) userUpdates.avatar_url = data.photoUrl;
    if (Object.keys(userUpdates).length > 0) await supabase.from('user_profiles').update(userUpdates).eq('id', uid);

    // Update lawyer specific
    const lawyerUpdates: Record<string, unknown> = {};
    if (data.specializations) lawyerUpdates.specializations = data.specializations;
    if (data.description) lawyerUpdates.description = data.description;
    if (data.price) lawyerUpdates.price = data.price;
    if (data.bannerUrl) lawyerUpdates.banner_url = data.bannerUrl;

    const { count } = await supabase.from('lawyer_profiles').select('*', { count: 'exact', head: true }).eq('id', uid);
    if (count === 0 && count !== null) {
        await supabase.from('lawyer_profiles').insert({ id: uid, ...lawyerUpdates });
    } else if (Object.keys(lawyerUpdates).length > 0) {
        await supabase.from('lawyer_profiles').update(lawyerUpdates).eq('id', uid);
    }
};

export const createLawyerProfile = updateLawyerProfile;

export const getVerifiedLawyers = async (): Promise<LawyerProfile[]> => {
    const { data } = await supabase.from('lawyer_profiles').select('*, user_profiles (*)').eq('verified', true);

    if (!data) return [];

    return (data as Array<Record<string, unknown>>).map((d) => ({
        ...mapProfileToUser(d.user_profiles as Record<string, unknown>),
        specializations: d.specializations as string[] || [],
        description: d.description as string || '',
        price: Number(d.price) || 0,
        verified: d.verified as boolean || false,
        rating: Number(d.rating) || 0,
        bannerUrl: d.banner_url as string
    }));
};

// --- Favorites ---
export const toggleFavorite = async (userId: string, lawyerId: string, isFavorite: boolean) => {
    let error;
    if (isFavorite) {
        const res = await supabase.from('favorites').delete().match({ user_id: userId, lawyer_id: lawyerId });
        error = res.error;
    } else {
        const res = await supabase.from('favorites').insert({ user_id: userId, lawyer_id: lawyerId });
        error = res.error;
    }
    if (error) throw error;
};

export const getFavoriteLawyers = async (userId: string): Promise<LawyerProfile[]> => {
    const { data } = await supabase
        .from('favorites')
        .select(`
            lawyer_id,
            lawyer:lawyer_profiles (
                *,
                user_profiles (*)
            )
        `)
        .eq('user_id', userId);

    if (!data) return [];

    return data.map((item: any) => {
        const l = item.lawyer;
        if (!l) return null;

        return {
            ...mapProfileToUser(l.user_profiles),
            specializations: l.specializations || [],
            description: l.description || '',
            price: Number(l.price) || 0,
            verified: l.verified || false,
            rating: Number(l.rating) || 0,
            bannerUrl: l.banner_url
        };
    }).filter(Boolean) as LawyerProfile[];
};


// --- Connection Requests ---
export const getIncomingRequests = async (userId: string): Promise<ConnectionRequest[]> => {
    const { data } = await supabase.from('connection_requests').select('*, sender:user_profiles!sender_id (*)').eq('receiver_id', userId).eq('status', 'pending');
    if (!data) return [];
    return (data as Array<Record<string, unknown>>).map((r) => {
        const sender = r.sender as Record<string, unknown>;
        return {
            id: r.id as string,
            senderId: r.sender_id as string,
            receiverId: r.receiver_id as string,
            status: r.status as 'pending' | 'accepted' | 'rejected',
            createdAt: r.created_at as string,
            senderName: sender.full_name as string,
            senderPhotoUrl: sender.avatar_url as string
        };
    });
};

export const respondToConnectionRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    await supabase.from('connection_requests').update({ status }).eq('id', requestId);
};

export const getConnectionStatus = async (userId: string, otherId: string): Promise<'none' | 'pending' | 'accepted' | 'rejected'> => {
    console.log("getConnectionStatus between", userId, otherId);
    return 'none';
};

export const sendConnectionRequest = async (senderId: string, receiverId: string) => {
    await supabase.from('connection_requests').insert({ sender_id: senderId, receiver_id: receiverId });
};


// --- Chat ---
export const getUserChats = async (userId: string): Promise<ChatRoom[]> => {
    console.log("getUserChats for", userId);
    return [];
};
export const getChatRoom = async (userId: string, otherId: string): Promise<ChatRoom | null> => {
    console.log("getChatRoom between", userId, otherId);
    return null;
};
export const sendMessage = async (chatId: string, senderId: string, text: string, options?: Record<string, unknown>) => {
    console.log("sendMessage in", chatId, "by", senderId, text, options);
};
export const subscribeToMessages = (chatId: string, callback: (msgs: ChatMessage[]) => void) => {
    console.log("Subscribing to chat", chatId, callback);
    return () => { };
};
export const getChatMessages = async (chatId: string): Promise<ChatMessage[]> => {
    console.log("getChatMessages for", chatId);
    return [];
};
export const markChatRead = async (chatId: string, userId: string) => {
    console.log("markChatRead for", chatId, "by", userId);
};
export const uploadChatAttachment = async (file: File, chatId: string) => {
    const path = `chats/${chatId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
    return publicUrl;
};
export const importChatDocument = async (caseId: string, lawyerId: string, msg: ChatMessage) => {
    console.log("importChatDocument", msg.fileName, "to", caseId, "by", lawyerId);
    return "";
};
export const subscribeToUnreadCount = (userId: string, callback: (count: number) => void) => {
    console.log("subscribeToUnreadCount for", userId);
    callback(0); return () => { };
};


// --- Reviews ---
export const getLawyerReviews = async (lawyerId: string) => {
    const { data } = await supabase.from('reviews').select('*').eq('lawyer_id', lawyerId);
    return data || [];
};
export const addReview = async (review: Record<string, unknown>) => {
    await supabase.from('reviews').insert({
        lawyer_id: review.lawyerId,
        client_id: review.clientId,
        rating: review.rating,
        comment: review.comment
    });
};


// --- Community Requests ---
export const createCommunityRequest = async (data: Record<string, unknown>) => {
    console.log("createCommunityRequest", data.title);
};
export const getOpenCommunityRequests = async (filters?: { city?: string, specialty?: string }) => {
    console.log("getOpenCommunityRequests", filters);
    return [] as CommunityRequest[];
};
export const getCommunityRequestById = async (id: string) => {
    console.log("getCommunityRequestById", id);
    return null;
};
export const createProposal = async (data: Record<string, unknown>) => {
    console.log("createProposal", data.requestId);
};
export const getProposalsForRequest = async (requestId: string) => {
    console.log("getProposalsForRequest", requestId);
    return [] as RequestProposal[];
};
export const acceptProposal = async (requestId: string, proposalId: string, _lawyerId: string) => {
    console.log("Accepting proposal", proposalId, "for request", requestId, "by lawyer", _lawyerId);
    await supabase.from('request_proposals').update({ status: 'accepted' }).eq('id', proposalId);
    await supabase.from('community_requests').update({ status: 'accepted' }).eq('id', requestId);
};
export const getMyClientRequests = async (clientId: string) => {
    console.log("getMyClientRequests", clientId);
    return [];
};


// --- CRM ---
export const getLawyerCases = async (lawyerId: string) => {
    console.log("getLawyerCases for", lawyerId);
    return [];
};
export const createCase = async (data: Partial<Case>) => {
    console.log("createCase", data.title);
};
export const getCaseById = async (id: string): Promise<Case | null> => {
    console.log("getCaseById", id);
    return null;
};
export const getCase = getCaseById; // Alias

export const updateCase = async (id: string, data: Partial<Case>) => {
    console.log("updateCase", id, data);
};
export const getTimeEntries = async (caseId: string): Promise<TimeEntry[]> => {
    console.log("getTimeEntries for", caseId);
    return [];
};
export const startTimeEntry = async (caseId: string, lawyerId: string) => {
    console.log("startTimeEntry", caseId, lawyerId);
};
export const stopTimeEntry = async (entryId: string, rate: number) => {
    console.log("stopTimeEntry", entryId, "with rate", rate);
};
export const getCRMDocuments = async (caseId: string): Promise<CRMDocument[]> => {
    console.log("getCRMDocuments for", caseId);
    return [];
};
export const uploadCRMDocument = async (file: File, caseId: string, lawyerId: string) => {
    console.log("uploadCRMDocument", file.name, "to", caseId, "by", lawyerId);
};


// --- Admin / Setup ---
// --- Admin / Setup ---
export const getAllUsers = async (): Promise<UserProfile[]> => {
    const { data } = await supabase.from('user_profiles').select('*');
    if (!data) return [];
    return (data as Array<Record<string, unknown>>).map(mapProfileToUser);
};

export const updateUserRole = async (uid: string, role: string) => {
    await supabase.from('user_profiles').update({ role }).eq('id', uid);
};

export const deleteUser = async (uid: string) => {
    await supabase.from('user_profiles').delete().eq('id', uid);
    // Trigger should handle cascade, or RLS might block. Best effort for now.
    // Ideally use Supabase Admin API for full delete, but client side we can only delete public profile if allowed.
};

export const getAllLawyersForAdmin = async (): Promise<LawyerProfile[]> => {
    const { data } = await supabase.from('lawyer_profiles').select('*, user_profiles (*)');
    if (!data) return [];
    return (data as Array<Record<string, unknown>>).map((d) => ({
        ...mapProfileToUser(d.user_profiles as Record<string, unknown>),
        specializations: d.specializations as string[] || [],
        description: d.description as string || '',
        price: Number(d.price) || 0,
        verified: d.verified as boolean || false,
        rating: Number(d.rating) || 0,
        bannerUrl: d.banner_url as string,
        verificationDocuments: [] // Fetching docs for list might be heavy, skipping for list view
    }));
};

export const toggleLawyerVerification = async (uid: string, status: boolean) => {
    // AdminPage calls: handleVerify(lawyer.uid, lawyer.verified) -> toggleLawyerVerification(uid, status)
    // And logic is: {lawyer.verified ? 'Unverify' : 'Verify'}
    // So the UI passes the CURRENT status. We should flip it.
    const { error } = await supabase.from('lawyer_profiles').update({ verified: !status }).eq('id', uid);
    if (error) throw error;
};
export const getSiteSettings = async (): Promise<SiteSettings> => {
    return {
        maintenanceMode: false,
        allowSignups: true,
        welcomeMessage: "",
        contactEmail: "",
        contactPhone: "",
        address: "",
        socialLinks: { facebook: "", twitter: "", instagram: "", linkedin: "" }
    };
};
export const updateSiteSettings = async (settings: Partial<SiteSettings>) => {
    console.log("updateSiteSettings", settings);
};
const dummyLawyers = [
    {
        id: "00000000-0000-0000-0000-000000000001",
        full_name: "John Doe",
        role: "lawyer",
        city: "Baku",
        specializations: ["Criminal Law", "Civil Law"],
        description: "Experienced lawyer with 10+ years in criminal defense.",
        price: 150,
        verified: true,
        rating: 4.8,
        avatar_url: "https://i.pravatar.cc/150?u=1",
        banner_url: "https://picsum.photos/seed/1/800/400"
    },
    {
        id: "00000000-0000-0000-0000-000000000002",
        full_name: "Jane Smith",
        role: "lawyer",
        city: "Ganja",
        specializations: ["Family Law", "Property Law"],
        description: "Specializing in family disputes and property settlements.",
        price: 120,
        verified: true,
        rating: 4.5,
        avatar_url: "https://i.pravatar.cc/150?u=2",
        banner_url: "https://picsum.photos/seed/2/800/400"
    }
];

export const seedDatabase = async () => {
    console.log("Seeding database...");
    for (const lawyer of dummyLawyers) {
        try {
            // Note: This may fail if the IDs don't exist in auth.users due to FK constraints.
            // For a pure demo, consider removing the FK constraint in your SQL editor temporarily.
            const { error: profileError } = await supabase.from('user_profiles').upsert({
                id: lawyer.id,
                full_name: lawyer.full_name,
                role: lawyer.role,
                city: lawyer.city,
                avatar_url: lawyer.avatar_url
            });

            if (profileError) throw profileError;

            const { error: lawyerError } = await supabase.from('lawyer_profiles').upsert({
                id: lawyer.id,
                specializations: lawyer.specializations,
                description: lawyer.description,
                price: lawyer.price,
                verified: lawyer.verified,
                rating: lawyer.rating,
                banner_url: lawyer.banner_url
            });

            if (lawyerError) throw lawyerError;

        } catch (err) {
            console.error("Error seeding lawyer:", lawyer.full_name, err);
            throw err; // Rethrow to notify caller
        }
    }
    console.log("Seed attempt completed.");
};

export const clearDatabase = async () => {
    console.log("Clearing database (Profiles only)...");
    await supabase.from('lawyer_profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('user_profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
};


// --- Constants ---
export const getConstants = async (type: string, lang?: string) => {
    console.log("getConstants", type, lang);
    if (type === 'locations') return ["Baku", "Ganja", "Sumqayit", "Lankaran", "Shaki"];
    if (type === 'specializations') return ["Criminal Law", "Civil Law", "Family Law", "Corporate Law", "Property Law"];
    return [];
};
export const addConstant = async (type: string, value: string) => {
    console.log("addConstant", type, value);
};
export const removeConstant = async (type: string, value: string) => {
    console.log("removeConstant", type, value);
};


// --- Storage Services ---
export const uploadProfilePhoto = async (uid: string, file: File) => {
    const path = `profiles/${uid}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
    return publicUrl;
};

export const uploadBannerPhoto = async (uid: string, file: File) => {
    const path = `banners/${uid}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
    return publicUrl;
};

export const uploadVerificationDocument = async (uid: string, file: File) => {
    const path = `verification/${uid}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('documents').upload(path, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path);
    await supabase.from('verification_documents').insert({ lawyer_id: uid, file_url: publicUrl, file_name: file.name });
    return { name: file.name, url: publicUrl, type: file.type || 'unknown', uploadedAt: new Date().toISOString() };
};
