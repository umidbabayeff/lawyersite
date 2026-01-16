-- 1. ADMIN CONSTANTS (Data Manager)
create table if not exists public.admin_constants (
    id uuid default uuid_generate_v4() primary key,
    category text not null check (category in ('locations', 'specializations')),
    value text not null,
    language text not null default 'en',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(category, value, language)
);
alter table public.admin_constants enable row level security;
create policy "Constants are viewable by everyone." on public.admin_constants for
select using (true);
create policy "Admins can insert constants." on public.admin_constants for
insert with check (
        exists (
            select 1
            from public.user_profiles
            where id = auth.uid()
                and role = 'admin'
        )
    );
create policy "Admins can delete constants." on public.admin_constants for delete using (
    exists (
        select 1
        from public.user_profiles
        where id = auth.uid()
            and role = 'admin'
    )
);
-- 2. SITE SETTINGS
create table if not exists public.site_settings (
    id integer primary key default 1,
    -- Singleton row
    maintenance_mode boolean default false,
    allow_signups boolean default true,
    welcome_message text default '',
    contact_phone text default '',
    contact_email text default '',
    address text default '',
    social_links jsonb default '{}'::jsonb,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    check (id = 1)
);
alter table public.site_settings enable row level security;
create policy "Settings are viewable by everyone." on public.site_settings for
select using (true);
create policy "Admins can update settings." on public.site_settings for
update using (
        exists (
            select 1
            from public.user_profiles
            where id = auth.uid()
                and role = 'admin'
        )
    );
create policy "Admins can insert settings" on public.site_settings for
insert with check (
        exists (
            select 1
            from public.user_profiles
            where id = auth.uid()
                and role = 'admin'
        )
    );
-- Insert default settings if not exists
insert into public.site_settings (id)
values (1) on conflict (id) do nothing;
-- 3. FIX USER MANAGEMENT PERMISSIONS
-- Allow admins to update any user profile (e.g. changing roles)
create policy "Admins can update user profiles." on public.user_profiles for
update using (
        exists (
            select 1
            from public.user_profiles
            where id = auth.uid()
                and role = 'admin'
        )
    );
-- Allow admins to delete users
create policy "Admins can delete user profiles." on public.user_profiles for delete using (
    exists (
        select 1
        from public.user_profiles
        where id = auth.uid()
            and role = 'admin'
    )
);
-- 4. FIX LAWYER VERIFICATION PERMISSIONS
-- Allow admins to update lawyer profiles (specifically for 'verified' and 'rating')
create policy "Admins can update lawyer profiles." on public.lawyer_profiles for
update using (
        exists (
            select 1
            from public.user_profiles
            where id = auth.uid()
                and role = 'admin'
        )
    );