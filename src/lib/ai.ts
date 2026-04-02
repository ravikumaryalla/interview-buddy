import { GoogleGenAI } from '@google/genai';

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

export async function solveProblemWithAI(apiKey: string, problemText: string): Promise<AISolution> {
  if (!apiKey) throw new Error("Gemini API Key is missing");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `You are an expert technical interviewer and software engineer. Solve the following coding problem extracted from an image via OCR (it may contain slight typos). 

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
}

Problem Text:
${problemText}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.2,
    }
  });

  const content = response.text;
  if (!content) throw new Error("No response from AI");

  // try to clean up the content if it contains markdown JSON blocks
  let cleanContent = content.trim();
  if (cleanContent.startsWith('\`\`\`json')) {
    cleanContent = cleanContent.replace(/^\`\`\`json\n/, '').replace(/\n\`\`\`$/, '');
  } else if (cleanContent.startsWith('\`\`\`')) {
    cleanContent = cleanContent.replace(/^\`\`\`\n/, '').replace(/\n\`\`\`$/, '');
  }

  try {
    const parsed = JSON.parse(cleanContent) as unknown;
    return validateAISolution(parsed);
  } catch (e) {
    console.error("Failed to parse AI response", cleanContent);
    throw new Error("Failed to parse AI solution format");
  }
}
