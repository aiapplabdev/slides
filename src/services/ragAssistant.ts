import type { Slide } from '../types/slide.types'
import { getSystemPrompt, getContextPreface } from './assistantConfig'
import { getKnowledgeChunks, serializeSlideToMarkdown, type KnowledgeChunk } from './knowledgeBase'

export type AssistantHistoryMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type AssistantAnswer = {
  answer: string
  citations: KnowledgeChunk[]
}

const MAX_CONTEXT_CHUNKS = 4
const API_PATH = '/api/azure-openai'

let chunkEmbeddings: { chunk: KnowledgeChunk; vector: number[] }[] | null = null

function normalizeBaseUrl(url: string) {
  return url.endsWith('/') ? url.slice(0, -1) : url
}

function getApiBaseUrl(): string {
  const override = import.meta.env.VITE_API_BASE_URL?.toString().trim()
  if (override) {
    return normalizeBaseUrl(override)
  }

  if (import.meta.env.DEV) {
    const localFunctionsHost = import.meta.env.VITE_AZURE_FUNCTIONS_HOST?.toString().trim() || 'http://localhost:7071'
    return normalizeBaseUrl(localFunctionsHost)
  }

  return normalizeBaseUrl(window.location.origin)
}

async function callAzureFunction<T = unknown>(payload: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${API_PATH}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const raw = await response.text()
  let data: unknown = null

  if (raw) {
    try {
      data = JSON.parse(raw)
    } catch (error) {
      throw new Error(`Azure function returned non-JSON response (${response.status}): ${raw}`)
    }
  } else if (response.ok) {
    throw new Error(`Azure function returned empty response with status ${response.status}.`)
  }

  if (!response.ok) {
    const errorMessage = typeof data === 'object' && data && 'error' in data ? (data as { error: string }).error : response.statusText
    throw new Error(errorMessage || 'Azure OpenAI request failed.')
  }

  return data as T
}

function cosineSimilarity(a: number[], b: number[]): number {
  const minLength = Math.min(a.length, b.length)
  let dot = 0
  let magA = 0
  let magB = 0
  for (let i = 0; i < minLength; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  if (!magA || !magB) return 0
  return dot / (Math.sqrt(magA) * Math.sqrt(magB))
}

async function ensureChunkEmbeddings(): Promise<void> {
  if (chunkEmbeddings) return

  const knowledgeChunks = getKnowledgeChunks()
  const inputs = knowledgeChunks.map((chunk) => chunk.content)

  const embeddings = await callAzureFunction<{ data: { embedding: number[] }[] }>({
    mode: 'embedding',
    input: inputs,
  })
  const vectors = embeddings.data.map((item) => item.embedding)
  chunkEmbeddings = knowledgeChunks.map((chunk, index) => ({
    chunk,
    vector: vectors[index],
  }))
}

async function findRelevantChunks(query: string, slideMarkdown: string): Promise<KnowledgeChunk[]> {
  await ensureChunkEmbeddings()

  const queryEmbedding = await callAzureFunction<{ data: { embedding: number[] }[] }>({
    mode: 'embedding',
    input: [`${query}\n\n${slideMarkdown}`],
  })
  const queryVector = queryEmbedding.data[0].embedding

  if (!chunkEmbeddings) return []

  const scored = chunkEmbeddings.map(({ chunk, vector }) => ({
    chunk,
    score: cosineSimilarity(queryVector, vector),
  }))

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_CONTEXT_CHUNKS)
    .map((entry) => entry.chunk)
}

export async function getAssistantAnswer(
  question: string,
  slide: Slide,
  history: AssistantHistoryMessage[] = [],
): Promise<AssistantAnswer> {
  const systemPrompt = getSystemPrompt()
  const contextPreface = getContextPreface()
  const slideMarkdown = serializeSlideToMarkdown(slide)
  const relevantChunks = await findRelevantChunks(question, slideMarkdown)

  const contextSections = [
    `### Active Slide Context\n${slideMarkdown}`,
    ...relevantChunks.map((chunk) => `### ${chunk.title}\n${chunk.content}`),
  ]

  const completion = await callAzureFunction<{ answer: string }>({
    question,
    history,
    systemPrompt,
    contextSections: `${contextPreface}\n\n${contextSections.join('\n\n---\n\n')}`,
  })
  const answer = completion.answer?.trim() || 'I was unable to generate a response based on the current context.'

  return {
    answer,
    citations: relevantChunks,
  }
}
