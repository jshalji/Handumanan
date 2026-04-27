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
    .describe('The user\'s starting geographic location (e.g., "Cebu City Center", "Mactan-Cebu International Airport").'),
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

### Instructions:
1. **Real Sites Only**: Only suggest REAL and EXISTING cultural heritage sites from the provided database. Do NOT invent locations.
2. **Proximity Matters**: Use a practical travel order based on geographic proximity. Do not jump between far-away locations randomly.
3. **Keep it Simple**: Use clear, easy-to-understand language. Avoid complex or academic words.
4. **Logical Flow**: Suggest a logical route (like a Google Maps style flow) starting from the user's location.
5. **Respect Time**: Ensure the total time (visiting + estimated transit) fits within the available hours.

### Input Data:
- **Starting Location**: {{{startingLocation}}}
- **Time Available**: {{{availableTimeHours}}} hours
- **User Interests**: {{{interests}}}
- **Heritage Site Database**: 
{{{siteDatabase}}}

### Output Format Requirements:
Generate a "Day Plan" with site names, short descriptions, and estimated visit times. 
Provide a "Route Suggestion" that explains the travel sequence simply.
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
    // Implementation of a simple retry loop to handle 503 (Service Unavailable) errors
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const {output} = await generatePersonalizedItineraryPrompt(input);
        if (output) return output;
      } catch (error: any) {
        lastError = error;
        // If it's a 503 or demand spike, wait and try again
        if (error.message?.includes('503') || error.message?.includes('high demand')) {
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
          continue;
        }
        throw error; // Throw immediately for non-transient errors
      }
    }
    throw lastError || new Error('Failed to generate itinerary after multiple attempts.');
  }
);
