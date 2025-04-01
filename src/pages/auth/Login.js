"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { motion } from "framer-motion"
import { ChevronLeft, Mail, Lock } from "lucide-react"
import { getImage } from "../../utils/imageApi"
import styled from "styled-components";

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [backgroundImage, setBackgroundImage] = useState("")
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const fetchImage = async () => {
      const imageUrl = await getImage("technology background", { orientation: 'landscape' })
      setBackgroundImage(imageUrl)
    }
    fetchImage()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      setError("")
      setLoading(true)
      await login(email, password)
      navigate("/")
    } catch (error) {
      setError("Failed to sign in. Please check your credentials.")
    } finally {
      setLoading(false)
    }
  }

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  }

  return (
    <div className="min-h-screen bg-black text-white flex">
      {/* Left side - Image */}
      <div className="hidden md:block md:w-1/2 relative">

      <img
  src={backgroundImage || "/placeholder.svg"}
  alt="Fashion"
  className="absolute inset-0 w-full h-full object-cover border-r border-white"
/>



        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="text-center p-8">
            <h1 className="text-5xl font-bold mb-4 font-poppins">
              <span className="text-gray-400">SHOP</span>
              <span className="text-white">EASE</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-md mx-auto font-inter">
              Your premium shopping destination with uncompromising quality.
            </p>
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full">
          <Link to="/" className="flex items-center text-gray-400 hover:text-white transition-colors mb-8 font-inter">
            <ChevronLeft className="h-5 w-5 mr-1" />
            Back to Home
          </Link>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="bg-gray-900 p-8 rounded-sm border border-gray-800"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold font-poppins">WELCOME BACK</h2>
              <p className="mt-2 text-gray-400 font-inter">Sign in to your account</p>
            </div>

            {error && (
              <div className="bg-black border border-red-500 text-red-400 px-4 py-3 rounded-sm mb-6 font-inter">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2 font-inter">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 px-4 py-3 bg-black border border-gray-800 rounded-sm focus:outline-none focus:border-white transition-colors text-white font-inter"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2 font-inter">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 px-4 py-3 bg-black border border-gray-800 rounded-sm focus:outline-none focus:border-white transition-colors text-white font-inter"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-white text-black px-4 py-3 rounded-sm hover:bg-gray-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed font-inter"
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        />
                      </svg>
                      Signing in...
                    </span>
                  ) : (
                    "SIGN IN"
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <p className="text-gray-400 font-inter">
                Don't have an account?{" "}
                <Link to="/register" className="text-white hover:text-gray-300 font-medium">
                  Sign up
                </Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

