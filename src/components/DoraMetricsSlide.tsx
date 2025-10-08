import { useEffect, useRef, useState } from 'react'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

type DoraMetric = {
  id: string
  name: string
  category: string
  current_value: number
  current_value_display?: string
  benchmark_value: number
  performance_tier: string
  gap_analysis: string
}

type DoraMetricsSlideProps = {
  metrics: DoraMetric[]
  title: string
  subtitle?: string
}

type ChartView = 'overview' | 'comparison' | 'performance'

export function DoraMetricsSlide({ metrics, title, subtitle }: DoraMetricsSlideProps) {
  const [activeView, setActiveView] = useState<ChartView>('overview')
  const [whatIfMetrics, setWhatIfMetrics] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {}
    metrics.forEach(m => {
      initial[m.id] = m.current_value
    })
    return initial
  })
  const barChartRef = useRef<HTMLDivElement>(null)
  const radarChartRef = useRef<HTMLDivElement>(null)

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
    
    const hasWhatIfChanges = activeView === 'performance' && metrics.some(m => whatIfMetrics[m.id] !== m.current_value)

    // Get current theme colors
    const rootStyles = getComputedStyle(document.documentElement)
    const textColor = rootStyles.getPropertyValue('--color-text').trim() || '#1f2937'
    const surfaceColor = rootStyles.getPropertyValue('--color-surface').trim() || '#ffffff'
    
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
          color: 'var(--color-text)'
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
        data: hasWhatIfChanges
          ? ['Current Performance', 'What-If Scenario', 'Elite Target']
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
          backgroundColor: surfaceColor,
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
            color: 'var(--color-border)',
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
              name: 'Current Performance',
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
  }, [metrics, activeView, whatIfMetrics])

  // Get velocity and stability metrics
  const velocityMetrics = metrics.filter(m => m.category === 'Velocity')
  const stabilityMetrics = metrics.filter(m => m.category === 'Stability')

  // Calculate what-if performance
  const calculatePerformance = (metricId: string, value: number, benchmarkValue: number) => {
    const lowerIsBetter = ['change_failure_rate', 'time_to_restore_service', 'lead_time_for_changes'].includes(metricId)
    
    if (lowerIsBetter) {
      return Math.max(0, Math.min(100, (benchmarkValue / value) * 100))
    } else {
      return Math.max(0, Math.min(100, (value / benchmarkValue) * 100))
    }
  }

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

  const handleSliderChange = (metricId: string, value: number) => {
    setWhatIfMetrics(prev => ({ ...prev, [metricId]: value }))
  }

  const resetWhatIf = () => {
    const reset: Record<string, number> = {}
    metrics.forEach(m => {
      reset[m.id] = m.current_value
    })
    setWhatIfMetrics(reset)
  }

  return (
    <div className="dora-metrics-slide">
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
                  Comparison
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
              <div className="category-group">
                <h3 className="category-title">Velocity</h3>
                <div className="metrics-row">
                  {velocityMetrics.map((metric) => (
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
              <div className="category-group">
                <h3 className="category-title">Stability</h3>
                <div className="metrics-row">
                  {stabilityMetrics.map((metric) => (
                    <div key={metric.id} className={`metric-card ${metric.performance_tier.toLowerCase()}`}>
                      <div className="metric-name">{metric.name}</div>
                      <div className="metric-value">
                        {metric.current_value_display || metric.current_value}
                      </div>
                      <div className="metric-benchmark">Target: {metric.benchmark_value}{metric.id === 'reliability' ? '%' : ''}</div>
                    </div>
                  ))}
                </div>
              </div>
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
                  Comparison
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
                  Comparison
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
                    const performance = calculatePerformance(metric.id, currentValue, metric.benchmark_value)
                    const isImproved = currentValue !== metric.current_value
                    
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
                          min={Math.min(metric.benchmark_value * 0.5, metric.current_value * 0.5)}
                          max={Math.max(metric.benchmark_value * 1.5, metric.current_value * 1.5)}
                          step={0.1}
                          value={currentValue}
                          onChange={(e) => handleSliderChange(metric.id, parseFloat(e.target.value))}
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
      </div>
    </div>
  )
}
