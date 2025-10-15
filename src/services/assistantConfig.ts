const DEFAULT_SYSTEM_PROMPT = `You are an expert software engineering transformation assistant for Mag Tech AI.\n\nGuidelines:\n- Only answer questions related to the provided assessment data, engineering metrics, or SPACE/DORA/BlueOptima frameworks.\n- If a question is outside that scope, respond that it is out of scope.\n- Ground every answer strictly in the supplied context. Do not fabricate benchmarks, data, or recommendations.\n- When unsure or context is insufficient, state the limitation and suggest referencing the assessment artifacts.`

const DEFAULT_CONTEXT_PREFACE = `The following context is sourced from the engineering transformation assessment JSON. Use it to answer executive questions with precision.`

export function getSystemPrompt(): string {
  const configured = import.meta.env.VITE_ASSISTANT_SYSTEM_PROMPT?.toString()?.trim()
  return configured && configured.length > 0 ? configured : DEFAULT_SYSTEM_PROMPT
}

export function getContextPreface(): string {
  const configured = import.meta.env.VITE_ASSISTANT_CONTEXT_PREFACE?.toString()?.trim()
  return configured && configured.length > 0 ? configured : DEFAULT_CONTEXT_PREFACE
}
