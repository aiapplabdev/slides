import { useEffect, useState } from 'react'
import { useDrag } from '@use-gesture/react'
import { ChevronLeft, ChevronRight, Info, MessageSquare } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { useTheme } from '../hooks/useTheme'
import { BrandSlide } from './BrandSlide'
import { SynopsisSlide } from './SynopsisSlide'
import { DoraMetricsSlide } from './DoraMetricsSlide'
import { ChatSidebar } from './ChatSidebar'
import type { Slide } from '../types/slide.types'

type SlideDeckProps = {
  slides: Slide[]
}

export function SlideDeck({ slides }: SlideDeckProps) {
  const { theme, toggleTheme } = useTheme()
  const [index, setIndex] = useState(0)
  const [infoTrigger, setInfoTrigger] = useState(0)

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
    <div className="deck">
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
                  <DoraMetricsSlide 
                    metrics={slide.metrics} 
                    title={slide.title} 
                    subtitle={slide.subtitle} 
                  />
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

      <ChatSidebar currentSlide={slide} triggerInfo={infoTrigger} theme={theme} onToggleTheme={toggleTheme} />
    </div>
  )
}
