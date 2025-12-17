# Lawyer Search Web App (Next.js + Firebase)

## Overview
A platform connecting clients with lawyers. Built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and Firebase.

## Technology Stack
- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage)

## Setup Instructions

1. **Clone the repository**
2. **Install dependencies**
   ```bash
   npm install
   ```
3. **Configure Firebase**
   - Create a project in [Firebase Console](https://console.firebase.google.com/).
   - Enable **Authentication** (Email/Password).
   - Enable **Firestore Database**.
   - Create a `.env.local` file in the root directory with your Firebase keys:
     ```env
     NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
     NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
     ```

4. **Firestore Rules**
   - Copy the contents of `firestore.rules` to your Firebase Console > Firestore > Rules.

5. **Run Locally**
   ```bash
   npm run dev
   ```

## User Roles
- **Client**: Can search and view lawyers.
- **Lawyer**: Can manage their profile (`/dashboard`).
- **Admin**: Can verify lawyers and manage users (`/admin`).
  - *Note*: You must manually set the `role` to `admin` in Firestore for your admin user.

## Deployment
This project is optimized for deployment on **Vercel**.
1. Push to GitHub.
2. Import project in Vercel.
3. Add Environment Variables in Vercel settings.
4. Deploy.

## Project Structure
- `src/app`: App Router pages
- `src/lib/firebase`: Firebase config and services
- `src/components`: UI components
