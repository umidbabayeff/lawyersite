
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
    type?: 'text' | 'image' | 'file' | 'call_log';
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
    fileUrl?: string; // Optional for folders
    uploadedAt: string | Date;
    source?: 'chat' | 'upload';
    isFolder?: boolean;
    parentId?: string | null;
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

    // Cast data to a more specific type structure matching the query result
    const rows = data as unknown as Array<{
        lawyer: Record<string, unknown> & {
            user_profiles: Record<string, unknown> | null
        }
    }>;

    return rows.map((item) => {
        const l = item.lawyer;
        if (!l) return null;

        return {
            ...mapProfileToUser(l.user_profiles),
            specializations: (l.specializations as string[]) || [],
            description: (l.description as string) || '',
            price: Number(l.price) || 0,
            verified: (l.verified as boolean) || false,
            rating: Number(l.rating) || 0,
            bannerUrl: l.banner_url as string
        };
    }).filter(Boolean) as LawyerProfile[];
};


// --- Connection Requests ---
export const getIncomingRequests = async (userId: string): Promise<ConnectionRequest[]> => {
    const { data } = await supabase.from('connection_requests').select('*, sender:user_profiles!sender_id (*)').eq('receiver_id', userId).eq('status', 'pending');
    if (!data) return [];
    return (data as Array<Record<string, unknown>>).map((r) => {
        const sender = (r.sender as Record<string, unknown>) || {};
        return {
            id: r.id as string,
            senderId: r.sender_id as string,
            receiverId: r.receiver_id as string,
            status: r.status as 'pending' | 'accepted' | 'rejected',
            createdAt: r.created_at as string,
            senderName: (sender.full_name as string) || "Unknown User",
            senderPhotoUrl: (sender.avatar_url as string) || ""
        };
    });
};

export const subscribeToIncomingRequestsCount = (userId: string, callback: (count: number) => void) => {
    const fetchCount = async () => {
        const { count } = await supabase
            .from('connection_requests')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', userId)
            .eq('status', 'pending');
        callback(count || 0);
    };

    fetchCount();

    const channel = supabase.channel(`requests:${userId}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'connection_requests', filter: `receiver_id=eq.${userId}` },
            () => {
                fetchCount();
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};

export const respondToConnectionRequest = async (requestId: string, status: 'accepted' | 'rejected') => {
    const { data, error } = await supabase
        .from('connection_requests')
        .update({ status })
        .eq('id', requestId)
        .select()
        .single();

    if (error) throw error;

    if (status === 'accepted' && data) {
        // Automatically start the chat by sending a system-like message from the acceptor
        // connection_request.sender_id is the one who ASKED (Client) -> They become the receiver of this message
        // connection_request.receiver_id is the one who ACCEPTED (Lawyer) -> They are the sender of this message
        await sendMessage(data.sender_id, data.receiver_id, "I have accepted your connection request. How can I help you?");
    }
};

export const getConnectionStatus = async (userId: string, otherId: string): Promise<'none' | 'pending' | 'accepted' | 'rejected'> => {
    console.log("getConnectionStatus between", userId, otherId);
    return 'none';
};

export const sendConnectionRequest = async (senderId: string, receiverId: string) => {
    await supabase.from('connection_requests').insert({ sender_id: senderId, receiver_id: receiverId });
};


// --- Chat ---

// Helper to get conversation ID (standardized as sorted IDs joined) or just use logic
// For this app, the Page uses `/chat/[targetUserId]`, so the "Chat ID" IS the "Other User ID".

export const getUserChats = async (userId: string): Promise<ChatRoom[]> => {
    // 1. Fetch all messages involving the user
    // Note: This is an inefficient MVP approach. For production, use a separate 'conversations' table or a recursive SQL view.
    const { data: messages, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("getUserChats error", error);
        return [];
    }

    // 2. Group by the OTHER user
    const chatsMap = new Map<string, ChatRoom>();

    if (messages) {
        for (const msg of messages) {
            const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;

            if (!chatsMap.has(otherId)) {
                chatsMap.set(otherId, {
                    id: otherId, // Chat ID is the other user's ID
                    participants: [userId, otherId],
                    lastMessage: msg.content || (msg.type === 'image' ? 'Sent an image' : 'Sent a file'),
                    updatedAt: msg.created_at,
                    unreadCounts: {}
                });
            }
        }
    }

    // 3. ALSO fetch "Accepted" connections to ensure they appear even if no messages yet
    const { data: connections } = await supabase
        .from('connection_requests')
        .select('sender_id, receiver_id, created_at')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('status', 'accepted');

    if (connections) {
        for (const conn of connections) {
            const otherId = conn.sender_id === userId ? conn.receiver_id : conn.sender_id;
            if (!chatsMap.has(otherId)) {
                chatsMap.set(otherId, {
                    id: otherId,
                    participants: [userId, otherId],
                    lastMessage: "Start a conversation", // Placeholder
                    updatedAt: conn.created_at,
                    unreadCounts: {}
                });
            }
        }
    }

    const chats = Array.from(chatsMap.values());

    // 4. Fetch user profiles for all these chats
    const otherIds = chats.map(c => c.id);
    if (otherIds.length > 0) {
        const { data: users } = await supabase.from('user_profiles').select('*').in('id', otherIds);
        const userMap = new Map(users?.map(u => [u.id, mapProfileToUser(u as Record<string, unknown>)]));

        chats.forEach(c => {
            c.otherUser = userMap.get(c.id);
        });
    }

    return chats;
};

export const getChatRoom = async (userId: string, otherId: string): Promise<ChatRoom | null> => {
    // Check if any messages exist
    const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`);

    if (!count) return null;

    const otherUser = await getUserProfile(otherId);
    return {
        id: otherId,
        participants: [userId, otherId],
        updatedAt: new Date(), // Mock, would need actual last msg
        otherUser: otherUser || undefined
    };
};

