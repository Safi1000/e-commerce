"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { useCart } from "../../contexts/CartContext"
import { useAuth } from "../../contexts/AuthContext"
import { motion } from "framer-motion"
import { ShoppingCart, Plus, Minus, X, ChevronRight, Tag } from "lucide-react"

export default function Cart() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal } = useCart()
  const { currentUser } = useAuth()
  const [couponCode, setCouponCode] = useState("")
  const [discount, setDiscount] = useState(0)

  const handleApplyCoupon = () => {
    // Simple coupon code implementation
    if (couponCode.toLowerCase() === "discount10") {
      setDiscount(cartTotal * 0.1)
    } else if (couponCode.toLowerCase() === "discount20") {
      setDiscount(cartTotal * 0.2)
    } else {
      setDiscount(0)
      alert("Invalid coupon code")
    }
  }

  // Calculate totals
  const shipping = cartTotal > 100 ? 0 : 10
  const tax = cartTotal * 0.08
  const orderTotal = cartTotal + shipping + tax - discount

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
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
  <h1 className="text-4xl font-bold mb-2 tracking-tight font-poppins">YOUR CART</h1>
  <div className="h-1 bg-white w-full"></div>
</div>

        </motion.div>

        {cartItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-gray-900 border border-gray-800 rounded-[12px] p-12 text-center max-w-2xl mx-auto"
          >
            <div className="h-24 w-24 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingCart className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-2 font-poppins">YOUR CART IS EMPTY</h3>
            <p className="text-gray-400 mb-8 font-inter">Looks like you haven't added any products to your cart yet.</p>
            <Link
              to="/shop"
              className="bg-white text-black py-3 px-8 rounded-[12px] hover:bg-gray-200 inline-flex items-center gap-2 transition-colors font-inter"
            >
              Continue Shopping
              <ChevronRight size={18} />
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div
              className="lg:col-span-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="bg-gray-900 border border-gray-800 rounded-[12px] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-800">
                    <thead className="bg-black">
                      <tr>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider font-poppins"
                        >
                          Product
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider font-poppins"
                        >
                          Price
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider font-poppins"
                        >
                          Quantity
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase tracking-wider font-poppins"
                        >
                          Total
                        </th>
                        <th
                          scope="col"
                          className="px-6 py-4 text-right text-xs font-medium text-gray-300 uppercase tracking-wider font-poppins"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {cartItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-800 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-16 w-16 flex-shrink-0 bg-gray-800 rounded-[12px] overflow-hidden">
                                <img
                                  className="h-16 w-16 object-cover"
                                  src={item.imageUrl || getPlaceholderImage(80, 80)}
                                  alt={item.name}
                                />
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-white font-inter">{item.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white font-inter">${item.price.toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <button
                                onClick={() => {
                                  if (item.quantity === 1) {
                                    removeFromCart(item.id);
                                  } else {
                                    updateQuantity(item.id, item.quantity - 1);
                                  }
                                }}
                                className="bg-black text-white p-2 rounded-l-lg border-t border-b border-l border-gray-700 hover:bg-gray-700 transition-colors flex items-center justify-center w-10 h-10"
                              >
                                <Minus size={16} />
                              </button>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.id, Math.max(1, parseInt(e.target.value)))}
                                className="w-12 h-10 text-center border-t border-b border-gray-700 bg-black text-white"
                                min="1"
                              />
                              <button
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="bg-black text-white p-2 rounded-r-lg hover:bg-gray-700 transition-colors flex items-center justify-center w-10 h-10 border-t border-b border-r border-gray-700"
                              >
                                <Plus size={16} />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-white font-medium font-inter">
                              ${(item.price * item.quantity).toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-gray-400 hover:text-white transition-colors bg-gray-800 p-2 rounded-[12px]"
                            >
                              <X size={18} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-6 py-4 bg-black flex justify-between">
                  <button
                    onClick={clearCart}
                    className="text-gray-400 hover:text-white text-sm font-medium transition-colors font-inter hover:bg-gray-800 p-2 rounded-[12px]"
                  >
                    Clear Cart
                  </button>
                  <Link
                    to="/shop"
                    className="text-gray-400 hover:text-white text-sm font-medium transition-colors font-inter flex items-center gap-1 hover:bg-gray-800 p-2 rounded-[12px]"
                  >
                    Continue Shopping
                    <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-gray-900 border border-gray-800 rounded-[12px] p-6">
                <h2 className="text-xl font-bold mb-6 font-poppins">ORDER SUMMARY</h2>

                <div className="space-y-4">
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

                  {discount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span className="font-inter">Discount</span>
                      <span className="font-inter">-${discount.toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-t border-gray-800 pt-4 flex justify-between">
                    <span className="font-semibold text-white font-inter">Total</span>
                    <span className="font-bold text-white text-xl font-inter">${orderTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-8 space-y-4">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Coupon Code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="bg-black text-white px-4 py-2 rounded-[12px] border border-gray-700 flex-grow focus:outline-none focus:border-white"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={!couponCode}
                      className="bg-white text-black px-4 py-2 rounded-[12px] hover:bg-gray-200 transition-colors flex items-center gap-1 font-inter"
                    >
                      <Tag size={16} />
                      Apply
                    </button>
                  </div>

                  {currentUser ? (
                    <Link
                      to="/checkout"
                      className="bg-white text-black w-full py-3 rounded-[12px] hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 font-inter"
                    >
                      Proceed to Checkout
                      <ChevronRight size={18} />
                    </Link>
                  ) : (
                    <Link
                      to="/login"
                      className="bg-gray-800 text-gray-300 w-full py-3 rounded-[12px] hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 font-inter"
                    >
                      Sign In to Checkout
                      <ChevronRight size={18} />
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  )
}

