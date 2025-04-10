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
  const { currentUser } = useAuth()
  const queryClient = useQueryClient()

  // Use React Query to fetch cart data
  const { data: firestoreCart, isLoading } = useQuery({
    queryKey: ['cart', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) return null
      
      try {
        const cartDoc = await getDoc(doc(db, "carts", currentUser.uid))
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
    enabled: !!currentUser
  })

  // Use mutation for saving cart - using useCallback to prevent recreation on each render
  const saveCartToFirestore = useCallback(async (items) => {
    if (!currentUser) return
    
    try {
      await setDoc(doc(db, "carts", currentUser.uid), {
        userId: currentUser.uid,
        items,
        updatedAt: new Date().toISOString(),
      })
      
      // Also save to localStorage as backup
      localStorage.setItem("cart", JSON.stringify(items))
    } catch (error) {
      console.error("Error saving cart to Firestore:", error)
      localStorage.setItem("cart", JSON.stringify(items))
    }
  }, [currentUser])

  // Use mutation without automatic invalidation to prevent loops
  const saveCartMutation = useMutation({
    mutationFn: saveCartToFirestore,
    // Remove the onSuccess handler to prevent loops
  })

  // Load cart data when user changes or firestoreCart updates
  useEffect(() => {
    const loadCart = async () => {
      try {
        if (currentUser) {
          // User is logged in, use data from Firestore via React Query
          if (firestoreCart) {
            setCartItems(firestoreCart)
          } else {
            // Check localStorage for potential migration
            const localCart = localStorage.getItem("cart")
            if (localCart) {
              const parsedCart = JSON.parse(localCart)
              setCartItems(parsedCart)
              
              // Save local cart to Firestore but don't trigger state updates
              saveCartToFirestore(parsedCart)
              
              // Clear localStorage cart after migration
              localStorage.removeItem("cart")
            } else {
              setCartItems([])
            }
          }
        } else {
          // User is not logged in, get cart from localStorage
          const localCart = localStorage.getItem("cart")
          if (localCart) {
            setCartItems(JSON.parse(localCart))
          } else {
            setCartItems([])
          }
        }
      } catch (error) {
        console.error("Error loading cart:", error)
        // Fallback to localStorage if something fails
        const localCart = localStorage.getItem("cart")
        if (localCart) {
          setCartItems(JSON.parse(localCart))
        }
      }
    }

    loadCart()
  }, [currentUser, firestoreCart, saveCartToFirestore])

  // Save cart data when it changes - with a ref to track if it's from user action
  const [shouldSaveCart, setShouldSaveCart] = useState(false)
  
  useEffect(() => {
    // Only save if cart has been initialized and we've had user interaction
    if (cartItems.length >= 0 && shouldSaveCart) {
      if (currentUser) {
        // User is logged in, save to Firestore
        saveCartMutation.mutate(cartItems)
      } else {
        // User is not logged in, save to localStorage
        localStorage.setItem("cart", JSON.stringify(cartItems))
      }
      // Reset flag after saving
      setShouldSaveCart(false)
    }
  }, [cartItems, currentUser, saveCartMutation, shouldSaveCart])

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

