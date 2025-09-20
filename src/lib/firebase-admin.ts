import { config } from 'dotenv';
config(); // Load environment variables from .env file

import { initializeApp, getApps, cert, getApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const firebaseAdminConfig = {
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    // This replace is critical for parsing the private key from environment variables
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
};

// This singleton pattern prevents re-initializing the app
function getFirebaseAdmin() {
  if (!getApps().length) {
    return initializeApp(firebaseAdminConfig);
  }
  return getApp();
}

const app = getFirebaseAdmin();
const auth = getAuth(app);
const firestore = getFirestore(app);

export { auth, firestore, app as adminApp };
