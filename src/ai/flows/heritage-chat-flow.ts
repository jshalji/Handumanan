'use server';
/**
 * @fileOverview Refined AI Chatbot flow for the Handumanan system.
 * 
 * - heritageChatFlow - Handles conversational AI for heritage site inquiries.
 * - searchSitesTool - Searches the site database using real site logic.
 * - addToItineraryTool - Simulates site addition logic for user interaction.
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
  userId: z.string().optional(),
});

const HeritageChatOutputSchema = z.object({
  text: z.string(),
  suggestedAction: z.enum(['none', 'show_map', 'open_itinerary']).default('none'),
});

export type HeritageChatInput = z.infer<typeof HeritageChatInputSchema>;
export type HeritageChatOutput = z.infer<typeof HeritageChatOutputSchema>;

// Tool to search the heritage site database using real site data
const searchSitesTool = ai.defineTool(
  {
    name: 'searchSites',
    description: 'Searches for real heritage sites in Metro Cebu using Firestore records.',
    inputSchema: z.object({
      query: z.string().describe('Search keyword like "museum", "church", or site name'),
      city: z.string().optional().describe('Filter by Cebu City, Mandaue, etc.'),
    }),
    outputSchema: z.array(z.any()),
  },
  async (input) => {
    const q = input.query.toLowerCase();
    const city = input.city?.toLowerCase();
    
    return HERITAGE_SITES.filter(site => {
      const matchesQuery = site.name.toLowerCase().includes(q) || 
                          site.category.toLowerCase().includes(q) ||
                          site.description.toLowerCase().includes(q);
      const matchesCity = city ? site.city.toLowerCase() === city : true;
      return matchesQuery && matchesCity;
    }).slice(0, 5);
  }
);

// Tool to trigger site focus on map
const focusSiteOnMapTool = ai.defineTool(
  {
    name: 'focusSiteOnMap',
    description: 'Centers the user\'s map view on a specific heritage site.',
    inputSchema: z.object({
      siteName: z.string().describe('Exact name of the site to focus on.'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    const site = HERITAGE_SITES.find(s => s.name.toLowerCase() === input.siteName.toLowerCase());
    if (site) return `Centering map on ${site.name} at [${site.coordinates.lat}, ${site.coordinates.lng}].`;
    return `Site "${input.siteName}" not found.`;
  }
);

const heritageChatPrompt = ai.definePrompt({
  name: 'heritageChatPrompt',
  tools: [searchSitesTool, focusSiteOnMapTool],
  system: `You are the "Handumanan Guide", an expert virtual tour guide for Metro Cebu.
  
  CONTEXT:
  - You help users find "Heritage Treasures" in Cebu, Mandaue, Talisay, and Lapu-Lapu.
  - You have access to real site data via searchSites tool.
  
  GOALS:
  1. ANSWER QUERIES: Provide short, engaging summaries (2-3 sentences).
  2. PROVIDE RECOMMENDATIONS: If the user asks for "nearby" or "popular" places, use searchSites and recommend 3 specific sites.
  3. SMART ACTIONS: If a user expresses strong interest in a site, offer to "Show it on the map" using focusSiteOnMap.
  
  STYLE:
  - Be conversational, helpful, and proud of Cebuano heritage.
  - Keep responses under 4 sentences.
  - Use simple language.
  `,
  prompt: '{{{message}}}',
});

export async function chatWithHeritageBot(input: HeritageChatInput): Promise<HeritageChatOutput> {
  const lastMessage = input.history[input.history.length - 1].content[0].text;
  
  const { text } = await ai.generate({
    prompt: lastMessage,
    history: input.history.slice(0, -1),
    tools: [searchSitesTool, focusSiteOnMapTool],
    model: 'googleai/gemini-2.5-flash',
    config: {
      temperature: 0.7,
    }
  });

  return {
    text: text || "I'm sorry, I couldn't find details on that. Try asking about local museums or churches in Cebu.",
    suggestedAction: 'none'
  };
}
