"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useAuth } from "../../contexts/AuthContext"
import { useCart } from "../../contexts/CartContext"
import { motion } from "framer-motion"
import { ChevronLeft, CreditCard, ShoppingBag, CheckCircle } from "lucide-react"
import { collection, addDoc } from "firebase/firestore"
import { db } from "../../firebase/config"
import MaterialToast from "../../components/layouts/MaterialToast"

export default function Checkout() {
  const { currentUser } = useAuth()
  const { cartItems, cartTotal, clearCart } = useCart()
  const navigate = useNavigate()

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

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [toast, setToast] = useState({ visible: false, message: '', type: 'success' });
  const [shouldNavigate, setShouldNavigate] = useState(false);
  const [orderDetails, setOrderDetails] = useState(null);
  const [preventRedirect, setPreventRedirect] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
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
        userId: currentUser?.uid || "guest",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      // Save order to Firestore
      const orderRef = await addDoc(collection(db, "orders"), orderData)

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
      console.error("Error placing order:", error)
      setToast({
        visible: true,
        message: "There was a problem processing your order. Please try again.",
        type: 'error'
      });
      setPreventRedirect(false);
    } finally {
      setLoading(false)
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

          {error && <div className="bg-red-900 text-white p-4 mb-6 rounded-sm">{error}</div>}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-gray-900 border border-gray-800 rounded-sm p-6">
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-300 mb-1 font-inter">
                        First Name *
                      </label>
                      <input
                        type="text"
                        id="firstName"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleChange}
                        className="block w-full bg-black border border-gray-700 rounded-sm py-2 px-3 focus:outline-none focus:border-white text-white"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-300 mb-1 font-inter">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        id="lastName"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleChange}
                        className="block w-full bg-black border border-gray-700 rounded-sm py-2 px-3 focus:outline-none focus:border-white text-white"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1 font-inter">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="block w-full bg-black border border-gray-700 rounded-sm py-2 px-3 focus:outline-none focus:border-white text-white"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="address" className="block text-sm font-medium text-gray-300 mb-1 font-inter">
                        Address *
                      </label>
                      <input
                        type="text"
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        className="block w-full bg-black border border-gray-700 rounded-sm py-2 px-3 focus:outline-none focus:border-white text-white"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-300 mb-1 font-inter">
                        City *
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="block w-full bg-black border border-gray-700 rounded-sm py-2 px-3 focus:outline-none focus:border-white text-white"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-300 mb-1 font-inter">
                        State *
                      </label>
                      <input
                        type="text"
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        className="block w-full bg-black border border-gray-700 rounded-sm py-2 px-3 focus:outline-none focus:border-white text-white"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="zipCode" className="block text-sm font-medium text-gray-300 mb-1 font-inter">
                        ZIP Code *
                      </label>
                      <input
                        type="text"
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        className="block w-full bg-black border border-gray-700 rounded-sm py-2 px-3 focus:outline-none focus:border-white text-white"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-300 mb-1 font-inter">
                        Country *
                      </label>
                      <select
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        className="block w-full bg-black border border-gray-700 rounded-sm py-2 px-3 focus:outline-none focus:border-white text-white"
                        required
                      >
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Australia">Australia</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center mb-6">
                    <div className="h-10 w-10 bg-black rounded-full flex items-center justify-center mr-4">
                      <CreditCard className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-xl font-bold font-poppins">PAYMENT INFORMATION</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="md:col-span-2">
                      <label htmlFor="cardName" className="block text-sm font-medium text-gray-300 mb-1 font-inter">
                        Name on Card *
                      </label>
                      <input
                        type="text"
                        id="cardName"
                        name="cardName"
                        value={formData.cardName}
                        onChange={handleChange}
                        className="block w-full bg-black border border-gray-700 rounded-sm py-2 px-3 focus:outline-none focus:border-white text-white"
                        required
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-300 mb-1 font-inter">
                        Card Number *
                      </label>
                      <input
                        type="text"
                        id="cardNumber"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleChange}
                        placeholder="XXXX XXXX XXXX XXXX"
                        className="block w-full bg-black border border-gray-700 rounded-sm py-2 px-3 focus:outline-none focus:border-white text-white"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="expMonth" className="block text-sm font-medium text-gray-300 mb-1 font-inter">
                        Expiration Month *
                      </label>
                      <input
                        type="text"
                        id="expMonth"
                        name="expMonth"
                        value={formData.expMonth}
                        onChange={handleChange}
                        placeholder="MM"
                        className="block w-full bg-black border border-gray-700 rounded-sm py-2 px-3 focus:outline-none focus:border-white text-white"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="expYear" className="block text-sm font-medium text-gray-300 mb-1 font-inter">
                        Expiration Year *
                      </label>
                      <input
                        type="text"
                        id="expYear"
                        name="expYear"
                        value={formData.expYear}
                        onChange={handleChange}
                        placeholder="YYYY"
                        className="block w-full bg-black border border-gray-700 rounded-sm py-2 px-3 focus:outline-none focus:border-white text-white"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="cvv" className="block text-sm font-medium text-gray-300 mb-1 font-inter">
                        CVV *
                      </label>
                      <input
                        type="text"
                        id="cvv"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleChange}
                        placeholder="XXX"
                        className="block w-full bg-black border border-gray-700 rounded-sm py-2 px-3 focus:outline-none focus:border-white text-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex justify-between mt-8">
                    <Link
                      to="/cart"
                      className="bg-transparent border border-white text-white py-2 px-6 rounded-sm hover:bg-white hover:text-black transition-colors flex items-center gap-2 font-inter"
                    >
                      <ChevronLeft size={18} />
                      Back to Cart
                    </Link>

                    <button
                      type="button" 
                      disabled={loading}
                      className="bg-white text-black py-2 px-6 rounded-sm hover:bg-gray-200 transition-colors flex items-center gap-2 font-inter"
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
              <div className="bg-gray-900 border border-gray-800 rounded-sm p-6">
                <h2 className="text-xl font-bold mb-6 font-poppins">ORDER SUMMARY</h2>

                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex items-center">
                      <div className="h-12 w-12 flex-shrink-0 bg-black rounded-sm overflow-hidden">
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

