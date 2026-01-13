import { useState, useEffect } from 'react';
import { useAuth } from "@/lib/auth";


export function useUnreadMessages() {
    const { user } = useAuth();
    const [unreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        // Stub logic until subscribeToUnreadCount is migrated
        // const unsubscribe = subscribeToUnreadCount(user.id, (count) => {
        //     setUnreadCount(count);
        // });

        return () => {
            // unsubscribe();
        };
    }, [user]);

    if (!user) return 0;

    return unreadCount;
}
