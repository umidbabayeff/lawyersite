import { createBrowserClient } from '@supabase/ssr'

// Fallback values for build time resilience
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export function createClient() {
    return createBrowserClient(
        supabaseUrl,
        supabaseAnonKey
    )
}
