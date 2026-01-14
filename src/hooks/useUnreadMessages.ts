import { useState, useEffect } from 'react';
import { useAuth } from "@/lib/auth";
import { subscribeToUnreadCount, subscribeToIncomingRequestsCount } from "@/lib/services";


export function useUnreadMessages() {
    const { user } = useAuth();
    const [msgCount, setMsgCount] = useState(0);
    const [reqCount, setReqCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        const subMsg = subscribeToUnreadCount(user.id, (count) => {
            setMsgCount(count);
        });

        const subReq = subscribeToIncomingRequestsCount(user.id, (count) => {
            setReqCount(count);
        });

        return () => {
            subMsg();
            subReq();
        };
    }, [user]);

    if (!user) return 0;

    return msgCount + reqCount;
}
