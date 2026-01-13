# Lawyer Search Web App (Next.js + Supabase)

## Overview

A platform connecting clients with lawyers. Built with Next.js 14/15, TypeScript, Tailwind CSS, and Supabase.

## Technology Stack

- **Frontend**: Next.js (App Router), React, Tailwind CSS
- **Backend**: Supabase (Auth, PostgreSQL, Storage, RLS)

## Setup Instructions

1. **Clone the repository**
2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Supabase**
   - Create a project in [Supabase Dashboard](https://supabase.com/).
   - Enable **Authentication** (Email/Password).
   - Run the contents of `supabase_schema.sql` in the **SQL Editor**.
   - Create a `.env.local` file in the root directory with your Supabase keys:

     ```env
     NEXT_PUBLIC_SUPABASE_URL=your_project_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     ```

4. **Database Setup**
   - Ensure RLS policies are enabled for all tables.
   - Use the `/setup` page in your local environment to seed initial data.

5. **Run Locally**

   ```bash
   npm run dev
   ```

## User Roles

- **Client**: Can search and view lawyers, chat, and post requests.
- **Lawyer**: Can manage their profile, respond to requests, and use CRM tools (`/dashboard`).
- **Admin**: Can verify lawyers and manage users (`/admin`).
  - *Note*: Set the `role` to `admin` in `user_profiles` table for authorized access.

## Deployment

This project is optimized for deployment on **Vercel**.

1. Push to GitHub.
2. Import project in Vercel.
3. Add **Environment Variables** (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in Vercel settings.
4. Deploy.

## Project Structure

- `src/app`: Next.js App Router pages
- `src/lib`: Core services and Supabase configuration
- `src/components`: UI components and layout
- `public`: Static assets and translations
- `src/components`: UI components
