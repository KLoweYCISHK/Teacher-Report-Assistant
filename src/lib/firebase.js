import { initializeApp } from "firebase/app";
import { initializeFirestore } from "firebase/firestore";
import { firebaseConfig } from "@/firebase-config";

export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

export const db = isFirebaseConfigured
  ? initializeFirestore(initializeApp(firebaseConfig), { ignoreUndefinedProperties: true })
  : null;
