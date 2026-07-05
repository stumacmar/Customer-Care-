/*
 * App shell. Two views — the dashboard and a single plot screen — with a plain
 * state-based router (no dependency, and the back button on a phone maps to
 * "close the sheet / go back to plots"). Keeps the whole thing one tap deep.
 */

import { useEffect, useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { PlotScreen } from './components/PlotScreen'
import { NewPlotSheet } from './components/NewPlotSheet'
import { SettingsSheet } from './components/SettingsSheet'
import { useToast } from './components/ui'
import { useStore } from './state/store'

type View = { name: 'dashboard' } | { name: 'plot'; plotId: string }

export function App() {
  const { state } = useStore()
  const [view, setView] = useState<View>({ name: 'dashboard' })
  const [showNewPlot, setShowNewPlot] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const { show, node: toastNode } = useToast()

  // Keep the browser/hardware back button in sync with our view stack.
  useEffect(() => {
    const onPop = () => setView({ name: 'dashboard' })
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const openPlot = (plotId: string) => {
    window.history.pushState({ plotId }, '')
    setView({ name: 'plot', plotId })
  }
  const backToDashboard = () => {
    setView({ name: 'dashboard' })
  }

  const onPlot = view.name === 'plot'

  return (
    <div className="app">
      <header className="topbar">
        {onPlot ? (
          <button className="backbtn" onClick={backToDashboard} aria-label="Back to plots">
            ‹ Plots
          </button>
        ) : (
          <>
            <span className="dot-xl rag-green" style={{ width: 20, height: 20, boxShadow: 'none' }} />
            <h1>
              Plot Clock
              <span className="sub"> · {state.developerName || 'NHQB compliance tracker'}</span>
            </h1>
          </>
        )}
        <div style={{ flex: 1 }} />
        <button className="iconbtn" onClick={() => setShowSettings(true)} aria-label="Settings">
          ⚙️
        </button>
      </header>

      {view.name === 'dashboard' ? (
        <Dashboard onOpenPlot={openPlot} onNewPlot={() => setShowNewPlot(true)} />
      ) : (
        <PlotScreen plotId={view.plotId} onBack={backToDashboard} onToast={show} />
      )}

      {view.name === 'dashboard' && (
        <button className="fab" onClick={() => setShowNewPlot(true)}>
          + Plot
        </button>
      )}

      {showNewPlot && (
        <NewPlotSheet
          onClose={() => setShowNewPlot(false)}
          onCreated={(plotId) => {
            setShowNewPlot(false)
            openPlot(plotId)
          }}
        />
      )}

      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} onToast={show} />}

      {toastNode}
    </div>
  )
}
