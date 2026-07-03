import type { CardCondition, CardGrade } from '@/types/card';

export type RawVisionAnalysis = {
  name: string;
  set: string;
  number: string;
  rarity: string;
  condition: CardCondition;
  confidence: number;
  grade: CardGrade;
};

const ANALYSIS_PROMPT = `You are a Pokemon TCG expert grader. Analyze the photo of a single Pokemon trading card.

Identify the card by reading visible text: Pokemon name, set name or symbol, collector number (e.g. 025/185), and rarity.
Grade physical condition from what you can see in the photo:
- Mint: no visible flaws
- Near Mint: tiny imperfections at most
- Excellent: minor wear, slight whitening or scratches
- Good: moderate wear, visible edge whitening
- Played: heavy wear, creases possible
- Poor: major damage

Score centering, corners, edges, and surface from 1.0 to 10.0 (one decimal). Base scores on visible evidence only.
If the image is blurry, not a Pokemon card, or too obscured, lower confidence below 0.5 and explain in grade.notes.

Return ONLY valid JSON with this exact shape:
{
  "name": "string",
  "set": "string",
  "number": "string",
  "rarity": "string",
  "condition": "Mint" | "Near Mint" | "Excellent" | "Good" | "Played" | "Poor",
  "confidence": 0.0,
  "grade": {
    "overall": "same as condition",
    "centering": 0.0,
    "corners": 0.0,
    "edges": 0.0,
    "surface": 0.0,
    "notes": ["string"]
  }
}`;

function geminiEndpoint(apiKey: string): string {
  // AI Studio keys (AIza...) use generativelanguage.googleapis.com
  if (apiKey.startsWith('AIza')) {
    return `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  }

  // Vertex / service-account style keys use a different host
  return `https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
}

export async function analyzeWithGemini(
  base64: string,
  mimeType: string,
  apiKey: string
): Promise<RawVisionAnalysis> {
  const response = await fetch(geminiEndpoint(apiKey), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: ANALYSIS_PROMPT },
            { inline_data: { mime_type: mimeType, data: base64 } },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401 || response.status === 403) {
      throw new Error(
        'Gemini API key rejected. Use a key from https://aistudio.google.com/apikey (starts with AIza).'
      );
    }
    throw new Error(`Gemini API error (${response.status}): ${errorText.slice(0, 200)}`);
  }

  const payload = await response.json();
  const text = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned no analysis content');

  return parseVisionJson(text);
}

export async function analyzeWithOpenAI(
  base64: string,
  mimeType: string,
  apiKey: string
): Promise<RawVisionAnalysis> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: ANALYSIS_PROMPT },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error (${response.status}): ${errorText.slice(0, 200)}`);
  }

  const payload = await response.json();
  const text = payload?.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI returned no analysis content');

  return parseVisionJson(text);
}

function parseVisionJson(raw: string): RawVisionAnalysis {
  const parsed = JSON.parse(raw) as Partial<RawVisionAnalysis> & {
    grade?: Partial<CardGrade>;
  };
  const condition = normalizeCondition(parsed.condition);
  const grade = parsed.grade;

  return {
    name: String(parsed.name ?? 'Unknown card').trim(),
    set: String(parsed.set ?? 'Unknown set').trim(),
    number: String(parsed.number ?? '?/?').trim(),
    rarity: String(parsed.rarity ?? 'Unknown').trim(),
    condition,
    confidence: clamp(Number(parsed.confidence ?? 0.5), 0, 1),
    grade: {
      overall: normalizeCondition(grade?.overall ?? condition),
      centering: clampScore(grade?.centering),
      corners: clampScore(grade?.corners),
      edges: clampScore(grade?.edges),
      surface: clampScore(grade?.surface),
      notes: Array.isArray(grade?.notes)
        ? grade.notes.map(String).filter(Boolean)
        : ['Analysis completed from photo'],
    },
  };
}

function normalizeCondition(value: unknown): CardCondition {
  const valid: CardCondition[] = ['Mint', 'Near Mint', 'Excellent', 'Good', 'Played', 'Poor'];
  if (typeof value === 'string' && valid.includes(value as CardCondition)) {
    return value as CardCondition;
  }

  const normalized = String(value ?? '').toLowerCase();
  if (normalized.includes('mint') && !normalized.includes('near')) return 'Mint';
  if (normalized.includes('near')) return 'Near Mint';
  if (normalized.includes('excellent')) return 'Excellent';
  if (normalized.includes('good')) return 'Good';
  if (normalized.includes('played')) return 'Played';
  if (normalized.includes('poor')) return 'Poor';
  return 'Good';
}

function clampScore(value: unknown): number {
  return Math.round(clamp(Number(value ?? 6), 1, 10) * 10) / 10;
}

function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}
