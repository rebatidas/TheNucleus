import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { setAuthToken } from './api/client'

// initialize auth header from stored token if present
const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
setAuthToken(token)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
