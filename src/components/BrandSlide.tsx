import type { BrandSlide as BrandSlideType } from '../types/slide.types'
import logoShield from '../../images/logo_transperant.png'

type BrandSlideProps = {
  slide: BrandSlideType
}

export function BrandSlide({ slide }: BrandSlideProps) {
  return (
    <div className="intro-brand">
      <div className="brand-hero">
        <div className="hero-logo">
          <img src={logoShield} alt={`${slide.id} logo`} />
        </div>
        <div className="hero-copy">
          {slide.hero.kicker && <span className="hero-kicker">{slide.hero.kicker}</span>}
          <h1>{slide.hero.title}</h1>
          {slide.hero.tagline && <p className="hero-tagline">{slide.hero.tagline}</p>}
        </div>
        {slide.metaDetails.length > 0 && (
          <ul className="hero-meta">
            {slide.metaDetails.map((detail) => (
              <li key={`${detail.label}-${detail.value}`}>
                <span className="meta-label">{detail.label}</span>
                <span className="meta-value">{detail.value}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
