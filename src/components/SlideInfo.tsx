import { motion } from 'framer-motion'
import type { Slide } from '../types/slide.types'

type SlideInfoProps = {
  slide: Slide
}

export function SlideInfo({ slide }: SlideInfoProps) {
  return (
    <motion.div
      key={slide.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.28 }}
      className="info-card"
    >
      <h3>{slide.info.title}</h3>
      <p>{slide.info.body}</p>
      <div className="divider" role="presentation" />
      {slide.info.utility && (
        <>
          <h4>Why it matters</h4>
          <p>{slide.info.utility}</p>
          <div className="divider" role="presentation" />
        </>
      )}
      <h4>Benchmark focus</h4>
      <p>{slide.benchmark}</p>
    </motion.div>
  )
}
