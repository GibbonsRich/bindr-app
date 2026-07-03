export type VisionProvider = 'gemini' | 'openai';

export function getVisionProvider(): VisionProvider | null {
  if (process.env.EXPO_PUBLIC_GEMINI_API_KEY) return 'gemini';
  if (process.env.EXPO_PUBLIC_OPENAI_API_KEY) return 'openai';
  return null;
}

export function getGeminiApiKey(): string | undefined {
  return process.env.EXPO_PUBLIC_GEMINI_API_KEY;
}

export function getOpenAiApiKey(): string | undefined {
  return process.env.EXPO_PUBLIC_OPENAI_API_KEY;
}

export function getPokemonTcgApiKey(): string | undefined {
  return process.env.EXPO_PUBLIC_POKEMON_TCG_API_KEY;
}

export function getMissingApiKeyMessage(): string {
  return (
    'Add EXPO_PUBLIC_GEMINI_API_KEY or EXPO_PUBLIC_OPENAI_API_KEY to a .env file in the project root, then restart Expo.'
  );
}
