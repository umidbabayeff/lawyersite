import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "mock_key",
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "mock_domain",
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "mock_project_id",
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "mock_bucket",
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "12345",
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:12345:web:mock",
};

// Debug Config Loading - SENSITIVE: Remove after debugging
console.log("Firebase Config Debug:", {
    apiKeySource: firebaseConfig.apiKey === "mock_key" ? "MOCK" : "REAL (" + firebaseConfig.apiKey.substring(0, 5) + "...)",
    projectIdSource: firebaseConfig.projectId === "mock_project_id" ? "MOCK" : "REAL (" + firebaseConfig.projectId + ")",
    envCheck: {
        HAS_API_KEY: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    }
});

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);

export { app, auth, db, storage };
