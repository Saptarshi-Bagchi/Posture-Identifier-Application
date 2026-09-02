// ------------------------- IMPORTS -------------------------
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './app.jsx'
import './index.css'

// ------------------------- APPLICATION MOUNT -------------------------
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
