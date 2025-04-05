import React from 'react';
import { Box, Typography, Paper, IconButton, Modal } from '@mui/material';
import { X } from 'lucide-react';

export default function MaterialToast({ message, isVisible, onClose, type = 'success' }) {
  return (
    <Modal
      open={isVisible}
      onClose={onClose} // Allow closing on backdrop click or escape key
      closeAfterTransition
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 2,
        zIndex: 1500,
      }}
      // Use simple semi-transparent backdrop without blur
      BackdropProps={{
        sx: { backgroundColor: 'rgba(0,0,0,0.5)' }
      }}
    >
      <Paper 
        elevation={24}
        sx={{ 
          bgcolor: 'black', 
          border: '2px solid white',
          color: 'white',
          borderRadius: '2px',
          p: { xs: 3, sm: 4 },
          minWidth: { xs: '300px', sm: '500px', md: '600px' },
          maxWidth: '90vw',
          width: '100%',
          animation: 'fadeIn 0.3s ease-out',
          '@keyframes fadeIn': {
            '0%': { opacity: 0, transform: 'scale(0.95)' },
            '100%': { opacity: 1, transform: 'scale(1)' },
          },
          overflow: 'auto',
          maxHeight: '90vh',
          boxShadow: '0 4px 30px rgba(0, 0, 0, 0.5)',
          position: 'relative', // Ensure z-index works
          zIndex: 1600, // Higher than Modal's z-index
        }}
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside the toast from closing it
      >
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-start' }}>
          <IconButton 
            onClick={onClose} 
            sx={{ 
              p: 0.5, 
              color: '#999', 
              '&:hover': { 
                color: 'white', 
                bgcolor: 'rgba(255,255,255,0.1)' 
              } 
            }}
          >
            <X size={20} />
          </IconButton>
        </Box>
        
        <Box sx={{ mt: -4 }}>
          {typeof message === 'string' ? (
            <Typography sx={{ color: '#e0e0e0', fontSize: '1rem', fontFamily: 'Inter' }}>
              {message}
            </Typography>
          ) : (
            <Box sx={{ color: '#e0e0e0' }}>{message}</Box>
          )}
        </Box>
        
        {type === 'success' && (
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
            <button
              onClick={onClose}
              style={{
                backgroundColor: 'white',
                color: 'black',
                padding: '10px 32px',
                borderRadius: '2px',
                border: 'none',
                fontFamily: 'Inter',
                fontWeight: 500,
                fontSize: '16px',
                cursor: 'pointer',
                transition: 'background-color 0.3s',
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f0f0f0'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'white'}
            >
              Continue Shopping
            </button>
          </Box>
        )}
      </Paper>
    </Modal>
  );
} 