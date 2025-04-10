"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { useCart } from "../../contexts/CartContext"
import { motion } from "framer-motion"
import { ChevronLeft, CreditCard, ShoppingBag, CheckCircle } from "lucide-react"
import { collection, addDoc, query, where, orderBy, limit, getDocs, doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "../../firebase/config"
import MaterialToast from "../../components/layouts/MaterialToast"
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query"

export default function Checkout() {
  const { currentUser, isGuest, guestId, getEffectiveUserId, enableGuestMode } = useAuth()
  const { cartItems, cartTotal, clearCart } = useCart()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const effectiveUserId = getEffectiveUserId()

  // Ensure guest mode is enabled if the user is not logged in
  useEffect(() => {
    const ensureGuestMode = async () => {
      if (!currentUser && !isGuest) {
        try {
          await enableGuestMode();
        } catch (error) {
          console.error("Error enabling guest mode:", error);
        }
      }
    };
    
    ensureGuestMode();
  }, [currentUser, isGuest, enableGuestMode]);

  // Use React Query to fetch user profile data for pre-filling the form
  const { data: userData } = useQuery({
    queryKey: ['userData', effectiveUserId],
    queryFn: async () => {
      if (!effectiveUserId) return null
      
      try {
        const userDoc = await getDoc(doc(db, "users", effectiveUserId))
        return userDoc.exists() ? userDoc.data() : null
      } catch (error) {
        console.error("Error fetching user data:", error)
        return null
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!effectiveUserId,
    // Add retry logic to prevent excessive retries
    retry: 1,
    retryDelay: 1000
  })

  // Use React Query to fetch user's recent orders - only for signed-in users
  const recentOrdersKey = currentUser ? ['recentOrders', currentUser.uid] : null
  const { data: recentOrders = [] } = useQuery({
    queryKey: recentOrdersKey,
    queryFn: async () => {
      if (!currentUser) return []
      
      try {
        const ordersRef = collection(db, "orders")
        const q = query(
          ordersRef, 
          where("userId", "==", currentUser.uid), 
          orderBy("createdAt", "desc"), 
          limit(5)
        )
        const querySnapshot = await getDocs(q)
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
      } catch (error) {
        console.error("Error fetching orders:", error)
        return []
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!recentOrdersKey,
    // Add retry logic to prevent excessive retries
    retry: 1,
    retryDelay: 1000
  })

  // Also fetch guest orders if in guest mode
  const { data: guestOrders } = useQuery({
    queryKey: ['guestOrders', guestId],
    queryFn: async () => {
      if (!guestId || !isGuest) return []
      
      try {
        const ordersQuery = query(
          collection(db, "orders"),
          where("userId", "==", guestId),
          where("isGuestOrder", "==", true),
          orderBy("createdAt", "desc"),
          limit(5)
        )
        
        const querySnapshot = await getDocs(ordersQuery)
        return querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }))
      } catch (error) {
        console.error("Error fetching guest orders:", error)
        return []
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    enabled: !!(guestId && isGuest),
    retry: 1
  })

  // Combine orders for display
  const allOrders = [...(recentOrders || []), ...(guestOrders || [])].sort((a, b) => 
    new Date(b.createdAt) - new Date(a.createdAt)
  ).slice(0, 5)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: currentUser?.email || "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "United States",
    cardName: "",
    cardNumber: "",
    expMonth: "",
    expYear: "",
    cvv: "",
  })

  // Pre-fill form with user data when available
  useEffect(() => {
    if (userData) {
      setFormData(prevData => ({
        ...prevData,
        firstName: userData.firstName || userData.name?.split(' ')[0] || "",
        lastName: userData.lastName || (userData.name?.split(' ').length > 1 ? userData.name?.split(' ').slice(1).join(' ') : "") || "",
        email: currentUser?.email || userData.email || "",
        address: userData.address || "",
        city: userData.city || "",
        state: userData.state || "",
        zipCode: userData.zipCode || "",
        country: userData.country || "United States",
      }))
    }
  }, [userData, currentUser])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [preventRedirect, setPreventRedirect] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    // Redirect to cart if cart is empty, but not if we've just placed an order
    if (cartItems.length === 0 && !preventRedirect && !toast.visible) {
      navigate("/cart")
    }
  }, [cartItems, navigate, preventRedirect, toast.visible])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleCloseToast = () => {
    // Hide the toast
    setToast({ ...toast, visible: false });
    
    // Reset the preventRedirect flag
    setPreventRedirect(false);
    
    // Navigate if needed, with a small delay to allow toast to close
    if (shouldNavigate) {
      // Reset the navigation flag
      setShouldNavigate(false);
      setTimeout(() => {
        navigate("/");
      }, 100);
    }
  };

  const validateForm = () => {
    const errors = {}
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const nameRegex = /^[a-zA-Z\s]{2,50}$/
    const zipCodeRegex = /^\d{5}(-\d{4})?$/
    const cardNumberRegex = /^\d{16}$/
    const cvvRegex = /^\d{3,4}$/
    
    // Name validation
    if (!formData.firstName) {
      errors.firstName = "First name is required"
    } else if (!nameRegex.test(formData.firstName)) {
      errors.firstName = "First name should only contain letters and spaces (2-50 characters)"
    }
    
    if (!formData.lastName) {
      errors.lastName = "Last name is required"
    } else if (!nameRegex.test(formData.lastName)) {
      errors.lastName = "Last name should only contain letters and spaces (2-50 characters)"
    }
    
    // Email validation
    if (!formData.email) {
      errors.email = "Email is required"
    } else if (!emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email address"
    }
    
    // Address validation
    if (!formData.address) {
      errors.address = "Address is required"
    }
    
    if (!formData.city) {
      errors.city = "City is required"
    }
    
    if (!formData.state) {
      errors.state = "State is required"
    }
    
    if (!formData.zipCode) {
      errors.zipCode = "ZIP code is required"
    } else if (!zipCodeRegex.test(formData.zipCode)) {
      errors.zipCode = "Please enter a valid ZIP code"
    }
    
    // Card validation
    if (!formData.cardName) {
      errors.cardName = "Cardholder name is required"
    } else if (!nameRegex.test(formData.cardName)) {
      errors.cardName = "Cardholder name should only contain letters and spaces (2-50 characters)"
    }
    
    if (!formData.cardNumber) {
      errors.cardNumber = "Card number is required"
    } else if (!cardNumberRegex.test(formData.cardNumber.replace(/\s/g, ''))) {
      errors.cardNumber = "Please enter a valid 16-digit card number"
    }
    
    if (!formData.expMonth) {
      errors.expMonth = "Expiration month is required"
    } else if (parseInt(formData.expMonth) < 1 || parseInt(formData.expMonth) > 12) {
      errors.expMonth = "Please enter a valid month (1-12)"
    }
    
    if (!formData.expYear) {
      errors.expYear = "Expiration year is required"
    } else if (parseInt(formData.expYear) < new Date().getFullYear()) {
      errors.expYear = "Please enter a valid year"
    }
    
    if (!formData.cvv) {
      errors.cvv = "CVV is required"
    } else if (!cvvRegex.test(formData.cvv)) {
      errors.cvv = "Please enter a valid CVV (3-4 digits)"
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return
    }
    
    setLoading(true);
    setError("");
    
    try {
      // Ensure we have a valid effectiveUserId for guest users
      if (!effectiveUserId && isGuest) {
        // Try enabling guest mode again to get a valid ID
        await enableGuestMode();
        
        // If still no effectiveUserId, create a fallback
        if (!getEffectiveUserId()) {
          console.error("No effective user ID available");
          throw new Error("Unable to process order without user identification");
        }
      }
      
      // Calculate order totals
      const subtotal = cartTotal
      const shipping = subtotal > 100 ? 0 : 10
      const tax = subtotal * 0.08
      const total = subtotal + shipping + tax

      // Create order object
      const orderData = {
        customer: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
        },
        items: cartItems.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.imageUrl,
        })),
        payment: {
          cardName: formData.cardName,
          cardLast4: formData.cardNumber.slice(-4).padStart(4, "*"),
          cardExpiry: `${formData.expMonth}/${formData.expYear}`,
        },
        totals: {
          subtotal,
          shipping,
          tax,
          total,
        },
        status: "pending",
        userId: getEffectiveUserId() || guestId,
        isGuestOrder: isGuest,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // First try saving to Firestore
      let orderRef;
      try {
        // Save order to Firestore
        orderRef = await addDoc(collection(db, "orders"), orderData)
      } catch (firestoreError) {
        // If Firestore fails due to permissions, save locally
        console.error("Failed to save order to Firestore:", firestoreError);
        
        // Generate a local ID
        const localOrderId = `local-order-${Date.now()}`;
        
        // Save to localStorage as fallback
        const existingOrders = JSON.parse(localStorage.getItem("guestOrders") || "[]");
        const newOrdersList = [
          { 
            id: localOrderId,
            ...orderData
          },
          ...existingOrders
        ];
        localStorage.setItem("guestOrders", JSON.stringify(newOrdersList));
        
        // Use the local ID
        orderRef = { id: localOrderId };
      }

      // Invalidate the relevant orders query to trigger a refetch
      if (currentUser) {
        queryClient.invalidateQueries(['recentOrders', currentUser.uid])
      } else if (isGuest && guestId) {
        queryClient.invalidateQueries(['guestOrders', guestId])
      }

      // Store order details
      setOrderDetails({
        orderId: orderRef.id,
        customer: {
          name: `${formData.firstName} ${formData.lastName}`,
          address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zipCode}`,
        },
        items: cartItems,
        totals: {
          subtotal,
          shipping,
          tax,
          total,
        },
        date: new Date().toLocaleDateString(),
      });

      // Update user profile with shipping info for future use
      if (effectiveUserId) {
        try {
          const userDocRef = doc(db, "users", effectiveUserId);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            // Update existing document
            await setDoc(userDocRef, {
              ...userDoc.data(),
              firstName: formData.firstName,
              lastName: formData.lastName,
              address: formData.address,
              city: formData.city,
              state: formData.state,
              zipCode: formData.zipCode,
              country: formData.country,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          } else if (isGuest) {
            // Create new document for guest
            await setDoc(userDocRef, {
              uid: effectiveUserId,
              name: `${formData.firstName} ${formData.lastName}`,
              email: formData.email,
              role: "guest",
              firstName: formData.firstName,
              lastName: formData.lastName,
              address: formData.address,
              city: formData.city,
              state: formData.state,
              zipCode: formData.zipCode,
              country: formData.country,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
          
          // Also save to localStorage for backup
          localStorage.setItem("guestData", JSON.stringify({
            uid: effectiveUserId,
            name: `${formData.firstName} ${formData.lastName}`,
            email: formData.email,
            role: "guest",
            firstName: formData.firstName,
            lastName: formData.lastName,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country
          }));
          
          // Invalidate user data query
          queryClient.invalidateQueries(['userData', effectiveUserId]);
        } catch (error) {
          console.error("Failed to update user profile:", error);
        }
      }

      // Clear the cart
      clearCart()

      // Show success toast with order details
      setToast({
        visible: true,
        message: (
          <div className="space-y-6">
            <div className="text-center border-b border-gray-800 pb-4">
              <h2 className="text-2xl font-bold font-poppins tracking-tight mb-2">THANK YOU FOR YOUR ORDER</h2>
              <p className="text-gray-400">Your order has been successfully placed.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold font-poppins border-b border-gray-800 pb-2">ORDER DETAILS</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Order ID:</span> {orderRef.id}</p>
                  <p><span className="font-medium">Date:</span> {new Date().toLocaleDateString()}</p>
                  <p><span className="font-medium">Payment Method:</span> Credit Card ending in {formData.cardNumber.slice(-4)}</p>
                  <p><span className="font-medium">Total Items:</span> {cartItems.length}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-semibold font-poppins border-b border-gray-800 pb-2">CUSTOMER INFORMATION</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Name:</span> {formData.firstName} {formData.lastName}</p>
                  <p><span className="font-medium">Email:</span> {formData.email}</p>
                  <p><span className="font-medium">Address:</span> {formData.address}</p>
                  <p><span className="font-medium">City, State, ZIP:</span> {formData.city}, {formData.state} {formData.zipCode}</p>
                  <p><span className="font-medium">Country:</span> {formData.country}</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold font-poppins border-b border-gray-800 pb-2">ORDER SUMMARY</h3>
              <div className="space-y-3">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <span className="font-medium">{item.name}</span> 
                      <span className="text-gray-400 ml-2">x{item.quantity}</span>
                    </div>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="pt-3 border-t border-gray-800">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span>${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-400">Shipping</span>
                  <span>${shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-400">Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold mt-3">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <div className="text-center pt-4 text-gray-400 text-sm">
              <p>A confirmation email has been sent to {formData.email}</p>
              <p className="mt-1">Questions about your order? Contact us at support@shopease.com</p>
            </div>
          </div>
        ),
        type: 'success'
      });
      
      // Set navigation flag
      setShouldNavigate(true);
      
    } catch (error) {
      console.error("Error placing order:", error);
      setToast({
        visible: true,
        message: "There was a problem processing your order. Please try again.",
        type: 'error'
      });
      setPreventRedirect(false);
    } finally {
      setLoading(false);
    }
  }

  // Calculate totals
  const shipping = cartTotal > 100 ? 0 : 10
  const tax = cartTotal * 0.08
  const total = cartTotal + shipping + tax

  // Placeholder image URL helper function
  const getPlaceholderImage = (width, height) => {
    return `https://via.placeholder.com/${width}x${height}/1a1a1a/ffffff?text=ShopEase`
  }

  return (
    <>
      <div className="bg-black text-white min-h-screen">
        <div className="container mx-auto px-4 py-12">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <div className="w-fit">
              <h1 className="text-4xl font-bold mb-2 tracking-tight font-poppins">CHECKOUT</h1>
              <div className="h-1 bg-white w-full"></div>
            </div>
          </motion.div>

          {error && <div className="bg-red-900 text-white p-4 mb-6 rounded-[12px]">{error}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-gray-900 border border-gray-800 rounded-[12px] p-6">
                <div className="flex items-center mb-6">
                  <div className="h-10 w-10 bg-black rounded-full flex items-center justify-center mr-4">
                    <ShoppingBag className="h-5 w-5 text-white" />
                  </div>
                  <h2 className="text-xl font-bold font-poppins">SHIPPING INFORMATION</h2>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit(e);
                }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 bg-black border ${
                          validationErrors.firstName ? 'border-red-500' : 'border-gray-800'
                        } rounded-[12px] focus:outline-none focus:border-white transition-colors text-white`}
                        placeholder="First Name"
                      />
                      {validationErrors.firstName && (
                        <p className="mt-1 text-sm text-red-500">{validationErrors.firstName}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 bg-black border ${
                          validationErrors.lastName ? 'border-red-500' : 'border-gray-800'
                        } rounded-[12px] focus:outline-none focus:border-white transition-colors text-white`}
                        placeholder="Last Name"
                      />
                      {validationErrors.lastName && (
                        <p className="mt-1 text-sm text-red-500">{validationErrors.lastName}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-black border ${
                        validationErrors.email ? 'border-red-500' : 'border-gray-800'
                      } rounded-[12px] focus:outline-none focus:border-white transition-colors text-white`}
                      placeholder="Email Address"
                    />
                    {validationErrors.email && (
                      <p className="mt-1 text-sm text-red-500">{validationErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-2">
                      Street Address
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-black border ${
                        validationErrors.address ? 'border-red-500' : 'border-gray-800'
                      } rounded-[12px] focus:outline-none focus:border-white transition-colors text-white`}
                      placeholder="Street Address"
                    />
                    {validationErrors.address && (
                      <p className="mt-1 text-sm text-red-500">{validationErrors.address}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-2">
                        City
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 bg-black border ${
                          validationErrors.city ? 'border-red-500' : 'border-gray-800'
                        } rounded-[12px] focus:outline-none focus:border-white transition-colors text-white`}
                        placeholder="City"
                      />
                      {validationErrors.city && (
                        <p className="mt-1 text-sm text-red-500">{validationErrors.city}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-300 mb-2">
                        State
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 bg-black border ${
                          validationErrors.state ? 'border-red-500' : 'border-gray-800'
                        } rounded-[12px] focus:outline-none focus:border-white transition-colors text-white`}
                        placeholder="State"
                      />
                      {validationErrors.state && (
                        <p className="mt-1 text-sm text-red-500">{validationErrors.state}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="zipCode" className="block text-sm font-medium text-gray-300 mb-2">
                        ZIP Code
                      </label>
                      <input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 bg-black border ${
                          validationErrors.zipCode ? 'border-red-500' : 'border-gray-800'
                        } rounded-[12px] focus:outline-none focus:border-white transition-colors text-white`}
                        placeholder="ZIP Code"
                      />
                      {validationErrors.zipCode && (
                        <p className="mt-1 text-sm text-red-500">{validationErrors.zipCode}</p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-gray-800 pt-6">
                    <h3 className="text-lg font-semibold mb-4">Payment Information</h3>
                    <div>
                      <label htmlFor="cardName" className="block text-sm font-medium text-gray-300 mb-2">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        id="cardName"
                        name="cardName"
                        value={formData.cardName}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 bg-black border ${
                          validationErrors.cardName ? 'border-red-500' : 'border-gray-800'
                        } rounded-[12px] focus:outline-none focus:border-white transition-colors text-white`}
                        placeholder="Cardholder Name"
                      />
                      {validationErrors.cardName && (
                        <p className="mt-1 text-sm text-red-500">{validationErrors.cardName}</p>
                      )}
                    </div>

                    <div className="mt-4">
                      <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-300 mb-2">
                        Card Number
                      </label>
                      <input
                        type="text"
                        id="cardNumber"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 bg-black border ${
                          validationErrors.cardNumber ? 'border-red-500' : 'border-gray-800'
                        } rounded-[12px] focus:outline-none focus:border-white transition-colors text-white`}
                        placeholder="Card Number"
                      />
                      {validationErrors.cardNumber && (
                        <p className="mt-1 text-sm text-red-500">{validationErrors.cardNumber}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div>
                        <label htmlFor="expMonth" className="block text-sm font-medium text-gray-300 mb-2">
                          Exp. Month
                        </label>
                        <input
                          type="text"
                          id="expMonth"
                          name="expMonth"
                          value={formData.expMonth}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 bg-black border ${
                            validationErrors.expMonth ? 'border-red-500' : 'border-gray-800'
                          } rounded-[12px] focus:outline-none focus:border-white transition-colors text-white`}
                          placeholder="MM"
                        />
                        {validationErrors.expMonth && (
                          <p className="mt-1 text-sm text-red-500">{validationErrors.expMonth}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="expYear" className="block text-sm font-medium text-gray-300 mb-2">
                          Exp. Year
                        </label>
                        <input
                          type="text"
                          id="expYear"
                          name="expYear"
                          value={formData.expYear}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 bg-black border ${
                            validationErrors.expYear ? 'border-red-500' : 'border-gray-800'
                          } rounded-[12px] focus:outline-none focus:border-white transition-colors text-white`}
                          placeholder="YYYY"
                        />
                        {validationErrors.expYear && (
                          <p className="mt-1 text-sm text-red-500">{validationErrors.expYear}</p>
                        )}
                      </div>
                      <div>
                        <label htmlFor="cvv" className="block text-sm font-medium text-gray-300 mb-2">
                          CVV
                        </label>
                        <input
                          type="text"
                          id="cvv"
                          name="cvv"
                          value={formData.cvv}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 bg-black border ${
                            validationErrors.cvv ? 'border-red-500' : 'border-gray-800'
                          } rounded-[12px] focus:outline-none focus:border-white transition-colors text-white`}
                          placeholder="CVV"
                        />
                        {validationErrors.cvv && (
                          <p className="mt-1 text-sm text-red-500">{validationErrors.cvv}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <Link
                      to="/cart"
                      className="bg-transparent border border-white text-white py-2 px-6 rounded-[12px] hover:bg-white hover:text-black transition-colors flex items-center gap-2 font-inter"
                    >
                      <ChevronLeft size={18} />
                      Back to Cart
                    </Link>

                    <button
                      type="button" 
                      disabled={loading}
                      className="bg-white text-black py-2 px-6 rounded-[12px] hover:bg-gray-200 transition-colors flex items-center gap-2 font-inter"
                      onClick={(e) => {
                        if (!loading) {
                          e.preventDefault();
                          e.stopPropagation();
                          // Set preventRedirect flag
                          setPreventRedirect(true);
                          // Call handleSubmit directly without showing processing toast
                          handleSubmit(e);
                        }
                      }}
                    >
                      {loading ? (
                        <>
                          Processing...
                          <div className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent"></div>
                        </>
                      ) : (
                        <>
                          Place Order
                          <CheckCircle size={18} />
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-gray-900 border border-gray-800 rounded-[12px] p-6">
                <h2 className="text-xl font-bold mb-6 font-poppins">ORDER SUMMARY</h2>

                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center">
                      <div className="h-12 w-12 flex-shrink-0 bg-black rounded-[12px] overflow-hidden">
                        <img
                          className="h-12 w-12 object-cover"
                          src={item.imageUrl || getPlaceholderImage(80, 80)}
                          alt={item.name}
                        />
                      </div>
                      <div className="ml-4 flex-1">
                        <div className="text-sm font-medium text-white font-inter">{item.name}</div>
                        <div className="text-sm text-gray-400 font-inter">
                          ${item.price.toFixed(2)} x {item.quantity}
                        </div>
                      </div>
                      <div className="text-sm font-medium text-white font-inter">
                        ${(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-800 pt-4 space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-inter">Subtotal</span>
                    <span className="font-medium text-white font-inter">${cartTotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400 font-inter">Shipping</span>
                    <span className="font-medium text-white font-inter">${shipping.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-gray-400 font-inter">Tax</span>
                    <span className="font-medium text-white font-inter">${tax.toFixed(2)}</span>
                  </div>

                  <div className="border-t border-gray-800 pt-4 flex justify-between">
                    <span className="font-semibold text-white font-inter">Total</span>
                    <span className="font-bold text-white text-xl font-inter">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Render toast outside of main container to prevent any styling conflicts */}
      <MaterialToast
        isVisible={toast.visible}
        message={toast.message}
        type={toast.type}
        onClose={handleCloseToast}
      />
    </>
  )
}

