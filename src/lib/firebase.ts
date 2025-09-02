// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBxp2j0gZf-sIrOrOMTHnuo6RsohVTiwcQ",
  authDomain: "business-cards-59f22.firebaseapp.com",
  projectId: "business-cards-59f22",
  storageBucket: "business-cards-59f22.appspot.com",
  messagingSenderId: "935421321413",
  appId: "1:935421321413:web:df472029ebe1b0209cd0ac"
};


// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, db, storage, auth };
