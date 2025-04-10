// Add React Query Provider to the index.js file
// First, import the necessary packages
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import React from "react"
import ReactDOM from "react-dom/client"
import App from "./App"
import "./index.css"
import Typography from '@mui/material/Typography'; // Correct import for Typography
import { createFilterOptions } from '@mui/material/useAutocomplete'; // Correct import for createFilterOptions
import Zoom from '@mui/material/Zoom'; // Correct import for Zoom
import { usePagination } from '@mui/material/usePagination'; // Correct import for usePagination


// Create a client with optimized settings to prevent infinite loops
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      // Add these settings to prevent excessive refetching
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes as default stale time
    },
  },
})

// Wrap the App component with QueryClientProvider
// If you're using React 18 with createRoot:
const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)

// If you're using older React with ReactDOM.render:
// ReactDOM.render(
//   <React.StrictMode>
//     <QueryClientProvider client={queryClient}>
//       <App />
//     </QueryClientProvider>
//   </React.StrictMode>,
//   document.getElementById('root')
// )
