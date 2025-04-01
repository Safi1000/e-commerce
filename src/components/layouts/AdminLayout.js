"use client"
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"

export default function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, currentUser } = useAuth()

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
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="flex h-16 items-center justify-center border-b">
          <Link to="/admin" className="text-xl font-bold text-blue-600">
            ShopEase Admin
          </Link>
        </div>
        <nav className="mt-6">
          <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">Dashboard</div>
          <Link
            to="/admin"
            className={`flex items-center px-4 py-3 ${
              isActive("/admin") &&
              !isActive("/admin/products") &&
              !isActive("/admin/categories") &&
              !isActive("/admin/orders")
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:bg-gray-50"
            }`}
          >
            <svg className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8m-8 6h16" />
            </svg>
            Overview
          </Link>

          <div className="mt-4 px-4 py-2 text-xs font-semibold text-gray-400 uppercase">Products</div>
          <Link
            to="/admin/products"
            className={`flex items-center px-4 py-3 ${
              isActive("/admin/products") ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
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
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:bg-gray-50"
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
              isActive("/admin/categories") ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
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
                ? "bg-blue-50 text-blue-600"
                : "text-gray-600 hover:bg-gray-50"
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
              isActive("/admin/orders") ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"
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

          <div className="mt-4 px-4 py-2 text-xs font-semibold text-gray-400 uppercase">User Interface</div>
          <Link to="/" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50">
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
        <div className="absolute bottom-0 w-64 border-t p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-700 font-bold">
                {currentUser?.displayName?.charAt(0) || "A"}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{currentUser?.displayName || "Admin User"}</p>
              <button onClick={handleLogout} className="text-xs font-medium text-gray-500 hover:text-gray-700">
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

