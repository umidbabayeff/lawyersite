import { useState, useEffect } from 'react';
import { useAuth } from "@/lib/auth";
import { subscribeToUnreadCount } from "@/lib/firebase/services";

export function useUnreadMessages() {
    const { user } = useAuth();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        const unsubscribe = subscribeToUnreadCount(user.uid, (count) => {
            setUnreadCount(count);
        });

        return () => {
            unsubscribe();
            setUnreadCount(0);
        };
    }, [user]);

    if (!user) return 0;

    return unreadCount;
}