export const sendMessage = async (chatId: string, senderId: string, text: string, options?: { type?: string, url?: string, name?: string }) => {
    // chatId IS the receiverId in this logic
    const receiverId = chatId;

    const { error } = await supabase.from('messages').insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content: text,
        type: options?.type || 'text',
        file_url: options?.url,
        file_name: options?.name,
        is_read: false
    });

    if (error) throw error;
};

export const subscribeToMessages = (chatId: string, callback: (msgs: ChatMessage[]) => void) => {
    // chatId is the OTHER user's ID.
    // We can't easily subscribe to "conversations with X" without auth context in filter.
    // BUT we can select * from messages where (sender=Me & receiver=Other) OR (sender=Other & receiver=Me).
    // Realtime filters are limited. simpler to subscribe to ALL public:messages and filter client side?
    // Or just subscribe to 'messages' and filter in callback?
    // Ideally we pass the current user ID to this function to handle filtering more securely/efficiently.
    // LIMITATION: 'subscribe' filters must be simple equality usually. 

    // Workaround: We will fetch initial and then listen to everything or use a loop. 
    // actually, let's just use the client to get messages initially, and then subscribe.

    // Hack: We need the Current User ID to filter properly inside this function, 
    // but the signature is (chatId, callback). 
    // We'll rely on the caller to manage refreshing or we use a global channel.
    // Better: Allow the caller to pass existing messages? 
    // Let's change the pattern: This function will fetch AND subscribe.

    // We assume the caller knows 'chatId' is the PARTNER id.
    // To fetch, we need OUR id. We don't have it here. 
    // We'll assume the component handles fetching via `getChatMessages` first?
    // The current component calls `subscribeToMessages` and expects it to do everything.
    // We will use `supabase.auth.getUser()` to get current user.

    let myId: string = "";

    const fetchMessages = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        myId = user.id;

        const { data } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${user.id},receiver_id.eq.${chatId}),and(sender_id.eq.${chatId},receiver_id.eq.${user.id})`)
            .order('created_at', { ascending: true });

        if (data) {
            const msgs = (data as Array<Record<string, unknown>>).map((d) => ({
                id: d.id as string,
                senderId: d.sender_id as string,
                text: d.content as string,
                createdAt: d.created_at as string,
                type: (d.type as 'text' | 'image' | 'file') || 'text',
                fileUrl: d.file_url as string,
                fileName: d.file_name as string
            }));
            callback(msgs);
        }
    };

    fetchMessages();

    const channel = supabase.channel(`chat:${chatId}`)
        .on(
            'postgres_changes',
            { event: 'INSERT', schema: 'public', table: 'messages' },
            (payload) => {
                const msg = payload.new as Record<string, unknown>;
                // Check if this message belongs to this conversation
                if (
                    (msg.sender_id === myId && msg.receiver_id === chatId) ||
                    (msg.sender_id === chatId && msg.receiver_id === myId)
                ) {
                    fetchMessages(); // Refresh all to be safe and ordered
                }
            }
        )
        .subscribe();

    return () => {
        supabase.removeChannel(channel);
    };
};

export const getChatMessages = async (chatId: string): Promise<ChatMessage[]> => {
    // Typically used if not supervising?
    // We implemented fetch inside subscribe.
    // Leaving this for manual calls if needed.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${chatId}),and(sender_id.eq.${chatId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

    if (!data) return [];

    return (data as Array<Record<string, unknown>>).map((d) => ({
        id: d.id as string,
        senderId: d.sender_id as string,
        text: d.content as string,
        createdAt: d.created_at as string,
        type: (d.type as 'text' | 'image' | 'file') || 'text',
        fileUrl: d.file_url as string,
        fileName: d.file_name as string
    }));
};

export const markChatRead = async (chatId: string, userId: string) => {
    // Set is_read = true for all messages received FROM chatId (sender) TO userId (me)
    await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('sender_id', chatId)
        .eq('receiver_id', userId)
        .eq('is_read', false);

    // Notify local listeners
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('chat-read'));
    }
};

export const uploadChatAttachment = async (file: File, chatId: string) => {
    const path = `chats/${chatId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('images').upload(path, file);
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(path);
    return publicUrl;
};

