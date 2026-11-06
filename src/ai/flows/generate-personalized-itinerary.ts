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

  const startPoint = startCoordsFor(input.startingLocation);
  let prevPos = startPoint;
  let totalTravel = 0;
  const withTravel = cleaned.map((stop) => {
    const sourceSite = availableSites.find((s: any) => getPlannerSiteId(s) === stop.siteId) || availableSites.find((s: any) => getPlannerSiteName(s) === stop.siteName);
    const coords = sourceSite ? ((sourceSite as any).coordinates || { lat: (sourceSite as any).latitude, lng: (sourceSite as any).longitude }) : null;
    let travel = 0;
    if (coords && Number.isFinite(Number(coords.lat))) {
      travel = Math.max(5, Math.round((estimateDistanceKm(prevPos, { lat: Number(coords.lat), lng: Number(coords.lng) }) * 1.35 / 22) * 60) + 3);
      prevPos = { lat: Number(coords.lat), lng: Number(coords.lng) };
    }
    totalTravel += travel;
    return { ...stop, estimatedTravelDurationMinutes: travel };
  });
  const totalVisit = withTravel.reduce((total, stop) => total + stop.estimatedVisitDurationMinutes, 0);
  const bufferMinutes = Math.max(10, Math.min(45, Math.round(totalTravel)));
  const totalEstimatedDurationMinutes = totalVisit + totalTravel + bufferMinutes;

  return {
    itinerary: withTravel,
    summary: cleaned.length > 0
      ? `Prepared a ${cleaned.length}-stop route using only available Handumanan sites.`
      : 'No currently open heritage sites were available for this itinerary.',
    routeSuggestion: cleaned.length > 0
      ? `Start from ${input.startingLocation || 'your current location'}, then visit ${cleaned.map(stop => stop.siteName).join(' -> ')}.`
      : 'No route is available because there are no eligible open sites.',
    totalEstimatedDurationMinutes,
    totalEstimatedTravelDurationMinutes: totalTravel,
    bufferMinutes,
  };
}

function estimateDistanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLng = (b.lng - a.lng) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const x = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(x));
}
function startCoordsFor(location: string | undefined): { lat: number; lng: number } {
  const key = (location || '').toLowerCase();
  if (key.includes('mandaue')) return { lat: 10.3236, lng: 123.9223 };
  if (key.includes('lapu') || key.includes('mactan')) return { lat: 10.3103, lng: 123.9593 };
  if (key.includes('talisay')) return { lat: 10.2447, lng: 123.8494 };
  return { lat: 10.29365, lng: 123.90196 };
}
function generateLocalItinerary(input: z.infer<typeof GeneratePersonalizedItineraryInputSchema>): GeneratePersonalizedItineraryOutput {
  const availableTimeMinutes = Math.max(30, (input.availableTimeHours || 4) * 60);
  const pool = getAvailableUniquePlannerSites(input);
  const startPoint = startCoordsFor(input.startingLocation);
  const selectedSites = [];
  const travelMinutes: number[] = [];
  const used = new Set();
  let currentPos = startPoint;
  let usedMinutes = 0;
  const visitMinutes = (site: any, index: number) => 30;
  while (selectedSites.length < pool.length) {
    let best = null;
    let bestDist = Infinity;
    for (const site of pool as any[]) {
      if (used.has(getPlannerSiteKey(site))) continue;
      const coords = site.coordinates || { lat: site.latitude, lng: site.longitude };
      if (!coords || !Number.isFinite(Number(coords.lat))) continue;
      const d = estimateDistanceKm(currentPos, { lat: Number(coords.lat), lng: Number(coords.lng) });
      if (d < bestDist) { bestDist = d; best = site; }
    }
    if (!best) break;
    const coords = (best as any).coordinates || { lat: (best as any).latitude, lng: (best as any).longitude };
    const travelMin = Math.max(5, Math.round((estimateDistanceKm(currentPos, { lat: Number(coords.lat), lng: Number(coords.lng) }) * 1.35 / 22) * 60) + 3);
    const visit = visitMinutes(best, selectedSites.length);
    if (usedMinutes + travelMin + visit > availableTimeMinutes && selectedSites.length > 0) break;
    selectedSites.push(best);
    travelMinutes.push(travelMin);
    used.add(getPlannerSiteKey(best));
    usedMinutes += travelMin + visit;
    currentPos = { lat: Number(coords.lat), lng: Number(coords.lng) };
  }
  if (selectedSites.length === 0 && pool.length > 0) selectedSites.push(pool[0]);
  const itinerary = selectedSites.map((site, index) => {
    const siteId = getPlannerSiteId(site);
    const siteName = getPlannerSiteName(site);
    return {
      siteId,
      siteName,
      estimatedVisitDurationMinutes: 30,
      estimatedTravelDurationMinutes: travelMinutes[index] || 0,
      description: index === 0
        ? `Start here to set the historical context for the route${site.city ? ` in ${site.city}` : ''}.`
        : `Continue here next for a smooth heritage stop sequence${site.city ? ` around ${site.city}` : ''}.`,
    };
  });
  const totalTravel = travelMinutes.reduce((t, m) => t + m, 0);
  const totalVisit = itinerary.reduce((total, stop) => total + stop.estimatedVisitDurationMinutes, 0);
  const bufferMinutes = Math.max(10, Math.min(45, Math.round(totalTravel)));
  const totalEstimatedDurationMinutes = totalVisit + totalTravel + bufferMinutes;
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
    totalEstimatedTravelDurationMinutes: totalTravel,
    bufferMinutes,
  };
}export async function generatePersonalizedItinerary(
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
