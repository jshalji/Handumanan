'use server';
/**
 * @fileOverview An AI agent that generates personalized travel itineraries for cultural heritage sites.
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
    .describe('A JSON string representing an array of available cultural heritage sites, including their name, description, category, location, and visiting hours.'),
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
      notes: z
        .string()
        .describe('Brief notes or highlights about the site or why it was included.'),
    })
  ).describe('An ordered list of recommended heritage sites to visit.'),
  totalEstimatedDurationMinutes: z
    .number()
    .describe('The total estimated duration of the entire itinerary in minutes.'),
  summary: z
    .string()
    .describe('A concise summary of the generated itinerary, highlighting key aspects.'),
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
  prompt: `You are an expert IT researcher and system analyst working on the "Handumanan" project, a web-based cultural heritage site information system for Metro Cebu. Your task is to act as an AI itinerary planner.

Generate a personalized travel itinerary for cultural heritage sites in Metro Cebu based on the user's preferences. The itinerary should be optimal in terms of route and duration, respecting the available time and user interests.

Available Heritage Sites (JSON format):
{{{siteDatabase}}}

User Preferences:
- Interests: {{{interests}}}
- Available Time: {{{availableTimeHours}}} hours
- Starting Location: {{{startingLocation}}}

Instructions:
1. Select heritage sites from the provided database that align with the user's interests.
2. Create an optimal visiting order for the selected sites, considering the starting location and minimizing travel time (assume sites in the same general area are closer).
3. Ensure the total estimated visit duration for all sites in the itinerary does not exceed the available time.
4. For each site, provide an estimated visit duration and brief notes.
5. Provide a summary of the entire itinerary.
6. The output MUST be a JSON object conforming to the GeneratePersonalizedItineraryOutputSchema, with sites ordered logically for travel.
`,
});

const generatePersonalizedItineraryFlow = ai.defineFlow(
  {
    name: 'generatePersonalizedItineraryFlow',
    inputSchema: GeneratePersonalizedItineraryInputSchema,
    outputSchema: GeneratePersonalizedItineraryOutputSchema,
  },
  async input => {
    const {output} = await generatePersonalizedItineraryPrompt(input);
    if (!output) {
      throw new Error('Failed to generate itinerary.');
    }
    return output;
  }
);
