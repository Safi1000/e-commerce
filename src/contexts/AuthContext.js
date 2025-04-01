import { createContext, useContext, useState, useEffect } from "react"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { auth, db } from "../firebase/config"
import { onAuthChange } from "../firebase/auth"

const AuthContext = createContext()

export function useAuth() {
  return useContext(AuthContext)
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)

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
      } else {
        setCurrentUser(null)
        setUserRole(null)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

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

  // Logout a user
  function logout() {
    return signOut(auth)
  }

  const value = {
    currentUser,
    userRole,
    isAdmin: userRole === "admin",
    register,
    login,
    logout,
    loading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

