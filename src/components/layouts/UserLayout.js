"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate, useLocation } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { useCart } from "../../contexts/CartContext"
import { ShoppingBag, Search, User, LogOut, Menu, X, ChevronDown, Home, ShoppingCart, Settings, UserPlus } from "lucide-react"
import ThemeToggle from "../ThemeToggle"
import { useTheme } from "../../contexts/ThemeContext"
import { NewtonsCradle } from 'ldrs/react'
import 'ldrs/react/NewtonsCradle.css'

export default function UserLayout({ children }) {
  const { currentUser, logout, userRole, isAdmin, isGuest, guestId } = useAuth()
  const { itemCount } = useCart()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isPageLoaded, setIsPageLoaded] = useState(false)

  useEffect(() => {
    // Set page loaded to true when all content is loaded
    const handleLoad = () => {
      setIsPageLoaded(true)
    }

    window.addEventListener('load', handleLoad)
    return () => window.removeEventListener('load', handleLoad)
  }, [])

  const handleLogoClick = (e) => {
    if (location.pathname === "/") {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)
      setIsPageLoaded(false)
      await logout()
      // Force a page reload after logout
      window.location.reload()
    } catch (error) {
      console.error("Failed to log out", error)
      setIsLoggingOut(false)
      setIsPageLoaded(true)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()

    // If search is empty, just navigate to shop
    if (!searchTerm.trim()) {
      navigate("/shop")
      return
    }

    // Build search URL preserving any existing category or price filters
    const currentParams = new URLSearchParams(location.search)
    const params = new URLSearchParams()

    // Set search parameter
    params.set("search", searchTerm.trim())

    // Preserve category and price filters if we're already on the shop page
    if (location.pathname === "/shop") {
      const category = currentParams.get("category")
      const minPrice = currentParams.get("minPrice")
      const maxPrice = currentParams.get("maxPrice")

      if (category) params.set("category", category)
      if (minPrice) params.set("minPrice", minPrice)
      if (maxPrice) params.set("maxPrice", maxPrice)
    }

    // If we're already on shop page with the same search
    if (location.pathname === "/shop" && currentParams.get("search") === searchTerm.trim()) {
      // Force a refresh by navigating away and back
      navigate("/shop", { replace: true })
      setTimeout(() => {
        navigate(`/shop?${params.toString()}`, { replace: true })
      }, 10)
    } else {
      // Normal navigation
      navigate(`/shop?${params.toString()}`)
    }
  }

  // Keep search bar in sync with URL
  useEffect(() => {
    if (location.pathname === "/shop") {
      const params = new URLSearchParams(location.search)
      const searchParam = params.get("search")
      setSearchTerm(searchParam || "")
    } else {
      // Clear search when not on shop page
      setSearchTerm("")
    }
  }, [location.pathname, location.search])

  if (isLoggingOut && !isPageLoaded) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-black" : "bg-white"}`}>
        <NewtonsCradle
          size="78"
          speed="1.4"
          color={theme === "dark" ? "white" : "black"}
        />
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex flex-col theme-transition ${theme === "dark" ? "bg-black text-white" : "bg-white text-gray-900"}`}>
      {/* Header */}
      <header className={`${theme === "dark" ? "bg-gray-800 border-b-2 border-white-800" : "bg-white border-b-2 border-gray-800"} sticky top-0 z-50 theme-transition`}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link 
              to="/" 
              onClick={handleLogoClick}
              className={`text-2xl font-bold ${theme === "dark" ? "text-white" : "text-gray-900"} flex items-center font-poppins theme-transition`}
            >
              <ShoppingBag className={`h-7 w-7 mr-2 ${theme === "dark" ? "text-white" : "text-gray-900"}`} />
              <span>
                SHOP<span className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>EASE</span>
              </span>
            </Link>

            {/* Search */}
            <form onSubmit={handleSearch} className="hidden md:flex items-center flex-1 max-w-md mx-4">
              <input
                type="text"
                placeholder="Search products..."
                className={`w-full px-4 py-2 ${
                  theme === "dark" 
                    ? "bg-black border border-gray-700 text-white" 
                    : "bg-gray-100 border border-gray-300 text-gray-900"
                } rounded-[12px] focus:outline-none focus:border-blue-500 transition-all theme-transition`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button
                type="submit"
                className={`${
                  theme === "dark"
                    ? "bg-white text-black"
                    : "bg-gray-900 text-white"
                } px-4 py-2 rounded-[12px] hover:opacity-90 transition-colors ml-2`}
              >
                <Search className="h-5 w-5" />
              </button>
            </form>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/" className={`${theme === "dark" ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"} transition-colors font-medium font-inter`}>
                Home
              </Link>
              <Link to="/shop" className={`${theme === "dark" ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"} transition-colors font-medium font-inter`}>
                Shop
              </Link>
              {/* Cart visible for both logged in and guest users */}
              <Link
                to="/cart"
                className={`${theme === "dark" ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"} py-2 font-inter flex items-center gap-2`}
                onClick={() => setIsMenuOpen(false)}
              >
                <ShoppingCart className="h-5 w-5" />
                <span>Cart</span>
                {itemCount > 0 && (
                  <span className={`ml-2 ${theme === "dark" ? "bg-white text-black" : "bg-gray-900 text-white"} text-xs rounded-full h-5 w-5 flex items-center justify-center`}>
                    {itemCount}
                  </span>
                )}
              </Link>

              {/* Add Theme Toggle */}
              <ThemeToggle />

              {currentUser || isGuest ? (
                <div className="relative">
                  <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className={`flex items-center ${theme === "dark" ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"} focus:outline-none`}
                  >
                    <div className={`h-8 w-8 rounded-full ${theme === "dark" ? "bg-gray-700" : "bg-gray-300"} flex items-center justify-center text-sm font-medium mr-1`}>
                      {isGuest ? (
                        <User className="h-4 w-4" />
                      ) : (
                        currentUser.displayName?.charAt(0) || <User className="h-4 w-4" />
                      )}
                    </div>
                    <span className="font-medium font-inter">
                      {isGuest ? (
                        "Guest"
                      ) : (
                        currentUser.displayName?.split(" ")[0] || "Account"
                      )}
                    </span>
                    {isGuest && (
                      <span className="ml-2 px-2 py-1 text-xs bg-amber-500 text-black rounded-full">Guest</span>
                    )}
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </button>
                  {isMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-[12px] shadow-lg py-1 z-10">
                      {isGuest ? (
                        <>
                          <Link
                            to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors font-inter flex items-center gap-2"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <User className="h-4 w-4" />
                            Sign in
                          </Link>
                          <Link
                            to={`/register?redirect=${encodeURIComponent(location.pathname + location.search)}`}
                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors font-inter flex items-center gap-2"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            <UserPlus className="h-4 w-4" />
                            Create Account
                          </Link>
                        </>
                      ) : (
                        <>
                          <Link
                            to="/profile"
                            className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors font-inter"
                            onClick={() => setIsMenuOpen(false)}
                          >
                            Profile
                          </Link>
                          {/* Add Admin Dashboard Link in dropdown too */}
                          {isAdmin && (
                            <Link
                              to="/admin"
                              className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors font-inter"
                              onClick={() => setIsMenuOpen(false)}
                            >
                              Admin Dashboard
                            </Link>
                          )}
                          <button
                            onClick={() => {
                              handleLogout()
                              setIsMenuOpen(false)
                            }}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors font-inter"
                          >
                            Sign out
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
                    className={`${
                      theme === "dark" 
                        ? "bg-white text-black hover:bg-gray-200" 
                        : "bg-gray-900 text-white hover:bg-gray-800"
                    } px-4 py-2 rounded-[12px] transition-colors font-medium font-inter`}
                  >
                    Sign in
                  </Link>
                </>
              )}
            </nav>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              {/* Add Theme Toggle for mobile */}
              <ThemeToggle />
              
              <button className={`ml-3 ${theme === "dark" ? "text-gray-300" : "text-gray-700"} focus:outline-none`} onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 border-t border-gray-800 pt-4">
              <form onSubmit={handleSearch} className="mb-4">
                <div className="flex items-center">
                  <input
                    type="text"
                    placeholder="Search products..."
                    className={`w-full px-4 py-2 ${
                      theme === "dark" 
                        ? "bg-black border border-gray-700 text-white" 
                        : "bg-gray-100 border border-gray-300 text-gray-900"
                    } rounded-[12px] focus:outline-none focus:border-blue-500 transition-all theme-transition`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <button type="submit" className={`${
                    theme === "dark"
                      ? "bg-white text-black"
                      : "bg-gray-900 text-white"
                  } px-4 py-2 rounded-[12px] hover:opacity-90 transition-colors ml-2`}>
                    <Search className="h-5 w-5" />
                  </button>
                </div>
              </form>
              <div className="flex flex-col space-y-4">
                <Link
                  to="/"
                  className={`${theme === "dark" ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"} py-2 font-inter flex items-center gap-2`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Home className="h-5 w-5" />
                  Home
                </Link>
                <Link
                  to="/shop"
                  className={`${theme === "dark" ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"} py-2 font-inter flex items-center gap-2`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ShoppingBag className="h-5 w-5" />
                  Shop
                </Link>
                {/* Cart visible for both logged in and guest users */}
                <Link
                  to="/cart"
                  className={`${theme === "dark" ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"} py-2 font-inter flex items-center gap-2`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <ShoppingCart className="h-5 w-5" />
                  <span>Cart</span>
                  {itemCount > 0 && (
                    <span className={`ml-2 ${theme === "dark" ? "bg-white text-black" : "bg-gray-900 text-white"} text-xs rounded-full h-5 w-5 flex items-center justify-center`}>
                      {itemCount}
                    </span>
                  )}
                </Link>
                
                {isGuest && (
                  <div className="flex items-center gap-2 py-2">
                    <User className="h-5 w-5 text-amber-500" />
                    <span className="font-inter">Guest Mode</span>
                    <span className="ml-2 px-2 py-1 text-xs bg-amber-500 text-black rounded-full font-bold">Guest</span>
                  </div>
                )}

                {currentUser ? (
                  <>
                    <Link
                      to="/profile"
                      className={`${theme === "dark" ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"} py-2 font-inter flex items-center gap-2`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <User className="h-5 w-5" />
                      Profile
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin"
                        className={`${theme === "dark" ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"} py-2 font-inter flex items-center gap-2`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <Settings className="h-5 w-5" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsMenuOpen(false)
                      }}
                      className={`${theme === "dark" ? "text-gray-300 hover:text-white" : "text-gray-700 hover:text-gray-900"} text-left text-sm font-inter flex items-center gap-2`}
                    >
                      <LogOut className="h-5 w-5" />
                      Sign out
                    </button>
                  </>
                ) : !isGuest && (
                  <>
                    <Link
                      to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`}
                      className={`${
                        theme === "dark" 
                          ? "bg-white text-black hover:bg-gray-200" 
                          : "bg-gray-900 text-white hover:bg-gray-800"
                      } px-4 py-2 rounded-[12px] transition-colors font-inter`}
                    >
                      Sign in
                    </Link>
                    <Link
                      to={`/register?redirect=${encodeURIComponent(location.pathname + location.search)}`}
                      className={`${
                        theme === "dark" 
                          ? "bg-white text-black hover:bg-gray-200" 
                          : "bg-gray-900 text-white hover:bg-gray-800"
                      } px-4 py-2 rounded-[12px] transition-colors font-inter`}
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className={`${theme === "dark" ? "bg-gray-900 border-t border-gray-800 text-white" : "bg-gray-100 border-t border-gray-200 text-gray-900"} py-12 theme-transition`}>
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4 flex items-center font-poppins">
                <ShoppingBag className="h-6 w-6 mr-2" />
                <span>
                  SHOP<span className={theme === "dark" ? "text-gray-400" : "text-gray-500"}>EASE</span>
                </span>
              </h3>
              <p className="text-gray-400 font-inter">Your one-stop shop for all your needs.</p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 font-poppins">QUICK LINKS</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/"
                    className={`${theme === "dark" ? "text-gray-400 hover:text-white" : "text-gray-700 hover:text-gray-900"} transition-colors font-inter flex items-center gap-2`}>
                    <Home className="h-4 w-4" />
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    to="/shop"
                    className={`${theme === "dark" ? "text-gray-400 hover:text-white" : "text-gray-700 hover:text-gray-900"} transition-colors font-inter flex items-center gap-2`}>
                    <ShoppingBag className="h-4 w-4" />
                    Shop
                  </Link>
                </li>
                <li>
                  <Link
                    to="/cart"
                    className={`${theme === "dark" ? "text-gray-400 hover:text-white" : "text-gray-700 hover:text-gray-900"} transition-colors font-inter flex items-center gap-2`}>
                    <ShoppingCart className="h-4 w-4" />
                    Cart
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-4 font-poppins">CONTACT US</h3>
              <p className="text-gray-400 font-inter">Email: info@shopease.com</p>
              <p className="text-gray-400 font-inter">Phone: (123) 456-7890</p>
              <div className="flex mt-6 space-x-4">
                <a
                  href="#"
                  className="h-10 w-10 bg-black rounded-[12px] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="h-10 w-10 bg-black rounded-[12px] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723 10.054 10.054 0 01-3.127 1.184 4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="h-10 w-10 bg-black rounded-[12px] flex items-center justify-center text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p className="text-gray-500 text-sm font-inter">© 2025 ShopEase. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

