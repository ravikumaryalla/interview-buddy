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
    const parsed = JSON.parse(cleanContent) as AISolution;
    return parsed;
  } catch (e) {
    console.error("Failed to parse AI response", cleanContent);
    throw new Error("Failed to parse AI solution format");
  }
}