export const importChatDocument = async (caseId: string, lawyerId: string, msg: ChatMessage) => {
    // Create a CRM document from a chat message
    if (!msg.fileUrl) return "";

    const { error } = await supabase.from('crm_documents').insert({
        case_id: caseId,
        file_name: msg.fileName || 'Chat Attachment',
        file_url: msg.fileUrl,
        source: 'chat'
    });

    if (error) throw error;
    return msg.fileUrl;
};

export const subscribeToUnreadCount = (userId: string, callback: (count: number) => void) => {
    const fetchCount = async () => {
        const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('receiver_id', userId)
            .eq('is_read', false);
        callback(count || 0);
    };

    fetchCount();

    const channel = supabase.channel(`unread:${userId}`)
        .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'messages', filter: `receiver_id=eq.${userId}` },
            (payload) => {
                console.log("Unread count update triggered by:", payload);
                setTimeout(fetchCount, 1000); // reduced delay slightly
            }
        )
        .subscribe((status) => {
            console.log("Unread subscription status:", status);
        });

    // Listen to local "read" events to update immediately
    const handleLocalRead = () => {
        console.log("Local read event received, fetching count...");
        setTimeout(fetchCount, 200); // fast update
    };
    window.addEventListener('chat-read', handleLocalRead);

    return () => {
        supabase.removeChannel(channel);
        window.removeEventListener('chat-read', handleLocalRead);
    };
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
export const getLawyerCases = async (lawyerId: string): Promise<Case[]> => {
    const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('lawyer_id', lawyerId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching cases:", error);
        return [];
    }

    return (data as Array<Record<string, unknown>>).map(d => ({
        id: d.id as string,
        clientId: d.client_id as string,
        clientName: (d.client_name as string) || 'Unknown Client',
        title: d.title as string,
        status: d.status as Case['status'],
        createdAt: d.created_at as string,
        description: d.description as string,
        lawyerId: d.lawyer_id as string
    }));
};

export const createCase = async (data: Partial<Case>) => {
    const { error } = await supabase.from('cases').insert({
        lawyer_id: data.lawyerId,
        client_id: data.clientId,
        client_name: data.clientName,
        title: data.title,
        description: data.description,
        status: data.status || 'new'
    });
    if (error) throw error;
};

