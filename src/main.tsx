import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { BuyerApp, BUYER_STORAGE_KEY } from './buyer/BuyerApp'
import { StoreProvider } from './state/store'
import './styles.css'

/*
 * Persona boot. One static site serves two apps:
 *  - a #/buyer/<code> link (or #/buyer) opens the buyer's view — the code in
 *    the fragment carries the plot snapshot and never touches the network;
 *  - a device that has only ever held buyer data boots straight into the
 *    buyer view (so the buyer's home-screen install opens their app);
 *  - otherwise the developer's tracker loads as before.
 */
function boot() {
  const hash = location.hash
  let buyerCode: string | null = null
  if (hash.startsWith('#/buyer')) {
    const rest = hash.slice('#/buyer'.length)
    buyerCode = rest.startsWith('/') ? rest.slice(1) : ''
  }
  let hasBuyerState = false
  let hasDevState = false
  try {
    hasBuyerState = !!localStorage.getItem(BUYER_STORAGE_KEY)
    hasDevState = !!localStorage.getItem('plot-clock-state-v1')
  } catch {
    /* private browsing */
  }
  const buyerMode = buyerCode !== null || (hasBuyerState && !hasDevState)

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      {buyerMode ? (
        <BuyerApp initialCode={buyerCode || undefined} />
      ) : (
        <StoreProvider>
          <App />
        </StoreProvider>
      )}
    </StrictMode>
  )
}
boot()

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
