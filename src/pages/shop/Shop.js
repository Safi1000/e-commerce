"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useCart } from "../../contexts/CartContext"
import { useAuth } from "../../contexts/AuthContext"
import { getImage } from "../../utils/imageApi"
import { motion } from "framer-motion"
import { Search, Filter, X, Check, ChevronRight, ShoppingBag } from "lucide-react"

export default function Shop() {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [priceRange, setPriceRange] = useState({ min: "", max: "" })
  const [searchTerm, setSearchTerm] = useState("")
  const [addedToCart, setAddedToCart] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { currentUser } = useAuth()

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await Promise.all([fetchCategories(), fetchProducts()])
      setLoading(false)
    }
    fetchData()
  }, [])

  // Handle URL parameters and initial filtering
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const categoryParam = params.get("category")
    const searchParam = params.get("search")
    const minPrice = params.get("minPrice")
    const maxPrice = params.get("maxPrice")

    // Update local state without triggering filters
    setSelectedCategory(categoryParam || "")
    setSearchTerm(searchParam || "")
    setPriceRange({
      min: minPrice || "",
      max: maxPrice || "",
    })

    // Only apply filters if we have products
    if (products.length > 0) {
      let filtered = [...products]

      // Apply category filter
      if (categoryParam) {
        filtered = filtered.filter((product) => product.categoryId === categoryParam)
      }

      // Apply search filter
      if (searchParam) {
        const search = searchParam.toLowerCase()
        filtered = filtered.filter(
          (product) =>
            product.name.toLowerCase().includes(search) ||
            (product.description && product.description.toLowerCase().includes(search)),
        )
      }

      // Apply price filter
      const min = Number.parseFloat(minPrice) || 0
      const max = Number.parseFloat(maxPrice) || Number.POSITIVE_INFINITY
      filtered = filtered.filter((product) => {
        const price = Number.parseFloat(product.price) || 0
        return price >= min && price <= max
      })

      setFilteredProducts(filtered)
    }
  }, [location.search, products])

  const fetchCategories = async () => {
    try {
      const categoriesSnapshot = await getDocs(collection(db, "categories"))
      const categoriesList = categoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setCategories(categoriesList)
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchProducts = async () => {
    try {
      const productsSnapshot = await getDocs(collection(db, "products"))
      const productsList = await Promise.all(
        productsSnapshot.docs.map(async (doc) => {
          const productData = doc.data()
          const imageUrl = await getImage(`${productData.category} ${productData.name}`, { orientation: "horizontal" })
          return {
            id: doc.id,
            ...productData,
            imageUrl,
          }
        }),
      )
      setProducts(productsList)
      setFilteredProducts(productsList)
    } catch (error) {
      console.error("Error fetching products:", error)
    }
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    const params = new URLSearchParams(location.search)

    // Update search parameter
    if (searchTerm.trim()) {
      params.set("search", searchTerm.trim())
    } else {
      params.delete("search")
    }

    // Preserve other parameters
    if (selectedCategory) params.set("category", selectedCategory)
    if (priceRange.min) params.set("minPrice", priceRange.min)
    if (priceRange.max) params.set("maxPrice", priceRange.max)

    // Update URL and trigger filter through URL effect
    navigate(
      {
        pathname: "/shop",
        search: params.toString(),
      },
      { replace: true },
    )
  }

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value) // Only update input value
  }

  const handleCategoryChange = (e) => {
    const category = e.target.value
    const params = new URLSearchParams(location.search)

    if (category) {
      params.set("category", category)
    } else {
      params.delete("category")
    }

    // Preserve other parameters
    if (searchTerm.trim()) params.set("search", searchTerm.trim())
    if (priceRange.min) params.set("minPrice", priceRange.min)
    if (priceRange.max) params.set("maxPrice", priceRange.max)

    navigate(
      {
        pathname: "/shop",
        search: params.toString(),
      },
      { replace: true },
    )
  }

  const handlePriceChange = (e) => {
    const { name, value } = e.target
    const newRange = { ...priceRange, [name]: value }
    setPriceRange(newRange)

    const params = new URLSearchParams(location.search)

    // Update price parameters
    if (value) {
      params.set(name === "min" ? "minPrice" : "maxPrice", value)
    } else {
      params.delete(name === "min" ? "minPrice" : "maxPrice")
    }

    // Preserve other parameters
    if (selectedCategory) params.set("category", selectedCategory)
    if (searchTerm.trim()) params.set("search", searchTerm.trim())
    if (name === "min" && priceRange.max) params.set("maxPrice", priceRange.max)
    if (name === "max" && priceRange.min) params.set("minPrice", priceRange.min)

    navigate(
      {
        pathname: "/shop",
        search: params.toString(),
      },
      { replace: true },
    )
  }

  const clearFilters = () => {
    setSelectedCategory("")
    setSearchTerm("")
    setPriceRange({ min: "", max: "" })
    navigate("/shop", { replace: true })
  }

  // Handle add to cart
  const handleAddToCart = (product) => {
    addToCart(product, 1)
    setAddedToCart(product.id)

    // Reset the "Added to cart" message after 3 seconds
    setTimeout(() => {
      setAddedToCart(null)
    }, 3000)
  }

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
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

  // Placeholder image URL helper function
  const getPlaceholderImage = (width, height) => {
    return `https://via.placeholder.com/${width}x${height}/1a1a1a/ffffff?text=ShopEase`
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
  <h1 className="text-4xl font-bold mb-2 tracking-tight font-poppins">SHOP</h1>
  <div className="h-1 bg-white w-full"></div>
</div>

        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="w-full bg-gray-900 border border-gray-800 text-white py-3 px-4 rounded-sm flex items-center justify-center gap-2"
            >
              {showFilters ? (
                <>
                  <X size={18} />
                  Hide Filters
                </>
              ) : (
                <>
                  <Filter size={18} />
                  Show Filters
                </>
              )}
            </button>
          </div>

          {/* Sidebar Filters */}
          <motion.div
            className={`w-full lg:w-72 ${showFilters ? "block" : "hidden lg:block"}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="bg-gray-900 border border-gray-800 rounded-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 font-poppins">SEARCH</h2>
              <form onSubmit={handleSearchSubmit} className="space-y-2">
                <div className="hidden md:flex items-center flex-1 max-w-md ">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full px-4 py-2 bg-black border border-gray-700 rounded-sm focus:outline-none focus:border-white transition-all text-white"
                  />
                  <button
                    type="submit"
                    className="bg-white text-black px-4 py-2 rounded-sm hover:bg-gray-200 transition-colors "
                  >
                    <Search size={18} />
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 font-poppins">CATEGORIES</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="all-categories"
                    name="category"
                    value=""
                    checked={selectedCategory === ""}
                    onChange={handleCategoryChange}
                    className="h-4 w-4 text-white focus:ring-white border-gray-700 bg-black"
                  />
                  <label htmlFor="all-categories" className="ml-2 text-gray-300 font-inter">
                    All Categories
                  </label>
                </div>

                {categories.map((category) => (
                  <div key={category.id} className="flex items-center">
                    <input
                      type="radio"
                      id={`category-${category.id}`}
                      name="category"
                      value={category.id}
                      checked={selectedCategory === category.id}
                      onChange={handleCategoryChange}
                      className="h-4 w-4 text-white focus:ring-white border-gray-700 bg-black"
                    />
                    <label htmlFor={`category-${category.id}`} className="ml-2 text-gray-300 font-inter">
                      {category.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-sm p-6 mb-6">
              <h2 className="text-xl font-bold mb-4 font-poppins">PRICE RANGE</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="min" className="block text-sm text-gray-300 mb-1 font-inter">
                    Min Price
                  </label>
                  <input
                    type="number"
                    id="min"
                    name="min"
                    min="0"
                    value={priceRange.min}
                    onChange={handlePriceChange}
                    className="block w-full bg-black border border-gray-700 rounded-sm py-2 px-3 focus:outline-none focus:border-white text-white"
                  />
                </div>

                <div>
                  <label htmlFor="max" className="block text-sm text-gray-300 mb-1 font-inter">
                    Max Price
                  </label>
                  <input
                    type="number"
                    id="max"
                    name="max"
                    min="0"
                    value={priceRange.max}
                    onChange={handlePriceChange}
                    className="block w-full bg-black border border-gray-700 rounded-sm py-2 px-3 focus:outline-none focus:border-white text-white"
                  />
                </div>

                <button
                  onClick={clearFilters}
                  className="w-full bg-transparent border border-white text-white py-2 px-4 rounded-sm hover:bg-white hover:text-black transition-colors font-inter"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </motion.div>

          {/* Product Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="bg-gray-900 border border-gray-800 rounded-sm p-8 text-center"
              >
                <div className="h-20 w-20 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2 font-poppins">NO PRODUCTS FOUND</h3>
                <p className="text-gray-400 mb-6 font-inter">Try changing your filters or search term.</p>
                <button
                  onClick={clearFilters}
                  className="bg-white text-black py-2 px-6 rounded-sm hover:bg-gray-200 transition-colors font-inter"
                >
                  Clear Filters
                </button>
              </motion.div>
            ) : (
              <motion.div
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    variants={fadeIn}
                    className="bg-gray-900 border border-gray-800 rounded-sm overflow-hidden hover:border-gray-600 transition-all duration-300 group"
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
                      <p className="text-2xl font-bold mb-4 text-white">${product.price}</p>
                      <div className="flex flex-col space-y-3">
                        <Link
                          to={`/product/${product.id}`}
                          className="w-full bg-transparent border border-white text-white px-4 py-2 rounded-sm hover:bg-white hover:text-black transition-colors flex items-center justify-center gap-2 font-inter"
                        >
                          View Details
                          <ChevronRight size={16} />
                        </Link>
                        {currentUser ? (
                          <button
                            onClick={() => handleAddToCart(product)}
                            className={`w-full px-4 py-2 rounded-sm transition-colors flex items-center justify-center gap-2 font-inter ${
                              addedToCart === product.id
                                ? "bg-green-600 text-white"
                                : "bg-white text-black hover:bg-gray-200"
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
                            className="w-full bg-gray-800 text-gray-300 px-4 py-2 rounded-sm hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 font-inter"
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
          </div>
        </div>
      </div>
    </div>
  )
}

