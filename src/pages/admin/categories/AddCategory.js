"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { collection, addDoc, getDocs } from "firebase/firestore"
import { db } from "../../../firebase/config"
import Toast from "../../../components/layouts/Toast"

export default function AddCategory() {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [parentCategoryId, setParentCategoryId] = useState("")
  const [parentCategories, setParentCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const navigate = useNavigate()
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [shouldNavigate, setShouldNavigate] = useState(false);

  useEffect(() => {
    fetchParentCategories();
  }, []);

  const fetchParentCategories = async () => {
    try {
      const categoriesSnapshot = await getDocs(collection(db, "categories"));
      const categoriesList = categoriesSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setParentCategories(categoriesList);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleCloseToast = () => {
    setToast({ ...toast, visible: false });
    if (shouldNavigate) {
      navigate("/admin/categories");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!name) {
      alert("Category name is required")
      return
    }

    setLoading(true)
    setError('')

    try {
      await addDoc(collection(db, "categories"), {
        name,
        description,
        parentCategoryId: parentCategoryId || null,
        isParent: !parentCategoryId,
        createdAt: new Date().toISOString(),
      })

      // Show success toast and set navigation flag
      setShouldNavigate(true);
      setToast({
        visible: true,
        message: 'Category added successfully!',
        type: 'success'
      });
    } catch (error) {
      console.error("Error adding category:", error)
      setToast({
        visible: true,
        message: 'Error adding category. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white text-black min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Add Category</h1>

      <div className="bg-white rounded-[12px] shadow p-6">
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Category Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-[12px] shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label htmlFor="parentCategory" className="block text-sm font-medium text-gray-700">
                Parent Category
              </label>
              <select
                id="parentCategory"
                value={parentCategoryId}
                onChange={(e) => setParentCategoryId(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-[12px] shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="">None (Top-level category)</option>
                {parentCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Select a parent category to create a subcategory, or leave empty for a top-level category.
              </p>
            </div>

            <div>
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
          </div>

          <div className="mt-6 flex justify-end">
            <button
              type="button"
              onClick={() => navigate("/admin/categories")}
              className="bg-white py-2 px-4 border border-gray-300 rounded-[12px] shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 py-2 px-4 border border-transparent rounded-[12px] shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {loading ? "Adding..." : "Add Category"}
            </button>
          </div>
        </form>
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

