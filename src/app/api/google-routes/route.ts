import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ALLOWED_TRAVEL_MODES = new Set(['DRIVE', 'TWO_WHEELER', 'TRANSIT', 'WALK']);

function isValidLatLng(value: any) {
  const lat = Number(value?.lat);
  const lng = Number(value?.lng);
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

export async function POST(request: Request) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  if (!apiKey.trim()) {
    return NextResponse.json({ error: 'Google Maps API key is not configured.' }, { status: 500 });
  }

  try {
    const body = await request.json();
    const origin = body?.origin?.location?.latLng;
    const destination = body?.destination?.location?.latLng;
    const intermediates = Array.isArray(body?.intermediates) ? body.intermediates : [];
    const travelMode = String(body?.travelMode || 'DRIVE');

    if (!isValidLatLng(origin) || !isValidLatLng(destination)) {
      return NextResponse.json({ error: 'Invalid route origin or destination.' }, { status: 400 });
    }

    if (!ALLOWED_TRAVEL_MODES.has(travelMode)) {
      return NextResponse.json({ error: 'Invalid travel mode.' }, { status: 400 });
    }

    if (
      intermediates.length > 10 ||
      intermediates.some((item: any) => !isValidLatLng(item?.location?.latLng))
    ) {
      return NextResponse.json({ error: 'Invalid route stop list.' }, { status: 400 });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    let response: Response;

    try {
      response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey.trim(),
          'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters,routes.polyline.encodedPolyline,routes.legs.steps.navigationInstruction,routes.legs.steps.distanceMeters,routes.legs.steps.staticDuration',
        },
        body: JSON.stringify(body),
      });
    } finally {
      clearTimeout(timeout);
    }

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });
  } catch {
    return NextResponse.json({ error: 'Unable to compute route.' }, { status: 500 });
  }
}
