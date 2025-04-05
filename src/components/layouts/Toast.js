import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

export default function Toast({ message, isVisible, onClose, type = 'success' }) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50 px-4 backdrop-blur-sm"
        >
          <div className="absolute inset-0 bg-black bg-opacity-70" onClick={onClose}></div>
          <motion.div
            className="bg-black border-2 border-white rounded-lg p-8 shadow-2xl relative z-10 max-w-md w-full"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                {type === 'success' ? (
                  <CheckCircle className="h-8 w-8 text-green-500" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-red-500" />
                )}
                <h3 className="text-2xl font-bold text-white font-poppins tracking-tight">
                  {type === 'success' ? 'Success!' : 'Error'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>
            <div className="mt-4">
              {typeof message === 'string' ? (
                <p className="text-gray-300 text-lg font-inter leading-relaxed">{message}</p>
              ) : (
                <div className="text-gray-300">{message}</div>
              )}
            </div>
            {type === 'success' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6"
              >
                <button
                  onClick={onClose}
                  className="bg-white text-black px-6 py-2 rounded-lg hover:bg-gray-200 transition-colors font-inter font-medium"
                >
                  Continue
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 