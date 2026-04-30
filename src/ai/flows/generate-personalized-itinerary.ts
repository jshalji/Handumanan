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
});
export type GeneratePersonalizedItineraryInput = z.infer<
  typeof GeneratePersonalizedItineraryInputSchema
>;

const GeneratePersonalizedItineraryOutputSchema = z.object({
  itinerary: z.array(
    z.object({
      siteName: z.string().describe('The name of the heritage site.'),
      estimatedVisitDurationMinutes: z
        .number()
        .describe('The estimated time in minutes required to visit this specific site.'),
      estimatedTravelTimeMinutes: z
        .number()
        .describe('The estimated time in minutes to travel to this site from the previous stop.'),
      description: z
        .string()
        .describe('A short, simple description of the site and its significance.'),
    })
  ).describe('The "Day Plan": An ordered list of recommended heritage sites to visit.'),
  totalEstimatedDurationMinutes: z
    .number()
    .describe('The total estimated duration of the entire itinerary in minutes.'),
  routeSuggestion: z
    .string()
    .describe('A simple explanation of the travel order, logical route flow, and travel tips.'),
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
  prompt: `You are an AI travel assistant for "Handumanan", a cultural heritage information system for Metro Cebu. 

Your task is to generate a simple and realistic travel itinerary based on the user's location, interests, and available time.

### Schedule Rules:
- If time is 1 hour: Recommend 1-2 sites.
- If time is 2 hours: Recommend 2-3 sites.
- If time is 4 hours (Half Day): Recommend 3-5 sites.
- If time is 8 hours or more (Full Day): Recommend 5-8 sites.

### Instructions:
1. **Real Sites Only**: Only suggest REAL and EXISTING cultural heritage sites from the provided database.
2. **Proximity Matters**: Use a practical travel order based on geographic proximity.
3. **Estimated Times**: Provide realistic estimated visit times (e.g., 30-60 mins per site) and travel times (15-30 mins between sites).
4. **Logical Flow**: Suggest a logical route starting from the user's location.
5. **Respect Time**: Ensure the total time (visiting + transit) fits strictly within the available hours.

### Input Data:
- **Starting Location**: {{{startingLocation}}}
- **Time Available**: {{{availableTimeHours}}} hours
- **User Interests**: {{{interests}}}
- **Heritage Site Database**: 
{{{siteDatabase}}}

### Output Format Requirements:
Provide an ordered list of sites with durations and descriptions.
Provide a "Route Suggestion" summary.
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
