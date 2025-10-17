import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import * as echarts from 'echarts'
import type { SecurityPostureSlide as SecurityPostureSlideType, SammAssessment } from '../types/slide.types'
import '../styles/SecurityPostureSlide.css'

const VIEW_TABS = ['summary', 'top-performers', 'focus-areas'] as const

type ViewTab = (typeof VIEW_TABS)[number]

type SecurityPostureSlideProps = {
  slide: SecurityPostureSlideType
}

type EnrichedAssessment = SammAssessment & {
  tier: 'high' | 'mid' | 'low'
}

export function SecurityPostureSlide({ slide }: SecurityPostureSlideProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>('summary')
  const radarRef = useRef<HTMLDivElement | null>(null)
  const [currentTheme, setCurrentTheme] = useState<string>(document.body.dataset.theme || 'light')

  const enrichedAssessments = useMemo<EnrichedAssessment[]>(() => {
    const scores = slide.assessments.map((assessment) => assessment.maturity_score)
    const maxScore = Math.max(...scores)
    const minScore = Math.min(...scores)
    const range = Math.max(maxScore - minScore, 0.1)

    return slide.assessments.map((assessment) => {
      const normalised = (assessment.maturity_score - minScore) / range
      let tier: EnrichedAssessment['tier'] = 'mid'
      if (normalised >= 0.66) tier = 'high'
      if (normalised <= 0.34) tier = 'low'
      return { ...assessment, tier }
    })
  }, [slide.assessments])

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newTheme = document.body.dataset.theme || 'light'
      setCurrentTheme(newTheme)
    })

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (activeTab !== 'summary') return
    const target = radarRef.current
    if (!target) return

    const existing = echarts.getInstanceByDom(target)
    if (existing) existing.dispose()

    const chart = echarts.init(target)
    const textColor = currentTheme === 'dark' ? '#ffffff' : '#111827'
    chart.setOption(buildRadarOption(enrichedAssessments, textColor))

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [activeTab, enrichedAssessments, currentTheme])

  const topThree = useMemo(
    () => enrichedAssessments.slice().sort((a, b) => b.maturity_score - a.maturity_score).slice(0, 3),
    [enrichedAssessments],
  )

  const bottomThree = useMemo(
    () => enrichedAssessments.slice().sort((a, b) => a.maturity_score - b.maturity_score).slice(0, 3),
    [enrichedAssessments],
  )

  const averageScore = useMemo(() => {
    if (!enrichedAssessments.length) return 0
    const total = enrichedAssessments.reduce((sum, assessment) => sum + assessment.maturity_score, 0)
    return total / enrichedAssessments.length
  }, [enrichedAssessments])

  return (
    <div className="space-framework-slide security-posture-slide">
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

      <div className="space-body">
        {activeTab === 'summary' && (
          <SummaryView
            assessments={enrichedAssessments}
            averageScore={averageScore}
            description={slide.description}
            radarRef={radarRef}
          />
        )}
        {activeTab === 'top-performers' && <PerformerView assessments={topThree} variant="top" />}
        {activeTab === 'focus-areas' && <PerformerView assessments={bottomThree} variant="focus" />}
      </div>
    </div>
  )
}

const TAB_LABELS: Record<ViewTab, string> = {
  summary: 'Summary',
  'top-performers': 'Top Controls',
  'focus-areas': 'Focus Gaps',
}

