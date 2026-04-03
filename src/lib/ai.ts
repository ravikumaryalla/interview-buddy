import OpenAI from 'openai';

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
  { id: 'gpt-4o', name: 'GPT-4o', reasoning: false },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', reasoning: false },
  { id: 'gpt-4.1', name: 'GPT-4.1', reasoning: false },
  { id: 'gpt-4.1-mini', name: 'GPT-4.1 Mini', reasoning: false },
  { id: 'o4-mini', name: 'o4-mini', reasoning: true },
  { id: 'o3', name: 'o3', reasoning: true },
  { id: 'o1', name: 'o1', reasoning: true },
];

export type ReasoningEffort = 'low' | 'medium' | 'high';

export function isReasoningModel(model: string): boolean {
  return /^o\d/.test(model);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function validateAISolution(value: unknown): AISolution {
  if (!isRecord(value)) {
    throw new Error('AI response was not an object');
  }

  const { summary, approach, code, complexity } = value;

  if (typeof summary !== 'string' || typeof approach !== 'string') {
    throw new Error('AI response is missing summary or approach');
  }

  if (!isRecord(code)) {
    throw new Error('AI response is missing code solutions');
  }

  if (
    typeof code.javascript !== 'string' ||
    typeof code.java !== 'string' ||
    typeof code.python !== 'string'
  ) {
    throw new Error('AI response is missing one or more language solutions');
  }

  if (!isRecord(complexity)) {
    throw new Error('AI response is missing complexity details');
  }

  if (typeof complexity.time !== 'string' || typeof complexity.space !== 'string') {
    throw new Error('AI response is missing time or space complexity');
  }

  return {
    summary,
    approach,
    code: {
      javascript: code.javascript,
      java: code.java,
      python: code.python,
    },
    complexity: {
      time: complexity.time,
      space: complexity.space,
    },
  };
}

export async function solveProblemWithAI(
  apiKey: string,
  problemText: string,
  model: string = 'gpt-4o',
  reasoningEffort: ReasoningEffort = 'medium'
): Promise<AISolution> {
  if (!apiKey) throw new Error("OpenAI API Key is missing");

  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  const systemPrompt = `You are an expert technical interviewer and software engineer. Solve the following coding problem extracted from an image via OCR (it may contain slight typos).

Return ONLY a raw JSON object string with the following format (no markdown code blocks, just pure JSON parseable string):
{
  "summary": "Brief 1-2 sentence summary of the problem",
  "approach": "Clear, concise explanation of the optimal algorithm to solve this problem",
  "code": {
    "javascript": "optimal javascript code here",
    "java": "optimal java code here",
    "python": "optimal python code here"
  },
  "complexity": {
    "time": "O(...)",
    "space": "O(...)"
  }
}`;

  const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
    model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: problemText },
    ],
    ...(isReasoningModel(model)
      ? { reasoning_effort: reasoningEffort }
      : { temperature: 0.2 }),
  };

  const response = await client.chat.completions.create(params);

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error("No response from AI");

  let cleanContent = content.trim();
  if (cleanContent.startsWith('```json')) {
    cleanContent = cleanContent.replace(/^```json\n/, '').replace(/\n```$/, '');
  } else if (cleanContent.startsWith('```')) {
    cleanContent = cleanContent.replace(/^```\n/, '').replace(/\n```$/, '');
  }

  try {
    const parsed = JSON.parse(cleanContent) as unknown;
    return validateAISolution(parsed);
  } catch (e) {
    console.error("Failed to parse AI response", cleanContent);
    throw new Error("Failed to parse AI solution format");
  }
}

export async function transcribeAudio(apiKey: string, audioBlob: Blob): Promise<string> {
  if (!apiKey) throw new Error('OpenAI API Key is missing');
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });
  const file = new File([audioBlob], 'audio.webm', { type: audioBlob.type || 'audio/webm' });
  const result = await client.audio.transcriptions.create({ model: 'whisper-1', file, language: 'en' });
  return result.text;
}

export async function answerWithCustomPrompt(
  apiKey: string,
  extractedText: string,
  customPrompt: string,
  model: string = 'gpt-4o',
  reasoningEffort: ReasoningEffort = 'medium'
): Promise<string> {
  if (!apiKey) throw new Error("OpenAI API Key is missing");

  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
    model,
    messages: [
      { role: 'system', content: customPrompt },
      { role: 'user', content: extractedText },
    ],
    ...(isReasoningModel(model)
      ? { reasoning_effort: reasoningEffort }
      : { temperature: 0.5 }),
  };

  const response = await client.chat.completions.create(params);
  return response.choices[0]?.message?.content ?? 'No response';
}

export async function chatWithAI(
  apiKey: string,
  query: string,
  history: { role: string; content: string }[],
  systemPrompt: string,
  model: string = 'gpt-4o',
  reasoningEffort: ReasoningEffort = 'medium'
): Promise<string> {
  if (!apiKey) throw new Error("OpenAI API Key is missing");

  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.map(m => ({
      role: (m.role === 'assistant' ? 'assistant' : 'user') as 'assistant' | 'user',
      content: m.content,
    })),
    { role: 'user', content: query },
  ];

  const params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
    model,
    messages,
    ...(isReasoningModel(model)
      ? { reasoning_effort: reasoningEffort }
      : { temperature: 0.5 }),
  };

  const response = await client.chat.completions.create(params);
  return response.choices[0]?.message?.content ?? 'No response';
}
