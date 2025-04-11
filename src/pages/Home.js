"use client"
import { useQuery } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { collection, getDocs, query, limit, orderBy, where, doc, getDoc } from "firebase/firestore"
import { db } from "../firebase/config"
import { useCart } from "../contexts/CartContext"
import { useAuth } from "../contexts/AuthContext"
import { useTheme } from "../contexts/ThemeContext"
import { motion } from "framer-motion"
import { ShoppingBag, Clock, Shield, Layers, ChevronRight, Check } from "lucide-react"
import { getImage } from "../utils/imageApi"
import { NewtonsCradle } from "ldrs/react"
import "ldrs/react/NewtonsCradle.css"
import "../App.css"

// Add these helper functions right after the imports, before the component
const fetchFeaturedProducts = async () => {
  // First try to fetch featured products
  const featuredQuery = query(collection(db, "products"), where("featured", "==", true), limit(4))
  let productsSnapshot = await getDocs(featuredQuery)

  // If no featured products, fetch the most recent products
  if (productsSnapshot.empty) {
    const recentQuery = query(collection(db, "products"), orderBy("createdAt", "desc"), limit(4))
    productsSnapshot = await getDocs(recentQuery)
  }

  // Fetch images for each product
  const productsData = await Promise.all(
    productsSnapshot.docs.map(async (doc) => {
      const productData = doc.data()
      const imageUrl = await getImage(`${productData.category} ${productData.name}`, {
        orientation: "horizontal",
      })
      return {
        id: doc.id,
        ...productData,
        imageUrl,
      }
    }),
  )

  return productsData
}

const fetchCategories = async () => {
  const categoriesSnapshot = await getDocs(collection(db, "categories"))
  const categoriesData = categoriesSnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }))
  return categoriesData
}

const fetchHeroImages = async () => {
  const [heroImg, showcaseImg] = await Promise.all([
    getImage("gaming setup workspace", { orientation: "horizontal" }),
    getImage("gaming pc build", { orientation: "horizontal" }),
  ])
  return { heroImg, showcaseImg }
}

