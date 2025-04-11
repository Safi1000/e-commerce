"use client"

import React from "react"

import { useState, useEffect } from "react"
import { collection, getDocs, query, where, orderBy, doc, updateDoc } from "firebase/firestore"
import { db } from "../../../firebase/config"
import { format as formatDateFromDateFns } from "date-fns"
import { Printer, X } from "lucide-react"

export default function OrderList() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState("all")
  const [dateRange, setDateRange] = useState({ start: "", end: "" })
  const [expandedOrderId, setExpandedOrderId] = useState(null)
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState(null)

  // Status options for filtering and updating
  const statusOptions = [
    { value: "pending", label: "Pending", color: "bg-yellow-500" },
    { value: "processing", label: "Processing", color: "bg-blue-500" },
    { value: "shipped", label: "Shipped", color: "bg-purple-500" },
    { value: "delivered", label: "Delivered", color: "bg-green-500" },
    { value: "cancelled", label: "Cancelled", color: "bg-red-500" },
  ]

  useEffect(() => {
    fetchOrders()
  }, [selectedStatus, dateRange])

  const fetchOrders = async () => {
    try {
      setLoading(true)

      // Start with a base query reference
      const ordersRef = collection(db, "orders")
      const constraints = []

      // Add status filter if not "all"
      if (selectedStatus !== "all") {
        constraints.push(where("status", "==", selectedStatus))
      }

      // Add date range filters if provided
      if (dateRange.start && dateRange.end) {
        const startDate = new Date(dateRange.start)
        startDate.setHours(0, 0, 0, 0) // Start of day

        const endDate = new Date(dateRange.end)
        endDate.setHours(23, 59, 59, 999) // End of day

        constraints.push(where("createdAt", ">=", startDate.toISOString()))
        constraints.push(where("createdAt", "<=", endDate.toISOString()))
      }

      // Always add sorting
      constraints.push(orderBy("createdAt", "desc"))

      // Build the query with all constraints
      let ordersQuery
      if (constraints.length > 0) {
        ordersQuery = query(ordersRef, ...constraints)
      } else {
        ordersQuery = query(ordersRef, orderBy("createdAt", "desc"))
      }

      // Execute the query
      const ordersSnapshot = await getDocs(ordersQuery)
      const ordersList = ordersSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))

      setOrders(ordersList)
    } catch (error) {
      console.error("Error fetching orders:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      })

      // Update local state
      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, status: newStatus, updatedAt: new Date().toISOString() } : order,
        ),
      )
    } catch (error) {
      console.error("Error updating order status:", error)
    }
  }

  const toggleOrderDetails = (orderId) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId)
  }

  const formatDate = (dateString) => {
    try {
      return formatDateFromDateFns(new Date(dateString), "MMM dd, yyyy h:mm a")
    } catch (error) {
      console.error("Date formatting error:", error)
      return "Invalid date"
    }
  }

  const calculateOrderTotal = (items) => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const shipping = subtotal > 100 ? 0 : 10
    const tax = subtotal * 0.08
    return (subtotal + shipping + tax).toFixed(2)
  }

  const getStatusBadge = (status) => {
    const statusOption = statusOptions.find((option) => option.value === status) || {
      color: "bg-gray-500",
      label: "Unknown",
    }

    return (
      <span className={`${statusOption.color} text-white text-xs px-2 py-1 rounded-full`}>{statusOption.label}</span>
    )
  }

  const clearFilters = () => {
    setSelectedStatus("all")
    setDateRange({ start: "", end: "" })
  }

  const handleViewInvoice = (order) => {
    setSelectedOrderForInvoice(order)
  }

  const handleCloseInvoice = () => {
    setSelectedOrderForInvoice(null)
  }

  const handlePrintInvoice = () => {
    window.print()
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Order Management</h1>

      {/* Filters */}
      <div className="bg-white rounded-[12px] shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filters</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="block w-full border border-gray-300 rounded-[12px] shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="all">All Statuses</option>
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="block w-full border border-gray-300 rounded-[12px] shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="block w-full border border-gray-300 rounded-[12px] shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={clearFilters}
            className="bg-gray-200 text-gray-800 py-2 px-4 rounded-[12px] hover:bg-gray-300 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-[12px] shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">No orders found matching your filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleOrderDetails(order.id)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{order.id.slice(0, 8)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.customer.firstName} {order.customer.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${calculateOrderTotal(order.items)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {getStatusBadge(order.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleViewInvoice(order)
                            }}
                            className="text-blue-600 hover:text-blue-800"
                            title="View Invoice"
                          >
                            <Printer size={18} />
                          </button>
                          <select
                            value={order.status}
                            onChange={(e) => {
                              e.stopPropagation()
                              handleStatusChange(order.id, e.target.value)
                            }}
                            className="border border-gray-300 rounded-[12px] shadow-sm py-1 px-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {statusOptions.map((option) => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Order Details */}
                    {expandedOrderId === order.id && (
                      <tr>
                        <td colSpan="6" className="px-6 py-4 bg-gray-50">
                          <div className="border-t border-gray-200 pt-4">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Order Details</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <h4 className="font-medium text-gray-700 mb-2">Shipping Information</h4>
                                <p className="text-sm text-gray-600">
                                  {order.customer.firstName} {order.customer.lastName}
                                  <br />
                                  {order.customer.address}
                                  <br />
                                  {order.customer.city}, {order.customer.state} {order.customer.zipCode}
                                  <br />
                                  {order.customer.country}
                                </p>
                              </div>

                              <div>
                                <h4 className="font-medium text-gray-700 mb-2">Contact Information</h4>
                                <p className="text-sm text-gray-600">
                                  Email: {order.customer.email}
                                  <br />
                                </p>
                              </div>
                            </div>

                            <h4 className="font-medium text-gray-700 mb-2">Items</h4>
                            <div className="overflow-x-auto">
                              <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      Product
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      Price
                                    </th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                      Quantity
                                    </th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                      Total
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {order.items.map((item, index) => (
                                    <tr key={index}>
                                      <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                                      <td className="px-4 py-2 text-sm text-gray-500">${item.price.toFixed(2)}</td>
                                      <td className="px-4 py-2 text-sm text-gray-500">{item.quantity}</td>
                                      <td className="px-4 py-2 text-sm text-gray-900 text-right">
                                        ${(item.price * item.quantity).toFixed(2)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot className="bg-gray-50">
                                  <tr>
                                    <td colSpan="3" className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                                      Subtotal:
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-900 text-right">
                                      $
                                      {order.items
                                        .reduce((sum, item) => sum + item.price * item.quantity, 0)
                                        .toFixed(2)}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td colSpan="3" className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                                      Shipping:
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-900 text-right">
                                      $
                                      {order.items.reduce((sum, item) => sum + item.price * item.quantity, 0) > 100
                                        ? "0.00"
                                        : "10.00"}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td colSpan="3" className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                                      Tax:
                                    </td>
                                    <td className="px-4 py-2 text-sm text-gray-900 text-right">
                                      $
                                      {(
                                        order.items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 0.08
                                      ).toFixed(2)}
                                    </td>
                                  </tr>
                                  <tr>
                                    <td colSpan="3" className="px-4 py-2 text-sm font-bold text-gray-900 text-right">
                                      Total:
                                    </td>
                                    <td className="px-4 py-2 text-sm font-bold text-gray-900 text-right">
                                      ${calculateOrderTotal(order.items)}
                                    </td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Modal */}
      {selectedOrderForInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[12px] shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Invoice</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={handlePrintInvoice}
                    className="bg-blue-600 text-white py-2 px-4 rounded-[12px] hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <Printer size={18} className="mr-2" />
                    Print
                  </button>
                  <button
                    onClick={handleCloseInvoice}
                    className="bg-gray-200 text-gray-800 py-2 px-4 rounded-[12px] hover:bg-gray-300 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="invoice-content">
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-lg font-bold mb-2">ShopEase</h3>
                    <p className="text-gray-600">123 E-Commerce Street</p>
                    <p className="text-gray-600">New York, NY 10001</p>
                    <p className="text-gray-600">contact@shopease.com</p>
                  </div>
                  <div className="text-right">
                    <h3 className="text-lg font-bold mb-2">Invoice #{selectedOrderForInvoice.id.slice(0, 8)}</h3>
                    <p className="text-gray-600">Date: {formatDate(selectedOrderForInvoice.createdAt)}</p>
                    <p className="text-gray-600">Status: {selectedOrderForInvoice.status}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="text-lg font-bold mb-2">Bill To:</h3>
                    <p className="text-gray-600">
                      {selectedOrderForInvoice.customer.firstName} {selectedOrderForInvoice.customer.lastName}
                    </p>
                    <p className="text-gray-600">{selectedOrderForInvoice.customer.address}</p>
                    <p className="text-gray-600">
                      {selectedOrderForInvoice.customer.city}, {selectedOrderForInvoice.customer.state}{" "}
                      {selectedOrderForInvoice.customer.zipCode}
                    </p>
                    <p className="text-gray-600">{selectedOrderForInvoice.customer.country}</p>
                    <p className="text-gray-600">Email: {selectedOrderForInvoice.customer.email}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold mb-2">Shipping Address:</h3>
                    <p className="text-gray-600">
                      {selectedOrderForInvoice.customer.firstName} {selectedOrderForInvoice.customer.lastName}
                    </p>
                    <p className="text-gray-600">{selectedOrderForInvoice.customer.address}</p>
                    <p className="text-gray-600">
                      {selectedOrderForInvoice.customer.city}, {selectedOrderForInvoice.customer.state}{" "}
                      {selectedOrderForInvoice.customer.zipCode}
                    </p>
                    <p className="text-gray-600">{selectedOrderForInvoice.customer.country}</p>
                  </div>
                </div>

                <table className="min-w-full divide-y divide-gray-200 mb-8">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedOrderForInvoice.items.map((item, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">${item.price.toFixed(2)}</td>
                        <td className="px-4 py-2 text-sm text-gray-500">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 text-right">
                          ${(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan="3" className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                        Subtotal:
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">
                        $
                        {selectedOrderForInvoice.items
                          .reduce((sum, item) => sum + item.price * item.quantity, 0)
                          .toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                        Shipping:
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">
                        $
                        {selectedOrderForInvoice.items.reduce((sum, item) => sum + item.price * item.quantity, 0) > 100
                          ? "0.00"
                          : "10.00"}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                        Tax:
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 text-right">
                        $
                        {(
                          selectedOrderForInvoice.items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 0.08
                        ).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="3" className="px-4 py-2 text-sm font-bold text-gray-900 text-right">
                        Total:
                      </td>
                      <td className="px-4 py-2 text-sm font-bold text-gray-900 text-right">
                        ${calculateOrderTotal(selectedOrderForInvoice.items)}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                <div className="text-center text-gray-500 text-sm">
                  <p>Thank you for your business!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

