-- Enable UUID extension
create extension if not exists "uuid-ossp";
-- 1. PROFILES (Extends auth.users)
create table public.user_profiles (
    id uuid references auth.users on delete cascade not null primary key,
    role text check (role in ('client', 'lawyer', 'admin')) default 'client',
    full_name text,
    city text,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- RLS: Public read, User can update own
alter table public.user_profiles enable row level security;
create policy "Public profiles are viewable by everyone." on public.user_profiles for
select using (true);
create policy "Users can insert their own profile." on public.user_profiles for
insert with check (auth.uid() = id);
create policy "Users can update own profile." on public.user_profiles for
update using (auth.uid() = id);
-- 2. LAWYER PROFILES
create table public.lawyer_profiles (
    id uuid references public.user_profiles(id) on delete cascade not null primary key,
    specializations text [],
    description text,
    price numeric,
    verified boolean default false,
    banner_url text,
    rating numeric default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- RLS
alter table public.lawyer_profiles enable row level security;
create policy "Lawyer profiles are viewable by everyone." on public.lawyer_profiles for
select using (true);
create policy "Lawyers can insert own profile." on public.lawyer_profiles for
insert with check (auth.uid() = id);
create policy "Lawyers can update own profile." on public.lawyer_profiles for
update using (auth.uid() = id);
-- 3. VERIFICATION DOCUMENTS
create table public.verification_documents (
    id uuid default uuid_generate_v4() primary key,
    lawyer_id uuid references public.lawyer_profiles(id) on delete cascade not null,
    file_url text not null,
    file_name text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- RLS
alter table public.verification_documents enable row level security;
create policy "Lawyers can see own docs" on public.verification_documents for
select using (auth.uid() = lawyer_id);
create policy "Lawyers can upload own docs" on public.verification_documents for
insert with check (auth.uid() = lawyer_id);
-- Admins also need access (implement admin logic later by role check)
-- 4. REVIEWS
create table public.reviews (
    id uuid default uuid_generate_v4() primary key,
    lawyer_id uuid references public.lawyer_profiles(id) not null,
    client_id uuid references public.user_profiles(id) not null,
    rating integer check (
        rating >= 1
        and rating <= 5
    ),
    comment text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- RLS
alter table public.reviews enable row level security;
create policy "Reviews are viewable by everyone." on public.reviews for
select using (true);
create policy "Clients can insert reviews." on public.reviews for
insert with check (auth.uid() = client_id);
-- 5. CONNECTION REQUESTS
create table public.connection_requests (
    id uuid default uuid_generate_v4() primary key,
    sender_id uuid references public.user_profiles(id) not null,
    receiver_id uuid references public.user_profiles(id) not null,
    status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- RLS
alter table public.connection_requests enable row level security;
create policy "Users can see requests relating to them" on public.connection_requests for
select using (
        auth.uid() = sender_id
        or auth.uid() = receiver_id
    );
create policy "Users can insert requests" on public.connection_requests for
insert with check (auth.uid() = sender_id);
create policy "Users can update requests sent to them" on public.connection_requests for
update using (auth.uid() = receiver_id);
-- 6. MESSAGES
-- 6. MESSAGES
create table public.messages (
    id uuid default uuid_generate_v4() primary key,
    sender_id uuid references public.user_profiles(id) not null,
    receiver_id uuid references public.user_profiles(id) not null,
    content text,
    is_read boolean default false,
    type text default 'text',
    file_url text,
    file_name text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- RLS
alter table public.messages enable row level security;
create policy "Users can see their messages" on public.messages for
select using (
        auth.uid() = sender_id
        or auth.uid() = receiver_id
    );
create policy "Users can send messages" on public.messages for
insert with check (auth.uid() = sender_id);
-- AUTO-CREATE PROFILE ON SIGNUP (Trigger)
-- This ensures every user in auth.users has a corresponding entry in public.user_profiles
create or replace function public.handle_new_user() returns trigger as $$ begin
insert into public.user_profiles (id, full_name, role)
values (
        new.id,
        new.raw_user_meta_data->>'full_name',
        coalesce(new.raw_user_meta_data->>'role', 'client')
    );
return new;
end;
$$ language plpgsql security definer;
create trigger on_auth_user_created
after
insert on auth.users for each row execute procedure public.handle_new_user();