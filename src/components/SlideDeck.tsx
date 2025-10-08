import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Info, Moon, Sun } from 'lucide-react'
import { useDrag } from '@use-gesture/react'
import { useTheme } from '../hooks/useTheme'
import { BrandSlide } from './BrandSlide'
import { SynopsisSlide } from './SynopsisSlide'
import { SlideInfo } from './SlideInfo'
import type { Slide } from '../types/slide.types'

type SlideDeckProps = {
  slides: Slide[]
}

export function SlideDeck({ slides }: SlideDeckProps) {
  const { theme, toggleTheme } = useTheme()
  const [index, setIndex] = useState(0)
  const [infoOpen, setInfoOpen] = useState(false)

  const slide = slides[index]
  const goNext = () => setIndex((idx) => Math.min(idx + 1, slides.length - 1))
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
              {slide.layout === 'brand' ? (
                <BrandSlide slide={slide} />
              ) : slide.layout === 'synopsis' ? (
                <SynopsisSlide slide={slide} />
              ) : null}
            </div>
            <button
              type="button"
              className="info-button"
              onClick={() => setInfoOpen((open) => !open)}
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
                  <SlideInfo slide={slide} />
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
  )
}
