import data from '../../engineering_metrics_benchmark_template.json'
import { toTrimmedString, toTrimmedStringArray, toSourcesArray } from '../utils/dataHelpers'
import type {
  Slide,
  BrandSlide,
  SynopsisSlide,
  DualFrameworkSlide,
  SpaceFrameworkSlide,
  MetaDetail,
  DoraMetric,
  SpaceDimension,
} from '../types/slide.types'

const ORGANISATION_FALLBACK = 'Mag Tech AI'

export const buildSlides = (): Slide[] => {
  const organization = toTrimmedString(data.metadata.organization, ORGANISATION_FALLBACK)
  const reportTitle = toTrimmedString(
    data.metadata.assessment_title,
    'Engineering Transformation Assessment',
  )
  const client = toTrimmedString((data.metadata as Record<string, unknown>).client, organization)
  const preparedBy = toTrimmedString(data.metadata.prepared_by, ORGANISATION_FALLBACK)
  const assessmentDate = toTrimmedString(data.metadata.assessment_date)
  const version = toTrimmedString(data.metadata.version)

  const introMeta: MetaDetail[] = [
    { label: 'Client', value: client },
    { label: 'Prepared by', value: preparedBy },
    ...(assessmentDate ? [{ label: 'Date', value: assessmentDate }] : []),
    ...(version ? [{ label: 'Version', value: version }] : []),
  ].filter((detail) => detail.value.trim().length > 0)

  const executiveSummaryRaw = data.assessment_overview?.executive_summary
  const synopsisParagraphs = (typeof executiveSummaryRaw === 'string' && executiveSummaryRaw.trim().length > 0
    ? executiveSummaryRaw.trim()
    : `${ORGANISATION_FALLBACK} assessed ${client}'s engineering organisation, benchmarking delivery velocity, stability, and product practices against elite performers to surface transformation priorities.

Survey insights, stakeholder interviews, CI/CD telemetry, and security posture reviews were synthesised to diagnose systemic friction, quantify capability gaps, and shape the transformation roadmap.`)
    .split(/\n{2,}|\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)

  const synopsisPillars = toTrimmedStringArray(data.assessment_overview?.strategic_pillars)
  const synopsisFindings = toTrimmedStringArray(data.assessment_overview?.key_findings)
  const synopsisSources = toSourcesArray(data.benchmarks_reference?.source_documents)

  const introSlide: BrandSlide = {
    id: 'intro',
    layout: 'brand',
    hero: {
      kicker: `Prepared by ${preparedBy}`,
      title: reportTitle,
      tagline: `Engineering transformation insights for ${client}`,
    },
    metaDetails: introMeta,
    info: {
      title: 'What this slide shows',
      body: `Credits ${preparedBy} at ${organization} and documents the ${reportTitle.toLowerCase()} produced for ${client}.`,
      utility: 'Provides immediate context on authorship, audience, and the assessment artefact.',
    },
    benchmark:
      'Highlights the gap between current engineering posture and elite benchmarks referenced throughout the deck.',
  }

  const synopsisSlide: SynopsisSlide = {
    id: 'synopsis',
    layout: 'synopsis',
    title: 'Assessment Synopsis',
    subtitle: 'Scope, data sources, and evaluation methodology',
    synopsis: {
      paragraphs: synopsisParagraphs,
      pillars: synopsisPillars.length > 0
        ? synopsisPillars
        : [
            'Modernise the engineering engine via automated CI/CD and DevSecOps.',
            'Adopt an empowered product operating model with long-lived teams.',
            'Embed AI-assisted development and proactive security workflows.',
          ],
      findings: synopsisFindings.length > 0
        ? synopsisFindings
        : [
            'Delivery velocity and stability trail elite benchmarks, slowing release cadence.',
            'Developer experience is constrained by tooling friction and fragmented automation.',
            'AI adoption and security governance require structured investment to scale responsibly.',
          ],
      sources: synopsisSources.length > 0
        ? synopsisSources
        : [
            { title: 'DORA Metrics: Elite performance thresholds', url: 'https://getdx.com/blog/dora-metrics/' },
            { title: 'BlueOptima Global Drivers of Performance', url: null },
            { title: 'SPACE Framework References', url: 'https://octopus.com/devops/metrics/space-framework/' },
          ],
    },
    info: {
      title: 'What this slide shows',
      body: 'Summarises the assessed dimensions, evidence base, and benchmark references shaping the transformation roadmap.',
      utility: 'Sets expectations for how subsequent slides interpret metrics against industry-leading performance tiers.',
    },
    benchmark:
      'All metrics are benchmarked against elite performance targets across DORA, BlueOptima, SPACE, AI readiness, and security frameworks.',
  }

  // DORA Metrics Slide
  const doraMetrics: DoraMetric[] = (data.frameworks.dora.metrics as any[]).map((metric) => ({
    id: metric.id,
    name: metric.name,
    category: metric.category,
    definition: metric.definition,
    current_value: metric.current_value,
    current_value_display: metric.current_value_display,
    benchmark_value: metric.benchmark_value,
    performance_tier: metric.performance_tier,
    gap_analysis: metric.gap_analysis,
    telemetry: metric.telemetry,
  }))

  // Build insights from metrics
  const doraInsights = doraMetrics.map(metric => {
    const notes = (metric as any).notes || []
    const notesText = notes.length > 0 ? `\n\nNotes:\n${notes.map((n: string) => `• ${n}`).join('\n')}` : ''
    
    // Add telemetry insights if available
    const telemetryText = metric.telemetry 
      ? `\n\n**Telemetry vs Survey:**\n` +
        `Survey: ${(metric as any).current_value_display || metric.current_value} | ` +
        `Actual: ${metric.telemetry.value_display || metric.telemetry.value} | ` +
        `Variance: ${metric.telemetry.variance_from_survey > 0 ? '+' : ''}${metric.telemetry.variance_from_survey}%\n` +
        `Source: ${metric.telemetry.source} (${metric.telemetry.measurement_period})\n` +
        `${metric.telemetry.notes || ''}`
      : ''
    
    return `**${metric.name}**\n` +
           `Current: ${(metric as any).current_value_display || metric.current_value} | ` +
           `Benchmark: ${metric.benchmark_value} | ` +
           `Tier: ${metric.performance_tier}\n\n` +
           `Gap Analysis: ${metric.gap_analysis}${notesText}${telemetryText}`
  }).join('\n\n---\n\n')

  const doraSlide: DualFrameworkSlide = {
    id: 'dora-metrics',
    layout: 'dora-metrics',
    title: 'DORA Metrics Dashboard',
    subtitle: 'System-level delivery performance vs. elite benchmarks',
    metrics: doraMetrics,
    info: {
      title: 'DORA Metrics Insights',
      body: 'DORA (DevOps Research and Assessment) metrics measure software delivery performance across velocity and stability dimensions.',
      utility: 'These metrics predict organizational performance and identify bottlenecks in the delivery pipeline.',
      insights: doraInsights
    },
    benchmark: 'Elite performers deploy on-demand, with <1 day lead time, <15% failure rate, and <1 hour recovery time.',
  }

  // BlueOptima Metrics Slide
  const blueOptimaMetrics: DoraMetric[] = (data.frameworks.blueoptima.metrics as any[]).map((metric) => ({
    id: metric.id,
    name: metric.name,
    category: metric.category,
    definition: metric.definition,
    current_value: metric.current_value,
    current_value_display: metric.current_value_display,
    benchmark_value: metric.benchmark_value,
    performance_tier: metric.performance_tier,
    gap_analysis: metric.gap_analysis,
    telemetry: metric.telemetry,
  }))

  // Build insights from BlueOptima metrics
  const blueOptimaInsights = blueOptimaMetrics.map(metric => {
    const notes = (metric as any).notes || []
    const notesText = notes.length > 0 ? `\n\nNotes:\n${notes.map((n: string) => `• ${n}`).join('\n')}` : ''
    
    // Add telemetry insights if available
    const telemetryText = metric.telemetry 
      ? `\n\n**Telemetry vs Survey:**\n` +
        `Survey: ${(metric as any).current_value_display || metric.current_value} | ` +
        `Actual: ${metric.telemetry.value_display || metric.telemetry.value} | ` +
        `Variance: ${metric.telemetry.variance_from_survey > 0 ? '+' : ''}${metric.telemetry.variance_from_survey}%\n` +
        `Source: ${metric.telemetry.source} (${metric.telemetry.measurement_period})\n` +
        `${metric.telemetry.notes || ''}`
      : ''
    
    return `**${metric.name}**\n` +
           `Current: ${(metric as any).current_value_display || metric.current_value} | ` +
           `Benchmark: ${metric.benchmark_value} | ` +
           `Tier: ${metric.performance_tier}\n\n` +
           `Gap Analysis: ${metric.gap_analysis}${notesText}${telemetryText}`
  }).join('\n\n---\n\n')

  const blueOptimaSlide: DualFrameworkSlide = {
    id: 'blueoptima-metrics',
    layout: 'dora-metrics',
    title: 'BlueOptima Metrics Dashboard',
    subtitle: 'Developer-level productivity and code quality metrics',
    metrics: blueOptimaMetrics,
    info: {
      title: 'BlueOptima Metrics Insights',
      body: 'BlueOptima metrics measure individual developer productivity, code quality, and collaboration patterns.',
      utility: 'These metrics identify developer experience friction points and opportunities to improve team velocity.',
      insights: blueOptimaInsights
    },
    benchmark: 'Elite teams commit every 1-2 days, merge PRs within 7 days, and maintain <5% code aberrancy.',
  }

  const rawSpaceDimensions: SpaceDimension[] = (Array.isArray(data.frameworks?.space?.dimensions)
    ? data.frameworks.space.dimensions
    : []) as SpaceDimension[]

  const fallbackSpaceDimensions: SpaceDimension[] = [
    {
      id: 'satisfaction_wellbeing',
      name: 'Satisfaction & Well-being',
      definition: 'Developer morale and day-to-day experience.',
      survey_question: "Overall, I'm satisfied with my day-to-day developer experience.",
      scale: '1-5 Likert',
      current_score: 2.8,
      target_score: 4.5,
      industry_target: 'Strongly Agree (4.5+)',
      supporting_signals: [
        'Tool friction reported by 65% of developers',
        'High context-switching between tasks',
        'Limited time for focused coding',
      ],
    },
    {
      id: 'performance',
      name: 'Performance',
      definition: 'Confidence in quality and impact of delivered code.',
      survey_question: 'The team has high confidence that released code meets reliability and performance expectations.',
      scale: '1-5 Likert',
      current_score: 3.1,
      target_score: 4.5,
      industry_target: 'Strongly Agree (4.5+)',
      supporting_signals: [
        '28% change failure rate indicates quality concerns',
        'Limited automated testing coverage',
        'Post-release defects common',
      ],
    },
    {
      id: 'activity',
      name: 'Activity',
      definition: 'Balance of coding versus manual/repetitive tasks.',
      survey_question: 'I spend most of my time coding rather than on manual or repetitive tasks.',
      scale: '1-5 Likert',
      current_score: 2.6,
      target_score: 4.5,
      industry_target: 'Strongly Agree (4.5+)',
      supporting_signals: [
        'Manual deployment processes consume 15-20% of developer time',
        'Environment setup takes 2-3 days for new developers',
        'Repetitive testing and verification tasks',
      ],
    },
    {
      id: 'communication_collaboration',
      name: 'Communication & Collaboration',
      definition: 'Cross-functional alignment and knowledge sharing.',
      survey_question: 'Product, engineering, and design share a common understanding of priorities.',
      scale: '1-5 Likert',
      current_score: 3.3,
      target_score: 4.5,
      industry_target: 'Strongly Agree (4.5+)',
      supporting_signals: [
        'Siloed team structure limits cross-functional collaboration',
        'Unclear product roadmap priorities',
        'Limited shared documentation',
      ],
    },
    {
      id: 'efficiency_flow',
      name: 'Efficiency & Flow',
      definition: 'Frictionless developer environments and uninterrupted focus.',
      survey_question: 'Development environments are consistent and easy to set up.',
      scale: '1-5 Likert',
      current_score: 2.4,
      target_score: 4.5,
      industry_target: 'Strongly Agree (4.5+)',
      supporting_signals: [
        'Inconsistent local development environments',
        'Frequent build failures and dependency issues',
        'No containerized development setup',
      ],
    },
  ]

  const sanitizedSpaceDimensions: SpaceDimension[] = (rawSpaceDimensions.length > 0
    ? rawSpaceDimensions
    : fallbackSpaceDimensions
  ).map((dimension) => ({
    ...dimension,
    supporting_signals: Array.isArray(dimension.supporting_signals)
      ? dimension.supporting_signals.map((signal) => signal?.toString().trim()).filter(Boolean) as string[]
      : [],
  }))

  const aggregate = sanitizedSpaceDimensions.reduce(
    (acc, dimension) => {
      acc.current += dimension.current_score
      acc.target += dimension.target_score
      return acc
    },
    { current: 0, target: 0 },
  )

  const dimensionCount = sanitizedSpaceDimensions.length || 1
  const overallScore = Number((aggregate.current / dimensionCount).toFixed(2))
  const overallTarget = Number((aggregate.target / dimensionCount).toFixed(2))
  const overallGap = Number((overallTarget - overallScore).toFixed(1))

  const mostPressingDimension = sanitizedSpaceDimensions
    .slice()
    .sort((a, b) => (b.target_score - b.current_score) - (a.target_score - a.current_score))[0]
  const strongestDimension = sanitizedSpaceDimensions
    .slice()
    .sort((a, b) => (a.target_score - a.current_score) - (b.target_score - b.current_score))[0]

  const dimensionInsights = sanitizedSpaceDimensions
    .map((dimension) => {
      const gap = Number((dimension.target_score - dimension.current_score).toFixed(1))
      const signalsText = dimension.supporting_signals.length
        ? `\n\nSignals:\n${dimension.supporting_signals.map((signal) => `• ${signal}`).join('\n')}`
        : ''

      return `**${dimension.name}**\nScore: ${dimension.current_score.toFixed(1)} / Target: ${dimension.target_score.toFixed(1)} | Gap: ${gap > 0 ? `-${gap.toFixed(1)}` : '+0.0'}\n${dimension.definition}${signalsText}`
    })
    .join('\n\n---\n\n')

  const spaceInsights = [
    `**SPACE Index**\nCurrent: ${overallScore.toFixed(1)} / Target: ${overallTarget.toFixed(1)} | Gap: ${overallGap > 0 ? `-${overallGap.toFixed(1)}` : '+0.0'}\nTop gap: ${mostPressingDimension?.name ?? 'N/A'} | Immediate win: ${strongestDimension?.name ?? 'N/A'}`,
    dimensionInsights,
  ]
    .filter(Boolean)
    .join('\n\n---\n\n')

  const spaceSlide: SpaceFrameworkSlide = {
    id: 'space-framework',
    layout: 'space-framework',
    title: 'SPACE Framework Assessment',
    subtitle: 'Developer experience and organizational health signals',
    dimensions: sanitizedSpaceDimensions,
    overall_score: overallScore,
    overall_target: overallTarget,
    info: {
      title: 'What this slide shows',
      body: 'Highlights SPACE dimensions (Satisfaction, Performance, Activity, Communication, Efficiency) with survey scores versus elite targets.',
      utility:
        'Connects developer experience sentiment to delivery performance and prioritizes interventions across people, process, and tooling.',
      insights: spaceInsights,
    },
    benchmark: 'Elite engineering organizations sustain SPACE scores of 4.5+ across all dimensions with minimal variance.',
  }

  return [introSlide, synopsisSlide, doraSlide, blueOptimaSlide, spaceSlide]
}
