import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
  } from "firebase/auth"
  // Add the necessary import for getDoc and doc
  import { doc, getDoc } from "firebase/firestore"
  import { auth, db } from "./config"
  
  // Register a new user
  export const registerUser = async (email, password, name) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      await updateProfile(userCredential.user, { displayName: name })
      return userCredential.user
    } catch (error) {
      throw error
    }
  }
  
  // Login a user
  export const loginUser = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password)
  }
  
  // Logout a user
  export const logoutUser = () => {
    return signOut(auth)
  }
  
  // Auth state change listener
  export const onAuthChange = (callback) => {
    return onAuthStateChanged(auth, callback)
  }
  
  // Add a function to check if a user is an admin
  export const checkUserRole = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId))
      if (userDoc.exists()) {
        const userData = userDoc.data()
        return userData.role || "user"
      }
      return "user"
    } catch (error) {
      console.error("Error checking user role:", error)
      return "user"
    }
  }
  
  