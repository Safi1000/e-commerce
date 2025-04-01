"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { collection, getDocs, query, limit, orderBy, where } from "firebase/firestore"
import { db } from "../firebase/config"
import { useCart } from "../contexts/CartContext"
import { useAuth } from "../contexts/AuthContext"
import { motion } from "framer-motion"
import { ShoppingBag, Clock, Shield, Layers, ChevronRight, Check } from "lucide-react"
import { getImage } from "../utils/imageApi"

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [addedToCart, setAddedToCart] = useState(null)
  const [heroImage, setHeroImage] = useState("")
  const [showcaseImage, setShowcaseImage] = useState("")
  const { addToCart } = useCart()
  const { currentUser } = useAuth()

  useEffect(() => {
    const fetchImages = async () => {
      try {
        const [heroImg, showcaseImg] = await Promise.all([
          getImage('gaming setup workspace', { orientation: 'horizontal' }),
          getImage('gaming pc build', { orientation: 'horizontal' })
        ]);
        setHeroImage(heroImg);
        setShowcaseImage(showcaseImg);
      } catch (error) {
        console.error('Error fetching hero images:', error);
      }
    };

    fetchImages();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
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
            const productData = doc.data();
            const imageUrl = await getImage(
              `${productData.category} ${productData.name}`,
              { orientation: 'horizontal' }
            );
            return {
              id: doc.id,
              ...productData,
              imageUrl
            };
          })
        );

        setFeaturedProducts(productsData)

        // Fetch categories
        const categoriesSnapshot = await getDocs(collection(db, "categories"))
        const categoriesData = categoriesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setCategories(categoriesData)
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAddToCart = (product) => {
    addToCart(product, 1)
    setAddedToCart(product.id)

    // Reset the "Added to cart" message after 3 seconds
    setTimeout(() => {
      setAddedToCart(null)
    }, 3000)
  }

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
    return `https://via.placeholder.com/${width}x${height}/1a1a1a/ffffff?text=ShopEase`
  }

  return (
    <div className="bg-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-black to-gray-900">
        <div
          className="absolute inset-0 opacity-20 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        ></div>
        <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
          >
            <motion.div variants={fadeIn}>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 tracking-tight font-poppins">
                <span className="text-gray-400">SHOP</span>
                <span className="text-white">EASE</span>
              </h1>
              <p className="text-xl mb-8 text-gray-300 max-w-lg font-inter">
                Your one-stop shop for all your needs. Discover premium products with uncompromising quality.
              </p>
              <Link
                to="/shop"
                className="group bg-white text-black px-8 py-4 rounded-sm hover:bg-gray-200 inline-flex items-center transition-all duration-300 font-sans font-bold"
              >
                Shop Now
                <ChevronRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            <motion.div variants={fadeIn} className="flex justify-center">
              <div className="bg-gray-800 rounded-sm p-2 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
              
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gray-900">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
      
            className="mb-12"
          >
            <h2 className="text-3xl font-bold mb-2 text-center font-poppins">FEATURED PRODUCTS</h2>
            <div className="w-24 h-1 bg-white mx-auto"></div>
          </motion.div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
            </div>
          ) : featuredProducts.length === 0 ? (
            <p className="text-center text-gray-400 font-inter">No products available</p>
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
                  className="bg-black border border-gray-800 rounded-sm overflow-hidden hover:border-gray-600 duration-300 group w-150"
                >
                 
                 <div className="rounded-lg overflow-hidden shadow-lg flex flex-col duration-300 hover:shadow-xl border border-gray-100 group">
  {/* Product Image */}
  <div className="h-48 overflow-hidden bg-gray-200 relative">
    {product.imageUrl ? (
      <img 
        src={product.imageUrl} 
        alt={product.name} 
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
      />
    ) : (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <span className="text-gray-400 text-sm">No image available</span>
      </div>
    )}
  </div>


      
      {/* Product Info */}
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-lg font-bold mb-2 tracking-tight truncate">
          {product.name}
        </h3>
        <p className="text-gray-400 mb-4 line-clamp-2 text-xs min-h-[40px]">
          {product.description || "No description available"}
        </p>
        
        <div className="mt-auto pt-4 border-t border-gray-100">
          <div className="flex justify-between items-center">
            <span className="text-lg font-bold">
              ${product.price?.toFixed(2) || "0.00"}
            </span>
            
            <div className="flex gap-2">
              <Link
                to={`/product/${product.id}`}
                className="
                  bg-transparent border border-white text-white 
                  px-4 py-2 rounded-md text-xs shadow-md 
                  hover:scale-105  duration-300
                  flex items-center justify-center min-w-[80px]
                "
              >
                Details
              </Link>
              
              {currentUser ? (
                <button
                  onClick={() => handleAddToCart(product)}
                  className={`
                    px-4 py-2 rounded-md text-xs shadow-md transition-all duration-300 
                    hover:scale-105 min-w-[100px] flex items-center justify-center
                    ${addedToCart === product.id 
                      ? "bg-green-600 text-white" 
                      : "bg-white text-black hover:bg-gray-200"}
                  `}
                  disabled={addedToCart === product.id}
                >
                  {addedToCart === product.id ? (
                    <span className="flex items-center">
                      <Check className="h-3 w-3 mr-1" />
                      Added
                    </span>
                  ) : (
                    "Add to Cart"
                  )}
                </button>
              ) : (
                <Link
                  to="/login"
                  className="
                    bg-transparent border border-white text-white 
                    px-4 py-2 text-xs font-medium rounded-md shadow-md 
                    hover:scale-105 transition-transform duration-300
                    flex items-center justify-center min-w-[140px]
                  "
                >
                  Sign in to add
                </Link>
              )}
            </div>
          </div>
        </div>
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
              className="group bg-transparent border-2 border-white text-white px-8 py-3 rounded-sm font-medium hover:bg-white hover:text-black inline-flex items-center transition-all duration-300"
            >
              View All Products
              <ChevronRight className="ml-2 h-5 w-5 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold mb-2 text-center font-poppins">SHOP BY CATEGORY</h2>
            <div className="w-24 h-1 bg-white mx-auto"></div>
          </motion.div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
            </div>
          ) : categories.length === 0 ? (
            <p className="text-center text-gray-400 font-inter">No categories available</p>
          ) : (
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="
              grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 
              gap-10 sm:gap-12 md:gap-14 lg:gap-16 
              w-full max-w-screen-xl mx-auto
            "
            
            >
              {categories.map((category) => (
                <motion.div key={category.id} variants={fadeIn}>
                  <Link
                    to={`/shop?category=${category.id}`}
                    className="bg-gray-900 border border-gray-800 rounded-sm p-8 text-center block hover:border-gray-600 transition-all duration-300 group"
                  >
                    <div className="h-16 w-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                      <Layers className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 tracking-tight font-poppins">{category.name}</h3>
                    <p className="text-gray-400 text-sm font-inter">{category.description || "Browse products"}</p>
                    <div className="mt-4 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                      <span className="text-sm">Explore</span>
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gradient-to-b from-gray-900 to-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <h2 className="text-3xl font-bold mb-2 text-center font-poppins">WHY CHOOSE US</h2>
            <div className="w-24 h-1 bg-white mx-auto"></div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div
              variants={fadeIn}
              className="bg-black border border-gray-800 rounded-sm p-8 text-center hover:border-gray-600 transition-all duration-300 group"
            >
              <div className="h-20 w-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 tracking-tight font-poppins">FAST DELIVERY</h3>
              <p className="text-gray-400 font-inter">
                Get your orders delivered quickly to your doorstep with our premium shipping service.
              </p>
            </motion.div>

            <motion.div
              variants={fadeIn}
              className="bg-black border border-gray-800 rounded-sm p-8 text-center hover:border-gray-600 transition-all duration-300 group"
            >
              <div className="h-20 w-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 tracking-tight font-poppins">SECURE PAYMENTS</h3>
              <p className="text-gray-400 font-inter">
                All transactions are processed securely with military-grade encryption for your peace of mind.
              </p>
            </motion.div>

            <motion.div
              variants={fadeIn}
              className="bg-black border border-gray-800 rounded-sm p-8 text-center hover:border-gray-600 transition-all duration-300 group"
            >
              <div className="h-20 w-20 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                <ShoppingBag className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-3 tracking-tight font-poppins">WIDE SELECTION</h3>
              <p className="text-gray-400 font-inter">
                Browse through thousands of premium products across multiple categories.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

