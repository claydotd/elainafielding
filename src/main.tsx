import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)
