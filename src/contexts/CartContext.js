"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { doc, setDoc, getDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useAuth } from "./AuthContext"

const CartContext = createContext()

export function useCart() {
  return useContext(CartContext)
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const { currentUser } = useAuth()

  // Load cart data when user changes
  useEffect(() => {
    const loadCart = async () => {
      setLoading(true)

      try {
        if (currentUser) {
          // User is logged in, get cart from Firestore
          const cartDoc = await getDoc(doc(db, "carts", currentUser.uid))

          if (cartDoc.exists()) {
            setCartItems(cartDoc.data().items || [])
          } else {
            // New user, check if there are items in localStorage to migrate
            const localCart = localStorage.getItem("cart")
            if (localCart) {
              const parsedCart = JSON.parse(localCart)
              setCartItems(parsedCart)

              // Save local cart to Firestore
              await setDoc(doc(db, "carts", currentUser.uid), {
                userId: currentUser.uid,
                items: parsedCart,
                updatedAt: new Date().toISOString(),
              })

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
        // Fallback to localStorage if Firestore fails
        const localCart = localStorage.getItem("cart")
        if (localCart) {
          setCartItems(JSON.parse(localCart))
        }
      } finally {
        setLoading(false)
      }
    }

    loadCart()
  }, [currentUser])

  // Save cart data when it changes
  useEffect(() => {
    const saveCart = async () => {
      try {
        if (currentUser) {
          // User is logged in, save to Firestore
          await setDoc(doc(db, "carts", currentUser.uid), {
            userId: currentUser.uid,
            items: cartItems,
            updatedAt: new Date().toISOString(),
          })
          // Also save to localStorage as backup
          localStorage.setItem("cart", JSON.stringify(cartItems))
        } else {
          // User is not logged in, save to localStorage
          localStorage.setItem("cart", JSON.stringify(cartItems))
        }
      } catch (error) {
        console.error("Error saving cart:", error)
        // Fallback to localStorage if Firestore fails
        localStorage.setItem("cart", JSON.stringify(cartItems))
      }
    }

    // Only save if cart has been loaded (not in initial loading state)
    if (!loading) {
      saveCart()
    }
  }, [cartItems, currentUser, loading])

  // Add item to cart
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
            imageUrl: product.imageUrl,
            quantity,
          },
        ]
      }
    })
  }

  // Remove item from cart
  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter((item) => item.id !== productId))
  }

  // Update item quantity
  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) return

    setCartItems((prevItems) => prevItems.map((item) => (item.id === productId ? { ...item, quantity } : item)))
  }

  // Clear cart
  const clearCart = () => {
    setCartItems([])
  }

  // Calculate cart totals
  const cartTotal = cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  const itemCount = cartItems.reduce((count, item) => count + item.quantity, 0)

  const value = {
    cartItems,
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    cartTotal,
    itemCount,
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

