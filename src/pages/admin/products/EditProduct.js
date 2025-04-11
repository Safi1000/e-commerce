"use client"

import { useState, useEffect } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { doc, getDoc, updateDoc, collection, getDocs } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage"
import { db, storage } from "../../../firebase/config"
import Toast from "../../../components/layouts/Toast"

export default function EditProduct() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [stock, setStock] = useState("")
  const [categoryId, setCategoryId] = useState("")
  const [parentCategoryId, setParentCategoryId] = useState("")
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [image, setImage] = useState(null)
  const [imageUrl, setImageUrl] = useState("")
  const [imagePreview, setImagePreview] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState("")
  const [validationErrors, setValidationErrors] = useState({})
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' })

  useEffect(() => {
    fetchProduct()
    fetchCategories()
  }, [id])

  const fetchProduct = async () => {
    try {
      const productDoc = await getDoc(doc(db, "products", id))
      if (productDoc.exists()) {
        const productData = productDoc.data()
        setName(productData.name || "")
        setDescription(productData.description || "")
        setPrice(productData.price?.toString() || "")
        setStock(productData.stock?.toString() || "0")
        setCategoryId(productData.categoryId || "")
        setParentCategoryId(productData.parentCategoryId || "")
        setImageUrl(productData.imageUrl || "")
        setImagePreview(productData.imageUrl || "")
        
        // If the product has a parent category, fetch its subcategories
        if (productData.parentCategoryId) {
          fetchSubcategories(productData.parentCategoryId)
        }
      } else {
        setError("Product not found")
        navigate("/admin/products")
      }
    } catch (error) {
      console.error("Error fetching product:", error)
      setError("Error loading product")
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const categoriesSnapshot = await getDocs(collection(db, "categories"))
      const categoriesList = categoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      
      // Filter to get only parent categories (those without a parentCategoryId)
      const parentCategories = categoriesList.filter(category => !category.parentCategoryId)
      setCategories(parentCategories)
    } catch (error) {
      console.error("Error fetching categories:", error)
      setError("Failed to load categories")
    }
  }

  // Fetch subcategories when a parent category is selected
  const fetchSubcategories = async (parentId) => {
    if (!parentId) {
      setSubcategories([])
      return
    }
    
    try {
      const categoriesSnapshot = await getDocs(collection(db, "categories"))
      const categoriesList = categoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      
      // Filter to get subcategories for the selected parent
      const subcategoriesList = categoriesList.filter(category => category.parentCategoryId === parentId)
      setSubcategories(subcategoriesList)
    } catch (error) {
      console.error("Error fetching subcategories:", error)
    }
  }

  // Handle parent category change
  const handleParentCategoryChange = (e) => {
    const parentId = e.target.value
    setParentCategoryId(parentId)
    setCategoryId("") // Reset subcategory selection
    
    if (parentId) {
      fetchSubcategories(parentId)
    } else {
      setSubcategories([])
    }
  }

  const validateImage = (file) => {
    // Check file type
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"]
    if (!validTypes.includes(file.type)) {
      setError("Please select a valid image file (JPEG, PNG, GIF, or WEBP)")
      return false
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      setError("Image size should be less than 5MB")
      return false
    }

    return true
  }

  const handleImageChange = (e) => {
    setError("")
    if (e.target.files[0]) {
      const file = e.target.files[0]

      if (validateImage(file)) {
        setImage(file)
        setImagePreview(URL.createObjectURL(file))
      } else {
        e.target.value = null // Reset the input
      }
    }
  }

  const validateForm = () => {
    const errors = {}
    
    if (!name.trim()) {
      errors.name = "Product name is required"
    }
    
    if (!price.trim()) {
      errors.price = "Price is required"
    } else if (isNaN(price) || parseFloat(price) <= 0) {
      errors.price = "Price must be a positive number"
    }
    
    if (!stock.trim()) {
      errors.stock = "Stock is required"
    } else if (isNaN(stock) || parseInt(stock) <= 0) {
      errors.stock = "Stock must be greater than 0"
    }
    
    if (!categoryId) {
      errors.categoryId = "Category is required"
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!validateForm()) {
      return
    }

    setSaving(true)
    setUploadProgress(0)

    try {
      let updatedImageUrl = imageUrl

      if (image) {
        // Create a unique filename with timestamp and original name
        const timestamp = Date.now()
        const fileName = `${timestamp}_${image.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
        const storageRef = ref(storage, `products/${fileName}`)

        // Simulate upload progress
        const simulateProgress = () => {
          let progress = 0
          const interval = setInterval(() => {
            progress += Math.random() * 10
            if (progress > 90) {
              clearInterval(interval)
              progress = 90
            }
            setUploadProgress(Math.min(Math.round(progress), 90))
          }, 300)

          return interval
        }

        const progressInterval = simulateProgress()

        // Upload the new image
        await uploadBytes(storageRef, image)
        clearInterval(progressInterval)
        setUploadProgress(100)

        // Get the download URL
        updatedImageUrl = await getDownloadURL(storageRef)

        // Delete the old image if it exists and is different
        if (imageUrl && imageUrl !== updatedImageUrl) {
          try {
            // Extract the old file path from the URL
            const oldImagePath = imageUrl.split("products%2F")[1].split("?")[0]
            if (oldImagePath) {
              const oldImageRef = ref(storage, `products/${decodeURIComponent(oldImagePath)}`)
              await deleteObject(oldImageRef)
            }
          } catch (deleteError) {
            console.error("Error deleting old image:", deleteError)
            // Continue with the update even if deleting the old image fails
          }
        }
      }

      // Get the selected category (either parent or subcategory)
      const selectedCategoryId = categoryId || parentCategoryId
      const selectedCategory = [...categories, ...subcategories].find((cat) => cat.id === selectedCategoryId)

      const productRef = doc(db, "products", id)
      await updateDoc(productRef, {
        name,
        description,
        price: Number.parseFloat(price),
        stock: Number.parseInt(stock),
        categoryId: selectedCategoryId,
        parentCategoryId: parentCategoryId || null,
        category: selectedCategory?.name || "",
        imageUrl: updatedImageUrl,
        updatedAt: new Date().toISOString(),
      })

      setToast({
        visible: true,
        message: 'Product updated successfully!',
        type: 'success'
      })
      
      // Navigate back to products page after a short delay
      setTimeout(() => {
        navigate("/admin/products")
      }, 1500)
    } catch (error) {
      console.error("Error updating product:", error)
      setToast({
        visible: true,
        message: 'Error updating product. Please try again.',
        type: 'error'
      })
    } finally {
      setSaving(false)
      setUploadProgress(0)
    }
  }

  const handleCloseToast = () => {
    setToast({ ...toast, visible: false })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="bg-white text-black min-h-screen">
      <div>
        <h1 className="text-2xl font-bold mb-6">Edit Product</h1>

        <div className="bg-white rounded-[12px] shadow p-6">
          {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-[12px]">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Product Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`mt-1 block w-full border ${validationErrors.name ? 'border-red-500' : 'border-gray-300'} rounded-[12px] shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  required
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.name}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full border border-gray-300 rounded-[12px] shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price ($) *
                </label>
                <input
                  type="number"
                  id="price"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  min="0"
                  step="0.01"
                  className={`mt-1 block w-full border ${validationErrors.price ? 'border-red-500' : 'border-gray-300'} rounded-[12px] shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  required
                />
                {validationErrors.price && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.price}</p>
                )}
              </div>

              <div>
                <label htmlFor="stock" className="block text-sm font-medium text-gray-700">
                  Stock *
                </label>
                <input
                  type="number"
                  id="stock"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  min="1"
                  step="1"
                  className={`mt-1 block w-full border ${validationErrors.stock ? 'border-red-500' : 'border-gray-300'} rounded-[12px] shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  required
                />
                {validationErrors.stock && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.stock}</p>
                )}
              </div>

              <div>
                <label htmlFor="parentCategory" className="block text-sm font-medium text-gray-700">
                  Parent Category
                </label>
                <select
                  id="parentCategory"
                  value={parentCategoryId}
                  onChange={handleParentCategoryChange}
                  className={`mt-1 block w-full border ${validationErrors.parentCategoryId ? 'border-red-500' : 'border-gray-300'} rounded-[12px] shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                >
                  <option value="">Select a parent category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {validationErrors.parentCategoryId && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.parentCategoryId}</p>
                )}
              </div>

              {parentCategoryId && subcategories.length > 0 && (
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Subcategory *
                  </label>
                  <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className={`mt-1 block w-full border ${validationErrors.categoryId ? 'border-red-500' : 'border-gray-300'} rounded-[12px] shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    required
                  >
                    <option value="">Select a subcategory</option>
                    {subcategories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.categoryId && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.categoryId}</p>
                  )}
                </div>
              )}

              {!parentCategoryId && (
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                    Category *
                  </label>
                  <select
                    id="category"
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className={`mt-1 block w-full border ${validationErrors.categoryId ? 'border-red-500' : 'border-gray-300'} rounded-[12px] shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {validationErrors.categoryId && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.categoryId}</p>
                  )}
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Product Image</label>
                <div className="mt-1 flex items-center">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="h-32 w-32 object-cover rounded-[12px]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImage(null)
                          setImagePreview("")
                          setImageUrl("")
                        }}
                        className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <div className="h-32 w-32 border-2 border-gray-300 border-dashed rounded-[12px] flex items-center justify-center">
                      <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}
                  <div className="ml-4 flex-1">
                    <div className="relative bg-white py-2 px-3 border border-gray-300 rounded-[12px] shadow-sm flex items-center cursor-pointer hover:bg-gray-50">
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleImageChange}
                        accept="image/*"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {imagePreview ? "Change image" : "Upload image"}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF or WEBP up to 5MB</p>

                    {/* Upload progress bar */}
                    {uploadProgress > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Uploading: {uploadProgress}%</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => navigate("/admin/products")}
                className="bg-white py-2 px-4 border border-gray-300 rounded-[12px] shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 py-2 px-4 border border-transparent rounded-[12px] shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Toast
        isVisible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={handleCloseToast}
      />
    </div>
  )
}

