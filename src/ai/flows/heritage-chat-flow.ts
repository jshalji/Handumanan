'use server';
/**
 * @fileOverview Refined AI Chatbot flow for the Handumanan system.
 * 
 * - heritageChatFlow - Handles conversational AI for heritage site inquiries.
 * - addToItineraryTool - Allows the AI to save sites to the user's collection.
 * - searchSitesTool - Searches the site database with location awareness.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { HERITAGE_SITES } from '@/lib/heritage-data';
import { collection, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

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

// Tool to add a site to user's itinerary
// Note: In this environment, we simulate the database write as a tool action confirmation.
const addToItineraryTool = ai.defineTool(
  {
    name: 'addToItinerary',
    description: 'Adds a specific heritage site to the user\'s personal itinerary.',
    inputSchema: z.object({
      siteName: z.string().describe('The name of the heritage site to add.'),
      latitude: z.number().describe('The latitude of the site.'),
      longitude: z.number().describe('The longitude of the site.'),
    }),
    outputSchema: z.string(),
  },
  async (input) => {
    // In a real scenario, we would use the userId to write to Firestore here.
    // For this prototype, we confirm the intent which the client-side can handle or the AI confirms.
    return `Confirmed: ${input.siteName} at ${input.latitude}, ${input.longitude} added to itinerary.`;
  }
);

const heritageChatPrompt = ai.definePrompt({
  name: 'heritageChatPrompt',
  tools: [searchSitesTool, addToItineraryTool],
  system: `You are the "Handumanan Guide", an expert virtual tour guide for cultural heritage sites in Metro Cebu.
  
  ROLE & SCOPE:
  - Only answer questions related to Metro Cebu heritage sites, history, locations, travel routes, and itinerary planning.
  - If asked an unrelated question, respond with: "I can only help with cultural heritage sites in Metro Cebu."
  
  CAPABILITIES:
  1. HERITAGE INFORMATION: Provide short, clear descriptions (2–3 sentences). Include location if available.
  2. NEARBY SUGGESTIONS: Recommend sites near the user's location or a selected site using the searchSites tool.
  3. ITINERARY PLANNING: Create a simple travel itinerary (3–5 sites). Arrange nearest to farthest. Include estimated travel time between locations.
  4. ADD TO ITINERARY: When the user says "Add this to my itinerary", use the addToItinerary tool.
  
  RESPONSE STYLE:
  - Keep responses short (2–4 sentences).
  - Use simple and clear language.
  - Be helpful and conversational.
  
  DATA SOURCE:
  - Use real data from the searchSites tool. Do NOT generate fake or assumed data.
  `,
  prompt: '{{{message}}}',
});

export async function chatWithHeritageBot(input: HeritageChatInput): Promise<HeritageChatOutput> {
  const lastMessage = input.history[input.history.length - 1].content[0].text;
  
  const { text } = await ai.generate({
    prompt: lastMessage,
    history: input.history.slice(0, -1),
    tools: [searchSitesTool, addToItineraryTool],
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
