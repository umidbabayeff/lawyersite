import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Simple env parser
const envPath = path.resolve(process.cwd(), '.env.local');
let env = {};
if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            env[key] = value;
        }
    });
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
    console.log('Testing connection...');

    // 1. Try to fetch lawyers
    console.log('Fetching verified lawyers...');
    const { data: lawyers, error: fetchError } = await supabase
        .from('lawyer_profiles')
        .select('*, user_profiles (*)')
        .eq('verified', true);

    if (fetchError) {
        console.error('Fetch Error:', fetchError.message);
    } else {
        console.log(`Found ${lawyers.length} lawyers.`);
    }

    // 2. Try to insert a dummy user profile
    if (lawyers && lawyers.length === 0) {
        console.log('Attempting to seed a dummy lawyer...');
        const dummyId = '11111111-1111-1111-1111-111111111111';

        const { error: userError } = await supabase.from('user_profiles').upsert({
            id: dummyId,
            full_name: 'Test Lawyer',
            role: 'lawyer',
            city: 'Test City',
            avatar_url: 'https://placehold.co/400'
        });

        if (userError) {
            console.error('User Insert Error:', userError.message);
            if (userError.message.includes('foreign key constraint')) {
                console.log('CONFIRMED: Cannot seed users because they do not exist in Auth system.');
            }
        } else {
            console.log('User profile inserted/updated.');

            const { error: lawyerError } = await supabase.from('lawyer_profiles').upsert({
                id: dummyId,
                specializations: ['Test Law'],
                description: 'Test Description',
                price: 100,
                verified: true,
                rating: 5,
                banner_url: 'https://placehold.co/800x400'
            });

            if (lawyerError) {
                console.error('Lawyer Insert Error:', lawyerError.message);
            } else {
                console.log('Lawyer profile inserted successfully.');
            }
        }
    }
}

test();
