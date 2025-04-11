"use client"
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import ThemeToggle from "../ThemeToggle"
import { useTheme } from "../../contexts/ThemeContext"

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, currentUser } = useAuth()
  const { theme } = useTheme()

  const handleLogout = async () => {
    try {
      await logout()
      navigate("/login")
    } catch (error) {
      console.error("Failed to log out", error)
    }
  }

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  return (
    <div className={`flex h-screen ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"} theme-transition`}>
      {/* Sidebar */}
      <div className={`w-64 ${theme === "dark" ? "bg-gray-800" : "bg-white"} shadow-md theme-transition`}>
        <div className={`flex h-16 items-center justify-between px-6 border-b ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}>
          <Link to="/admin" className={`text-xl font-bold ${theme === "dark" ? "text-blue-400" : "text-blue-600"}`}>
            ShopEase Admin
          </Link>
          <ThemeToggle />
        </div>
        <nav className="mt-6">
          <div className={`px-4 py-2 text-xs font-semibold ${theme === "dark" ? "text-gray-400" : "text-gray-500"} uppercase`}>Dashboard</div>
          <Link
            to="/admin"
            className={`flex items-center px-4 py-3 ${
              isActive("/admin") &&
              !isActive("/admin/products") &&
              !isActive("/admin/categories") &&
              !isActive("/admin/orders") &&
              !isActive("/admin/settings")
                ? theme === "dark" 
                  ? "bg-gray-700 text-blue-400 rounded-lg ml-2 mr-2" 
                  : "bg-blue-50 text-blue-600 rounded-lg ml-2 mr-2"
                : theme === "dark"
                  ? "text-gray-300 hover:bg-gray-700 hover:rounded-lg ml-2 mr-2"
                  : "text-gray-600 hover:bg-gray-50 hover:rounded-lg ml-2 mr-2"
            }`}
          >
            <svg className={`h-5 w-5 mr-3 ${theme === "dark" ? "text-current" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
            Overview
          </Link>

          <div className="mt-4 px-4 py-2 text-xs font-semibold text-gray-400 uppercase">Products</div>
          <Link
            to="/admin/products"
            className={`flex items-center px-4 py-3 ${
              isActive("/admin/products") ? "bg-blue-50 text-blue-600 rounded-[12px] ml-2 mr-2" : "text-gray-600 hover:bg-gray-50 hover:rounded-[12px] ml-2 mr-2"
            }`}
          >
            <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
              />
            </svg>
            Products
          </Link>
          <Link
            to="/admin/products/add"
            className={`flex items-center px-4 py-3 ${
              location.pathname === "/admin/products/add"
                ? "bg-blue-50 text-blue-600 rounded-[12px] ml-2 mr-2"
                : "text-gray-600 hover:bg-gray-50 hover:rounded-[12px] ml-2 mr-2"
            }`}
          >
            <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Product
          </Link>

          <div className="mt-4 px-4 py-2 text-xs font-semibold text-gray-400 uppercase">Categories</div>
          <Link
            to="/admin/categories"
            className={`flex items-center px-4 py-3 ${
              isActive("/admin/categories") ? "bg-blue-50 text-blue-600 rounded-[12px] ml-2 mr-2" : "text-gray-600 hover:bg-gray-50 hover:rounded-[12px] ml-2 mr-2"
            }`}
          >
            <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
              />
            </svg>
            Categories
          </Link>
          <Link
            to="/admin/categories/add"
            className={`flex items-center px-4 py-3 ${
              location.pathname === "/admin/categories/add"
                ? "bg-blue-50 text-blue-600 rounded-[12px] ml-2 mr-2"
                : "text-gray-600 hover:bg-gray-50 hover:rounded-[12px] ml-2 mr-2"
            }`}
          >
            <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Category
          </Link>

          {/* Orders Section */}
          <div className="mt-4 px-4 py-2 text-xs font-semibold text-gray-400 uppercase">Orders</div>
          <Link
            to="/admin/orders"
            className={`flex items-center px-4 py-3 ${
              isActive("/admin/orders") ? "bg-blue-50 text-blue-600 rounded-[12px] ml-2 mr-2" : "text-gray-600 hover:bg-gray-50 hover:rounded-[12px] ml-2 mr-2"
            }`}
          >
            <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            Manage Orders
          </Link>

          <div className="mt-4 px-4 py-2 text-xs font-semibold text-gray-400 uppercase">Settings</div>
          <Link
            to="/admin/settings"
            className={`flex items-center px-4 py-3 ${
              isActive("/admin/settings") ? "bg-blue-50 text-blue-600 rounded-[12px] ml-2 mr-2" : "text-gray-600 hover:bg-gray-50 hover:rounded-[12px] ml-2 mr-2"
            }`}
          >
            <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
            Site Settings
          </Link>

          <div className="mt-4 px-4 py-2 text-xs font-semibold text-gray-400 uppercase">User Interface</div>
          <Link to="/" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 hover:rounded-[12px] ml-2 mr-2">
            <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Back to Shop
          </Link>
        </nav>
        <div className={`absolute bottom-0 w-64 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"} p-4`}>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className={`h-10 w-10 rounded-full ${theme === "dark" ? "bg-gray-600" : "bg-gray-200"} flex items-center justify-center ${theme === "dark" ? "text-gray-300" : "text-gray-700"} font-bold`}>
                {currentUser?.displayName?.charAt(0) || "A"}
              </div>
            </div>
            <div className="ml-3">
              <p className={`text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>{currentUser?.displayName || "Admin User"}</p>
              <button onClick={handleLogout} className={`text-xs font-medium ${theme === "dark" ? "text-gray-400 hover:text-gray-300" : "text-gray-500 hover:text-gray-700"} transition-colors`}>
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className={`p-6 ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-900"}`}>
          <Outlet />
        </div>
      </div>
    </div>
  )
}

