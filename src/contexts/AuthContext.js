import { createContext, useContext, useState, useEffect } from "react"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "../firebase/config"
import { onAuthChange } from "../firebase/auth"
import { v4 as uuidv4 } from 'uuid'

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [guestId, setGuestId] = useState(null)
  const [isGuest, setIsGuest] = useState(false)

  // Initialize or retrieve guest ID
  useEffect(() => {
    const initGuestId = () => {
      // Get an existing guest ID from localStorage or create a new one
      let storedGuestId = localStorage.getItem("guestId")
      
      if (!storedGuestId) {
        storedGuestId = `guest-${uuidv4()}`
        localStorage.setItem("guestId", storedGuestId)
      }
      
      setGuestId(storedGuestId)
    }

    initGuestId()
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      if (user) {
        // Get user role from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid))
          const userData = userDoc.data()
          setUserRole(userData?.role || "user")
        } catch (error) {
          console.error("Error fetching user data:", error)
          setUserRole("user")
        }
        setCurrentUser(user)
        setIsGuest(false)
      } else {
        setCurrentUser(null)
        setUserRole(null)
        // If no logged in user, we're in guest mode
        setIsGuest(true)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Enable guest mode
  const enableGuestMode = async () => {
    if (!guestId) return

    try {
      // Check if guest user already exists in Firestore
      const guestDoc = await getDoc(doc(db, "users", guestId))
      
      // If guest user doesn't exist, create one
      if (!guestDoc.exists()) {
        await setDoc(doc(db, "users", guestId), {
          uid: guestId,
          email: null,
          name: "Guest User",
          role: "guest",
          createdAt: new Date().toISOString(),
        })
      }
      
      setIsGuest(true)
      return guestId
    } catch (error) {
      console.error("Error enabling guest mode:", error)
      throw error
    }
  }

  // Get the effective user ID (either authenticated user or guest)
  const getEffectiveUserId = () => {
    if (currentUser) {
      return currentUser.uid
    } else if (guestId && isGuest) {
      return guestId
    }
    return null
  }

  // Convert guest to registered user
  const convertGuestToUser = async (email, password, name) => {
    try {
      // First register the user normally
      const user = await register(email, password, name)
      
      // Then, if we have a guestId, transfer data from guest to user
      if (guestId) {
        // This is where you'd move cart items, order history, etc.
        // For now, we'll just implement the basic structure
        
        // Example: Move cart items from guest to user
        const guestCartDoc = await getDoc(doc(db, "carts", guestId))
        if (guestCartDoc.exists()) {
          const cartData = guestCartDoc.data()
          await setDoc(doc(db, "carts", user.uid), {
            ...cartData,
            userId: user.uid,
            updatedAt: new Date().toISOString(),
          })
        }
        
        // Example: Update orders from guest to this user
        // This would typically be done in a backend function for security
        
        // Clear guest ID from localStorage
        localStorage.removeItem("guestId")
      }
      
      return user
    } catch (error) {
      console.error("Error converting guest to user:", error)
      throw error
    }
  }

  // Register a new user
  async function register(email, password, name, role = "user") {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update profile with display name
      await updateProfile(user, { displayName: name })

      // Store user data in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email,
        name,
        role,
        createdAt: new Date().toISOString(),
      })

      return user
    } catch (error) {
      throw error
    }
  }

  // Login a user
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password)
  }

  // Logout a user and re-enable guest mode
  async function logout() {
    await signOut(auth)
    // Re-enable guest mode after logout
    enableGuestMode()
  }

  const value = {
    currentUser,
    userRole,
    isAdmin: userRole === "admin",
    isGuest,
    guestId,
    register,
    login,
    logout,
    loading,
    enableGuestMode,
    getEffectiveUserId,
    convertGuestToUser
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

