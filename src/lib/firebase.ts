import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Helper to ensure anonymous auth
export const ensureAuth = async () => {
  if (!auth.currentUser) {
    try {
      await signInAnonymously(auth);
    } catch (e) {
      console.error("Auth error:", e);
    }
  }
};

/**
 * Wraps Firestore write operations with try/catch and user-friendly alerts.
 */
export async function safeWrite<T>(operation: () => Promise<T>): Promise<T | void> {
  try {
    return await operation();
  } catch (e: any) {
    console.error("Firebase error:", e);
    alert("خطأ في الحفظ: " + (e.message || "حدث خطأ غير متوقع"));
    throw e;
  }
}