export const deleteChat = async (userId: string, otherId: string) => {
    // Delete messages where (sender=Me AND receiver=Other) OR (sender=Other AND receiver=Me)
    const { error } = await supabase
        .from('messages')
        .delete()
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`);

    if (error) throw error;
};
export const getCaseById = async (id: string): Promise<Case | null> => {
    const { data, error } = await supabase.from('cases').select('*').eq('id', id).single();
    if (error || !data) return null;

    const row = data as Record<string, unknown>;
    return {
        id: row.id as string,
        clientId: row.client_id as string,
        clientName: row.client_name as string,
        title: row.title as string,
        status: row.status as Case['status'],
        createdAt: row.created_at as string,
        description: row.description as string,
        lawyerId: row.lawyer_id as string
    };
};
export const getCase = getCaseById; // Alias

export const updateCase = async (id: string, data: Partial<Case>) => {
    const updates: Record<string, unknown> = {};
    if (data.title) updates.title = data.title;
    if (data.status) updates.status = data.status;
    if (data.description) updates.description = data.description;

    const { error } = await supabase.from('cases').update(updates).eq('id', id);
    if (error) throw error;
};

export const getTimeEntries = async (caseId: string): Promise<TimeEntry[]> => {
    console.log("getTimeEntries for", caseId);
    return [];
};
export const getCaseByClient = async (lawyerId: string, clientId: string): Promise<Case | null> => {
    const { data, error } = await supabase
        .from('cases')
        .select('*')
        .eq('lawyer_id', lawyerId)
        .eq('client_id', clientId)
        .single();

    if (error || !data) return null;

    const row = data as Record<string, unknown>;
    return {
        id: row.id as string,
        clientId: row.client_id as string,
        clientName: row.client_name as string,
        title: row.title as string,
        status: row.status as Case['status'],
        createdAt: row.created_at as string,
        description: row.description as string,
        lawyerId: row.lawyer_id as string
    };
};

export const importChatFilesToCRM = async (caseId: string, chatId: string, lawyerId: string) => {
    console.log(`Importing files to Case ${caseId} from Chat ${chatId} (Lawyer: ${lawyerId})`);

    // 1. Get all file messages in this chat
    const { data: messages, error: fetchError } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${lawyerId},receiver_id.eq.${chatId}),and(sender_id.eq.${chatId},receiver_id.eq.${lawyerId})`)
        .in('type', ['file', 'image'])
        .not('file_url', 'is', null);

    if (fetchError) {
        console.error("Error fetching messages for import:", fetchError);
        throw fetchError;
    }

    if (!messages || messages.length === 0) {
        console.log("No files found to import.");
        return 0;
    }

    console.log(`Found ${messages.length} files. Importing...`);

    let count = 0;
    for (const msg of messages) {
        const { error } = await supabase.from('crm_documents').insert({
            case_id: caseId,
            file_name: msg.file_name || 'Chat Attachment',
            file_url: msg.file_url,
            source: 'chat'
        });

        if (error) {
            console.error("Error inserting document:", error);
        } else {
            count++;
        }
    }
    return count;
};

export const startTimeEntry = async (caseId: string, lawyerId: string) => {
    console.log("startTimeEntry", caseId, lawyerId);
};
export const stopTimeEntry = async (entryId: string, rate: number) => {
    console.log("stopTimeEntry", entryId, "with rate", rate);
};

export const getCRMDocuments = async (caseId: string, parentId: string | null = null): Promise<CRMDocument[]> => {
    let query = supabase
        .from('crm_documents')
        .select('*')
        .eq('case_id', caseId)
        .order('is_folder', { ascending: false }) // Folders first
        .order('uploaded_at', { ascending: false });

    if (parentId) {
        query = query.eq('parent_id', parentId);
    } else {
        query = query.is('parent_id', null);
    }

    const { data, error } = await query;

    if (error) {
        console.error("Error fetching CRM documents:", error);
        return [];
    }

    return (data as Array<Record<string, unknown>>).map(d => ({
        id: d.id as string,
        fileName: d.file_name as string,
        fileUrl: d.file_url as string,
        uploadedAt: d.uploaded_at as string,
        source: (d.source as 'chat' | 'upload') || 'upload',
        isFolder: d.is_folder as boolean,
        parentId: d.parent_id as string
    }));
};

export const createCRMFolder = async (caseId: string, name: string, parentId: string | null = null) => {
    const { error } = await supabase.from('crm_documents').insert({
        case_id: caseId,
        file_name: name,
        file_url: '', // Empty for folders
        source: 'upload',
        is_folder: true,
        parent_id: parentId
    });
    if (error) throw error;
};

