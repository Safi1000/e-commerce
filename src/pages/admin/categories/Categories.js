"use client"

import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore"
import { db } from "../../../firebase/config"
import Toast from "../../../components/layouts/Toast"

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const categoriesSnapshot = await getDocs(collection(db, "categories"))
      const categoriesList = categoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      
      // Organize categories into a hierarchical structure
      const organizedCategories = organizeCategories(categoriesList)
      setCategories(organizedCategories)
    } catch (error) {
      console.error("Error fetching categories:", error)
      setToast({
        visible: true,
        message: 'Error fetching categories. Please try again.',
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const organizeCategories = (categoriesList) => {
    // Create a map of parent categories
    const parentCategories = categoriesList.filter(category => !category.parentCategoryId)
    
    // Create a map of subcategories
    const subcategoriesMap = categoriesList.reduce((acc, category) => {
      if (category.parentCategoryId) {
        if (!acc[category.parentCategoryId]) {
          acc[category.parentCategoryId] = []
        }
        acc[category.parentCategoryId].push(category)
      }
      return acc
    }, {})

    // Attach subcategories to their parent categories
    return parentCategories.map(category => ({
      ...category,
      subcategories: subcategoriesMap[category.id] || []
    }))
  }

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this category?")) {
      return
    }

    try {
      await deleteDoc(doc(db, "categories", id))
      setToast({
        visible: true,
        message: 'Category deleted successfully!',
        type: 'success'
      })
      fetchCategories() // Refresh the list
    } catch (error) {
      console.error("Error deleting category:", error)
      setToast({
        visible: true,
        message: 'Error deleting category. Please try again.',
        type: 'error'
      })
    }
  }

  const handleCloseToast = () => {
    setToast({ ...toast, visible: false })
  }

  const renderCategory = (category, level = 0) => {
    const paddingLeft = level * 2 // 2rem per level

    return (
      <div key={category.id}>
        <div 
          className="flex items-center justify-between p-4 bg-white rounded-[12px] shadow mb-2"
          style={{ marginLeft: `${paddingLeft}rem` }}
        >
          <div>
            <h3 className="text-lg font-medium">{category.name}</h3>
            {category.description && (
              <p className="text-gray-500 text-sm mt-1">{category.description}</p>
            )}
          </div>
          <div className="flex space-x-2">
            <Link
              to={`/admin/categories/edit/${category.id}`}
              className="bg-blue-600 text-white px-3 py-1 rounded-[12px] hover:bg-blue-700"
            >
              Edit
            </Link>
            <button
              onClick={() => handleDelete(category.id)}
              className="bg-red-600 text-white px-3 py-1 rounded-[12px] hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
        {category.subcategories && category.subcategories.map(subcategory => 
          renderCategory(subcategory, level + 1)
        )}
      </div>
    )
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
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Link
          to="/admin/categories/add"
          className="bg-blue-600 text-white px-4 py-2 rounded-[12px] hover:bg-blue-700"
        >
          Add Category
        </Link>
      </div>

      <div className="space-y-4">
        {categories.length === 0 ? (
          <p className="text-gray-500">No categories found.</p>
        ) : (
          categories.map(category => renderCategory(category))
        )}
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