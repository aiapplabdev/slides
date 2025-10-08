import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Info, Moon, Sun } from 'lucide-react'
import { useDrag } from '@use-gesture/react'
import clsx from 'clsx'
import './index.css'
import './App.css'

import data from '../engineering_metrics_benchmark_template.json'
import logoShield from '../images/logo_transperant.png'

const slidesContent = [
  {
    id: 'intro',
    title: 'Mag Tech AI',
    subtitle: 'Engineering Transformation Metrics Dashboard',
    body: `Stemming from the GNTeq assessment, this briefing positions Mag Tech AI as the strategic partner ready to deliver elite engineering velocity, stability, and innovation.`,
    info: {
      title: 'What this slide shows',
      body: 'Introduces Mag Tech AI, aligns stakeholders on the session’s purpose, and connects the assessment to the transformation programme.',
      utility: 'Sets context so the audience understands the narrative and benchmarks referenced throughout the deck.'
    },
    benchmark: 'Highlights the delta between GNTeq’s current posture and elite performers, framing the urgency presented in the executive summary.'
  },
  {
    id: 'synopsis',
    title: 'Assessment Synopsis',
    subtitle: 'Scope, data sources, and evaluation methodology',
    body: data.assessment_overview.executive_summary ??
      'The assessment spans software delivery velocity, developer experience, AI readiness, security posture, and product operating model to map GNTeq against elite benchmarks.',
    info: {
      title: 'What this slide shows',
      body: 'Summarises the breadth of the GNTeq assessment including metrics frameworks and qualitative inputs.',
      utility: 'Prepares viewers for how metrics relate to industry standards by clarifying the data foundation.'
    },
    benchmark: 'All subsequent metrics are compared with elite/high-performer thresholds from DORA, BlueOptima, SPACE, and DevSecOps best practices.'
  }
] as const

type Slide = (typeof slidesContent)[number]

const THEME_STORAGE_KEY = 'magtech-theme'

function resolveInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  return prefersDark ? 'dark' : 'light'
}

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => resolveInitialTheme())

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.dataset.theme = theme
    }
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  return { theme, toggleTheme }
}

function SlideDeck() {
  const { theme, toggleTheme } = useTheme()
  const [index, setIndex] = useState(0)
  const [infoOpen, setInfoOpen] = useState(false)

  const slide = slidesContent[index]

  const goNext = () => setIndex((idx) => Math.min(idx + 1, slidesContent.length - 1))
  const goPrev = () => setIndex((idx) => Math.max(idx - 1, 0))

  const bind = useDrag(({ swipe: [swipeX], active }) => {
    if (!active && swipeX !== 0) {
      if (swipeX < 0) goNext()
      if (swipeX > 0) goPrev()
    }
  })

  useEffect(() => {
    setInfoOpen(false)
  }, [index])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        goNext()
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goPrev()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  })

  const renderInfo = (item: Slide) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.28 }}
      className="info-card"
    >
      <h3>{item.info.title}</h3>
      <p>{item.info.body}</p>
      <div className="divider" role="presentation" />
      <h4>Why it matters</h4>
      <p>{item.info.utility}</p>
      <div className="divider" role="presentation" />
      <h4>Benchmark focus</h4>
      <p>{item.benchmark}</p>
    </motion.div>
  )

  return (
    <div className="deck">
      <div className="chrome">
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <div className="progress">
          {slidesContent.map((_, i) => (
            <span key={_.id} className={clsx('dot', { active: i === index })} />
          ))}
        </div>
      </div>

      <div className="viewport" {...bind()} role="presentation">
        <AnimatePresence mode="wait">
          <motion.section
            key={slide.id}
            className="slide"
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -60 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="slide-content">
              {slide.id === 'intro' ? (
                <div className="brand">
                  <img src={logoShield} alt="Mag Tech AI logo" className="logo" />
                  <div className="brand-text">
                    <h1>{slide.title}</h1>
                    <p>{slide.subtitle}</p>
                  </div>
                </div>
              ) : (
                <div className="slide-header">
                  <h2>{slide.title}</h2>
                  <p>{slide.subtitle}</p>
                </div>
              )}
              <div className={clsx('slide-body', { 'synopsis-body': slide.id === 'synopsis' })}>
                {slide.id === 'intro' ? (
                  <p className="lead">{slide.body}</p>
                ) : (
                  <article>
                    <p>{slide.body}</p>
                  </article>
                )}
              </div>
            </div>
            <button
              type="button"
              className="info-button"
              onClick={() => setInfoOpen((o) => !o)}
              aria-expanded={infoOpen}
              aria-controls="slide-info"
            >
              <Info size={18} />
            </button>
            <AnimatePresence>
              {infoOpen && (
                <motion.aside
                  id="slide-info"
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 40 }}
                  transition={{ duration: 0.24 }}
                  className="info-panel"
                >
                  {renderInfo(slide)}
                </motion.aside>
              )}
            </AnimatePresence>
          </motion.section>
        </AnimatePresence>
      </div>

      <div className="controls">
        <button type="button" className="nav" onClick={goPrev} disabled={index === 0}>
          <ChevronLeft aria-hidden size={20} /> Prev
        </button>
        <button
          type="button"
          className="nav"
          onClick={goNext}
          disabled={index === slidesContent.length - 1}
        >
          Next <ChevronRight aria-hidden size={20} />
        </button>
      </div>
    </div>
  )
}

function App() {
  return <SlideDeck />
}

export default App
