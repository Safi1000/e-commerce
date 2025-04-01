"use client"

import { useState, useEffect } from "react"
import { useParams, Link, useNavigate } from "react-router-dom"
import { doc, getDoc } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useAuth } from "../../contexts/AuthContext"
import { useCart } from "../../contexts/CartContext"
import { getImage } from "../../utils/imageApi"
import { motion } from "framer-motion"
import { ShoppingCart, ShoppingBag, ChevronLeft, Check, AlertTriangle, Plus, Minus } from "lucide-react"

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { addToCart } = useCart()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)
  const [relatedImages, setRelatedImages] = useState([])
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    const fetchProduct = async () => {
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

          setRelatedImages([imageUrl, ...additionalImages])
          setProduct({
            id: docSnap.id,
            ...productData,
            imageUrl,
          })
        } else {
          console.error("Product not found")
        }
      } catch (error) {
        console.error("Error fetching product:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

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
          <div className="flex justify-center items-center h-64">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
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
            className="bg-gray-900 border border-gray-800 rounded-sm p-12 text-center max-w-2xl mx-auto"
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
              className="bg-white text-black py-3 px-8 rounded-sm hover:bg-gray-200 inline-flex items-center gap-2 transition-colors font-inter"
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
    <div className="bg-gray-900 border border-gray-800 rounded-sm overflow-hidden relative">
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
            className={`h-20 bg-gray-900 border cursor-pointer overflow-hidden ${activeImage === index ? "border-white" : "border-gray-800"}`}
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
            <div className="bg-gray-900 border border-gray-800 rounded-sm p-8">
              <h2 className="text-3xl font-bold mb-4 font-poppins">{product.name}</h2>
              <div className="text-3xl font-bold text-white mb-6">${product.price?.toFixed(2) || "0.00"}</div>

              <div className="border-t border-gray-800 my-6 pt-6">
                <p className="text-gray-300 mb-6 font-inter leading-relaxed">
                  {product.description || "No description available for this product."}
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

              {currentUser && (
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-3 font-poppins">QUANTITY</h3>
                  <div className="flex items-center">
                  <button
  onClick={decrementQuantity}
  className="bg-black text-white p-2 rounded-sm border-t border-b border-gray-700 hover:bg-gray-800 transition-colors h-12"
>
  <Minus size={16} />
</button>

<input
  type="number"
  id="quantity"
  min="1"
  value={quantity}
  onChange={handleQuantityChange}
  className="w-16 text-center border-t border-b border-gray-700 py-2 bg-black text-white focus:outline-none h-12"
  // The input field remains the same with the border applied
/>

<button
  onClick={incrementQuantity}
  className="bg-black text-white p-2 rounded-sm border-t border-b border-gray-700 hover:bg-gray-800 transition-colors h-12"
>
  <Plus size={16} />
</button>


                  </div>
                </div>
              )}

              <div className="space-y-4">
                {currentUser ? (
                  <>
                    <button
                      onClick={handleAddToCart}
                      className={`w-full px-6 py-3 rounded-sm transition-colors flex items-center justify-center gap-2 font-inter ${
                        addedToCart ? "bg-green-600 text-white" : "bg-white text-black hover:bg-gray-200"
                      }`}
                      disabled={addedToCart}
                    >
                      {addedToCart ? (
                        <>
                          Added to Cart
                          <Check size={18} />
                        </>
                      ) : (
                        <>
                          Add to Cart
                          <ShoppingCart size={18} />
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleBuyNow}
                      className="w-full bg-transparent border border-white text-white px-6 py-3 rounded-sm hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2 font-inter"
                    >
                      Buy Now
                      <ShoppingBag size={18} />
                    </button>
                  </>
                ) : (
                  <Link
                    to="/login"
                    className="w-full bg-gray-800 text-gray-300 px-6 py-3 rounded-sm hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 font-inter"
                  >
                    Sign in to add to cart
                    <ChevronLeft size={18} className="rotate-180" />
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

