import { buildSlides } from './slideBuilder'
import type {
  Slide,
  BrandSlide,
  SynopsisSlide,
  DualFrameworkSlide,
  SpaceFrameworkSlide,
  DoraMetric,
  SpaceDimension,
} from '../types/slide.types'

export type KnowledgeChunk = {
  id: string
  title: string
  content: string
  tags: string[]
}

let cachedChunks: KnowledgeChunk[] | null = null
let cachedMarkdown: string | null = null

const chunkSeparator = '\n\n---\n\n'

export function getKnowledgeChunks(): KnowledgeChunk[] {
  if (!cachedChunks) {
    cachedChunks = buildKnowledgeChunks()
  }
  return cachedChunks
}

export function serializeSlideToMarkdown(slide: Slide): string {
  if (slide.layout === 'brand') {
    const brand = slide as BrandSlide
    const meta = brand.metaDetails.map((detail) => `- ${detail.label}: ${detail.value}`).join('\n')
    return `## ${brand.hero.title}\n${brand.hero.tagline ?? ''}\n\n${meta}`.trim()
  }
  if (slide.layout === 'synopsis') {
    const synopsis = slide as SynopsisSlide
    const paragraphs = synopsis.synopsis.paragraphs.join('\n\n')
    const pillars = synopsis.synopsis.pillars.map((pillar) => `- ${pillar}`).join('\n')
    return [`## ${synopsis.title}`, synopsis.subtitle ?? '', paragraphs, '### Strategic Pillars', pillars]
      .filter((section) => section && section.toString().trim().length > 0)
      .join('\n\n')
  }
  if (slide.layout === 'dora-metrics') {
    const dual = slide as DualFrameworkSlide
    const metrics = dual.metrics
      .map((metric) => {
        const telemetry = metric.telemetry
          ? `Telemetry ${metric.telemetry.value_display ?? metric.telemetry.value} from ${metric.telemetry.source} (${metric.telemetry.measurement_period})`
          : ''
        return [
          `### ${metric.name}`,
          `Definition: ${metric.definition}`,
          `Current: ${metric.current_value_display ?? metric.current_value}`,
          `Benchmark: ${metric.benchmark_value}`,
          `Tier: ${metric.performance_tier}`,
          `Gap Analysis: ${metric.gap_analysis}`,
          telemetry,
        ]
          .filter((entry) => entry && entry.toString().trim().length > 0)
          .join('\n')
      })
      .join('\n\n')
    return [`## ${dual.title}`, dual.subtitle ?? '', dual.info.body, dual.info.insights ?? '', metrics]
      .filter((section) => section && section.toString().trim().length > 0)
      .join('\n\n')
  }
  const space = slide as SpaceFrameworkSlide
  const dimensions = space.dimensions
    .map((dimension) => {
      const signals = dimension.supporting_signals.map((signal) => `• ${signal}`).join('\n')
      return [
        `### ${dimension.name}`,
        `Definition: ${dimension.definition}`,
        `Survey: ${dimension.current_score.toFixed(1)} / Target: ${dimension.target_score.toFixed(1)}`,
        signals ? `Signals:\n${signals}` : '',
      ]
        .filter((entry) => entry && entry.toString().trim().length > 0)
        .join('\n')
    })
    .join('\n\n')
  return [
    `## ${space.title}`,
    space.subtitle ?? '',
    `Overall: ${space.overall_score.toFixed(1)} / Target ${space.overall_target.toFixed(1)}`,
    space.info.body,
    space.info.utility ?? '',
    dimensions,
  ]
    .filter((section) => section && section.toString().trim().length > 0)
    .join('\n\n')
}

export function getAssessmentMarkdown(): string {
  if (!cachedMarkdown) {
    const slides = buildSlides()
    const sections = slides.map((slide) => serializeSlideToMarkdown(slide))
    cachedMarkdown = sections.join(chunkSeparator)
  }
  return cachedMarkdown
}

function buildKnowledgeChunks(): KnowledgeChunk[] {
  const slides = buildSlides()
  const chunks: KnowledgeChunk[] = []

  slides.forEach((slide) => {
    if (slide.layout === 'brand') {
      chunks.push(buildBrandChunk(slide as BrandSlide))
    } else if (slide.layout === 'synopsis') {
      chunks.push(buildSynopsisChunk(slide as SynopsisSlide))
    } else if (slide.layout === 'dora-metrics') {
      const dualSlide = slide as DualFrameworkSlide
      chunks.push(buildSlideSummaryChunk(dualSlide))
      dualSlide.metrics.forEach((metric) => {
        chunks.push(buildMetricChunk(dualSlide, metric))
      })
    } else if (slide.layout === 'space-framework') {
      const spaceSlide = slide as SpaceFrameworkSlide
      chunks.push(buildSpaceSummaryChunk(spaceSlide))
      spaceSlide.dimensions.forEach((dimension) => {
        chunks.push(buildDimensionChunk(spaceSlide, dimension))
      })
    }
  })

  return chunks
}

