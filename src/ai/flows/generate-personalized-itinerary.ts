'use server';
/**
 * @fileOverview A strict AI agent for organizing user-selected heritage sites.
 *
 * - generatePersonalizedItinerary - Organizes a specific list of sites into a logical route.
 */

import {ai, hasGoogleAiApiKey} from '@/ai/genkit';
import {z} from 'genkit';
import { isSiteOpenForVisit } from '@/lib/site-availability';

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
      description: z.string().describe('Why this stop is logical in the sequence.'),
    })
  ),
  summary: z.string().describe('A brief summary of the route.'),
  routeSuggestion: z.string().describe('A brief route suggestion for the full trip.'),
  totalEstimatedDurationMinutes: z.number().describe('The total estimated visit duration in minutes.'),
});

export type GeneratePersonalizedItineraryOutput = z.infer<typeof GeneratePersonalizedItineraryOutputSchema>;

type PlannerSite = {
  id?: string;
  siteId?: string;
  name?: string;
  siteName?: string;
  city?: string;
  visitingHours?: string;
  isActive?: boolean;
  status?: string;
};

function parsePlannerSites(input: z.infer<typeof GeneratePersonalizedItineraryInputSchema>): PlannerSite[] {
  try {
    const parsed = JSON.parse(input.selectedSitesJson || input.siteDatabase || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getPlannerSiteId(site: PlannerSite) {
  return site.siteId || site.id || '';
}

function getPlannerSiteName(site: PlannerSite) {
  return site.siteName || site.name || '';
}

function getPlannerSiteKey(site: PlannerSite) {
  return (getPlannerSiteId(site) || getPlannerSiteName(site)).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function getAvailableUniquePlannerSites(input: z.infer<typeof GeneratePersonalizedItineraryInputSchema>) {
  const usedSiteKeys = new Set<string>();

  return parsePlannerSites(input)
    .filter(site => isSiteOpenForVisit(site))
    .filter(site => {
      const key = getPlannerSiteKey(site);
      if (!key || usedSiteKeys.has(key)) return false;
      usedSiteKeys.add(key);
      return true;
    });
}

function sanitizeGeneratedItinerary(
  output: GeneratePersonalizedItineraryOutput,
  input: z.infer<typeof GeneratePersonalizedItineraryInputSchema>
): GeneratePersonalizedItineraryOutput {
  const availableSites = getAvailableUniquePlannerSites(input);
  const allowedById = new Map(availableSites.map(site => [getPlannerSiteId(site), site]));
  const allowedByName = new Map(availableSites.map(site => [getPlannerSiteName(site).toLowerCase(), site]));
  const targetStopCount = Math.max(1, Math.min(availableSites.length, Math.ceil(input.availableTimeHours || 4)));
  const usedKeys = new Set<string>();

  const cleaned = output.itinerary
    .map(stop => {
      const sourceSite = allowedById.get(stop.siteId) || allowedByName.get(stop.siteName.toLowerCase());
      if (!sourceSite) return null;

      const key = getPlannerSiteKey(sourceSite);
      if (!key || usedKeys.has(key)) return null;
      usedKeys.add(key);

      return {
        siteId: getPlannerSiteId(sourceSite),
        siteName: getPlannerSiteName(sourceSite),
        estimatedVisitDurationMinutes: Math.min(60, Math.max(30, Math.round(stop.estimatedVisitDurationMinutes || 40))),
        description: stop.description || `Visit ${getPlannerSiteName(sourceSite)} as part of the open heritage route.`,
      };
    })
    .filter(Boolean) as GeneratePersonalizedItineraryOutput['itinerary'];

  for (const site of availableSites) {
    if (cleaned.length >= targetStopCount) break;

    const key = getPlannerSiteKey(site);
    if (usedKeys.has(key)) continue;

    cleaned.push({
      siteId: getPlannerSiteId(site),
      siteName: getPlannerSiteName(site),
      estimatedVisitDurationMinutes: 40,
      description: `Added because this heritage site is currently available and fits the requested tour.`,
    });
    usedKeys.add(key);
  }

  const totalEstimatedDurationMinutes = cleaned.reduce((total, stop) => total + stop.estimatedVisitDurationMinutes, 0);

  return {
    itinerary: cleaned,
    summary: cleaned.length > 0
      ? `Prepared a ${cleaned.length}-stop route using only available Handumanan sites.`
      : 'No currently open heritage sites were available for this itinerary.',
    routeSuggestion: cleaned.length > 0
      ? `Start from ${input.startingLocation || 'your current location'}, then visit ${cleaned.map(stop => stop.siteName).join(' -> ')}.`
      : 'No route is available because there are no eligible open sites.',
    totalEstimatedDurationMinutes,
  };
}

function generateLocalItinerary(input: z.infer<typeof GeneratePersonalizedItineraryInputSchema>): GeneratePersonalizedItineraryOutput {
  const selectedSites = getAvailableUniquePlannerSites(input)
    .slice(0, Math.max(1, input.availableTimeHours));

  const itinerary = selectedSites
    .map((site, index) => {
      const siteId = site.siteId || site.id || `stop-${index + 1}`;
      const siteName = site.siteName || site.name || `Stop ${index + 1}`;

      return {
        siteId,
        siteName,
        estimatedVisitDurationMinutes: index === 0 ? 45 : 40,
        description: index === 0
          ? `Start here to set the historical context for the route${site.city ? ` in ${site.city}` : ''}.`
          : `Continue here next for a smooth heritage stop sequence${site.city ? ` around ${site.city}` : ''}.`,
      };
    });
  const totalEstimatedDurationMinutes = itinerary.reduce((total, stop) => total + stop.estimatedVisitDurationMinutes, 0);
  const routeSuggestion = itinerary.length > 0
    ? `Start from ${input.startingLocation || 'your current location'}, then visit ${itinerary.map(stop => stop.siteName).join(' -> ')}.`
    : 'No route is available yet.';

  return {
    itinerary,
    summary: itinerary.length > 0
      ? `Auto-generated a ${itinerary.length}-stop Cebu heritage route from the available sites.`
      : 'No heritage sites were available to generate a route.',
    routeSuggestion,
    totalEstimatedDurationMinutes,
  };
}

export async function generatePersonalizedItinerary(
  input: z.infer<typeof GeneratePersonalizedItineraryInputSchema>
): Promise<GeneratePersonalizedItineraryOutput> {
  if (!hasGoogleAiApiKey) {
    return generateLocalItinerary(input);
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
      7. Do not include any site marked inactive, closed, unavailable, or outside listed visiting hours.
      8. Keep the route practical: nearby sites first, avoid zigzagging between cities, and prefer stronger-rated/must-visit sites when the sequence is otherwise equal.
      9. Output MUST be valid JSON matching the provided schema.`,
      prompt: `Organize these selected heritage sites into a logical ${input.availableTimeHours}-hour tour. 
      Starting Location: ${input.startingLocation || 'Current location'}
      Interests: ${input.interests?.join(', ') || 'General Interest'}
      Input Data: ${input.selectedSitesJson || input.siteDatabase || '[]'}`,
    });

    if (!output) {
      throw new Error('AI failed to generate a response.');
    }

    return sanitizeGeneratedItinerary(output, input);
  } catch (error: any) {
    if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
       return generateLocalItinerary(input);
    }
    
    console.error("AI Planner Error:", error.message);
    return generateLocalItinerary(input);
  }
}
