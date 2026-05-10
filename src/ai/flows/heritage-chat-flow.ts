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
    }).slice(0, 3);
  }
);

export async function chatWithHeritageBot(input: HeritageChatInput): Promise<HeritageChatOutput> {
  const lastMessage = input.history[input.history.length - 1].content[0].text;
  
  const routeContext = input.currentRoute ? 
    `The user has an active route with ${input.currentRoute.stops.length} stops: ${input.currentRoute.stops.join(', ')}. 
     Total distance is ${input.currentRoute.totalDistance.toFixed(1)} km, taking approx ${Math.round(input.currentRoute.estimatedTime)} mins.` : 
    "No active route yet.";

  const userContext = `
    User Saved Data (from Database):
    - Favorites: ${input.favorites?.join(', ') || 'None yet'}
    - Recent Trip: ${input.lastItinerary || 'No saved trips yet'}
  `;

  let lastError;
  const maxAttempts = 3;
  
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const { output } = await ai.generate({
        prompt: lastMessage,
        history: input.history.slice(0, -1),
        tools: [searchSitesTool],
        model: 'googleai/gemini-2.5-flash',
        output: { schema: HeritageChatOutputSchema },
        system: `You are the "Handumanan Guide", an expert virtual tour guide for Metro Cebu.
        
        CONTEXT:
        - You help users find heritage sites and understand their active travel route.
        - User Context: ${userContext}
        - Active Route Info: ${routeContext}
        - Use real data from the searchSites tool if the user asks for details about a landmark.
        
        GOALS:
        1. RECOGNIZE USER DATA: If the user asks about their saved sites or trips, use the User Context provided.
        2. ANSWER ROUTE QUERIES: If asked about the next stop, distance, or time, use the provided Route Info.
        3. PROVIDE LANDMARK INFO: Use searchSites to get the overview and significance of sites.
        4. SITE CARDS: If you mention specific heritage sites, include their EXACT IDs in the "suggestedSiteIds" array so the UI can show interactive cards.
        5. STAY CONCISE: Keep responses to 2-4 sentences max. Use simple, natural language.
        
        STYLE:
        - Friendly, helpful, and Cebuano-proud.
        - If asked an unrelated question, politely say: "I can only help with Metro Cebu heritage sites and your cultural journey here."`,
        config: {
          temperature: 0.7,
        }
      });

      if (!output) throw new Error('No output from AI');

      return output;
    } catch (error: any) {
      lastError = error;
      if (attempt < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      break;
    }
  }

  return {
    text: "I'm currently receiving too many requests or the API key is missing. Please check your configuration and try again.",
    suggestedAction: 'none'
  };
}
