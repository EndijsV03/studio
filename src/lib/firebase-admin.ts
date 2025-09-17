import * as admin from 'firebase-admin';
import { config } from 'dotenv';

// Load environment variables from .env file
config();

const hasFirebaseAdminConfig =
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_CLIENT_EMAIL &&
  process.env.FIREBASE_PRIVATE_KEY;

if (hasFirebaseAdminConfig && !admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

let auth, firestore;

if (admin.apps.length) {
  auth = admin.auth();
  firestore = admin.firestore();
} else {
    // Provide mock instances or handle the uninitialized case
    // This prevents the app from crashing when the admin SDK is not configured.
    console.warn("Firebase Admin SDK not initialized. Skipping Firebase Admin services.");
    auth = {} as admin.auth.Auth;
    firestore = {} as admin.firestore.Firestore;
}

export { auth, firestore };
