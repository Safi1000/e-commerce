"use client"

import { useState, useEffect } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../../firebase/config"
import { useCart } from "../../contexts/CartContext"
import { useAuth } from "../../contexts/AuthContext"
import { useTheme } from "../../contexts/ThemeContext"
import { getImage } from "../../utils/imageApi"
import { motion } from "framer-motion"
import { Search, Filter, X, Check, ChevronRight, ShoppingBag } from "lucide-react"
import { Slider } from "@mui/material"
import { NewtonsCradle } from "ldrs/react"
import "ldrs/react/NewtonsCradle.css"

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
  const { theme } = useTheme()
  const location = useLocation()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { currentUser } = useAuth()

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      window.scrollTo(0, 0) // Scroll to top when loading
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
    const value = e.target.value
    setSearchTerm(value)

    // Update URL in real-time as user types
    const params = new URLSearchParams(location.search)

    if (value.trim()) {
      params.set("search", value.trim())
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
    return theme === "dark"
      ? `https://via.placeholder.com/${width}x${height}/1a1a1a/ffffff?text=ShopEase`
      : `https://via.placeholder.com/${width}x${height}/f0f0f0/333333?text=ShopEase`
  }

  const handleSliderChange = (event, newValue) => {
    setPriceRange({ min: newValue[0], max: newValue[1] })
    const params = new URLSearchParams(location.search)
    params.set("minPrice", newValue[0])
    params.set("maxPrice", newValue[1])
    if (selectedCategory) params.set("category", selectedCategory)
    if (searchTerm.trim()) params.set("search", searchTerm.trim())
    navigate({ pathname: "/shop", search: params.toString() }, { replace: true })
  }

  // Theme-based styles
  const styles = {
    background: theme === "dark" ? "bg-black" : "bg-white",
    text: theme === "dark" ? "text-white" : "text-gray-900",
    subtext: theme === "dark" ? "text-gray-400" : "text-gray-600",
    card: `${theme === "dark" ? "bg-gray-900" : "bg-white"} border-[1px]  ${theme === "dark" ? "border-gray-800" : "border-gray-900"}`,
    cardHover: theme === "dark" ? "hover:border-gray-600" : "hover:border-gray-400",
    input:
      theme === "dark"
        ? "bg-black border-gray-800 focus:border-gray-600"
        : "bg-white border-gray-300 focus:border-gray-400",
    button: theme === "dark" ? "bg-white text-black hover:bg-gray-200" : "bg-gray-900 text-white hover:bg-gray-800",
    buttonOutline:
      theme === "dark"
        ? "border-white text-white hover:bg-white hover:text-black"
        : "border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white",
    divider: theme === "dark" ? "bg-white" : "bg-gray-900",
    checkboxActive: theme === "dark" ? "border-white bg-white text-black" : "border-gray-900 bg-gray-900 text-white",
    checkboxInactive: theme === "dark" ? "border-gray-600" : "border-gray-400",
    radioTextActive: theme === "dark" ? "text-white" : "text-gray-900",
    radioTextInactive: theme === "dark" ? "text-gray-400" : "text-gray-600",
    loadingColor: theme === "dark" ? "white" : "black",
    noResultsIcon: theme === "dark" ? "bg-black text-gray-400" : "bg-gray-100 text-gray-600",
    sliderColor: theme === "dark" ? "white" : "black",
    sliderRail: theme === "dark" ? "#8D8D8D" : "#D1D1D1",
    mobileFilterButton: theme === "dark" ? "bg-gray-900 border-gray-800" : "bg-white border-gray-300",
    addedToCartButton:
      theme === "dark" ? "bg-green-900 text-white border-green-500" : "bg-green-100 text-green-800 border-green-300",
    signInButton:
      theme === "dark" ? "bg-gray-800 text-gray-300 hover:bg-gray-700" : "bg-gray-200 text-gray-700 hover:bg-gray-300",
  }

  return (
    <div className={`${styles.background} ${styles.text} min-h-screen`}>
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <div className="w-fit">
            <h1 className="text-4xl font-bold mb-2 tracking-tight font-poppins">SHOP</h1>
            <div className={`h-1 ${styles.divider} w-full`}></div>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-full ${styles.mobileFilterButton} py-3 px-4 rounded-[12px] flex items-center justify-center gap-2`}
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
            <div className={`${styles.card} ${styles.cardHover} rounded-[12px] p-6 sticky top-20 transition-colors`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`text-lg font-bold ${styles.text} font-poppins`}>FILTERS</h3>
                {(selectedCategory || searchTerm || priceRange.min || priceRange.max) && (
                  <button
                    onClick={clearFilters}
                    className={`text-xs ${styles.subtext} hover:${styles.text} transition-colors flex items-center gap-1`}
                  >
                    Clear All
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="space-y-8">
                {/* Real-time search input */}
                <div>
                  <h4 className={`text-sm font-semibold ${styles.subtext} mb-3 font-poppins`}>SEARCH PRODUCTS</h4>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      placeholder="Search..."
                      className={`${styles.input} w-full py-2 px-3 pr-10 rounded-[12px] ${styles.text} text-sm focus:outline-none`}
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <Search size={16} className={styles.subtext} />
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className={`text-sm font-semibold ${styles.subtext} mb-3 font-poppins`}>CATEGORIES</h4>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="all-categories"
                        name="category"
                        value=""
                        checked={selectedCategory === ""}
                        onChange={handleCategoryChange}
                        className="hidden"
                      />
                      <label
                        htmlFor="all-categories"
                        className={`flex items-center cursor-pointer text-sm ${
                          selectedCategory === "" ? styles.radioTextActive : styles.radioTextInactive
                        }`}
                      >
                        <span
                          className={`w-4 h-4 mr-2 border flex items-center justify-center rounded-md ${
                            selectedCategory === "" ? styles.checkboxActive : styles.checkboxInactive
                          }`}
                        >
                          {selectedCategory === "" && <Check size={12} />}
                        </span>
                        All Categories
                      </label>
                    </div>

                    {categories.map((category) => (
                      <div key={category.id} className="flex items-center">
                        <input
                          type="radio"
                          id={category.id}
                          name="category"
                          value={category.id}
                          checked={selectedCategory === category.id}
                          onChange={handleCategoryChange}
                          className="hidden"
                        />
                        <label
                          htmlFor={category.id}
                          className={`flex items-center cursor-pointer text-sm ${
                            selectedCategory === category.id ? styles.radioTextActive : styles.radioTextInactive
                          }`}
                        >
                          <span
                            className={`w-4 h-4 mr-2 border flex items-center justify-center rounded-md ${
                              selectedCategory === category.id ? styles.checkboxActive : styles.checkboxInactive
                            }`}
                          >
                            {selectedCategory === category.id && <Check size={12} />}
                          </span>
                          {category.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className={`text-sm font-semibold ${styles.subtext} mb-3 font-poppins`}>PRICE RANGE</h4>
                  <div>
                    <Slider
                      value={[Number.parseFloat(priceRange.min) || 0, Number.parseFloat(priceRange.max) || 10000]}
                      onChange={handleSliderChange}
                      valueLabelDisplay="auto"
                      min={0}
                      max={10000}
                      sx={{
                        color: styles.sliderColor,
                        "& .MuiSlider-thumb": {
                          height: 16,
                          width: 16,
                          backgroundColor: styles.sliderColor,
                        },
                        "& .MuiSlider-track": {
                          height: 2,
                        },
                        "& .MuiSlider-rail": {
                          color: styles.sliderRail,
                          height: 2,
                        },
                      }}
                    />
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label htmlFor="min" className={`block text-xs ${styles.subtext} mb-1`}>
                          Min Price
                        </label>
                        <input
                          type="number"
                          id="min"
                          name="min"
                          value={priceRange.min}
                          onChange={handlePriceChange}
                          className={`${styles.input} w-full py-2 px-3 rounded-[12px] ${styles.text} text-sm focus:outline-none`}
                          placeholder="$0"
                        />
                      </div>
                      <div>
                        <label htmlFor="max" className={`block text-xs ${styles.subtext} mb-1`}>
                          Max Price
                        </label>
                        <input
                          type="number"
                          id="max"
                          name="max"
                          value={priceRange.max}
                          onChange={handlePriceChange}
                          className={`${styles.input} w-full py-2 px-3 rounded-[12px] ${styles.text} text-sm focus:outline-none`}
                          placeholder="$10000"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Product Grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex justify-center items-center min-h-[60vh]">
                <NewtonsCradle size="78" speed="1.4" color={styles.loadingColor} />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className={`${styles.card} ${styles.cardHover} rounded-[12px] p-12 text-center transition-colors`}>
                <div
                  className={`h-24 w-24 ${styles.noResultsIcon} rounded-full flex items-center justify-center mx-auto mb-6`}
                >
                  <X className="h-12 w-12" />
                </div>
                <h3 className={`text-2xl font-bold ${styles.text} mb-2 font-poppins`}>NO PRODUCTS FOUND</h3>
                <p className={`${styles.subtext} mb-8 font-inter`}>Try adjusting your search or filter criteria.</p>
                <button
                  onClick={clearFilters}
                  className={`${styles.button} py-3 px-8 rounded-[12px] inline-flex items-center gap-2 transition-colors font-inter`}
                >
                  Clear Filters
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`${styles.card} ${styles.cardHover} rounded-[12px] overflow-hidden transition-colors`}
                  >
                    <div className={`h-64 ${theme === "dark" ? "bg-black" : "bg-gray-100"} relative overflow-hidden`}>
                      <img
                        src={product.imageUrl || getPlaceholderImage(400, 300)}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                    <div className="p-5">
                      <h3 className={`${styles.text} font-medium text-lg mb-2 font-inter`}>{product.name}</h3>
                      <p className={`${styles.subtext} text-sm mb-3 font-inter`}>{product.category}</p>
                      <div className="flex justify-between items-center mb-3">
                        <span className={`${styles.text} text-xl font-bold font-inter`}>
                          ${product.price?.toFixed(2) || "0.00"}
                        </span>
                      </div>
                    </div>

                    <div className="px-5 pb-5 space-y-3">
                      <Link
                        to={`/product/${product.id}`}
                        className={`w-full bg-transparent border ${styles.buttonOutline} px-4 py-3 rounded-[12px] transition-colors flex items-center justify-center gap-2 font-inter`}
                      >
                        View Details
                        <ChevronRight size={16} />
                      </Link>

                      {currentUser ? (
                        <button
                          onClick={() => handleAddToCart(product)}
                          className={`w-full py-3 rounded-[12px] transition-colors flex items-center justify-center gap-2 font-inter ${
                            addedToCart === product.id ? styles.addedToCartButton : styles.button
                          }`}
                          disabled={addedToCart === product.id}
                        >
                          {addedToCart === product.id ? (
                            <>
                              Added <Check size={16} />
                            </>
                          ) : (
                            <>
                              Add to Cart <ShoppingBag size={16} />
                            </>
                          )}
                        </button>
                      ) : (
                        <Link
                          to="/login"
                          className={`w-full ${styles.signInButton} px-4 py-3 rounded-[12px] transition-colors flex items-center justify-center gap-2 font-inter`}
                        >
                          Sign in to add to cart
                          <ChevronRight size={16} />
                        </Link>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
