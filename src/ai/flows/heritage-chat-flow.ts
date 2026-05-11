
'use server';
/**
 * @fileOverview Refined AI Chatbot flow for the Handumanan system.
 * 
 * - heritageChatFlow - Handles conversational AI for heritage site inquiries.
 * - searchSitesTool - Searches the site database using real site logic.
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
  favorites: z.array(z.string()).optional().describe('List of site names the user has favorited.'),
  lastItinerary: z.string().optional().describe('Summary of the user\'s last saved itinerary.'),
  currentRoute: z.object({
    stops: z.array(z.string()),
    totalDistance: z.number(),
    estimatedTime: z.number(),
  }).optional(),
});

const HeritageChatOutputSchema = z.object({
  text: z.string(),
  suggestedAction: z.enum(['none', 'show_map', 'open_itinerary']).default('none'),
  suggestedSiteIds: z.array(z.string()).optional().describe('IDs of heritage sites relevant to the conversation to be displayed as cards.'),
});

export type HeritageChatInput = z.infer<typeof HeritageChatInputSchema>;
export type HeritageChatOutput = z.infer<typeof HeritageChatOutputSchema>;

const searchSitesTool = ai.defineTool(
  {
    name: 'searchSites',
    description: 'Searches for real heritage sites in Metro Cebu using records.',
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
    }).slice(0, 3);
  }
);

export async function chatWithHeritageBot(input: HeritageChatInput): Promise<HeritageChatOutput> {
  const lastMessage = input.history[input.history.length - 1].content[0].text;
  
  const routeContext = input.currentRoute ? 
    `The user has an active route with ${input.currentRoute.stops.length} stops: ${input.currentRoute.stops.join(', ')}.` : 
    "No active route yet.";

  const userContext = `
    User Context:
    - Favorites: ${input.favorites?.join(', ') || 'None yet'}
    - Recent Trip: ${input.lastItinerary || 'No saved trips yet'}
  `;

  try {
    const { output } = await ai.generate({
      prompt: lastMessage,
      history: input.history.slice(0, -1),
      tools: [searchSitesTool],
      model: 'googleai/gemini-1.5-flash',
      output: { schema: HeritageChatOutputSchema },
      system: `You are the "Handumanan Guide", an expert virtual tour guide for Metro Cebu.
      
      CONTEXT:
      - Help users find heritage sites and understand their route.
      - User Context: ${userContext}
      - Active Route Info: ${routeContext}
      
      GOALS:
      1. RECOGNIZE USER DATA: Acknowledge favorites and recent trips.
      2. PROVIDE LANDMARK INFO: Use searchSites tool for real data.
      3. SITE CARDS: If you mention specific sites, include their EXACT IDs in "suggestedSiteIds".
      4. STAY CONCISE: 2-4 sentences max.
      
      STYLE: Friendly, Cebuano-proud, helpful.`,
      config: { temperature: 0.7 }
    });

    if (!output) throw new Error('No response from AI');
    return output;
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return {
      text: `AI Guide unavailable: ${error.message || 'Check API connection'}`,
      suggestedAction: 'none'
    };
  }
}
