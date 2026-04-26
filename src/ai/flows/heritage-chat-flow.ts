'use server';
/**
 * @fileOverview AI Chatbot flow for the Handumanan system.
 * 
 * - heritageChatFlow - Handles conversational AI for heritage site inquiries and itinerary planning.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { HERITAGE_SITES } from '@/lib/heritage-data';

const MessageSchema = z.object({
  role: z.enum(['user', 'model', 'system']),
  content: z.array(z.object({ text: z.string() })),
});

const HeritageChatInputSchema = z.object({
  history: z.array(MessageSchema),
  userLocation: z.object({
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});

const HeritageChatOutputSchema = z.object({
  text: z.string(),
  suggestedAction: z.enum(['none', 'show_map', 'open_itinerary']).default('none'),
});

export type HeritageChatInput = z.infer<typeof HeritageChatInputSchema>;
export type HeritageChatOutput = z.infer<typeof HeritageChatOutputSchema>;

// Tool to search the heritage site database
const searchSitesTool = ai.defineTool(
  {
    name: 'searchSites',
    description: 'Searches for heritage sites in Metro Cebu based on keywords like name, category, or city.',
    inputSchema: z.object({
      query: z.string().describe('Search keyword or category (e.g., "museum", "Cebu City", "church")'),
    }),
    outputSchema: z.array(z.any()),
  },
  async (input) => {
    const q = input.query.toLowerCase();
    return HERITAGE_SITES.filter(site => 
      site.name.toLowerCase().includes(q) ||
      site.category.toLowerCase().includes(q) ||
      site.city.toLowerCase().includes(q) ||
      site.description.toLowerCase().includes(q)
    ).slice(0, 5);
  }
);

const heritageChatPrompt = ai.definePrompt({
  name: 'heritageChatPrompt',
  tools: [searchSitesTool],
  system: `You are the "Handumanan Guide", an expert tourism assistant for Metro Cebu cultural heritage sites.
  
  Your goals:
  1. Answer questions about heritage sites (history, location, significance).
  2. Provide recommendations based on the user's interests or location.
  3. Help plan itineraries.
  
  Constraint: ONLY answer questions related to Cebu heritage, tourism, and navigation. If asked unrelated questions, politely state you are here to help with Cebu's cultural treasures.
  
  When recommending sites, use the searchSites tool to get accurate data.
  If the user provides a location (latitude/longitude), prioritize sites near them.
  `,
  prompt: '{{{message}}}',
});

export async function chatWithHeritageBot(input: HeritageChatInput): Promise<HeritageChatOutput> {
  const lastMessage = input.history[input.history.length - 1].content[0].text;
  
  const { text } = await ai.generate({
    prompt: lastMessage,
    history: input.history.slice(0, -1),
    tools: [searchSitesTool],
    model: 'googleai/gemini-2.5-flash',
    config: {
      temperature: 0.7,
    }
  });

  return {
    text: text || "I'm sorry, I couldn't process that. How else can I help you explore Cebu?",
    suggestedAction: 'none'
  };
}