export const renameCRMDocument = async (docId: string, newName: string) => {
    const { error } = await supabase
        .from('crm_documents')
        .update({ file_name: newName })
        .eq('id', docId);
    if (error) throw error;
};

export const deleteCRMDocument = async (docId: string) => {
    // If it's a folder, cascade delete is handled by DB constraint if set, BUT
    // Storage bucket files need to be deleted manually if we want to be clean.
    // For now, let's just delete the DB record. Storage cleanup is a separate task (or RLS prevents orphan access).

    const { error } = await supabase
        .from('crm_documents')
        .delete()
        .eq('id', docId);
    if (error) throw error;
};
export const uploadCRMDocument = async (file: File, caseId: string, parentId: string | null = null) => {
    const path = `crm/${caseId}/${Date.now()}_${file.name}`;
    const { error } = await supabase.storage.from('documents').upload(path, file);
    if (error) throw error;

    // Get URL
    const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(path);

    // Save to DB
    const { error: dbError } = await supabase.from('crm_documents').insert({
        case_id: caseId,
        file_name: file.name,
        file_url: publicUrl,
        source: 'upload',
        parent_id: parentId,
        is_folder: false
    });

    if (dbError) throw dbError;
    return publicUrl;
};

export const moveCRMDocument = async (docId: string, newParentId: string | null) => {
    const { error } = await supabase
        .from('crm_documents')
        .update({ parent_id: newParentId })
        .eq('id', docId);
    if (error) throw error;
};

export const getAllCRMFolders = async (caseId: string): Promise<CRMDocument[]> => {
    const { data, error } = await supabase
        .from('crm_documents')
        .select('*')
        .eq('case_id', caseId)
        .eq('is_folder', true)
        .order('file_name', { ascending: true });

    if (error) {
        console.error("Error fetching folders:", error);
        return [];
    }

    return (data as Array<Record<string, unknown>>).map(d => ({
        id: d.id as string,
        fileName: d.file_name as string,
        fileUrl: d.file_url as string,
        uploadedAt: d.uploaded_at as string,
        source: (d.source as 'chat' | 'upload') || 'upload',
        isFolder: true,
        parentId: d.parent_id as string
    }));
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

// --- Video Call Signaling ---
// --- Video Call Signaling ---
export enum CallState {
    IDLE = 'IDLE',
    CALLING = 'CALLING',
    RINGING = 'RINGING',
    CONNECTED = 'CONNECTED',
    ENDED = 'ENDED'
}

export interface CallSignal {
    type: 'offer' | 'answer' | 'ice-candidate' | 'end-call' | 'request-call' | 'accept-call' | 'reject-call' | 'busy' | 'missed-call';
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload?: any;
    senderId: string;
    senderName?: string;
}

export const subscribeToCallEvents = (userId: string, callback: (signal: CallSignal) => void) => {
    console.log(`📡 Subscribing to call channel: call:${userId}`);
    const channel = supabase.channel(`call:${userId}`)
        .on(
            'broadcast',
            { event: 'signal' },
            (payload) => {
                console.log("📡 Signal Received:", payload);
                if (payload.payload) {
                    callback(payload.payload as CallSignal);
                }
            }
        )
        .subscribe((status) => {
            console.log(`📡 Subscription status for call:${userId}:`, status);
        });

    return () => {
        console.log(`Unsubscribing from call:${userId}`);
        supabase.removeChannel(channel);
    };
};

export const signalCall = async (receiverId: string, signal: CallSignal) => {
    console.log(`📡 Sending signal to call:${receiverId}`, signal.type);

    // We send to the RECEIVER's channel
    const channel = supabase.channel(`call:${receiverId}`);

    const sendPayload = async () => {
        await channel.send({
            type: 'broadcast',
            event: 'signal',
            payload: signal
        });
        console.log(`📡 Signal sent successfully to call:${receiverId} (${signal.type})`);
    };

    // If already subscribed, send immediately
    // Note: state is 'joined' if subscribed
    if (channel.state === 'joined') {
        await sendPayload();
        return;
    }

    // Otherwise subscribe
    await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            await sendPayload();
            // Do NOT remove channel, keep it open for subsequent ICE candidates
            // supabase.removeChannel(channel); 
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error(`📡 Failed to subscribe to call:${receiverId} status:`, status);
        }
    });
};
