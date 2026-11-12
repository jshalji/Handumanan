'use server';
/**
 * @fileOverview A strict AI agent for organizing user-selected heritage sites.
 *
 * - generatePersonalizedItinerary - Organizes a specific list of sites into a logical route.
 */

import {ai, hasGoogleAiApiKey} from '@/ai/genkit';
import {z} from 'genkit';
import {
  generateLocalItinerary,
  resolvePlannerCandidates,
  sanitizeGeneratedItinerary,
} from '@/lib/itinerary-planner';

const GeneratePersonalizedItineraryInputSchema = z.object({
  selectedSitesJson: z.string().describe('JSON array of heritage sites currently in the user localstorage.').optional(),
  startingLocation: z.string().optional(),
  interests: z.array(z.string()).optional(),
  siteDatabase: z.string().optional(),
  availableTimeHours: z.number().default(4),
});

const GeneratePersonalizedItineraryOutputSchema = z.object({
  itinerary: z.array(
    z.object({
      siteId: z.string(),
      siteName: z.string(),
      estimatedVisitDurationMinutes: z.number(),
      estimatedTravelDurationMinutes: z.number().optional().describe('Estimated travel time in minutes to reach this stop from the previous stop.'),
      description: z.string().describe('Why this stop is logical in the sequence.'),
    })
  ),
  summary: z.string().describe('A brief summary of the route.'),
  routeSuggestion: z.string().describe('A brief route suggestion for the full trip.'),
  totalEstimatedDurationMinutes: z.number().describe('The total estimated visit duration in minutes.'),
  totalEstimatedTravelDurationMinutes: z.number().optional().describe('The total estimated travel duration in minutes.'),
  bufferMinutes: z.number().optional().describe('Buffer time in minutes for the full trip.'),
});

export type GeneratePersonalizedItineraryOutput = z.infer<typeof GeneratePersonalizedItineraryOutputSchema>;

export async function generatePersonalizedItinerary(
  input: z.infer<typeof GeneratePersonalizedItineraryInputSchema>
): Promise<GeneratePersonalizedItineraryOutput> {
  const now = new Date();

  if (!hasGoogleAiApiKey) {
    return generateLocalItinerary(input, now);
  }

  const candidateResolution = resolvePlannerCandidates(input, now);
  if (candidateResolution.sites.length === 0) {
    return sanitizeGeneratedItinerary(
      {
        itinerary: [],
        summary: '',
        routeSuggestion: '',
        totalEstimatedDurationMinutes: 0,
      },
      input,
      now
    );
  }

  try {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      output: { schema: GeneratePersonalizedItineraryOutputSchema },
      system: `You are the "Strict Heritage Planner". 
      
      CRITICAL RULES:
      1. ONLY use the sites provided in the input JSON string. DO NOT suggest new sites.
      2. If the input list is empty, return an empty itinerary list.
      3. NEVER repeat the same siteId or same siteName. Every stop must be unique.
      4. Organize the sites provided into a geographically logical order for a Cebu tour.
      5. Provide realistic visit durations (30-60 mins).
      6. Include routeSuggestion and totalEstimatedDurationMinutes.
      7. Never include any site marked inactive, demolished, permanently closed, or explicitly unavailable. Prioritize currently open sites; when all eligible candidate sites are currently outside their daily visiting hours, organize them as a future daytime itinerary for their shared planned visiting period and clearly state that the route is planned for a future daytime visit (never claim closed sites are open right now).
      8. Keep the route practical: nearby sites first, avoid zigzagging between cities, and prefer stronger-rated/must-visit sites when the sequence is otherwise equal.
      9. Output MUST be valid JSON matching the provided schema.`,
      prompt: `Organize these selected heritage sites into a logical ${input.availableTimeHours}-hour tour. 
      Planning Mode: ${
        candidateResolution.mode === 'future-daytime'
          ? `Future daytime itinerary for ${candidateResolution.plannedWindowLabel || 'regular daytime visiting hours'} (all candidate sites are currently outside their visiting hours; do not claim stops are currently open)`
          : 'Immediate itinerary using currently open sites'
      }
      Starting Location: ${input.startingLocation || 'Current location'}
      Interests: ${input.interests?.join(', ') || 'General Interest'}
      Input Data: ${JSON.stringify(candidateResolution.sites)}`,
    });

    if (!output) {
      throw new Error('AI failed to generate a response.');
    }

    return sanitizeGeneratedItinerary(output, input, now);
  } catch (error: any) {
    if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
       return generateLocalItinerary(input, now);
    }
    
    console.error("AI Planner Error:", error.message);
    return generateLocalItinerary(input, now);
  }
}
