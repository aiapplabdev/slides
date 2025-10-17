export type InfoBlock = {
  title: string
  body: string
  utility?: string
  insights?: string
}

export type HeroBlock = {
  kicker?: string
  title: string
  tagline?: string
}

export type MetaDetail = {
  label: string
  value: string
}

export type SynopsisBlock = {
  paragraphs: string[]
  pillars: string[]
  findings: string[]
  sources: { title: string; url?: string | null }[]
}

export type BrandSlide = {
  id: 'intro'
  layout: 'brand'
  hero: HeroBlock
  metaDetails: MetaDetail[]
  info: InfoBlock
  benchmark?: string
}

export type SynopsisSlide = {
  id: 'synopsis'
  layout: 'synopsis'
  title: string
  subtitle?: string
  synopsis: SynopsisBlock
  info: InfoBlock
  benchmark?: string
}

export type TelemetryData = {
  value: number
  value_display?: string
  source: string
  measurement_period: string
  confidence: string
  variance_from_survey: number
  notes?: string
}

export type DoraMetric = {
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

export type DualFrameworkSlide = {
  id: 'dora-metrics' | 'blueoptima-metrics'
  layout: 'dora-metrics'
  title: string
  subtitle?: string
  metrics: DoraMetric[]
  info: InfoBlock
  benchmark?: string
}

export type SpaceDimension = {
  id: string
  name: string
  definition: string
  survey_question: string
  scale: string
  current_score: number
  target_score: number
  industry_target: string
  supporting_signals: string[]
}

export type SpaceFrameworkSlide = {
  id: 'space-framework'
  layout: 'space-framework'
  title: string
  subtitle?: string
  dimensions: SpaceDimension[]
  overall_score: number
  overall_target: number
  info: InfoBlock
  benchmark?: string
}

export type SammAssessment = {
  id: string
  practice: string
  maturity_score: number
  insights: string[]
  proof: string[]
  recommendations: string[]
}

export type SecurityPostureSlide = {
  id: 'samm-security'
  layout: 'samm-security'
  title: string
  subtitle?: string
  description?: string
  assessments: SammAssessment[]
  info: InfoBlock
  benchmark?: string
}

export type Slide =
  | BrandSlide
  | SynopsisSlide
  | DualFrameworkSlide
  | SpaceFrameworkSlide
  | SecurityPostureSlide