export default function Home() {
  const [addedToCart, setAddedToCart] = useState(null)
  const { addToCart } = useCart()
  const { currentUser, isGuest } = useAuth()
  const { theme } = useTheme()
  const [heroText, setHeroText] = useState("Your one-stop shop for all your needs. Discover premium products with uncompromising quality.")
  const [heroLoading, setHeroLoading] = useState(true)

  const isDark = theme === "dark"

  // Fetch hero images with caching
  const { data: heroImages, isLoading: heroImagesLoading } = useQuery({
    queryKey: ['heroImages'],
    queryFn: fetchHeroImages,
    staleTime: 60 * 60 * 1000, // 1 hour
    cacheTime: 24 * 60 * 60 * 1000, // 24 hours
  })

  // State for images (keep these for backward compatibility)
  const [heroImage, setHeroImage] = useState("")
  const [showcaseImage, setShowcaseImage] = useState("")

  // Update hero images when data changes
  useEffect(() => {
    if (heroImages) {
      setHeroImage(heroImages.heroImg)
      setShowcaseImage(heroImages.showcaseImg)
    }
  }, [heroImages])

  // Fetch featured products with caching
  const { data: featuredProducts = [], isLoading: productsLoading } = useQuery({
    queryKey: ['featuredProducts'],
    queryFn: fetchFeaturedProducts,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  })

  // Fetch categories with caching
  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  })

  // Fetch hero text
  useEffect(() => {
    const fetchHeroText = async () => {
      try {
        const settingsDoc = await getDoc(doc(db, "settings", "hero"))
        
        if (settingsDoc.exists()) {
          setHeroText(settingsDoc.data().text)
        }
      } catch (error) {
        console.error("Error fetching hero text:", error)
      } finally {
        setHeroLoading(false)
      }
    }

    fetchHeroText()
  }, [])

  // Combine loading states to match the original behavior
  const loading = productsLoading || categoriesLoading || heroImagesLoading

  // Keep the rest of the component exactly the same
  const handleAddToCart = (product) => {
    addToCart(product, 1)
    setAddedToCart(product.id)

    // Reset the "Added to cart" message after 3 seconds
    setTimeout(() => {
      setAddedToCart(null)
    }, 3000)
  }

  // Keep all the animation constants and helper functions
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  // Placeholder image URL helper function to avoid SVG issues
  const getPlaceholderImage = (width, height) => {
    return isDark
      ? `https://via.placeholder.com/${width}x${height}/1a1a1a/ffffff?text=ShopEase`
      : `https://via.placeholder.com/${width}x${height}/f5f5f5/333333?text=ShopEase`
  }

  // Keep the loading UI
  if (heroLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? "bg-black" : "bg-gray-100"}`}>
        <NewtonsCradle
          size="100"
          speed="1.4"
          color={isDark ? "white" : "black"}
        />
      </div>
    )
  }

  // Keep the rest of the component exactly the same
  return (
    <div className={isDark ? "bg-black text-white" : "bg-white text-gray-900"}>
      {/* Hero Section */}
      <section className={`relative ${theme === "dark" ? "bg-black" : "bg-white"} ${
        theme === "dark" ? "border-b-2 border-white" : "border-b-2 border-gray-800"
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-[85vh] relative">
          {/* Animated Divider */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-full w-[4px] hidden md:block overflow-hidden">
            <motion.div
              initial={{ y: "-100%" }}
              animate={{ 
                y: "100%",
              }}
              transition={{ 
                repeat: Infinity,
                duration: 3,
                ease: "linear"
              }}
              className={`absolute top-0 w-full h-full ${theme === "dark" ? "bg-gradient-to-b from-transparent via-white to-transparent" : "bg-gradient-to-b from-transparent via-black to-transparent"}`}
            />
            <div className={`absolute inset-0 ${theme === "dark" ? "bg-gray-800" : "bg-gray-200"} opacity-20`}></div>
          </div>

          {/* Left Content */}
          <div className={`relative flex items-center justify-center p-8 md:p-12 ${theme === "dark" ? "bg-black" : "bg-white"} overflow-hidden`}>
            {/* Decorative Elements */}
            <div className="absolute inset-0">
              {/* Static Decorative Lines */}
              <div className="absolute inset-0 overflow-hidden">
                {/* Generate 30 lines with 3.33% spacing */}
                {Array.from({ length: 1000 }).map((_, index) => (
                  <div
                    key={index}
                    className={`absolute left-0 right-0 h-0.5 ${
                      theme === "dark" 
                        ? "bg-gradient-to-r from-gray-900 via-gray-900 to-black" 
                        : "bg-gradient-to-r from-gray-300 via-gray-300 to-white"
                    }`}
                    style={{ top: `${(index + 1) * 0.8}%` }}
                  ></div>
                ))}
              </div>

              {/* Animated Background Shapes */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.1 }}
                transition={{ duration: 1, delay: 0.5 }}
                className={`absolute top-1/4 left-1/4 w-64 h-64 rounded-full ${theme === "dark" ? "bg-white" : "bg-gray-900"} blur-3xl`}
              />
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 0.1 }}
                transition={{ duration: 1, delay: 0.7 }}
                className={`absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full ${theme === "dark" ? "bg-white" : "bg-gray-900"} blur-3xl`}
              />
            </div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="relative max-w-lg z-20"
            >
              <motion.div variants={fadeIn}>
                {/* Premium Tag */}
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-1 ${theme === "dark" ? "bg-white" : "bg-black"}`}></div>
                  <span className={`text-sm font-medium tracking-widest ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
                    PREMIUM E-COMMERCE
                  </span>
                </div>

                {/* Main Heading */}
                <h1 className={`text-6xl md:text-7xl font-bold mb-6 tracking-tight font-poppins ${theme === "dark" ? "text-white" : "text-black"}`}>
                  <span className={theme === "dark" ? "text-gray-400" : "text-gray-600"}>SHOP</span>
                  <span className={theme === "dark" ? "text-white" : "text-black"}>EASE</span>
                </h1>

                {/* Description */}
                <p className={`text-xl mb-8 ${theme === "dark" ? "text-gray-400" : "text-gray-600"} font-inter leading-relaxed`}>
                  {heroText}
                </p>

                {/* Stats */}
                <div className="flex gap-8 mb-8">
                  <div>
                    <span className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-black"}`}>10K+</span>
                    <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Happy Customers</p>
                  </div>
                  <div>
                    <span className={`text-3xl font-bold ${theme === "dark" ? "text-white" : "text-black"}`}>500+</span>
                    <p className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>Premium Products</p>
                  </div>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    to="/shop"
                    className={`group px-8 py-4 rounded-full inline-flex items-center transition-all duration-300 font-sans font-bold ${
                      theme === "dark" 
                        ? "bg-white text-black hover:bg-gray-200" 
                        : "bg-black text-white hover:bg-gray-800"
                    }`}
                  >
                    Shop Now
                    <ChevronRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <Link
                    to="/shop"
                    className={`group px-8 py-4 rounded-full inline-flex items-center transition-all duration-300 font-sans font-bold border-2 ${
                      theme === "dark" 
                        ? "border-white text-white hover:bg-white hover:text-black" 
                        : "border-black text-black hover:bg-black hover:text-white"
                    }`}
                  >
                    Explore Categories
                    <ChevronRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Image */}
          <div className="relative hidden md:block">
            <div
              className={`absolute inset-0 ${theme === "dark" ? "opacity-90" : "opacity-100"} bg-cover bg-center`}
              style={{ 
                backgroundImage: `url(${heroImage})`,
                maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 20%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 20%, transparent 100%)'
              }}
            ></div>
            <div className={`absolute inset-0 ${theme === "dark" ? "bg-black" : "bg-white"} ${theme === "dark" ? "opacity-20" : "opacity-30"}`}></div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className={`${isDark ? "py-20 bg-gray-900" : "py-20 bg-gray-100"} ${isDark ? "" : "border-b-2 border-gray-800"}`}>
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold mb-2 text-center font-poppins">FEATURED PRODUCTS</h2>
            <div className={`w-24 h-1 ${isDark ? "bg-white" : "bg-gray-900"} mx-auto`}></div>
          </motion.div>

          {featuredProducts.length === 0 ? (
            <p className={`text-center ${isDark ? "text-gray-400" : "text-gray-600"} font-inter`}>
              No products available
            </p>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {featuredProducts.map((product) => (
                <motion.div
                  key={product.id}
                  variants={fadeIn}
                  className={`${isDark ? "bg-black border-gray-800 hover:border-gray-600" : "bg-white border-gray-900 hover:border-gray-400"} border rounded-[12px] overflow-hidden duration-300 group`}
                >
                  <div className="h-48 overflow-hidden">
                    <Link to={`/product/${product.id}`}>
                      <img
                        src={product.imageUrl || getPlaceholderImage(400, 300)}
                        alt={product.name}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                      />
                    </Link>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 tracking-tight font-poppins">{product.name}</h3>
                    <p className={`text-2xl font-bold mb-4 ${isDark ? "text-white" : "text-gray-900"}`}>
                      ${product.price.toFixed(2)}
                    </p>
                    <div className="flex flex-col space-y-3">
                      <Link
                        to={`/product/${product.id}`}
                        className={`w-full bg-transparent ${isDark ? "border-white text-white hover:bg-white hover:text-black" : "border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"} border px-4 py-2 rounded-[12px] transition-colors flex items-center justify-center gap-2 font-inter font-bold`}
                      >
                        View Details
                        <ChevronRight size={16} />
                      </Link>
                      {(currentUser || isGuest) ? (
                        <button
                          onClick={() => handleAddToCart(product)}
                          className={`w-full h-full px-4 py-2 rounded-[12px] transition-colors flex items-center justify-center gap-2 font-inter ${
                            addedToCart === product.id
                              ? "bg-green-600 text-white"
                              : isDark
                                ? "bg-white text-black hover:bg-gray-200"
                                : "bg-gray-900 text-white hover:bg-gray-800"
                          }`}
                          disabled={addedToCart === product.id}
                        >
                          {addedToCart === product.id ? (
                            <>
                              Added to Cart
                              <Check size={16} />
                            </>
                          ) : (
                            <>
                              Add to Cart
                              <ShoppingBag size={16} />
                            </>
                          )}
                        </button>
                      ) : (
                        <Link
                          to="/login"
                          className={`w-full ${isDark ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300"} px-4 py-2 rounded-[12px] transition-colors flex items-center justify-center gap-2 font-inter font-bold`}
                        >
                          Sign in to add to cart
                          <ChevronRight size={16} />
                        </Link>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-center mt-12"
          >
            <Link
              to="/shop"
              className={`group bg-transparent border-2 ${isDark ? "border-white text-white hover:bg-white hover:text-black" : "border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"} px-8 py-3 rounded-[12px] font-bold font-inter inline-flex items-center transition-all duration-300`}
            >
              View All Products
              <ChevronRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className={`${isDark ? "py-10 bg-black" : "py-10 bg-white"} ${isDark ? "" : "border-b-2 border-gray-800"}`}>
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <h2 className="text-3xl font-bold mb-2 text-center font-poppins">SHOP BY CATEGORY</h2>
            <div className={`w-24 h-1 ${isDark ? "bg-white" : "bg-gray-900"} mx-auto`}></div>
          </motion.div>

          {categories.length === 0 ? (
            <p className={`text-center ${isDark ? "text-gray-400" : "text-gray-600"} font-inter`}>
              No categories available
            </p>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="flex flex-wrap justify-center gap-3"
            >
              {categories.map((category) => (
                <motion.div 
                  key={category.id} 
                  variants={fadeIn}
                  whileHover={{ 
                    scale: 1.05,
                    boxShadow: isDark 
                      ? "0 10px 15px -3px rgba(255, 255, 255, 0.1), 0 4px 6px -2px rgba(255, 255, 255, 0.05)"
                      : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)"
                  }}
                >
                  <Link
                    to={`/shop?category=${category.id}`}
                    className={`inline-flex items-center px-5 py-3 m-1 rounded-full shadow-sm transition-all duration-300 mt-12 mb-12 font-inter font-bold ${
                      isDark 
                        ? "bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white border border-gray-700" 
                        : "bg-gradient-to-r from-gray-100 via-white to-gray-100 text-gray-900 border border-gray-800"
                    }`}
                  >
                    <div
                      className={`h-8 w-8 ${
                        isDark 
                          ? "bg-black text-white" 
                          : "bg-white text-gray-900"
                      } rounded-full flex items-center justify-center mr-2 shadow-md border ${isDark ? "border-gray-700" : "border-gray-500"}`}
                    >
                      <Layers className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{category.name}</span>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
 
        </div>
      </section>

      {/* Features */}
      <section
        className={`
          ${isDark ? "py-20 bg-gradient-to-b from-gray-900 to-black" : "py-20 bg-gradient-to-b from-gray-100 to-white"}
          ${isDark ? "" : "border-b-2 border-gray-800"}
        `}
      >
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold mb-2 text-center font-poppins">WHY CHOOSE US</h2>
            <div className={`w-24 h-1 ${isDark ? "bg-white" : "bg-gray-900"} mx-auto`}></div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ">
            <motion.div
              variants={fadeIn}
              className={`${isDark ? "bg-gray-900 border-gray-800 hover:border-gray-600" : "bg-white border-gray-200 hover:border-gray-400"} border p-6 rounded-[12px] transition-colors`}
            >
              <ShoppingBag className={`h-12 w-12 mb-4 ${isDark ? "text-white" : "text-gray-900"}`} />
              <h3 className="text-xl font-bold mb-2 font-poppins">Premium Quality</h3>
              <p className={isDark ? "text-gray-400 font-inter" : "text-gray-600 font-inter"}>
                Handpicked products with exceptional quality and design.
              </p>
            </motion.div>

            <motion.div
              variants={fadeIn}
              className={`${isDark ? "bg-gray-900 border-gray-800 hover:border-gray-600" : "bg-white border-gray-200 hover:border-gray-400"} border p-6 rounded-[12px] transition-colors`}
            >
              <Clock className={`h-12 w-12 mb-4 ${isDark ? "text-white" : "text-gray-900"}`} />
              <h3 className="text-xl font-bold mb-2 font-poppins">Fast Delivery</h3>
              <p className={isDark ? "text-gray-400 font-inter" : "text-gray-600 font-inter"}>
                Get your products delivered quickly and reliably.
              </p>
            </motion.div>

            <motion.div
              variants={fadeIn}
              className={`${isDark ? "bg-gray-900 border-gray-800 hover:border-gray-600" : "bg-white border-gray-200 hover:border-gray-400"} border p-6 rounded-[12px] transition-colors`}
            >
              <Shield className={`h-12 w-12 mb-4 ${isDark ? "text-white" : "text-gray-900"}`} />
              <h3 className="text-xl font-bold mb-2 font-poppins">Secure Payments</h3>
              <p className={isDark ? "text-gray-400 font-inter" : "text-gray-600 font-inter"}>
                Your transactions are protected with top security measures.
              </p>
            </motion.div>

            <motion.div
              variants={fadeIn}
              className={`${isDark ? "bg-gray-900 border-gray-800 hover:border-gray-600" : "bg-white border-gray-200 hover:border-gray-400"} border p-6 rounded-[12px] transition-colors`}
            >
              <Layers className={`h-12 w-12 mb-4 ${isDark ? "text-white" : "text-gray-900"}`} />
              <h3 className="text-xl font-bold mb-2 font-poppins">Easy Returns</h3>
              <p className={isDark ? "text-gray-400 font-inter" : "text-gray-600 font-inter"}>
                Not satisfied? Return your products hassle-free.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className={isDark ? "bg-black text-white py-20" : "bg-white text-gray-900 py-20"}>
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
              <motion.h2 variants={fadeIn} className="text-3xl md:text-4xl font-bold mb-6 font-poppins">
                Subscribe to Our Newsletter
              </motion.h2>
              <motion.p
                variants={fadeIn}
                className={isDark ? "text-gray-400 mb-8 font-inter" : "text-gray-600 mb-8 font-inter"}
              >
                Stay updated with our latest products, promotions, and design inspiration delivered straight to your
                inbox.
              </motion.p>
              <motion.div variants={fadeIn}>
                <form className="flex flex-col md:flex-row items-stretch gap-3 mt-6">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className={`${isDark ? "bg-black border-gray-800 text-white focus:border-white" : "bg-white border-gray-300 text-gray-900 focus:border-gray-900"} border px-4 py-3 rounded-[12px] focus:outline-none flex-grow`}
                  />
                  <button
                    className={`${isDark ? "bg-white text-black hover:bg-gray-200" : "bg-gray-900 text-white hover:bg-gray-800"} px-6 py-3 rounded-[12px] transition-colors inline-flex items-center gap-2 whitespace-nowrap`}
                  >
                    Subscribe
                    <ChevronRight size={16} />
                  </button>
                </form>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}
