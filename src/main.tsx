import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { StoreProvider } from './state/store'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>
)

// Register the offline service worker (production builds only — in dev the
// module paths differ and caching just gets in the way).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    // If the page was already controlled by a service worker, a *new* worker
    // taking over means a fresh deploy has activated — reload once so the user
    // sees the update immediately instead of a stale cached page. The guard
    // avoids reloading on the very first install (no prior controller).
    const hadController = !!navigator.serviceWorker.controller
    let reloaded = false
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || reloaded) return
      reloaded = true
      window.location.reload()
    })
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* offline support is a bonus, not a hard requirement */
    })
  })
}
