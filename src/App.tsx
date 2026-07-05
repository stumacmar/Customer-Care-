/*
 * App shell. Two tabs — Plots (developments → a development's plots → a plot)
 * and Code (the searchable New Homes Quality Code). A plain state-based router
 * with a small view stack; the bottom tab bar switches between the two.
 */

import { useEffect, useState } from 'react'
import { DevelopmentsList } from './components/DevelopmentsList'
import { DevelopmentScreen } from './components/DevelopmentScreen'
import { PlotScreen } from './components/PlotScreen'
import { NewPlotSheet } from './components/NewPlotSheet'
import { NewDevelopmentSheet } from './components/NewDevelopmentSheet'
import { SettingsSheet } from './components/SettingsSheet'
import { HelpSheet } from './components/HelpSheet'
import { CodeSearch } from './components/CodeSearch'
import { useToast } from './components/ui'
import { useStore } from './state/store'

type Tab = 'plots' | 'code'
type View =
  | { name: 'developments' }
  | { name: 'development'; devId: string }
  | { name: 'plot'; plotId: string; devId: string }

export function App() {
  const { state } = useStore()
  const [tab, setTab] = useState<Tab>('plots')
  const [view, setView] = useState<View>({ name: 'developments' })
  const [newPlotForDev, setNewPlotForDev] = useState<string | null>(null)
  const [showNewDev, setShowNewDev] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const { show, node: toastNode } = useToast()

  // First-ever open: show the 7-line guide once. After that it lives behind ❓.
  useEffect(() => {
    try {
      if (!localStorage.getItem('plot-clock-help-seen')) {
        localStorage.setItem('plot-clock-help-seen', '1')
        setShowHelp(true)
      }
    } catch {
      /* private browsing — skip */
    }
  }, [])

  const openDevelopment = (devId: string) => setView({ name: 'development', devId })
  const openPlot = (plotId: string, devId: string) => setView({ name: 'plot', plotId, devId })
  const toDevelopments = () => setView({ name: 'developments' })

  const backLabel =
    view.name === 'plot' ? '‹ Plots' : view.name === 'development' ? '‹ Developments' : ''
  const goBack = () => {
    if (view.name === 'plot') setView({ name: 'development', devId: view.devId })
    else toDevelopments()
  }

  const showBack = tab === 'plots' && view.name !== 'developments'

  return (
    <div className="app">
      <header className="topbar">
        {showBack ? (
          <button className="backbtn" onClick={goBack} aria-label="Back">
            {backLabel}
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
        <button className="iconbtn" onClick={() => setShowHelp(true)} aria-label="How to use">
          ❓
        </button>
        <button className="iconbtn" onClick={() => setShowSettings(true)} aria-label="Settings">
          ⚙️
        </button>
      </header>

      <main className="tab-body">
        {tab === 'code' ? (
          <CodeSearch />
        ) : view.name === 'developments' ? (
          <DevelopmentsList
            onOpenDevelopment={openDevelopment}
            onNewDevelopment={() => setShowNewDev(true)}
          />
        ) : view.name === 'development' ? (
          <DevelopmentScreen
            devId={view.devId}
            onOpenPlot={(plotId) => openPlot(plotId, view.devId)}
            onNewPlot={(devId) => setNewPlotForDev(devId)}
            onBack={toDevelopments}
            onToast={show}
          />
        ) : (
          <PlotScreen
            plotId={view.plotId}
            onBack={() => setView({ name: 'development', devId: view.devId })}
            onToast={show}
          />
        )}
      </main>

      {tab === 'plots' && view.name === 'developments' && (
        <button className="fab" onClick={() => setShowNewDev(true)}>
          + Development
        </button>
      )}

      <nav className="tabbar">
        <button className={`tab${tab === 'plots' ? ' active' : ''}`} onClick={() => setTab('plots')}>
          <span className="tab-ico">🏠</span>
          Plots
        </button>
        <button className={`tab${tab === 'code' ? ' active' : ''}`} onClick={() => setTab('code')}>
          <span className="tab-ico">📖</span>
          The Code
        </button>
      </nav>

      {showNewDev && (
        <NewDevelopmentSheet
          onClose={() => setShowNewDev(false)}
          onCreated={(devId) => {
            setShowNewDev(false)
            openDevelopment(devId)
          }}
        />
      )}

      {newPlotForDev && (
        <NewPlotSheet
          developmentId={newPlotForDev}
          onClose={() => setNewPlotForDev(null)}
          onCreated={(plotId) => {
            const devId = newPlotForDev
            setNewPlotForDev(null)
            openPlot(plotId, devId)
          }}
        />
      )}

      {showSettings && <SettingsSheet onClose={() => setShowSettings(false)} onToast={show} />}

      {showHelp && <HelpSheet onClose={() => setShowHelp(false)} />}

      {toastNode}
    </div>
  )
}
