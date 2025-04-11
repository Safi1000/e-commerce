"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { doc, getDoc, updateDoc } from "firebase/firestore"
import { updateProfile } from "firebase/auth"
import { db } from "../../firebase/config"
import { useAuth } from "../../contexts/AuthContext"
import { motion } from "framer-motion"
import { User, ShoppingCart, ShoppingBag, LogOut, Check, AlertTriangle } from "lucide-react"
import { NewtonsCradle } from 'ldrs/react'
import 'ldrs/react/NewtonsCradle.css'
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

export default function Profile() {
  const { currentUser, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [userData, setUserData] = useState({
    name: "",
    email: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
  })

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: "", text: "" })
  const [orders, setOrders] = useState([])
  const [activeTab, setActiveTab] = useState("orders")

  // Fetch user data with React Query
  const { data: userProfileData, isLoading } = useQuery({
    queryKey: ['userProfile', currentUser?.uid],
    queryFn: async () => {
      if (!currentUser) return null
      
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid))
        if (userDoc.exists()) {
          return userDoc.data()
        }
        return null
      } catch (error) {
        console.error("Error fetching user data:", error)
        return null
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!currentUser,
    retry: 1,
  })

  // Update user data useEffect
  useEffect(() => {
    if (userProfileData && currentUser) {
      setUserData({
        name: userProfileData.name || currentUser.displayName || "",
        email: currentUser.email || "",
        address: userProfileData.address || "",
        city: userProfileData.city || "",
        state: userProfileData.state || "",
        zipCode: userProfileData.zipCode || "",
        country: userProfileData.country || "",
      })
    } else if (currentUser && !userProfileData) {
      // No user profile data exists yet
      setUserData({
        name: currentUser.displayName || "",
        email: currentUser.email || "",
        address: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
      })
    }
  }, [userProfileData, currentUser])

  // Use mutation for updating profile
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData) => {
      // Update user profile in Firebase Auth
      if (currentUser.displayName !== updatedData.name) {
        await updateProfile(currentUser, {
          displayName: updatedData.name,
        })
      }

      // Update user data in Firestore
      await updateDoc(doc(db, "users", currentUser.uid), {
        name: updatedData.name,
        address: updatedData.address,
        city: updatedData.city,
        state: updatedData.state,
        zipCode: updatedData.zipCode,
        country: updatedData.country,
        updatedAt: new Date().toISOString(),
      })
    },
    onSuccess: () => {
      setMessage({ type: "success", text: "Profile updated successfully" })
      // Invalidate and refetch user profile data
      queryClient.invalidateQueries(['userProfile', currentUser?.uid])
    },
    onError: (error) => {
      console.error("Error updating profile:", error)
      setMessage({ type: "error", text: "Failed to update profile" })
    },
    onSettled: () => {
      setSaving(false)
    }
  })

  const handleChange = (e) => {
    const { name, value } = e.target
    setUserData({
      ...userData,
      [name]: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage({ type: "", text: "" })
    
    // Use the mutation to update the profile
    updateProfileMutation.mutate(userData)
  }

  const handleLogout = async () => {
    try {
      await logout()
      navigate("/login")
    } catch (error) {
      console.error("Failed to log out", error)
    }
  }

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  if (isLoading) {
    return (
      <div className="bg-black text-white min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-center items-center min-h-[60vh]">
            <NewtonsCradle
              size="100"
              speed="1.4"
              color="white" 
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
<div className="w-fit">
  <h1 className="text-4xl font-bold mb-2 tracking-tight font-poppins">YOUR PROFILE</h1>
  <div className="h-1 bg-white w-full"></div>
</div>

        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div className="md:col-span-2" initial="hidden" animate="visible" variants={fadeIn}>
            <div className="bg-gray-900 border border-gray-800 rounded-[12px] p-6">
              <h2 className="text-xl font-bold mb-6 font-poppins">PERSONAL INFORMATION</h2>

              {message.text && (
                <div
                  className={`mb-6 p-4 rounded-[12px] border ${
                    message.type === "success"
                      ? "border-green-500 bg-black text-green-400 flex items-center"
                      : "border-red-500 bg-black text-red-400 flex items-center"
                  }`}
                >
                  {message.type === "success" ? (
                    <Check className="h-5 w-5 mr-2" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 mr-2" />
                  )}
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1 font-inter">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={userData.name}
                      onChange={handleChange}
                      className="block w-full bg-black border border-gray-700 rounded-[12px] py-2 px-3 focus:outline-none focus:border-white text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1 font-inter">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={userData.email}
                      disabled
                      className="block w-full bg-gray-800 border border-gray-700 rounded-[12px] py-2 px-3 text-gray-400"
                    />
                    <p className="mt-1 text-xs text-gray-500 font-inter">Email cannot be changed</p>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-1 font-inter">
                      Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={userData.address}
                      onChange={handleChange}
                      className="block w-full bg-black border border-gray-700 rounded-[12px] py-2 px-3 focus:outline-none focus:border-white text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-1 font-inter">
                      City
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={userData.city}
                      onChange={handleChange}
                      className="block w-full bg-black border border-gray-700 rounded-[12px] py-2 px-3 focus:outline-none focus:border-white text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-300 mb-1 font-inter">
                      State/Province
                    </label>
                    <input
                      type="text"
                      id="state"
                      name="state"
                      value={userData.state}
                      onChange={handleChange}
                      className="block w-full bg-black border border-gray-700 rounded-[12px] py-2 px-3 focus:outline-none focus:border-white text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium text-gray-300 mb-1 font-inter">
                      ZIP/Postal Code
                    </label>
                    <input
                      type="text"
                      id="zipCode"
                      name="zipCode"
                      value={userData.zipCode}
                      onChange={handleChange}
                      className="block w-full bg-black border border-gray-700 rounded-[12px] py-2 px-3 focus:outline-none focus:border-white text-white"
                    />
                  </div>

                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-1 font-inter">
                      Country
                    </label>
                    <select
                      id="country"
                      name="country"
                      value={userData.country}
                      onChange={handleChange}
                      className="block w-full bg-black border border-gray-700 rounded-[12px] py-2 px-3 focus:outline-none focus:border-white text-white"
                    >
                      <option value="">Select a country</option>
                      <option value="United States">United States</option>
                      <option value="Canada">Canada</option>
                      <option value="United Kingdom">United Kingdom</option>
                      <option value="Australia">Australia</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-white text-black py-2 px-6 rounded-[12px] text-sm font-medium hover:bg-gray-200 transition-colors flex items-center gap-2 font-inter"
                  >
                    {saving ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>

          <motion.div initial="hidden" animate="visible" variants={fadeIn}>
            <div className="bg-gray-900 border border-gray-800 rounded-[12px] p-6">
              <div className="flex items-center mb-6">
                <div className="h-16 w-16 rounded-[12px] bg-black flex items-center justify-center text-white text-xl font-bold">
                  {userData.name.charAt(0) || <User className="h-8 w-8" />}
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-bold font-poppins">{userData.name || "User"}</h2>
                  <p className="text-gray-400 font-inter">{userData.email}</p>
                </div>
              </div>

              <div className="border-t border-gray-800 pt-4">
                <button
                  onClick={handleLogout}
                  className="w-full bg-black border border-gray-700 text-white py-3 px-4 rounded-[12px] hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 font-inter"
                >
                  <LogOut className="h-5 w-5" />
                  Sign Out
                </button>
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-[12px] p-6 mt-6">
              <h2 className="text-lg font-bold mb-4 font-poppins">ACCOUNT ACTIONS</h2>

              <div className="space-y-4">
                <button
                  onClick={() => navigate("/cart")}
                  className="w-full bg-black border border-gray-700 text-white py-3 px-4 rounded-[12px] hover:bg-gray-800 transition-colors text-left flex items-center gap-3 font-inter"
                >
                  <ShoppingCart className="h-5 w-5" />
                  View Cart
                </button>

                <button
                  onClick={() => navigate("/shop")}
                  className="w-full bg-black border border-gray-700 text-white py-3 px-4 rounded-[12px] hover:bg-gray-800 transition-colors text-left flex items-center gap-3 font-inter"
                >
                  <ShoppingBag className="h-5 w-5" />
                  Continue Shopping
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

