"use client"

import { useState, useEffect } from "react"
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore"
import { db } from "../../firebase/config"
import { Link } from "react-router-dom"

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    products: 0,
    categories: 0,
    users: 0,
  })
  const [recentProducts, setRecentProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch counts
        const productsSnapshot = await getDocs(collection(db, "products"))
        const categoriesSnapshot = await getDocs(collection(db, "categories"))
        const usersSnapshot = await getDocs(collection(db, "users"))

        setStats({
          products: productsSnapshot.size,
          categories: categoriesSnapshot.size,
          users: usersSnapshot.size,
        })

        // Fetch recent products
        const recentProductsQuery = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(5))
        const recentProductsSnapshot = await getDocs(recentProductsQuery)
        const recentProductsData = recentProductsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setRecentProducts(recentProductsData)
      } catch (error) {
        console.error("Error fetching dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-[12px] shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm">Total Products</h2>
              <p className="text-2xl font-semibold text-gray-800">{stats.products}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/admin/products" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
              View all products →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-[12px] shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm">Total Categories</h2>
              <p className="text-2xl font-semibold text-gray-800">{stats.categories}</p>
            </div>
          </div>
          <div className="mt-4">
            <Link to="/admin/categories" className="text-green-600 hover:text-green-800 text-sm font-medium">
              View all categories →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-[12px] shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="text-gray-600 text-sm">Total Users</h2>
              <p className="text-2xl font-semibold text-gray-800">{stats.users}</p>
            </div>
          </div>
          <div className="mt-4">
            <span className="text-purple-600 text-sm font-medium">Registered users</span>
          </div>
        </div>
      </div>

      {/* Recent Products */}
      <div className="bg-white rounded-[12px] shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-800">Recent Products</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {recentProducts.length === 0 ? (
            <div className="px-6 py-4 text-gray-500">No products found</div>
          ) : (
            recentProducts.map((product) => (
              <div key={product.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-gray-800">{product.name}</h3>
                    <p className="text-sm text-gray-500">${product.price?.toFixed(2) || "0.00"}</p>
                  </div>
                  <Link
                    to={`/admin/products/edit/${product.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="px-6 py-4 bg-gray-50">
          <Link to="/admin/products" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            View all products
          </Link>
        </div>
      </div>
    </div>
  )
}

