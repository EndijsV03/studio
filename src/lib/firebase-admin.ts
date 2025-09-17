import * as admin from 'firebase-admin';

// Check if the app is already initialized to prevent errors
if (!admin.apps.length) {
  try {
    // This check ensures we only try to initialize if the credentials are all present.
    if (
      process.env.FIREBASE_PROJECT_ID &&
      process.env.FIREBASE_CLIENT_EMAIL &&
      process.env.FIREBASE_PRIVATE_KEY
    ) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          // This is a critical step: environment variables can escape newline characters.
          // We must replace them back to ensure the private key is parsed correctly.
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        }),
      });
    } else {
      console.warn("Firebase Admin SDK credentials are not fully set. Skipping initialization.");
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

// Export auth and firestore instances.
// If initialization failed, these will be undefined and will cause errors
// where they are used, which helps in debugging setup issues.
const auth = admin.auth();
const firestore = admin.firestore();

export { auth, firestore };
