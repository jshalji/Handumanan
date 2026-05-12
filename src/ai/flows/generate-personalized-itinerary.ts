
'use server';
/**
 * @fileOverview A simplified AI agent for organizing user-selected heritage sites.
 *
 * - generatePersonalizedItinerary - Organizes a specific list of sites into a logical route.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePersonalizedItineraryInputSchema = z.object({
  selectedSitesJson: z.string().describe('JSON array of heritage sites currently in the user localstorage.'),
  availableTimeHours: z.number().default(4),
});

const GeneratePersonalizedItineraryOutputSchema = z.object({
  itinerary: z.array(
    z.object({
      siteId: z.string(),
      siteName: z.string(),
      estimatedVisitDurationMinutes: z.number(),
      description: z.string().describe('Why this stop is logical in the sequence.'),
    })
  ),
  summary: z.string().describe('A brief summary of the route.'),
});

export type GeneratePersonalizedItineraryOutput = z.infer<typeof GeneratePersonalizedItineraryOutputSchema>;

export async function generatePersonalizedItinerary(
  input: z.infer<typeof GeneratePersonalizedItineraryInputSchema>
): Promise<GeneratePersonalizedItineraryOutput> {
  try {
    const { output } = await ai.generate({
      model: 'googleai/gemini-1.5-flash',
      input: { schema: GeneratePersonalizedItineraryInputSchema, data: input },
      output: { schema: GeneratePersonalizedItineraryOutputSchema },
      system: `You are a "Basic Itinerary Organizer". 
      
      STRICT RULES:
      1. ONLY use the sites provided in the input JSON. DO NOT suggest new sites.
      2. If no sites are provided, return an empty itinerary list.
      3. Organize the provided sites into a geographically logical order for a tour.
      4. Provide realistic visit durations (30-60 mins).
      5. Output MUST be valid JSON matching the schema.`,
      prompt: `Organize these selected heritage sites into a logical ${input.availableTimeHours}-hour tour: ${input.selectedSitesJson}`,
    });

    if (!output) {
      throw new Error('AI failed to generate a response. Please check your API configuration.');
    }

    return output;
  } catch (error: any) {
    console.error("AI Planner Error:", error.message);
    throw new Error(`Planner Error: ${error.message || 'Check your API configuration and quota.'}`);
  }
}
