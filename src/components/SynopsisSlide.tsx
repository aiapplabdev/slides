import type { SynopsisSlide as SynopsisSlideType } from '../types/slide.types'

type SynopsisSlideProps = {
  slide: SynopsisSlideType
}

export function SynopsisSlide({ slide }: SynopsisSlideProps) {
  return (
    <>
      <div className="slide-header">
        <h2>{slide.title}</h2>
        {slide.subtitle && <p>{slide.subtitle}</p>}
      </div>
      <div className="slide-body synopsis-body">
        <article className="synopsis-summary">
          {(slide.synopsis.paragraphs.length > 0
            ? slide.synopsis.paragraphs
            : [
                'The assessment covers delivery velocity, developer experience, AI readiness, security posture, and product operating model to map the organisation against industry benchmarks.',
              ]
          ).map((paragraph, idx) => (
            <p key={`${slide.id}-p-${idx}`}>{paragraph}</p>
          ))}
        </article>
        <aside className="synopsis-aside">
          {slide.synopsis.findings.length > 0 && (
            <section>
              <h3>Key Findings</h3>
              <ul>
                {slide.synopsis.findings.map((finding, idx) => (
                  <li key={`${slide.id}-finding-${idx}`}>{finding}</li>
                ))}
              </ul>
            </section>
          )}
          {slide.synopsis.pillars.length > 0 && (
            <section>
              <h3>Strategic Pillars</h3>
              <ul>
                {slide.synopsis.pillars.map((pillar, idx) => (
                  <li key={`${slide.id}-pillar-${idx}`}>{pillar}</li>
                ))}
              </ul>
            </section>
          )}
          {slide.synopsis.sources.length > 0 && (
            <section>
              <h3>Benchmark Sources</h3>
              <ul>
                {slide.synopsis.sources.map((source, idx) => (
                  <li key={`${slide.id}-source-${idx}`}>
                    {source.url ? (
                      <a href={source.url} target="_blank" rel="noreferrer">
                        {source.title}
                      </a>
                    ) : (
                      source.title
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </>
  )
}
