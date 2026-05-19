import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

const apiKey =
  process.env.GEMINI_API_KEY ||
  process.env.GOOGLE_API_KEY ||
  process.env.GOOGLE_GENAI_API_KEY;

export const hasGoogleAiApiKey =
  Boolean(apiKey) && apiKey !== 'replace_with_your_new_gemini_api_key';

export const ai = genkit({
  plugins: [googleAI({ apiKey })],
  model: 'googleai/gemini-2.5-flash',
});
