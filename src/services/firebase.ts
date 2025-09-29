import { getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { collection, doc, getDoc, getFirestore, setDoc } from "firebase/firestore";

export type FBConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
};

let app: FirebaseApp | null = null;

export function initFirebase(cfg: FBConfig) {
  app = getApps().length ? getApps()[0]! : initializeApp(cfg);
  return app;
}

export function firebaseApp() {
  if (!app) throw new Error("Firebase not initialized");
  return app;
}

export function auth() {
  return getAuth(firebaseApp());
}

export function db() {
  return getFirestore(firebaseApp());
}

export {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  collection,
  doc,
  getDoc,
  setDoc,
  type User,
};
