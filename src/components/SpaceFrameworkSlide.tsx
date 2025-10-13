import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import * as echarts from 'echarts'
import type { SpaceFrameworkSlide as SpaceFrameworkSlideType } from '../types/slide.types'
import '../styles/SpaceFrameworkSlide.css'

const VIEW_TABS = ['summary', 'dimension-radar', 'signal-matrix'] as const

type ViewTab = (typeof VIEW_TABS)[number]

type SpaceFrameworkSlideProps = {
  slide: SpaceFrameworkSlideType
}

export function SpaceFrameworkSlide({ slide }: SpaceFrameworkSlideProps) {
  const [activeTab, setActiveTab] = useState<ViewTab>('summary')
  const radarRef = useRef<HTMLDivElement | null>(null)
  const [currentTheme, setCurrentTheme] = useState<string>(document.body.dataset.theme || 'light')

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newTheme = document.body.dataset.theme || 'light'
      setCurrentTheme(newTheme)
    })

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['data-theme']
    })

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (activeTab !== 'dimension-radar') return
    const target = radarRef.current
    if (!target) return

    const existing = echarts.getInstanceByDom(target)
    if (existing) {
      existing.dispose()
    }
    const chart = echarts.init(target)
    const textColor = currentTheme === 'dark' ? '#ffffff' : '#000000'
    chart.setOption(buildRadarOption(slide, textColor))

    const handleResize = () => chart.resize()
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
      chart.dispose()
    }
  }, [activeTab, slide, currentTheme])

  const signalGroups = useMemo(
    () =>
      slide.dimensions.map((dimension) => ({
        id: dimension.id,
        name: dimension.name,
        signals: dimension.supporting_signals.slice(0, 3),
      })),
    [slide.dimensions],
  )

  return (
    <div className="space-framework-slide">
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
        {activeTab === 'summary' && <SummaryView slide={slide} />}
        {activeTab === 'dimension-radar' && <RadarView radarRef={radarRef} slide={slide} />}
        {activeTab === 'signal-matrix' && <SignalMatrixView groups={signalGroups} />}
      </div>
    </div>
  )
}

const TAB_LABELS: Record<ViewTab, string> = {
  summary: 'Summary',
  'dimension-radar': 'Dimension Radar',
  'signal-matrix': 'Signal Matrix',
}

function SummaryView({ slide }: { slide: SpaceFrameworkSlideType }) {
  const delta = slide.overall_target - slide.overall_score
  const mostImprovement = slide.dimensions
    .slice()
    .sort(
      (a, b) =>
        (b.target_score - b.current_score) - (a.target_score - a.current_score),
    )[0]
  const fastestWin = slide.dimensions
    .slice()
    .sort((a, b) => (a.target_score - a.current_score) - (b.target_score - b.current_score))[0]
  const topLeverText = mostImprovement?.supporting_signals[0] || 'Focus on highest gap dimension to lift sentiment.'
  const quickWinText = fastestWin?.supporting_signals[0] || 'Leverage the most mature dimension to build momentum.'

  return (
    <div className="summary-grid">
      <section className="index-column">
        <div className="index-card">
          <header>
            <h3>SPACE Index</h3>
            <span className="index-target">Target {slide.overall_target.toFixed(1)}</span>
          </header>
          <div className="index-metrics">
            <span className="index-score">{slide.overall_score.toFixed(1)}</span>
            <span className={`index-delta ${delta > 0 ? 'negative' : 'positive'}`}>
              {delta > 0 ? `-${delta.toFixed(1)} gap` : 'On Target'}
            </span>
          </div>
          <p className="index-footnote">Average of five SPACE dimensions, weighted evenly.</p>
        </div>

        <div className="callout-stack">
          <article className="callout-card">
            <h4>Top Improvement Lever</h4>
            <p>{topLeverText}</p>
          </article>
          <article className="callout-card">
            <h4>Immediate Win</h4>
            <p>{quickWinText}</p>
          </article>
        </div>
      </section>

      <section className="dimension-chips">
        {slide.dimensions.map((dimension) => {
          const gap = dimension.target_score - dimension.current_score
          const currentWidth = Math.min(100, (dimension.current_score / 5) * 100)
          const targetWidth = Math.min(100, (dimension.target_score / 5) * 100)
          return (
            <div key={dimension.id} className="dimension-chip">
              <div className="chip-main">
                <span className="chip-name">{dimension.name}</span>
                <div className="chip-bars">
                  <span className="chip-value current-value">{dimension.current_score.toFixed(1)}</span>
                  <div
                    className="chip-track"
                    style={{ '--target-width': `${targetWidth}%` } as React.CSSProperties}
                  >
                    <div className="chip-bar current" style={{ width: `${currentWidth}%` }} />
                  </div>
                </div>
              </div>
              <div className="chip-side">
                <span className={`chip-gap ${gap > 0.8 ? 'large' : gap > 0.4 ? 'medium' : 'small'}`}>
                  {gap > 0 ? `-${gap.toFixed(1)}` : '+0.0'}
                </span>
                <span className="chip-value target-value">{dimension.target_score.toFixed(1)}</span>
              </div>
            </div>
          )
        })}
      </section>

    </div>
  )
}

