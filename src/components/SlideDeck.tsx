import { useEffect, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { ChevronLeft, ChevronRight, MessageSquare, PanelRightOpen, PanelRightClose } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from '../hooks/useTheme'
import { BrandSlide } from './BrandSlide'
import { SynopsisSlide } from './SynopsisSlide'
import { DualFrameworkSlide } from './DualFrameworkSlide'
import { SpaceFrameworkSlide } from './SpaceFrameworkSlide'
import { ChatSidebar } from './ChatSidebar'
import type { Slide } from '../types/slide.types'

type SlideDeckProps = {
  slides: Slide[]
}

export function SlideDeck({ slides }: SlideDeckProps) {
  const { theme, toggleTheme } = useTheme()
  const [index, setIndex] = useState(0)
  const [infoTrigger, setInfoTrigger] = useState(0)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [shouldShowSidebar, setShouldShowSidebar] = useState(true)

  // Check if sidebar should be visible based on viewport width
  useEffect(() => {
    const checkWidth = () => {
      // Slide width (1260px) + Sidebar min width (380px) + padding = ~1700px
      const minWidthForSidebar = 1700
      const shouldShow = window.innerWidth >= minWidthForSidebar
      setShouldShowSidebar(shouldShow)
      
      // Auto-close sidebar if screen is too small
      if (!shouldShow) {
        setIsSidebarOpen(false)
      } else {
        setIsSidebarOpen(true)
      }
    }

    checkWidth()
    window.addEventListener('resize', checkWidth)
    return () => window.removeEventListener('resize', checkWidth)
  }, [])

  const slide = slides[index]
  const goNext = () => setIndex((idx) => Math.min(idx + 1, slides.length - 1))
  const goPrev = () => setIndex((idx) => Math.max(idx - 1, 0))

  const bind = useDrag(({ swipe: [swipeX], active }) => {
    if (!active && swipeX !== 0) {
      if (swipeX < 0) goNext()
      if (swipeX > 0) goPrev()
    }
  })

  // Reset trigger when slide changes
  useEffect(() => {
    // Trigger is reset automatically by component
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

  return (
    <div className={`deck ${shouldShowSidebar ? 'with-sidebar' : 'without-sidebar'}`}>
      <div className="deck-content">
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
                {slide.layout === 'brand' ? (
                  <BrandSlide slide={slide} />
                ) : slide.layout === 'synopsis' ? (
                  <SynopsisSlide slide={slide} />
                ) : slide.layout === 'dora-metrics' ? (
                  <DualFrameworkSlide
                    metrics={slide.metrics}
                    title={slide.title}
                    subtitle={slide.subtitle}
                  />
                ) : slide.layout === 'space-framework' ? (
                  <SpaceFrameworkSlide slide={slide} />
                ) : null}
              </div>
              <button
                type="button"
                className="chat-toggle-button"
                onClick={() => setInfoTrigger((prev) => prev + 1)}
                aria-label="Show slide info"
              >
                <MessageSquare size={18} />
              </button>
            </motion.section>
          </AnimatePresence>
        </div>

        <div className="controls">
          <button type="button" className="nav" onClick={goPrev} disabled={index === 0}>
            <ChevronLeft aria-hidden size={20} /> Prev
          </button>
          <div className="progress" aria-live="polite">
            <span className="progress-text">
              {index + 1}
              <span className="progress-separator"> / </span>
              {slides.length}
            </span>
          </div>
          <button type="button" className="nav" onClick={goNext} disabled={index === slides.length - 1}>
            Next <ChevronRight aria-hidden size={20} />
          </button>
        </div>
      </div>

      {!shouldShowSidebar && (
        <button
          className="sidebar-toggle"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label={isSidebarOpen ? 'Close sidebar' : 'Open sidebar'}
        >
          {isSidebarOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
        </button>
      )}

      <ChatSidebar 
        currentSlide={slide} 
        triggerInfo={infoTrigger} 
        theme={theme} 
        onToggleTheme={toggleTheme}
        isOpen={isSidebarOpen}
      />
    </div>
  )
}
