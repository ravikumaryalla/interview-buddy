import { api } from './api'

export interface AISolution {
  summary: string;
  approach: string;
  code: {
    javascript: string;
    java: string;
    python: string;
  };
  complexity: {
    time: string;
    space: string;
  };
}

export interface OpenAIModel {
  id: string;
  name: string;
  reasoning: boolean;
}

export const OPENAI_MODELS: OpenAIModel[] = [
  { id: 'gpt-4o',       name: 'GPT-4o',       reasoning: false },
  { id: 'gpt-4o-mini',  name: 'GPT-4o Mini',  reasoning: false },
  { id: 'gpt-4.1',      name: 'GPT-4.1',      reasoning: false },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', reasoning: false },
  { id: 'o4-mini',      name: 'o4-mini',       reasoning: true  },
  { id: 'o3',           name: 'o3',            reasoning: true  },
  { id: 'o1',           name: 'o1',            reasoning: true  },
]

export type ReasoningEffort = 'low' | 'medium' | 'high'

export function isReasoningModel(model: string): boolean {
  return /^o\d/.test(model)
}

export async function solveProblemWithAI(
  problemText: string,
  model: string = 'gpt-4o',
  reasoningEffort: ReasoningEffort = 'medium',
): Promise<AISolution> {
  return api.ai.solve(problemText, model, reasoningEffort)
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const result = await api.ai.transcribe(audioBlob)
  return result.text
}

export async function answerWithCustomPrompt(
  extractedText: string,
  customPrompt: string,
  model: string = 'gpt-4o',
  onDelta?: (delta: string) => void,
): Promise<string> {
  const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
    { role: 'system', content: customPrompt },
    { role: 'user',   content: extractedText },
  ]
  if (onDelta) {
    let full = ''
    await api.ai.chatStream(messages, model, (delta) => { full += delta; onDelta(delta) })
    return full
  }
  const result = await api.ai.chat(messages, model)
  return result.message
}

export async function chatWithAI(
  query: string,
  history: { role: string; content: string }[],
  systemPrompt: string,
  model: string = 'gpt-4o',
  onDelta?: (delta: string) => void,
): Promise<string> {
  const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [
    { role: 'system', content: systemPrompt },
    ...history.map(m => ({
      role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: query },
  ]
  if (onDelta) {
    let full = ''
    await api.ai.chatStream(messages, model, (delta) => { full += delta; onDelta(delta) })
    return full
  }
  const result = await api.ai.chat(messages, model)
  return result.message
}

export async function getRealtimeToken(): Promise<string> {
  const result = await api.ai.realtimeToken()
  return result.clientSecret
}
