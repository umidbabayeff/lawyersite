-- Create table for admin constants (locations, specializations)
create table if not exists public.admin_constants (
    id uuid default uuid_generate_v4() primary key,
    category text not null check (category in ('locations', 'specializations')),
    value text not null,
    language text not null default 'en',
    -- 'en', 'ru', 'az'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(category, value, language)
);
-- RLS Policies
alter table public.admin_constants enable row level security;
-- Everyone can read
create policy "Constants are viewable by everyone." on public.admin_constants for
select using (true);
-- Only admins can insert/delete (checking public.user_profiles.role)
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