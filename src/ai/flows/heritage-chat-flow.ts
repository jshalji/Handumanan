'use server';
/**
 * @fileOverview Refined AI Chatbot flow for the Handumanan system.
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
  favorites: z.array(z.string()).optional(),
  lastItinerary: z.string().optional(),
});

const HeritageChatOutputSchema = z.object({
  text: z.string(),
  suggestedSiteIds: z.array(z.string()).optional(),
});

export type HeritageChatInput = z.infer<typeof HeritageChatInputSchema>;
export type HeritageChatOutput = z.infer<typeof HeritageChatOutputSchema>;

const searchSitesTool = ai.defineTool(
  {
    name: 'searchSites',
    description: 'Searches for real heritage sites in Metro Cebu.',
    inputSchema: z.object({
      query: z.string(),
    }),
    outputSchema: z.array(z.any()),
  },
  async (input) => {
    const q = input.query.toLowerCase();
    return HERITAGE_SITES.filter(site => 
      site.name.toLowerCase().includes(q) || 
      site.description.toLowerCase().includes(q)
    ).slice(0, 3);
  }
);

export async function chatWithHeritageBot(input: HeritageChatInput): Promise<HeritageChatOutput> {
  const lastMessage = input.history[input.history.length - 1].content[0].text;

  try {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      prompt: lastMessage,
      history: input.history.slice(0, -1),
      tools: [searchSitesTool],
      output: { schema: HeritageChatOutputSchema },
      system: `You are the "Handumanan Guide", an expert virtual tour guide for Metro Cebu.
      Help users find heritage sites and understand their history.
      If you mention specific sites, include their EXACT IDs in "suggestedSiteIds".
      Stay concise: 2-3 sentences max. Friendly and Cebuano-proud style.`,
    });

    if (!output) throw new Error('No response from AI');
    return output;
  } catch (error: any) {
    console.error("Chat Error:", error.message);
    throw new Error(error.message);
  }
}
