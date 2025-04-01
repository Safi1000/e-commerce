import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBTLzFaecHeQyibhoR84whPQo6lgok7274",
  authDomain: "e-commerce-b7d85.firebaseapp.com",
  databaseURL: "https://e-commerce-b7d85-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "e-commerce-b7d85",
  storageBucket: "e-commerce-b7d85.firebasestorage.app",
  messagingSenderId: "765082634740",
  appId: "1:765082634740:web:3fa1d8999fef98e53e11a1",
  measurementId: "G-GQSN7E2CHR"
  };
  

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)
const storage = getStorage(app)

export { app, auth, db, storage }