function RadarView({ radarRef, slide }: { radarRef: RefObject<HTMLDivElement | null>; slide: SpaceFrameworkSlideType }) {
  return (
    <div className="radar-layout">
      <div className="radar-panel">
        <header className="panel-header">
          <h3>Dimension Radar</h3>
          <p>Benchmarking SPACE dimensions against target thresholds.</p>
        </header>
        <div ref={radarRef} className="chart" aria-label="SPACE radar chart" />
      </div>

      <div className="radar-table-panel">
        <header className="panel-header">
          <h3>Score Breakdown</h3>
          <p>Current survey scores vs elite targets and variance.</p>
        </header>
        <table className="gap-table two-column">
          <thead>
            <tr>
              <th>Dimension</th>
              <th>Score</th>
              <th>Target</th>
              <th>Gap</th>
            </tr>
          </thead>
          <tbody>
            {slide.dimensions.map((dimension) => {
              const gap = dimension.target_score - dimension.current_score
              return (
                <tr key={dimension.id}>
                  <td>{dimension.name}</td>
                  <td>{dimension.current_score.toFixed(1)}</td>
                  <td>{dimension.target_score.toFixed(1)}</td>
                  <td className={gap > 0 ? 'negative' : 'positive'}>{gap > 0 ? `-${gap.toFixed(1)}` : '+0.0'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SignalMatrixView({ groups }: { groups: { id: string; name: string; signals: string[] }[] }) {
  return (
    <div className="matrix-grid">
      {groups.map((group) => (
        <section key={group.id} className="matrix-card">
          <header>
            <h4>{group.name}</h4>
          </header>
          <ul>
            {group.signals.map((signal, idx) => (
              <li key={`${group.id}-${idx}`}>{signal}</li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

function buildRadarOption(slide: SpaceFrameworkSlideType, textColor: string) {
  return {
    legend: {
      bottom: 0,
      data: [
        {
          name: 'Current Score',
          itemStyle: { color: '#3b82f6' },
          lineStyle: { color: '#3b82f6' },
        },
        {
          name: 'Target',
          itemStyle: { color: '#10b981' },
          lineStyle: { color: '#10b981' },
        },
      ],
      textStyle: { color: textColor },
      itemWidth: 14,
      itemHeight: 14,
    },
    radar: {
      indicator: slide.dimensions.map((dimension) => ({
        name: dimension.name,
        max: 5,
      })),
      splitNumber: 4,
      radius: '65%',
      splitArea: {
        areaStyle: {
          color: ['rgba(59, 130, 246, 0.04)', 'rgba(59, 130, 246, 0.08)', 'rgba(59, 130, 246, 0.12)', 'rgba(59, 130, 246, 0.16)'],
        },
      },
      axisLine: {
        lineStyle: {
          color: textColor,
          opacity: 0.35,
        },
      },
      axisName: {
        color: textColor,
        fontSize: 12,
        fontWeight: 600,
      },
    },
    series: [
      {
        type: 'radar',
        name: 'Current Score',
        data: [slide.dimensions.map((dimension) => dimension.current_score)],
        areaStyle: { color: 'rgba(59, 130, 246, 0.25)' },
        lineStyle: { color: '#3b82f6', width: 2.5 },
        itemStyle: { color: '#3b82f6' },
      },
      {
        type: 'radar',
        name: 'Target',
        data: [slide.dimensions.map((dimension) => dimension.target_score)],
        areaStyle: { color: 'rgba(16, 185, 129, 0.18)' },
        lineStyle: { color: '#10b981', width: 2.5, type: 'dashed' },
        itemStyle: { color: '#10b981' },
      },
    ],
  }
}
