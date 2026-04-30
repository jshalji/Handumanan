'use server';
/**
 * @fileOverview An AI agent that generates simple, realistic travel itineraries for cultural heritage sites in Metro Cebu.
 *
 * - generatePersonalizedItinerary - A function that generates a personalized itinerary.
 * - GeneratePersonalizedItineraryInput - The input type for the generatePersonalizedItinerary function.
 * - GeneratePersonalizedItineraryOutput - The return type for the generatePersonalizedItinerary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GeneratePersonalizedItineraryInputSchema = z.object({
  interests: z
    .array(z.string())
    .describe('A list of user interests (e.g., "history", "architecture", "religious sites").'),
  availableTimeHours: z
    .number()
    .describe('The total available time for the itinerary in hours.'),
  startingLocation: z
    .string()
    .describe('The user\'s starting geographic location (e.g., "Cebu City Center").'),
  siteDatabase: z
    .string()
    .describe('A JSON string representing an array of available cultural heritage sites.'),
  selectedSitesJson: z
    .string()
    .optional()
    .describe('A JSON string representing sites the user has already specifically selected.'),
});
export type GeneratePersonalizedItineraryInput = z.infer<
  typeof GeneratePersonalizedItineraryInputSchema
>;

const GeneratePersonalizedItineraryOutputSchema = z.object({
  itinerary: z.array(
    z.object({
      siteId: z.string().describe('The unique ID of the site.'),
      siteName: z.string().describe('The name of the heritage site.'),
      estimatedVisitDurationMinutes: z
        .number()
        .describe('The estimated time in minutes required to visit this specific site.'),
      estimatedTravelTimeMinutes: z
        .number()
        .describe('The estimated time in minutes to travel to this site from the previous stop.'),
      description: z
        .string()
        .describe('A short, simple description of why this site fits the route.'),
    })
  ).describe('The "Day Plan": An ordered list of recommended heritage sites to visit.'),
  totalEstimatedDurationMinutes: z
    .number()
    .describe('The total estimated duration of the entire itinerary in minutes (visit + travel).'),
  routeSuggestion: z
    .string()
    .describe('A conversational summary or tip about the route (e.g., "This route covers the heart of old Parian").'),
});
export type GeneratePersonalizedItineraryOutput = z.infer<
  typeof GeneratePersonalizedItineraryOutputSchema
>;

export async function generatePersonalizedItinerary(
  input: GeneratePersonalizedItineraryInput
): Promise<GeneratePersonalizedItineraryOutput> {
  return generatePersonalizedItineraryFlow(input);
}

const generatePersonalizedItineraryPrompt = ai.definePrompt({
  name: 'generatePersonalizedItineraryPrompt',
  input: {schema: GeneratePersonalizedItineraryInputSchema},
  output: {schema: GeneratePersonalizedItineraryOutputSchema},
  prompt: `You are an expert AI travel guide for "Handumanan", the Metro Cebu cultural heritage system.

Your task is to create a detailed, time-aware itinerary.

### Priorities:
1. **User Selections**: If "Selected Sites" are provided, you MUST use them and arrange them in the most geographically logical order starting from the "{{{startingLocation}}}".
2. **Time Constraints**: Ensure the total time (visiting + estimated transit) fits within {{{availableTimeHours}}} hours.
3. **Logic**:
   - If time is 1 hour: Limit to 1-2 sites.
   - If time is 2 hours: Limit to 2-3 sites.
   - If time is 4 hours: Limit to 3-5 sites.
   - If time is 8+ hours: Limit to 5-8 sites.
4. **Site Context**: Use only REAL sites from the provided database.

### Input:
- **Available Time**: {{{availableTimeHours}}} hours.
- **Starting From**: {{{startingLocation}}}.
- **Selected Sites (Priority)**: {{{selectedSitesJson}}}
- **Full Database**: {{{siteDatabase}}}

### Requirements:
- Provide realistic visit durations (20-60 mins).
- Provide realistic travel times between stops (5-20 mins for Cebu traffic).
- Output the sites in the optimal visit order.
`,
});

const generatePersonalizedItineraryFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedItineraryFlow',
    inputSchema: GeneratePersonalizedItineraryInputSchema,
    outputSchema: GeneratePersonalizedItineraryOutputSchema,
  },
  async input => {
    let lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const {output} = await generatePersonalizedItineraryPrompt(input);
        if (output) return output;
      } catch (error: any) {
        lastError = error;
        if (error.message?.includes('503') || error.message?.includes('high demand')) {
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
          continue;
        }
        throw error;
      }
    }
    throw lastError || new Error('Failed to generate itinerary after multiple attempts.');
  }
);
