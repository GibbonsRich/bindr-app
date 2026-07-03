import {
  getGeminiApiKey,
  getMissingApiKeyMessage,
  getOpenAiApiKey,
  getVisionProvider,
} from '@/lib/config';
import { imageUriToBase64 } from '@/lib/imageUtils';
import { estimateValueFromMarket, verifyCardWithTcgApi } from '@/lib/pokemonTcg';
import { analyzeWithGemini, analyzeWithOpenAI } from '@/lib/vision';
import type { ScanResult } from '@/types/card';

export class ScanAnalysisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScanAnalysisError';
  }
}

/** Analyze a captured card photo with vision AI, then verify identity and pricing via Pokemon TCG API. */
export async function analyzeCardImage(imageUri: string): Promise<ScanResult> {
  const provider = getVisionProvider();
  if (!provider) {
    throw new ScanAnalysisError(getMissingApiKeyMessage());
  }

  const { base64, mimeType } = await imageUriToBase64(imageUri);

  const vision =
    provider === 'gemini'
      ? await analyzeWithGemini(base64, mimeType, getGeminiApiKey()!)
      : await analyzeWithOpenAI(base64, mimeType, getOpenAiApiKey()!);

  if (vision.confidence < 0.35) {
    throw new ScanAnalysisError(
      vision.grade.notes[0] ??
        'Could not confidently read this card. Retake the photo with the full card in frame and good lighting.'
    );
  }

  const verified = await verifyCardWithTcgApi(vision.name, vision.set, vision.number);

  const confidence = verified.verified
    ? Math.min(0.99, vision.confidence + 0.12)
    : vision.confidence;

  const notes = [...vision.grade.notes];
  if (verified.verified) {
    notes.unshift('Card identity confirmed via Pokemon TCG database.');
  } else if (verified.tcgId) {
    notes.unshift('Partial match found in Pokemon TCG database — verify set and number.');
  } else {
    notes.unshift('Pokemon TCG lookup had no match — showing AI-identified card details.');
  }

  return {
    confidence,
    card: {
      name: verified.verified ? verified.name : vision.name,
      set: verified.verified ? verified.set : vision.set,
      number: verified.verified ? verified.number : vision.number,
      rarity: verified.verified ? verified.rarity : vision.rarity,
      imageUri,
      condition: vision.condition,
      grade: {
        ...vision.grade,
        overall: vision.condition,
        notes,
      },
      estimatedValue: estimateValueFromMarket(
        verified.marketPrice,
        vision.condition,
        verified.name || vision.name
      ),
    },
  };
}
