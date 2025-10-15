import { DEFAULT_SYSTEM_PROMPT } from '../config/systemPrompt'

const DEFAULT_CONTEXT_PREFACE = `The following context includes the active slide followed by supporting knowledge from the engineering transformation assessment JSON. Use it to craft accurate, slide-aligned answers for executives.`

export function getSystemPrompt(): string {
  const configured = import.meta.env.VITE_ASSISTANT_SYSTEM_PROMPT?.toString()?.trim()
  return configured && configured.length > 0 ? configured : DEFAULT_SYSTEM_PROMPT
}

export function getContextPreface(): string {
  const configured = import.meta.env.VITE_ASSISTANT_CONTEXT_PREFACE?.toString()?.trim()
  return configured && configured.length > 0 ? configured : DEFAULT_CONTEXT_PREFACE
}
