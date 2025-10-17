import { useMemo, useState } from 'react'
import type { SynopsisSlide as SynopsisSlideType } from '../types/slide.types'
import '../styles/SynopsisSlide.css'

const VIEW_TABS = ['overview', 'findings', 'pillars'] as const

type ViewTab = (typeof VIEW_TABS)[number]

type SynopsisSlideProps = {
  slide: SynopsisSlideType
}

export function SynopsisSlide({ slide }: SynopsisSlideProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>('overview')

  const paragraphs = slide.synopsis.paragraphs.length > 0
    ? slide.synopsis.paragraphs
    : [
        'The assessment covers delivery velocity, developer experience, AI readiness, security posture, and product operating model to map the organisation against industry benchmarks.',
      ]
  const findings = slide.synopsis.findings.length > 0
    ? slide.synopsis.findings
    : [
        'Delivery velocity and stability trail elite benchmarks, slowing release cadence.',
        'Developer experience is constrained by tooling friction and fragmented automation.',
        'AI adoption and security governance require structured investment to scale responsibly.',
      ]
  const pillars = slide.synopsis.pillars.length > 0
    ? slide.synopsis.pillars
    : [
        'Modernise the engineering engine via automated CI/CD and DevSecOps.',
        'Adopt an empowered product operating model with long-lived teams.',
        'Embed AI-assisted development and proactive security workflows.',
      ]
  const sources = slide.synopsis.sources
  const stats = useMemo(
    () => ({
      paragraphs: paragraphs.length,
      findings: findings.length,
      pillars: pillars.length,
      sources: sources.length,
    }),
    [findings.length, paragraphs.length, pillars.length, sources.length],
  )

  return (
    <div className="synopsis-slide">
      <div className="slide-header">
        <h2>{slide.title}</h2>
        {slide.subtitle && <p>{slide.subtitle}</p>}
      </div>

      <div className="tab-bar">
        {VIEW_TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={`tab-button ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      <div className="synopsis-body">
        {activeTab === 'overview' && (
          <OverviewTab
            paragraphs={paragraphs}
            findings={findings}
            sources={sources}
            stats={stats}
            subtitle={slide.subtitle}
          />
        )}
        {activeTab === 'findings' && <FindingsTab findings={findings} />}
        {activeTab === 'pillars' && <PillarsTab pillars={pillars} sources={sources} />}
      </div>
    </div>
  )
}

const TAB_LABELS: Record<ViewTab, string> = {
  overview: 'Overview',
  findings: 'Key Findings',
  pillars: 'Strategic Pillars',
}

type Source = SynopsisSlideType['synopsis']['sources'][number]

function OverviewTab({
  paragraphs,
  findings,
  sources,
  stats,
  subtitle,
}: {
  paragraphs: string[]
  findings: string[]
  sources: Source[]
  stats: { paragraphs: number; findings: number; pillars: number; sources: number }
  subtitle?: string
}) {
  const [lead, ...supporting] = paragraphs
  const highlightFindings = findings.slice(0, 2)
  const spotlightSources = sources.slice(0, 2)

  return (
    <div className="synopsis-overview-grid">
      <section className="synopsis-hero-card">
        <header>
          <h3>Executive Summary</h3>
          {subtitle && <span className="synopsis-kicker">{subtitle}</span>}
        </header>
        <p className="synopsis-lead">{lead}</p>
        {supporting.length > 0 && (
          <div className="synopsis-paragraphs">
            {supporting.map((paragraph, idx) => (
              <p key={`supporting-${idx}`}>{paragraph}</p>
            ))}
          </div>
        )}
      </section>

      <aside className="synopsis-overview-side">
        <div className="synopsis-stat-cluster">
          <StatCard label="Paragraphs" value={stats.paragraphs} caption="Narrative sections" />
          <StatCard label="Key Findings" value={stats.findings} caption="Diagnostic hotspots" />
          <StatCard label="Strategic Pillars" value={stats.pillars} caption="Transformation themes" />
          <StatCard label="Sources" value={stats.sources} caption="Evidence references" />
        </div>

        <div className="synopsis-highlight-card">
          <header>
            <h4>Signal Highlights</h4>
            <span>Leading indicators surfaced</span>
          </header>
          <ul>
            {highlightFindings.map((finding, idx) => (
              <li key={`highlight-finding-${idx}`}>
                <span className="dot" aria-hidden />
                {finding}
              </li>
            ))}
          </ul>
        </div>

        {spotlightSources.length > 0 && (
          <div className="synopsis-highlight-card secondary">
            <header>
              <h4>Evidence Base</h4>
              <span>Primary benchmark references</span>
            </header>
            <ul>
              {spotlightSources.map((source, idx) => (
                <li key={`spotlight-source-${idx}`}>
                  <span className="dot" aria-hidden />
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
          </div>
        )}
      </aside>
    </div>
  )
}

function FindingsTab({ findings }: { findings: string[] }) {
  return (
    <div className="synopsis-card-grid">
      {findings.map((finding, idx) => (
        <article key={`finding-card-${idx}`} className="synopsis-card">
          <span className="synopsis-card-index">0{idx + 1}</span>
          <p>{finding}</p>
        </article>
      ))}
    </div>
  )
}

function PillarsTab({ pillars, sources }: { pillars: string[]; sources: Source[] }) {
  return (
    <div className="synopsis-pillars-layout">
      <section className="synopsis-pillars-list">
        {pillars.map((pillar, idx) => (
          <article key={`pillar-${idx}`} className="pillar-card">
            <header>
              <span className="pillar-step">Step {idx + 1}</span>
              <h4>{pillar}</h4>
            </header>
            <p>
              {pillar.includes('.') ? pillar.split('.').slice(1).join('.').trim() || pillar : pillar}
            </p>
          </article>
        ))}
      </section>

      <section className="synopsis-sources-card">
        <header>
          <h4>Benchmark Sources</h4>
          <span>Curated references informing the assessment</span>
        </header>
        <ul>
          {sources.map((source, idx) => (
            <li key={`pillar-source-${idx}`}>
              <span className="dot" aria-hidden />
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
    </div>
  )
}

function StatCard({ label, value, caption }: { label: string; value: number; caption: string }) {
  return (
    <div className="synopsis-stat-card">
      <span className="stat-value">{value}</span>
      <div className="stat-meta">
        <span className="stat-label">{label}</span>
        <span className="stat-caption">{caption}</span>
      </div>
    </div>
  )
}
