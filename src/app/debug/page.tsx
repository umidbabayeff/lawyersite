"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function DebugPage() {
    const [status, setStatus] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
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

            setStatus({
                session_user_id: session.user.id,
                session_user_email: session.user.email,
                profile_found: !!profile,
                profile_role: profile?.role,
                profile_error: error,
                profile_data: profile
            });
        };
        check();
    }, []);

    return (
        <div className="p-8 font-mono text-sm bg-gray-100 min-h-screen">
            <h1 className="text-xl font-bold mb-4">Debug Access</h1>
            <pre className="bg-white p-4 rounded shadow">
                {JSON.stringify(status, null, 2)}
            </pre>
            <div className="mt-4">
                <p>If <strong>profile_role</strong> is NOT "admin", you need to run the SQL script.</p>
                <p>Your User ID is: <strong>{status?.session_user_id}</strong></p>
            </div>
        </div>
    );
}
