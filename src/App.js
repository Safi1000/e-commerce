"use client"

import { useEffect, useState } from "react"
import { HashRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { onAuthChange } from "./firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { db } from "./firebase/config"

// Auth Components
import Login from "./pages/auth/Login"
import Register from "./pages/auth/Register"

// Admin Components
import AdminLayout from "./components/layouts/AdminLayout"
import AdminDashboard from "./pages/admin/Dashboard"
import ProductList from "./pages/admin/products/ProductList"
import AddProduct from "./pages/admin/products/AddProduct"
import EditProduct from "./pages/admin/products/EditProduct"
import CategoryList from "./pages/admin/categories/CategoryList"
import AddCategory from "./pages/admin/categories/AddCategory"
import EditCategory from "./pages/admin/categories/EditCategory"
import OrderList from "./pages/admin/orders/OrderList"
import Settings from "./pages/admin/Settings"

// User Components
import UserLayout from "./components/layouts/UserLayout"
import Home from "./pages/Home"
import Shop from "./pages/shop/Shop"
import ProductDetail from "./pages/shop/ProductDetail"
import Cart from "./pages/shop/Cart"
import Checkout from "./pages/shop/Checkout"
import Profile from "./pages/user/Profile"

// Context
import { AuthProvider } from "./contexts/AuthContext"
import { CartProvider } from "./contexts/CartContext"
import { ThemeProvider } from "./contexts/ThemeContext"

// Components
import ScrollToTop from "./components/ScrollToTop"

function App() {
  // Remove or modify the basename config when using HashRouter
  // const basename = process.env.PUBLIC_URL || "/e-commerce";

  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <ThemeProvider>
            <ScrollToTop />
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* User Routes */}
              <Route path="/" element={<UserLayout><Home /></UserLayout>} />
              <Route path="/shop" element={<UserLayout><Shop /></UserLayout>} />
              <Route path="/product/:id" element={<UserLayout><ProductDetail /></UserLayout>} />
              <Route path="/cart" element={<UserLayout><Cart /></UserLayout>} />
              <Route path="/checkout" element={<UserLayout><Checkout /></UserLayout>} />
              
              {/* Protected Routes - only for authenticated users (not guests) */}
              <Route path="/profile" element={
                <AuthenticatedRoute>
                  <UserLayout><Profile /></UserLayout>
                </AuthenticatedRoute>
              } />

              {/* Admin Routes - only for admin users */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              }>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<ProductList />} />
                <Route path="products/add" element={<AddProduct />} />
                <Route path="products/edit/:id" element={<EditProduct />} />
                <Route path="categories" element={<CategoryList />} />
                <Route path="categories/add" element={<AddCategory />} />
                <Route path="categories/edit/:id" element={<EditCategory />} />
                <Route path="orders" element={<OrderList />} />
                <Route path="settings" element={<Settings />} />
              </Route>

              {/* Catch All */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ThemeProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  )
}

// Private route component - allows both authenticated users and guests
function PrivateRoute({ children }) {
  const [user, setUser] = useState(null)
  const [isGuest, setIsGuest] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser)
      
      // If no user is authenticated, check if we're in guest mode
      if (!currentUser) {
        const guestId = localStorage.getItem("guestId");
        const guestData = localStorage.getItem("guestData");
        
        if (guestId && (guestData || localStorage.getItem("cart"))) {
          setIsGuest(true);
        }
      } else {
        setIsGuest(false);
      }
      
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  // Allow access if user is authenticated OR in guest mode
  if (!user && !isGuest) {
    // If trying to access a page that requires an account, redirect to login
    return <Navigate to="/login" />
  }

  return children
}

// Authenticated route component - only allows authenticated users (not guests)
function AuthenticatedRoute({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  // Only allow authenticated users (not guests)
  if (!user) {
    return <Navigate to="/" />
  }

  return children
}

// Admin route component - only allows admin users
function AdminRoute({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthChange(async (currentUser) => {
      if (currentUser) {
        // Check if user is admin
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid))
          const userData = userDoc.data()
          const isUserAdmin = userData?.role === "admin"
          console.log("User role check in AdminRoute:", userData?.role)
          console.log("Is admin:", isUserAdmin)
          setIsAdmin(isUserAdmin)
        } catch (error) {
          console.error("Error checking admin status:", error)
          setIsAdmin(false)
        }
        setUser(currentUser)
      } else {
        setUser(null)
        setIsAdmin(false)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" />
  }

  if (!isAdmin) {
    console.log("User is not an admin, redirecting to home") // Debug log
    return <Navigate to="/" />
  }

  return children
}

export default App