function SummaryView({
  assessments,
  averageScore,
  description,
  radarRef,
}: {
  assessments: EnrichedAssessment[]
  averageScore: number
  description?: string
  radarRef: RefObject<HTMLDivElement | null>
}) {
  const highest = assessments.slice().sort((a, b) => b.maturity_score - a.maturity_score)[0]
  const lowest = assessments.slice().sort((a, b) => a.maturity_score - b.maturity_score)[0]

  return (
    <div className="summary-grid">
      <section className="index-column">
        <div className="index-card samm-compact">
          <header>
            <h3>SAMM Maturity Index</h3>
            <span className="index-target">Target 2.0+</span>
          </header>
          <div className="index-metrics">
            <span className="index-score">{averageScore.toFixed(1)}</span>
            <span className={`index-delta ${averageScore >= 2 ? 'positive' : 'negative'}`}>
              {averageScore >= 2 ? 'On Track' : `-${(2 - averageScore).toFixed(1)} gap`}
            </span>
          </div>
          <p className="index-footnote">Average maturity across the 15 OWASP SAMM practices.</p>
          {description && <p className="security-summary-body">{description}</p>}
        </div>

        <div className="callout-stack samm-compact">
          <article className="callout-card compact">
            <h4>Strongest Practice</h4>
            <p>
              {highest ? `${highest.practice} is at ${highest.maturity_score.toFixed(1)} maturity. ${highest.insights[0] || 'Maintain current investments.'}` : 'No assessments captured.'}
            </p>
          </article>
          <article className="callout-card risk compact">
            <h4>Critical Opportunity</h4>
            <p>
              {lowest ? `${lowest.practice} sits at ${lowest.maturity_score.toFixed(1)} maturity. ${lowest.recommendations[0] || 'Prioritise uplift actions.'}` : 'No assessments captured.'}
            </p>
          </article>
        </div>

        <div className="security-summary-metrics">
          <article className="metric-card">
            <span className="metric-value">{assessments.filter((assessment) => assessment.maturity_score >= 1.5).length}</span>
            <span className="metric-label">Practices ≥1.5</span>
          </article>
          <article className="metric-card highlight">
            <span className="metric-value">{assessments.filter((assessment) => assessment.maturity_score < 1).length}</span>
            <span className="metric-label">Practices &lt;1.0</span>
          </article>
          <article className="metric-card">
            <span className="metric-value">{assessments.filter((assessment) => assessment.maturity_score >= 2).length}</span>
            <span className="metric-label">Ready for scale</span>
          </article>
        </div>
      </section>

      <section className="samm-summary-side">
        <div className="chart" ref={radarRef} aria-label="SAMM radar chart" />
      </section>
    </div>
  )
}

function PerformerView({ assessments, variant }: { assessments: EnrichedAssessment[]; variant: 'top' | 'focus' }) {
  const title = variant === 'top' ? 'Top 3 Practices' : 'Focus 3 Practices'
  const description =
    variant === 'top'
      ? 'High-performing SAMM practices sustaining maturity and consistency.'
      : 'Practices needing urgent investment to close maturity gaps.'

  return (
    <div className="matrix-grid security-matrix">
      <article className="matrix-card full-span">
        <header className="security-matrix-header">
          <div>
            <h3>{title}</h3>
            <p className="security-matrix-subtitle">{description}</p>
          </div>
        </header>
        <ul className="samm-list">
          {assessments.map((assessment) => (
            <li key={assessment.id} className={`samm-list-item ${assessment.tier}`}>
              <div className="samm-list-header">
                <span className="samm-practice">{assessment.practice}</span>
                <span className="samm-score">{assessment.maturity_score.toFixed(1)}</span>
              </div>
              <div className="samm-columns">
                <div>
                  <h5>Insight</h5>
                  <p>{assessment.insights[0] || '—'}</p>
                </div>
                <div>
                  <h5>Proof point</h5>
                  <p>{assessment.proof[0] || '—'}</p>
                </div>
                <div>
                  <h5>Recommendation</h5>
                  <p>{assessment.recommendations[0] || '—'}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </article>
    </div>
  )
}

function buildRadarOption(assessments: EnrichedAssessment[], textColor: string) {
  return {
    legend: {
      bottom: 0,
      data: [
        {
          name: 'Current Maturity',
          itemStyle: { color: '#2563eb' },
          lineStyle: { color: '#2563eb' },
        },
      ],
      textStyle: { color: textColor },
      itemWidth: 16,
      itemHeight: 16,
    },
    radar: {
      indicator: assessments.map((assessment) => ({
        name: assessment.practice,
        max: 2,
      })),
      radius: '70%',
      splitNumber: 4,
      splitArea: {
        areaStyle: {
          color: ['rgba(37, 99, 235, 0.06)', 'rgba(37, 99, 235, 0.1)', 'rgba(37, 99, 235, 0.14)', 'rgba(37, 99, 235, 0.18)'],
        },
      },
      axisLine: {
        lineStyle: {
          color: textColor,
          opacity: 0.25,
        },
      },
      axisName: {
        color: textColor,
        fontSize: 11,
        fontWeight: 600,
      },
      splitLine: {
        lineStyle: {
          color: 'rgba(37, 99, 235, 0.18)',
        },
      },
    },
    series: [
      {
        type: 'radar',
        name: 'Current Maturity',
        data: [assessments.map((assessment) => assessment.maturity_score)],
        areaStyle: { color: 'rgba(37, 99, 235, 0.25)' },
        lineStyle: { color: '#2563eb', width: 2 },
        itemStyle: { color: '#2563eb' },
        symbolSize: 6,
      },
    ],
  }
}
