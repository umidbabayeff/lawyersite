"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUserChats } from "@/lib/services";

export default function DebugPage() {
    type DebugStatus = {
        session_user_id: string;
        session_user_email?: string;
        profile_found: boolean;
        profile_role?: string;
        profile_error: unknown;
        profile_data: unknown;
        messages_sent: unknown;
        messages_received: unknown;
        connections: unknown;
        user_chats_result: unknown;
    };

    const [status, setStatus] = useState<DebugStatus | string | null>(null);

    useEffect(() => {
        const supabase = createClient();
        const check = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setStatus("No Session Found. Please log in.");
                return;
            }

            const { data: profile, error } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

            const { data: sentMessages } = await supabase.from('messages').select('*').eq('sender_id', session.user.id);
            const { data: receivedMessages } = await supabase.from('messages').select('*').eq('receiver_id', session.user.id);
            const { data: connections } = await supabase.from('connection_requests').select('*').or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`);

            let chats = [];
            try {
                chats = await getUserChats(session.user.id);
            } catch (e) {
                chats = [`Error fetching chats: ${(e as Error).message}`];
            }

            // Set all at once to match the type definition
            setStatus({
                // Put diagnostics at the top for easier screenshot reading
                user_chats_result: chats,
                connections: connections,

                // Rest of the data
                messages_sent: sentMessages,
                messages_received: receivedMessages,
                session_user_id: session.user.id,
                session_user_email: session.user.email,
                profile_found: !!profile,
                profile_role: profile?.role,
                profile_error: error,
                profile_data: profile,
            });
        };
        check();
    }, []);

    return (
        <div className="p-8 font-mono text-sm bg-gray-100 min-h-screen">
            <h1 className="text-xl font-bold mb-4">Debug Access</h1>
            <pre className="bg-white p-4 rounded shadow overflow-auto">
                {JSON.stringify(status, null, 2)}
            </pre>
            <div className="mt-4">
                <p>If <strong>profile_role</strong> is NOT &quot;admin&quot;, you need to run the SQL script.</p>
                <p>Your User ID is: <strong>{(status as DebugStatus)?.session_user_id}</strong></p>
            </div>
        </div>
    );
}
