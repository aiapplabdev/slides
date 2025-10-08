export const toTrimmedString = (value: unknown, fallback = ''): string => {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (trimmed.length > 0) {
      return trimmed
    }
  }
  return fallback
}

export const toTrimmedStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => toTrimmedString(item))
    .filter((item) => item.length > 0)
}

export const toSourcesArray = (value: unknown): { title: string; url?: string | null }[] => {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (item && typeof item === 'object' && 'title' in item) {
        const title = toTrimmedString((item as { title?: unknown }).title)
        if (!title) return null
        const urlRaw = (item as { url?: unknown }).url
        const url = typeof urlRaw === 'string' ? urlRaw : null
        return { title, url }
      }
      return null
    })
    .filter((entry): entry is { title: string; url?: string | null } => entry !== null)
}
