"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "./AuthContext"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"

const CartContext = createContext()

export function useCart() {
  return useContext(CartContext)
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])
  const { currentUser, guestId, isGuest, getEffectiveUserId } = useAuth()
  const queryClient = useQueryClient()
  const effectiveUserId = getEffectiveUserId()
  
  // Track whether the user state has changed (switching between guest/logged-in)
  const [userStateKey, setUserStateKey] = useState(isGuest ? `guest-${guestId}` : currentUser?.uid || 'anonymous')
  
  // Update the user state key when user authentication state changes
  useEffect(() => {
    const newKey = isGuest ? `guest-${guestId}` : currentUser?.uid || 'anonymous'
    if (newKey !== userStateKey) {
      // Invalidate the previous user's cart query before changing state
      if (userStateKey !== 'anonymous') {
        queryClient.invalidateQueries(['cart', userStateKey])
      }
      
      setUserStateKey(newKey)
      // Clear current cart when switching between users
      setCartItems([])
      
      // Force a refetch for the new user state
      if (newKey !== 'anonymous') {
        queryClient.invalidateQueries(['cart', isGuest ? guestId : currentUser?.uid])
      }
    }
  }, [isGuest, currentUser, guestId, userStateKey, queryClient])

  // Use React Query to fetch cart data for both registered and guest users
  const { data: firestoreCart, isLoading } = useQuery({
    queryKey: ['cart', effectiveUserId, isGuest],
    queryFn: async () => {
      if (!effectiveUserId) return null
      
      try {
        const cartDoc = await getDoc(doc(db, "carts", effectiveUserId))
        if (cartDoc.exists()) {
          return cartDoc.data().items || []
        }
        return null
      } catch (error) {
        console.error("Error fetching cart:", error)
        return null
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!effectiveUserId
  })

  // Use mutation for saving cart - using useCallback to prevent recreation on each render
  const saveCartToFirestore = useCallback(async (items) => {
    if (!effectiveUserId) return
    
    try {
      await setDoc(doc(db, "carts", effectiveUserId), {
        userId: effectiveUserId,
        items,
        updatedAt: new Date().toISOString(),
        isGuestCart: isGuest
      })
      
      // Also save to localStorage as backup, but use different keys for guest and user
      if (isGuest) {
        localStorage.setItem(`guest-cart-${guestId}`, JSON.stringify(items))
      } else {
        localStorage.setItem(`user-cart-${currentUser?.uid}`, JSON.stringify(items))
      }
    } catch (error) {
      console.error("Error saving cart to Firestore:", error)
      // Save to localStorage with appropriate key as backup
      if (isGuest) {
        localStorage.setItem(`guest-cart-${guestId}`, JSON.stringify(items))
      } else if (currentUser) {
        localStorage.setItem(`user-cart-${currentUser.uid}`, JSON.stringify(items))
      } else {
        localStorage.setItem("cart", JSON.stringify(items))
      }
    }
  }, [effectiveUserId, isGuest, guestId, currentUser])

  // Use mutation without automatic invalidation to prevent loops
  const saveCartMutation = useMutation({
    mutationFn: saveCartToFirestore,
    // Remove the onSuccess handler to prevent loops
  })

  // Load cart data when user changes or firestoreCart updates
  useEffect(() => {
    const loadCart = async () => {
      try {
        if (effectiveUserId) {
          // User is logged in or guest mode is active, use data from Firestore via React Query
          if (firestoreCart) {
            setCartItems(firestoreCart)
          } else {
            // Check localStorage for potential migration with appropriate key
            let localCart
            if (isGuest) {
              localCart = localStorage.getItem(`guest-cart-${guestId}`)
            } else if (currentUser) {
              localCart = localStorage.getItem(`user-cart-${currentUser.uid}`)
            } else {
              localCart = localStorage.getItem("cart")
            }
            
            if (localCart) {
              const parsedCart = JSON.parse(localCart)
              setCartItems(parsedCart)
              
              // Save local cart to Firestore but don't trigger state updates
              saveCartToFirestore(parsedCart)
              
              // Clear old localStorage cart key after migration
              if (!isGuest && !currentUser) {
                localStorage.removeItem("cart")
              }
            } else {
              setCartItems([])
            }
          }
        } else {
          // No effective user ID, get cart from localStorage with fallback to the generic key
          const localCart = localStorage.getItem("cart")
          if (localCart) {
            setCartItems(JSON.parse(localCart))
          } else {
            setCartItems([])
          }
        }
      } catch (error) {
        console.error("Error loading cart:", error)
        // Fallback to localStorage if something fails, trying user-specific keys first
        let localCart
        if (isGuest) {
          localCart = localStorage.getItem(`guest-cart-${guestId}`)
        } else if (currentUser) {
          localCart = localStorage.getItem(`user-cart-${currentUser.uid}`)
        } else {
          localCart = localStorage.getItem("cart")
        }
        
        if (localCart) {
          setCartItems(JSON.parse(localCart))
        }
      }
    }

    loadCart()
  }, [effectiveUserId, firestoreCart, saveCartToFirestore, isGuest, currentUser, guestId, userStateKey])

  // Save cart data when it changes - with a ref to track if it's from user action
  const [shouldSaveCart, setShouldSaveCart] = useState(false)
  
  useEffect(() => {
    // Only save if cart has been initialized and we've had user interaction
    if (cartItems.length >= 0 && shouldSaveCart) {
      if (effectiveUserId) {
        // User is logged in or guest mode is active, save to Firestore
        saveCartMutation.mutate(cartItems)
      } else {
        // No effective user ID, save to localStorage
        localStorage.setItem("cart", JSON.stringify(cartItems))
      }
      // Reset flag after saving
      setShouldSaveCart(false)
    }
  }, [cartItems, effectiveUserId, saveCartMutation, shouldSaveCart])

  // Wrapped cart modification functions to set the save flag
  const addToCart = (product, quantity = 1) => {
    setCartItems((prevItems) => {
      // Check if item already exists in cart
      const existingItemIndex = prevItems.findIndex((item) => item.id === product.id)

      if (existingItemIndex >= 0) {
        // Item exists, update quantity
        const updatedItems = [...prevItems]
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + quantity,
          // Ensure we keep the imageUrl when updating quantity
          imageUrl: product.imageUrl || updatedItems[existingItemIndex].imageUrl
        }
        return updatedItems
      } else {
        // Item doesn't exist, add new item
        return [
          ...prevItems,
          {
            id: product.id,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl, // Store the imageUrl from the product
            quantity,
          },
        ]
      }
    })
    // Mark for saving
    setShouldSaveCart(true)
  }

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId))
    // Mark for saving
    setShouldSaveCart(true)
  }

  // Update item quantity
  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return

    setCartItems((prevItems) => prevItems.map((item) => (item.id === productId ? { ...item, quantity } : item)))
    // Mark for saving
    setShouldSaveCart(true)
  }

  // Clear cart
  const clearCart = () => {
    setCartItems([])
    // Mark for saving
    setShouldSaveCart(true)
  }

  // Calculate cart totals
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0)

  const value = {
    cartItems,
    loading: isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    itemCount,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

