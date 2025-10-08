import data from '../../engineering_metrics_benchmark_template.json'
import { toTrimmedString, toTrimmedStringArray, toSourcesArray } from '../utils/dataHelpers'
import type { Slide, BrandSlide, SynopsisSlide, MetaDetail } from '../types/slide.types'

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

  return [introSlide, synopsisSlide]
}
