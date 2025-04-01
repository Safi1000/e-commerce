// This is a utility script to set a user as an admin
// Run this script with Node.js: node src/utils/create-admin.js

const { initializeApp } = require("firebase/app")
const { getFirestore, doc, updateDoc, getDoc } = require("firebase/firestore")

// Your Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

// Function to set a user as admin
async function setUserAsAdmin(userId) {
  try {
    // Check if user exists
    const userRef = doc(db, "users", userId)
    const userSnap = await getDoc(userRef)

    if (!userSnap.exists()) {
      console.error(`User with ID ${userId} does not exist`)
      return
    }

    // Update user role to admin
    await updateDoc(userRef, {
      role: "admin",
    })

    console.log(`User ${userId} has been set as admin successfully`)
    console.log(`User data: `, userSnap.data())
  } catch (error) {
    console.error("Error setting user as admin:", error)
  }
}

// Get user ID from command line arguments
const userId = process.argv[2]

if (!userId) {
  console.error("Please provide a user ID as an argument")
  console.log("Usage: node create-admin.js USER_ID")
  process.exit(1)
}

// Set the user as admin
setUserAsAdmin(userId)

