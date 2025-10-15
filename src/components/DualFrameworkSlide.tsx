import { useEffect, useRef, useState } from 'react'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

type TelemetryData = {
  value: number
  value_display?: string
  source: string
  measurement_period: string
  confidence: string
  variance_from_survey: number
  notes?: string
}

type DoraMetric = {
  id: string
  name: string
  category: string
  definition: string
  current_value: number
  current_value_display?: string
  benchmark_value: number
  performance_tier: string
  gap_analysis: string
  telemetry?: TelemetryData
}

const lowerIsBetterMetricIds = new Set([
  'change_failure_rate',
  'time_to_restore_service',
  'lead_time_for_changes',
  'cycle_time',
  'intra_pr_activity',
  'commit_frequency',
  'pr_frequency',
])

type DualFrameworkSlideProps = {
  metrics: DoraMetric[]
  title: string
  subtitle?: string
}

type ChartView = 'overview' | 'comparison' | 'performance' | 'telemetry'

export function DualFrameworkSlide({ metrics, title, subtitle }: DualFrameworkSlideProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const [activeView, setActiveView] = useState<ChartView>('overview')
  const [whatIfMetrics, setWhatIfMetrics] = useState<Record<string, number>>({})
  const [currentTheme, setCurrentTheme] = useState<string>(document.body.dataset.theme || 'light')
  const barChartRef = useRef<HTMLDivElement>(null)
  const radarChartRef = useRef<HTMLDivElement>(null)

  // Initialize whatIfMetrics with current values
  useEffect(() => {
    const initial: Record<string, number> = {}
    metrics.forEach(m => {
      initial[m.id] = m.current_value
    })
    setWhatIfMetrics(initial)
  }, [metrics])

  // Listen for theme changes
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
    // Skip chart initialization for overview
    if (activeView === 'overview') return
    
    const currentRef = activeView === 'comparison' ? barChartRef.current : radarChartRef.current
    if (!currentRef) return

    // Dispose existing chart instance if any
    const existingChart = echarts.getInstanceByDom(currentRef)
    if (existingChart) {
      existingChart.dispose()
    }

    const chart = echarts.init(currentRef)

    // Prepare data for bar chart (comparing current vs benchmark)
    const metricNames = metrics.map(m => m.name)
    const currentValues = metrics.map(m => m.current_value)
    const benchmarkValues = metrics.map(m => m.benchmark_value)
    
    // Calculate performance percentage (inverted for metrics where lower is better)
    const performancePercentages = metrics.map((m) => {
      // For change failure rate, time to restore, and lead time - lower is better
      const lowerIsBetter = ['change_failure_rate', 'time_to_restore_service', 'lead_time_for_changes'].includes(m.id)
      
      if (lowerIsBetter) {
        // If current is higher than benchmark, performance is poor
        return Math.max(0, Math.min(100, (m.benchmark_value / m.current_value) * 100))
      } else {
        // For deployment frequency and reliability - higher is better
        return Math.max(0, Math.min(100, (m.current_value / m.benchmark_value) * 100))
      }
    })

    // Calculate what-if performance percentages (only for radar chart)
    const whatIfPercentages = activeView === 'performance' ? metrics.map((m) => {
      const whatIfValue = whatIfMetrics[m.id]
      const lowerIsBetter = ['change_failure_rate', 'time_to_restore_service', 'lead_time_for_changes'].includes(m.id)
      
      if (lowerIsBetter) {
        return Math.max(0, Math.min(100, (m.benchmark_value / whatIfValue) * 100))
      } else {
        return Math.max(0, Math.min(100, (whatIfValue / m.benchmark_value) * 100))
      }
    }) : []
    
    // Calculate telemetry performance percentages (only for radar chart)
    const telemetryPercentages = activeView === 'performance' ? metrics.map((m) => {
      if (!m.telemetry) return 0
      const telemetryValue = m.telemetry.value
      const lowerIsBetter = ['change_failure_rate', 'time_to_restore_service', 'lead_time_for_changes'].includes(m.id)
      
      if (lowerIsBetter) {
        return Math.max(0, Math.min(100, (m.benchmark_value / telemetryValue) * 100))
      } else {
        return Math.max(0, Math.min(100, (telemetryValue / m.benchmark_value) * 100))
      }
    }) : []
    
    const hasWhatIfChanges = activeView === 'performance' && metrics.some(m => whatIfMetrics[m.id] !== m.current_value)
    const hasTelemetryData = metrics.some(m => m.telemetry)

    // Get text color based on current theme
    const textColor = currentTheme === 'dark' ? '#ffffff' : '#000000'
    // Bar Chart Configuration
    const barOption: EChartsOption = {
      title: {
        text: 'Current vs. Elite Benchmark',
        left: 'center',
        textStyle: {
          fontSize: 16,
          fontWeight: 600,
          color: 'var(--color-text)'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        formatter: (params: any) => {
          const metric = metrics[params[0].dataIndex]
          return `
            <strong>${metric.name}</strong><br/>
            Current: ${metric.current_value_display || metric.current_value}<br/>
            Performance: ${performancePercentages[params[0].dataIndex].toFixed(1)}%
          `
        }
      },
      legend: {
        data: ['Elite Benchmark', 'Current Performance'],
        bottom: 0,
        textStyle: {
          color: textColor
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '12%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'value',
        axisLabel: {
          color: 'var(--color-muted)'
        },
        splitLine: {
          lineStyle: {
            color: 'var(--color-border)'
          }
        }
      },
      yAxis: {
        type: 'category',
        data: metricNames,
        axisLabel: {
          color: 'var(--color-text)',
          fontSize: 11
        },
        axisLine: {
          lineStyle: {
            color: 'var(--color-border)'
          }
        }
      },
      series: [
        {
          name: 'Elite Benchmark',
          type: 'bar',
          data: benchmarkValues,
          itemStyle: {
            color: '#10b981',
            opacity: 0.3
          },
          barGap: '-100%',
          z: 1
        },
        {
          name: 'Current Performance',
          type: 'bar',
          data: currentValues.map((val, idx) => ({
            value: val,
            itemStyle: {
              color: performancePercentages[idx] < 50 ? '#ef4444' : performancePercentages[idx] < 75 ? '#f59e0b' : '#10b981'
            }
          })),
          label: {
            show: false
          },
          barGap: '-100%',
          z: 2
        }
      ]
    }

    // Radar Chart Configuration
    const radarOption: EChartsOption = {
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.seriesType === 'radar') {
            if (params.name === 'Current Performance') {
              return `<strong>${params.name}</strong><br/>` +
                metrics.map((m, idx) => 
                  `${m.name}: ${performancePercentages[idx].toFixed(0)}%`
                ).join('<br/>')
            } else {
              return `<strong>${params.name}</strong><br/>All metrics at 100% (Elite)`
            }
          }
          return ''
        }
      },
      legend: {
        data: hasWhatIfChanges && hasTelemetryData
          ? ['Survey Response', 'Actual Telemetry', 'What-If Scenario', 'Elite Target']
          : hasWhatIfChanges
          ? ['Current Performance', 'What-If Scenario', 'Elite Target']
          : hasTelemetryData
          ? ['Survey Response', 'Actual Telemetry', 'Elite Target']
          : ['Current Performance', 'Elite Target'],
        bottom: 5,
        textStyle: {
          color: textColor,
          fontSize: 11
        }
      },
      radar: {
        indicator: metrics.map((m) => ({
          name: m.name,
          max: 100,
          color: textColor
        })),
        center: ['50%', '50%'],
        radius: '70%',
        startAngle: 90,
        splitNumber: 4,
        shape: 'polygon',
        axisName: {
          color: textColor,
          fontSize: 12,
          fontWeight: 800,
          borderRadius: 4,
          padding: [4, 8],
          formatter: (value?: string) => {
            if (!value) return ''
            // Shorten names for better readability
            const shortNames: Record<string, string> = {
              'Deployment Frequency': 'Deploy\nFrequency',
              'Lead Time for Changes': 'Lead\nTime',
              'Change Failure Rate': 'Failure\nRate',
              'Time to Restore': 'Time to\nRestore',
              'Reliability / Availability': 'Reliability'
            }
            return shortNames[value] || value
          }
        },
        splitLine: {
          lineStyle: {
            color: textColor,
            width: 1
          }
        },
        splitArea: {
          show: true,
          areaStyle: {
            color: ['rgba(59, 130, 246, 0.03)', 'rgba(59, 130, 246, 0.06)', 'rgba(59, 130, 246, 0.09)', 'rgba(59, 130, 246, 0.12)']
          }
        },
        axisLine: {
          lineStyle: {
            color: 'var(--color-border)'
          }
        }
      },
      series: [
        {
          type: 'radar',
          emphasis: {
            lineStyle: {
              width: 3
            }
          },
          data: [
            {
              value: performancePercentages,
              name: hasTelemetryData ? 'Survey Response' : 'Current Performance',
              areaStyle: {
                color: 'rgba(239, 68, 68, 0.25)'
              },
              lineStyle: {
                color: '#ef4444',
                width: 2.5
              },
              itemStyle: {
                color: '#ef4444',
                borderWidth: 2,
                borderColor: '#fff'
              },
              label: {
                show: false
              }
            },
            ...(hasTelemetryData ? [{
              value: telemetryPercentages,
              name: 'Actual Telemetry',
              areaStyle: {
                color: 'rgba(168, 85, 247, 0.2)'
              },
              lineStyle: {
                color: '#a855f7',
                width: 2.5,
                type: 'solid' as const
              },
              itemStyle: {
                color: '#a855f7',
                borderWidth: 2,
                borderColor: '#fff'
              },
              label: {
                show: false
              }
            }] : []),
            ...(hasWhatIfChanges ? [{
              value: whatIfPercentages,
              name: 'What-If Scenario',
              areaStyle: {
                color: 'rgba(59, 130, 246, 0.2)'
              },
              lineStyle: {
                color: '#3b82f6',
                width: 2.5,
                type: 'solid' as const
              },
              itemStyle: {
                color: '#3b82f6',
                borderWidth: 2,
                borderColor: '#fff'
              },
              label: {
                show: false
              }
            }] : []),
            {
              value: metrics.map(() => 100),
              name: 'Elite Target',
              areaStyle: {
                color: 'rgba(16, 185, 129, 0.08)'
              },
              lineStyle: {
                color: '#10b981',
                width: 2,
                type: 'dashed'
              },
              itemStyle: {
                color: '#10b981'
              }
            }
          ]
        }
      ]
    }

    // Set options based on active view
    if (activeView === 'comparison') {
      chart.setOption(barOption)
    } else {
      chart.setOption(radarOption)
    }

    // Handle resize
    const handleResize = () => {
      chart.resize()
    }
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
      if (chart && !chart.isDisposed()) {
        chart.dispose()
      }
    }
  }, [metrics, activeView, whatIfMetrics, currentTheme])

  // Get unique categories and group metrics
  const categories = Array.from(new Set(metrics.map(m => m.category)))
  const metricsByCategory = categories.map(category => ({
    name: category,
    metrics: metrics.filter(m => m.category === category)
  }))

  // Calculate what-if performance
  const isLowerBetter = (metricId: string) => lowerIsBetterMetricIds.has(metricId)

  const calculatePerformance = (metricId: string, value: number, benchmarkValue: number) => {
    if (!benchmarkValue) return 0

    if (isLowerBetter(metricId)) {
      if (value <= 0) return 100
      return Math.min(100, Math.max(0, (benchmarkValue / value) * 100))
    }

    return Math.min(100, Math.max(0, (value / benchmarkValue) * 100))
  }

  const convertPercentToValue = (metricId: string, percent: number, benchmarkValue: number, fallback: number) => {
    const normalized = Math.max(0, Math.min(100, percent))

    if (!benchmarkValue) {
      return normalized <= 0 ? fallback : fallback * (normalized / 100)
    }

    if (isLowerBetter(metricId)) {
      if (normalized <= 0) {
        return benchmarkValue * 4
      }
      return benchmarkValue / (normalized / 100)
    }

    return (benchmarkValue * normalized) / 100
  }

  const getPerformancePercent = (metricId: string, value: number, benchmarkValue: number) =>
    calculatePerformance(metricId, value, benchmarkValue)

  // Get unit for metric
  const getMetricUnit = (metricId: string) => {
    const unitMap: Record<string, string> = {
      'deployment_frequency': 'deploys/month',
      'lead_time_for_changes': 'days',
      'change_failure_rate': '%',
      'time_to_restore_service': 'hours',
      'reliability': '%'
    }
    return unitMap[metricId] || ''
  }

  const handleSliderChange = (metric: DoraMetric, percent: number) => {
    const newValue = convertPercentToValue(metric.id, percent, metric.benchmark_value, metric.current_value)
    setWhatIfMetrics(prev => ({ ...prev, [metric.id]: newValue }))
  }

  const resetWhatIf = () => {
    const reset: Record<string, number> = {}
    metrics.forEach(m => {
      reset[m.id] = m.current_value
    })
    setWhatIfMetrics(reset)
  }

  return (
    <div className="dual-framework-slide">
      <div className="slide-header">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>

      <div className="chart-section">
        {activeView === 'overview' && (
          <div className="chart-container">
            <div className="chart-header">
              <div className="chart-tabs-inline">
                <button
                  className={`tab-inline ${activeView === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveView('overview')}
                >
                  Overview
                </button>
                <button
                  className={`tab-inline ${activeView === 'comparison' ? 'active' : ''}`}
                  onClick={() => setActiveView('comparison')}
                >
                  Survey Avg
                </button>
                <button
                  className={`tab-inline ${activeView === 'telemetry' ? 'active' : ''}`}
                  onClick={() => setActiveView('telemetry')}
                >
                  Survey vs Telemetry
                </button>
                <button
                  className={`tab-inline ${activeView === 'performance' ? 'active' : ''}`}
                  onClick={() => setActiveView('performance')}
                >
                  Performance
                </button>
              </div>
            </div>
            <div className="overview-content">
              {metricsByCategory.map((categoryGroup) => (
                <div key={categoryGroup.name} className="category-group">
                  <h3 className="category-title">{categoryGroup.name}</h3>
                  <div className="metrics-row">
                    {categoryGroup.metrics.map((metric) => (
                      <div key={metric.id} className={`metric-card ${metric.performance_tier.toLowerCase()}`}>
                        <div className="metric-name">{metric.name}</div>
                        <div className="metric-value">
                          {metric.current_value_display || metric.current_value}
                        </div>
                        <div className="metric-benchmark">Target: {metric.benchmark_value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'comparison' && (
          <div className="chart-container">
            <div className="chart-header">
              <div className="chart-tabs-inline">
                <button
                  className={`tab-inline ${activeView === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveView('overview')}
                >
                  Overview
                </button>
                <button
                  className={`tab-inline ${activeView === 'comparison' ? 'active' : ''}`}
                  onClick={() => setActiveView('comparison')}
                >
                  Survey Avg
                </button>
                <button
                  className={`tab-inline ${activeView === 'telemetry' ? 'active' : ''}`}
                  onClick={() => setActiveView('telemetry')}
                >
                  Survey vs Telemetry
                </button>
                <button
                  className={`tab-inline ${activeView === 'performance' ? 'active' : ''}`}
                  onClick={() => setActiveView('performance')}
                >
                  Performance
                </button>
              </div>
            </div>
            <div className="comparison-matrix">
              <table className="metrics-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Current</th>
                    <th>Target</th>
                    <th>Performance</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric) => {
                    const performance = calculatePerformance(metric.id, metric.current_value, metric.benchmark_value)
                    const performanceColor = performance < 50 ? '#ef4444' : performance < 75 ? '#f59e0b' : '#10b981'
                    const statusText = performance < 50 ? 'Needs Improvement' : performance < 75 ? 'Progressing' : 'On Track'
                    
                    return (
                      <tr key={metric.id}>
                        <td className="metric-name-cell">
                          <div className="metric-name-wrapper">
                            <span className="metric-name-text">{metric.name}</span>
                            <span className="metric-category">{metric.category}</span>
                          </div>
                        </td>
                        <td className="value-cell">
                          <span className="value-display">{metric.current_value_display || metric.current_value}</span>
                        </td>
                        <td className="value-cell">
                          <span className="value-display">{metric.benchmark_value}</span>
                        </td>
                        <td className="performance-cell">
                          <div className="performance-bar-container">
                            <div 
                              className="performance-bar-fill" 
                              style={{ 
                                width: `${Math.min(performance, 100)}%`,
                                backgroundColor: performanceColor
                              }}
                            />
                            <span className="performance-text">{performance.toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="status-cell">
                          <span 
                            className="status-badge" 
                            style={{ 
                              backgroundColor: `${performanceColor}20`,
                              color: performanceColor,
                              borderColor: performanceColor
                            }}
                          >
                            {statusText}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeView === 'performance' && (
          <div className="chart-container performance-container">
            <div className="chart-header">
              <div className="chart-tabs-inline">
                <button
                  className={`tab-inline ${activeView === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveView('overview')}
                >
                  Overview
                </button>
                <button
                  className={`tab-inline ${activeView === 'comparison' ? 'active' : ''}`}
                  onClick={() => setActiveView('comparison')}
                >
                  Survey Avg
                </button>
                <button
                  className={`tab-inline ${activeView === 'telemetry' ? 'active' : ''}`}
                  onClick={() => setActiveView('telemetry')}
                >
                  Survey vs Telemetry
                </button>
                <button
                  className={`tab-inline ${activeView === 'performance' ? 'active' : ''}`}
                  onClick={() => setActiveView('performance')}
                >
                  Performance
                </button>
              </div>
            </div>
            <div className="performance-content">
              <div className="radar-chart-wrapper">
                <div ref={radarChartRef} className="chart" key="radar-chart" />
              </div>
              
              <div className="whatif-panel-inline">
                <div className="whatif-header">
                  <h3>What-If Scenario</h3>
                  <button className="reset-button" onClick={resetWhatIf}>Reset</button>
                </div>
                
                <div className="whatif-controls-compact">
                  {metrics.map((metric) => {
                    const currentValue = whatIfMetrics[metric.id]
                    const performance = getPerformancePercent(metric.id, currentValue, metric.benchmark_value)
                    const isImproved = currentValue !== metric.current_value
                    const sliderMin = 0
                    const sliderMax = 100
                    const sliderStep = 1
                    
                    return (
                      <div key={metric.id} className="whatif-control-compact">
                        <div className="control-row">
                          <span className="control-label-compact">{metric.name}</span>
                          <span className={`control-value-compact ${isImproved ? 'improved' : ''}`}>
                            {currentValue.toFixed(1)} {getMetricUnit(metric.id)}
                          </span>
                          <span className="performance-indicator-compact" style={{
                            color: performance < 50 ? '#ef4444' : performance < 75 ? '#f59e0b' : '#10b981'
                          }}>
                            {performance.toFixed(0)}%
                          </span>
                        </div>
                        <input
                          type="range"
                          min={sliderMin}
                          max={sliderMax}
                          step={sliderStep}
                          value={performance}
                          onChange={(e) => handleSliderChange(metric, Number(e.target.value))}
                          className="whatif-slider-compact"
                        />
                      </div>
                    )
                  })}
                </div>
                
                <div className="whatif-summary">
                  <div className="summary-row">
                    <span className="stat-label">Overall Performance:</span>
                    <span className="stat-value">
                      {(() => {
                        const avg = metrics.reduce((sum, m) => 
                          sum + calculatePerformance(m.id, whatIfMetrics[m.id], m.benchmark_value), 0
                        ) / metrics.length
                        return `${avg.toFixed(1)}%`
                      })()}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span className="stat-label">Grade:</span>
                    <span className="stat-value grade">
                      {(() => {
                        const avg = metrics.reduce((sum, m) => 
                          sum + calculatePerformance(m.id, whatIfMetrics[m.id], m.benchmark_value), 0
                        ) / metrics.length
                        if (avg >= 90) return 'Elite'
                        if (avg >= 75) return 'High'
                        if (avg >= 50) return 'Medium'
                        return 'Low'
                      })()}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span className="stat-label">On Target:</span>
                    <span className="stat-value">
                      {metrics.filter(m => 
                        calculatePerformance(m.id, whatIfMetrics[m.id], m.benchmark_value) >= 75
                      ).length} / {metrics.length}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span className="stat-label">Weakest Metric:</span>
                    <span className="stat-value weakest">
                      {(() => {
                        const performances = metrics.map(m => ({
                          name: m.name,
                          perf: calculatePerformance(m.id, whatIfMetrics[m.id], m.benchmark_value)
                        }))
                        const weakest = performances.reduce((min, curr) => 
                          curr.perf < min.perf ? curr : min
                        )
                        return `${weakest.name.split(' ')[0]} (${weakest.perf.toFixed(0)}%)`
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'telemetry' && (
          <div className="chart-container">
            <div className="chart-header">
              <div className="chart-tabs-inline">
                <button
                  className={`tab-inline ${activeView === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveView('overview')}
                >
                  Overview
                </button>
                <button
                  className={`tab-inline ${activeView === 'comparison' ? 'active' : ''}`}
                  onClick={() => setActiveView('comparison')}
                >
                  Survey Avg
                </button>
                <button
                  className={`tab-inline ${activeView === 'telemetry' ? 'active' : ''}`}
                  onClick={() => setActiveView('telemetry')}
                >
                  Survey vs Telemetry
                </button>
                <button
                  className={`tab-inline ${activeView === 'performance' ? 'active' : ''}`}
                  onClick={() => setActiveView('performance')}
                >
                  Performance
                </button>
              </div>
            </div>
            <div className="comparison-matrix">
              <table className="metrics-table telemetry-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Survey Response</th>
                    <th>Actual Telemetry</th>
                    <th>Variance</th>
                    <th>Data Source</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((metric) => {
                    const hasTelemetry = metric.telemetry
                    const variance = hasTelemetry ? metric.telemetry.variance_from_survey : 0
                    const varianceColor = Math.abs(variance) < 10 ? '#10b981' : Math.abs(variance) < 25 ? '#f59e0b' : '#ef4444'
                    const alignmentText = Math.abs(variance) < 10 ? 'Good Alignment' : Math.abs(variance) < 25 ? 'Moderate Gap' : 'Significant Gap'
                    
                    return (
                      <tr key={metric.id}>
                        <td className="metric-name-cell">
                          <strong>{metric.name}</strong>
                        </td>
                        <td className="value-cell">
                          <div>{metric.current_value_display || metric.current_value}</div>
                          <div className="numeric-value">({metric.current_value})</div>
                        </td>
                        <td className="value-cell telemetry-value">
                          {hasTelemetry ? (
                            <>
                              <div>{metric.telemetry.value_display || metric.telemetry.value}</div>
                              <div className="numeric-value">({metric.telemetry.value})</div>
                            </>
                          ) : 'N/A'}
                        </td>
                        <td className="variance-cell">
                          {hasTelemetry ? (
                            <div className="variance-indicator">
                              <span className="variance-badge" style={{ 
                                backgroundColor: `${varianceColor}20`,
                                color: varianceColor,
                                borderColor: varianceColor
                              }}>
                                {variance > 0 ? '+' : ''}{variance.toFixed(1)}%
                              </span>
                              <span className="alignment-text" style={{ color: varianceColor }}>
                                {alignmentText}
                              </span>
                            </div>
                          ) : 'N/A'}
                        </td>
                        <td className="source-cell">
                          {hasTelemetry ? (
                            <div className="source-info">
                              <div className="source-name">{metric.telemetry.source}</div>
                              <div className="source-period">{metric.telemetry.measurement_period}</div>
                            </div>
                          ) : 'No telemetry data'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
