import { createContext, useContext, useState, useEffect } from "react"
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, updateProfile } from "firebase/auth"
import { doc, setDoc, getDoc, getDocs, query, where, writeBatch, collection } from "firebase/firestore"
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
        
        // Enable guest mode automatically if not already enabled
        // Check if we have guest data in localStorage
        const localGuestData = localStorage.getItem("guestData")
        if (localGuestData) {
          const guestData = JSON.parse(localGuestData)
          if (guestData.role === "guest") {
            setIsGuest(true)
          } else {
            // If we have guestId but not proper guest data, enable guest mode
            enableGuestMode()
          }
        } else if (guestId) {
          // If no logged in user and we have a guestId, enable guest mode
          enableGuestMode()
        }
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [guestId])

  // Enable guest mode
  const enableGuestMode = async () => {
    if (!guestId) return

    try {
      // First try to read the user document to check permissions
      try {
        const guestDoc = await getDoc(doc(db, "users", guestId))
        
        // If guest user doesn't exist and we have permission, create one
        if (!guestDoc.exists()) {
          await setDoc(doc(db, "users", guestId), {
            uid: guestId,
            email: null,
            name: "Guest User",
            role: "guest",
            createdAt: new Date().toISOString(),
          })
        }
      } catch (firestoreError) {
        // If there's a permission error with Firestore, fall back to local storage only
        console.log("Using local storage only for guest mode due to permission restrictions")
        // Store guest data in localStorage as a fallback
        const guestData = {
          uid: guestId,
          name: "Guest User",
          role: "guest",
          createdAt: new Date().toISOString(),
        }
        localStorage.setItem("guestData", JSON.stringify(guestData))
      }
      
      // Set guest mode regardless of Firestore success
      setIsGuest(true)
      return guestId
    } catch (error) {
      console.error("Error enabling guest mode:", error)
      // Still try to enable guest mode locally even if there was an error
      setIsGuest(true)
      return guestId
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

  // Helper to get user data even when Firestore is unavailable
  const getUserData = async (userId) => {
    if (!userId) return null;
    
    try {
      // Try to get from Firestore first
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        return userDoc.data();
      }
    } catch (error) {
      console.log("Firestore unavailable, falling back to local storage");
    }
    
    // Fall back to localStorage if Firestore fails or document doesn't exist
    if (userId === guestId) {
      const localGuestData = localStorage.getItem("guestData");
      if (localGuestData) {
        return JSON.parse(localGuestData);
      }
      
      // If no local data exists but we have a guestId, create basic data
      const basicGuestData = {
        uid: guestId,
        name: "Guest User",
        role: "guest",
        createdAt: new Date().toISOString(),
      };
      
      // Store for future use
      localStorage.setItem("guestData", JSON.stringify(basicGuestData));
      return basicGuestData;
    }
    
    return null;
  }

  // Convert guest to registered user
  const convertGuestToUser = async (email, password, name) => {
    try {
      // Store the current guest ID before registration
      const currentGuestId = guestId
      
      // First register the user normally
      const user = await register(email, password, name)
      
      // Then, if we have a guestId, transfer data from guest to user
      if (currentGuestId) {
        try {
          // 1. Move cart items from guest to user
          const guestCartDoc = await getDoc(doc(db, "carts", currentGuestId))
          if (guestCartDoc.exists()) {
            const cartData = guestCartDoc.data()
            // Add the cart to the new user's account
            await setDoc(doc(db, "carts", user.uid), {
              userId: user.uid,
              items: cartData.items || [],
              updatedAt: new Date().toISOString(),
              isGuestCart: false,
              migratedFromGuest: currentGuestId,
              migratedAt: new Date().toISOString()
            })
            
            // 2. Also migrate any orders from guest to this user
            try {
              const ordersSnapshot = await getDocs(
                query(collection(db, "orders"), where("userId", "==", currentGuestId))
              )
              
              // For each guest order, update it to associate with the new user
              const batch = writeBatch(db)
              ordersSnapshot.forEach((orderDoc) => {
                const orderRef = doc(db, "orders", orderDoc.id)
                batch.update(orderRef, {
                  userId: user.uid,
                  isGuestOrder: false,
                  updatedAt: new Date().toISOString(),
                  previousGuestId: currentGuestId
                })
              })
              
              if (ordersSnapshot.size > 0) {
                await batch.commit()
              }
            } catch (orderError) {
              console.error("Error migrating guest orders:", orderError)
              // Continue even if order migration fails
            }
          }
        } catch (migrationError) {
          console.error("Error during guest data migration:", migrationError)
          // Continue even if the migration fails
        }
        
        // 3. Handle localStorage migration
        try {
          // Migrate cart from localStorage
          const localGuestCart = localStorage.getItem(`guest-cart-${currentGuestId}`)
          if (localGuestCart) {
            localStorage.setItem(`user-cart-${user.uid}`, localGuestCart)
            localStorage.removeItem(`guest-cart-${currentGuestId}`)
          }
          
          // Also migrate any generic cart
          const genericCart = localStorage.getItem("cart")
          if (genericCart) {
            localStorage.setItem(`user-cart-${user.uid}`, genericCart)
            localStorage.removeItem("cart")
          }
        } catch (localStorageError) {
          console.error("Error during localStorage migration:", localStorageError)
        }
        
        // 4. Remove guest data
        try {
          // Remove guest user data
          localStorage.removeItem("guestData")
          localStorage.removeItem("guestId")
          
          // Optionally delete the guest cart document
          // await deleteDoc(doc(db, "carts", currentGuestId))
        } catch (cleanupError) {
          console.error("Error cleaning up guest data:", cleanupError)
        }
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
    convertGuestToUser,
    getUserData
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