function buildBrandChunk(slide: BrandSlide): KnowledgeChunk {
  const meta = slide.metaDetails.map((detail) => `${detail.label}: ${detail.value}`).join('\n')
  const content = [`Title: ${slide.hero.title}`, slide.hero.tagline ?? '', slide.info.body, slide.info.utility ?? '', meta]
    .filter((entry) => entry && entry.toString().trim().length > 0)
    .join('\n\n')
  return {
    id: 'brand-overview',
    title: 'Deck Overview',
    content,
    tags: ['overview'],
  }
}

function buildSynopsisChunk(slide: SynopsisSlide): KnowledgeChunk {
  const paragraphs = slide.synopsis.paragraphs.join('\n\n')
  const pillars = slide.synopsis.pillars.map((pillar) => `• ${pillar}`).join('\n')
  const findings = slide.synopsis.findings.map((finding) => `• ${finding}`).join('\n')
  const content = [slide.title, slide.subtitle ?? '', paragraphs, 'Key Findings:', findings, 'Strategic Pillars:', pillars]
    .filter((entry) => entry && entry.toString().trim().length > 0)
    .join('\n\n')
  return {
    id: 'synopsis-summary',
    title: 'Assessment Synopsis',
    content,
    tags: ['executive-summary'],
  }
}

function buildSlideSummaryChunk(slide: DualFrameworkSlide): KnowledgeChunk {
  const content = [slide.title, slide.subtitle ?? '', slide.info.body, slide.info.utility ?? '', slide.info.insights ?? '']
    .filter((entry) => entry && entry.toString().trim().length > 0)
    .join('\n\n')
  return {
    id: `${slide.id}-summary`,
    title: `${slide.title} Summary`,
    content,
    tags: ['metric-summary', slide.id],
  }
}

function buildMetricChunk(slide: DualFrameworkSlide, metric: DoraMetric): KnowledgeChunk {
  const telemetry = metric.telemetry
    ? `Telemetry: ${metric.telemetry.value_display ?? metric.telemetry.value} (${metric.telemetry.source}, ${metric.telemetry.measurement_period}) | Variance: ${metric.telemetry.variance_from_survey}`
    : ''
  const notes = (metric as unknown as { notes?: string[] }).notes
  const notesSection = Array.isArray(notes) && notes.length > 0 ? `Notes:\n${notes.map((note) => `• ${note}`).join('\n')}` : ''
  const content = [
    `${slide.title} – ${metric.name}`,
    `Category: ${metric.category}`,
    `Definition: ${metric.definition}`,
    `Current: ${metric.current_value_display ?? metric.current_value}`,
    `Benchmark: ${metric.benchmark_value}`,
    `Performance Tier: ${metric.performance_tier}`,
    `Gap Analysis: ${metric.gap_analysis}`,
    telemetry,
    notesSection,
  ]
    .filter((entry) => entry && entry.toString().trim().length > 0)
    .join('\n')
  return {
    id: `${slide.id}-${metric.id}`,
    title: `${metric.name} Metric Details`,
    content,
    tags: ['metric', slide.id, metric.id],
  }
}

function buildSpaceSummaryChunk(slide: SpaceFrameworkSlide): KnowledgeChunk {
  const content = [
    slide.title,
    slide.subtitle ?? '',
    `Overall Score: ${slide.overall_score.toFixed(1)}`,
    `Overall Target: ${slide.overall_target.toFixed(1)}`,
    slide.info.body,
    slide.info.utility ?? '',
    slide.info.insights ?? '',
  ]
    .filter((entry) => entry && entry.toString().trim().length > 0)
    .join('\n\n')
  return {
    id: 'space-summary',
    title: 'SPACE Framework Summary',
    content,
    tags: ['space', 'summary'],
  }
}

function buildDimensionChunk(slide: SpaceFrameworkSlide, dimension: SpaceDimension): KnowledgeChunk {
  const signals = dimension.supporting_signals.map((signal) => `• ${signal}`).join('\n')
  const content = [
    `${slide.title} – ${dimension.name}`,
    `Definition: ${dimension.definition}`,
    `Survey Question: ${dimension.survey_question}`,
    `Scale: ${dimension.scale}`,
    `Current Score: ${dimension.current_score.toFixed(1)}`,
    `Target Score: ${dimension.target_score.toFixed(1)}`,
    `Industry Target: ${dimension.industry_target}`,
    signals ? `Signals:\n${signals}` : '',
  ]
    .filter((entry) => entry && entry.toString().trim().length > 0)
    .join('\n')
  return {
    id: `space-${dimension.id}`,
    title: `${dimension.name} Dimension`,
    content,
    tags: ['space', dimension.id],
  }
}
