-- Create community_requests table
create table if not exists community_requests (
    id uuid default gen_random_uuid() primary key,
    client_id uuid references auth.users(id) not null,
    client_name text,
    title text not null,
    description text not null,
    location text not null,
    specialty text not null,
    budget numeric,
    status text default 'open' check (status in ('open', 'accepted', 'closed')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Enable RLS
alter table community_requests enable row level security;
-- Policies for community_requests
-- Everyone can read open requests (or maybe just lawyers? for now let's allow authenticated to simplify)
create policy "Authenticated users can view requests" on community_requests for
select to authenticated using (true);
-- Clients can insert their own requests
create policy "Users can insert their own requests" on community_requests for
insert to authenticated with check (auth.uid() = client_id);
-- Clients can update their own requests
create policy "Users can update their own requests" on community_requests for
update to authenticated using (auth.uid() = client_id);
-- Create request_proposals table
create table if not exists request_proposals (
    id uuid default gen_random_uuid() primary key,
    request_id uuid references community_requests(id) on delete cascade not null,
    lawyer_id uuid references auth.users(id) not null,
    lawyer_name text,
    lawyer_photo text,
    cover_letter text not null,
    price numeric not null,
    estimated_duration text,
    status text default 'pending' check (status in ('pending', 'accepted', 'rejected')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
-- Enable RLS
alter table request_proposals enable row level security;
-- Policies for request_proposals
-- Lawyers can insert proposals
create policy "Lawyers can insert proposals" on request_proposals for
insert to authenticated with check (auth.uid() = lawyer_id);
-- Lawyers can view their own proposals
create policy "Lawyers can view their own proposals" on request_proposals for
select to authenticated using (auth.uid() = lawyer_id);
-- Clients can view proposals for their requests
create policy "Clients can view proposals for their requests" on request_proposals for
select to authenticated using (
        exists (
            select 1
            from community_requests
            where community_requests.id = request_proposals.request_id
                and community_requests.client_id = auth.uid()
        )
    );
-- Clients can update proposals (to accept them) - technically they update the status
create policy "Clients can update proposals for their requests" on request_proposals for
update to authenticated using (
        exists (
            select 1
            from community_requests
            where community_requests.id = request_proposals.request_id
                and community_requests.client_id = auth.uid()
        )
    );
-- Indexes for performance
create index if not exists idx_community_requests_client_id on community_requests(client_id);
create index if not exists idx_community_requests_status on community_requests(status);
create index if not exists idx_request_proposals_request_id on request_proposals(request_id);
create index if not exists idx_request_proposals_lawyer_id on request_proposals(lawyer_id);