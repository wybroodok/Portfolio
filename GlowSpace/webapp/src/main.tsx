import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initTheme } from './theme'

initTheme()

// Initialise Telegram WebApp
const tg = (window as any).Telegram?.WebApp
if (tg) {
  tg.ready()
  tg.expand()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
