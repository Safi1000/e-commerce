"use client"

import { useState, useEffect } from "react"
import { useParams, Link, useNavigate, useLocation } from "react-router-dom"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useAuth } from "../../contexts/AuthContext"
import { useCart } from "../../contexts/CartContext"
import { getImage } from "../../utils/imageApi"
import { motion } from "framer-motion"
import { ShoppingCart, ShoppingBag, ChevronLeft, Check, AlertTriangle, Plus, Minus } from "lucide-react"
import { NewtonsCradle } from 'ldrs/react'
import 'ldrs/react/NewtonsCradle.css'
import { useQuery } from "@tanstack/react-query"

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { currentUser, isGuest } = useAuth()
  const { addToCart } = useCart()
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const [relatedImages, setRelatedImages] = useState([])
  const [activeImage, setActiveImage] = useState(0)

  // Fetch product data with React Query
  const { data: product, isLoading: loading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      window.scrollTo(0, 0) // Scroll to top when loading
      try {
        const docRef = doc(db, "products", id)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const productData = docSnap.data()

          // Get main product image
          const imageUrl = await getImage(`${productData.category} ${productData.name}`, { orientation: "horizontal" })

          // Get additional related images
          const additionalImages = []
          for (let i = 0; i < 3; i++) {
            const relatedImage = await getImage(`${productData.category} ${productData.name} ${i + 1}`, {
              orientation: "horizontal",
            })
            additionalImages.push(relatedImage)
          }

          // Update related images state
          setRelatedImages([imageUrl, ...additionalImages])
          
          return {
            id: docSnap.id,
            ...productData,
            imageUrl,
          }
        } else {
          console.error("Product not found")
          return null
        }
      } catch (error) {
        console.error("Error fetching product:", error)
        return null
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  })

  const handleQuantityChange = (e) => {
    const value = e.target.value;
  
    // Allow for backspacing and empty input
    if (value === "" || /^\d+$/.test(value)) {
      setQuantity(value === "" ? "" : Number(value));  // Allow empty input for backspacing
    }
  };
  
  const incrementQuantity = () => {
    setQuantity((prev) => prev + 1)
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1)
    }
  }

  const handleAddToCart = () => {
    addToCart(product, quantity)
    setAddedToCart(true)

    // Reset the "Added to cart" message after 3 seconds
    setTimeout(() => {
      setAddedToCart(false)
    }, 3000)
  }

  const handleBuyNow = () => {
    addToCart(product, quantity)
    navigate("/checkout")
  }

  const setMainImage = (index) => {
    setActiveImage(index)
  }

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  }

  if (loading) {
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

  if (!product) {
    return (
      <div className="bg-black text-white min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-900 border border-gray-800 rounded-[12px] p-12 text-center max-w-2xl mx-auto"
          >
            <div className="h-24 w-24 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 font-poppins">PRODUCT NOT FOUND</h3>
            <p className="text-gray-400 mb-8 font-inter">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Link
              to="/shop"
              className="bg-white text-black py-3 px-8 rounded-[12px] hover:bg-gray-200 inline-flex items-center gap-2 transition-colors font-inter"
            >
              Back to Shop
              <ChevronLeft size={18} />
            </Link>
          </motion.div>
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
          className="mb-8"
        >
          <Link
            to="/shop"
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 font-inter mb-4"
          >
            <ChevronLeft size={18} />
            Back to Shop
          </Link>
          <div className="w-fit">
            <h1 className="text-4xl font-bold mb-2 tracking-tight font-poppins">PRODUCT DETAILS</h1>
            <div className="h-1 bg-white w-full"></div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }}>
            <div className="bg-gray-900 border border-gray-800 rounded-[12px] overflow-hidden relative">
              <img
                src={relatedImages[activeImage] || product.imageUrl}
                alt={product.name}
                className="w-full h-96 object-cover"
              />
              
              {/* Left Arrow */}
              <button
                onClick={() => setActiveImage((prev) => (prev === 0 ? relatedImages.length - 1 : prev - 1))}
                className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft size={24} className="text-white" />
              </button>

              {/* Right Arrow */}
              <button
                onClick={() => setActiveImage((prev) => (prev === relatedImages.length - 1 ? 0 : prev + 1))}
                className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black bg-opacity-50 p-2 rounded-full hover:bg-gray-800 transition-colors"
              >
                <ChevronLeft size={24} className="text-white rotate-180" />
              </button>
            </div>

            {relatedImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2 mt-4">
                {relatedImages.map((img, index) => (
                  <div
                    key={index}
                    className={`h-20 bg-gray-900 border cursor-pointer overflow-hidden rounded-[12px] ${activeImage === index ? "border-white" : "border-gray-800"}`}
                    onClick={() => setMainImage(index)}
                  >
                    <img
                      src={img || "/placeholder.svg"}
                      alt={`${product.name} view ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="bg-gray-900 border border-gray-800 rounded-[12px] p-8">
              <h2 className="text-3xl font-bold mb-4 font-poppins">{product.name}</h2>
              <div className="text-3xl font-bold text-white mb-6">${product.price?.toFixed(2) || "0.00"}</div>

              <div className="border-t border-gray-800 my-6 pt-6">
                <p className="text-gray-300 mb-6 font-inter leading-relaxed">
                  {product.description }
                </p>
              </div>

              {product.features && (
                <div className="mb-6">
                  <h3 className="text-xl font-bold mb-3 font-poppins">FEATURES</h3>
                  <ul className="list-disc pl-5 text-gray-300 font-inter space-y-1">
                    {product.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>
                </div>
              )}

              {currentUser || isGuest ? (
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-3 font-poppins">QUANTITY</h3>
                  <div className="flex items-center">
                    <button
                      onClick={decrementQuantity}
                      className="bg-black text-white p-2 rounded-l-lg border-t border-b border-l border-gray-700 hover:bg-gray-800 transition-colors h-12"
                    >
                      <Minus size={20} />
                    </button>
                    <input
                      type="text"
                      value={quantity}
                      onChange={handleQuantityChange}
                      className="h-12 w-16 bg-black text-white text-center border-t border-b border-gray-700 focus:outline-none"
                    />
                    <button
                      onClick={incrementQuantity}
                      className="bg-black text-white p-2 rounded-r-lg border-t border-b border-r border-gray-700 hover:bg-gray-800 transition-colors h-12"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-8">
           
                </div>
              )}

              <div className="space-y-4">
                {currentUser || isGuest ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={handleAddToCart}
                      className={`w-full py-2 rounded-[12px] transition-colors flex items-center justify-center font-inter gap-2 bg-green-600 text-white${
                        addedToCart
                          ? "w-full py-2 rounded-[12px] transition-colors flex items-center justify-center gap-2 bg-green-600 text-white font-inter "
                          : "font-inter bg-white text-black hover:bg-gray-200"
                      }`}
                    >
                      {addedToCart ? <Check size={20} /> : <ShoppingCart size={20} />}
                      {addedToCart ? "Added to Cart" : "Add to Cart"}
                    </button>
                   
                    <button
                      onClick={handleBuyNow}
                      className=" w-full bg-transparent border border-white text-white px-4 py-2 rounded-[12px] hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2 font-inter"
                    >
                      <ShoppingBag size={20} />
                      Buy Now
                    </button>
                  </div>
                ) : (
                  <Link
                    to={`/login?redirect=${encodeURIComponent(location.pathname)}`}
                    className="inline-block bg-white text-black py-3 px-6 rounded-[12px] hover:bg-gray-200 transition-colors text-center w-full font-inter font-bold"
                  >
                    Sign in to Buy
                  </Link>
                )}
              </div>

              {product.category && (
                <div className="mt-8 pt-6 border-t border-gray-800">
                  <div className="flex items-center text-gray-400 font-inter">
                    <span className="mr-2">Category:</span>
                    <Link
                      to={`/shop?category=${product.categoryId}`}
                      className="text-white hover:text-gray-300 transition-colors"
                    >
                      {product.category}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

