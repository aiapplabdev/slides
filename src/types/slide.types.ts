export type InfoBlock = {
  title: string
  body: string
  utility?: string
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

export type Slide = BrandSlide | SynopsisSlide
