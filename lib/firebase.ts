import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import firebaseConfig from "../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const storage = getStorage(app);

const googleProvider = new GoogleAuthProvider();

export const getGoogleLoginErrorMessage = (error: unknown) => {
  const firebaseError = error as { code?: string; message?: string } | null;

  if (firebaseError?.code === "auth/unauthorized-domain") {
    const hostname =
      typeof window !== "undefined" ? window.location.hostname : "this domain";
    return `Google sign-in is blocked for ${hostname}. Add this host in Firebase Console > Authentication > Settings > Authorized domains, then try again.`;
  }

  return firebaseError?.message || "Failed to login with Google.";
};

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error signing in with Google", error);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out", error);
    throw error;
  }
};
