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
import { GuideTab } from './components/GuideTab'
import { BrandMark } from './components/Brand'
import { Icon } from './components/icons'
import { useToast } from './components/ui'
import { useStore } from './state/store'

type Tab = 'plots' | 'guide' | 'code'
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
  // "Why?" affordances deep-link into the Code tab at the relevant clause.
  const [codeRef, setCodeRef] = useState<string | null>(null)
  const { show, node: toastNode } = useToast()

  const explainCode = (ref: string) => {
    setCodeRef(ref)
    setTab('code')
  }

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
          <>
            <button className="backbtn" onClick={goBack} aria-label="Back">
              {backLabel}
            </button>
            <div style={{ flex: 1 }} />
          </>
        ) : (
          <div className="brand">
            <BrandMark size={38} className="brand-mark" />
            <div className="brand-text">
              <span className="brand-name">NHQB</span>
              <span className="brand-sub">Plot Tracker</span>
            </div>
          </div>
        )}
        <button className="iconbtn" onClick={() => setShowHelp(true)} aria-label="How to use">
          <Icon name="help" size={22} />
        </button>
        <button className="iconbtn" onClick={() => setShowSettings(true)} aria-label="Settings">
          <Icon name="settings" size={21} />
        </button>
      </header>

      <main className="tab-body">
        {tab === 'code' ? (
          <CodeSearch openRef={codeRef} onRefConsumed={() => setCodeRef(null)} />
        ) : tab === 'guide' ? (
          <GuideTab />
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
            onExplainCode={explainCode}
          />
        )}
      </main>

      {/* The FAB is hidden on the empty state, which has its own centred CTA —
          otherwise "add development" appears twice (most obvious on desktop). */}
      {tab === 'plots' && view.name === 'developments' && state.developments.length > 0 && (
        <button className="fab" onClick={() => setShowNewDev(true)}>
          + Development
        </button>
      )}

      <nav className="tabbar">
        <button className={`tab${tab === 'plots' ? ' active' : ''}`} onClick={() => setTab('plots')}>
          <span className="tab-ico"><Icon name="home" size={22} /></span>
          Plots
        </button>
        <button className={`tab${tab === 'guide' ? ' active' : ''}`} onClick={() => setTab('guide')}>
          <span className="tab-ico"><Icon name="help" size={22} /></span>
          Guide
        </button>
        <button className={`tab${tab === 'code' ? ' active' : ''}`} onClick={() => setTab('code')}>
          <span className="tab-ico"><Icon name="book" size={22} /></span>
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

      {showHelp && (
        <HelpSheet
          onClose={() => setShowHelp(false)}
          onOpenGuide={() => {
            setShowHelp(false)
            setTab('guide')
          }}
        />
      )}

      {toastNode}
    </div>
  )
}
