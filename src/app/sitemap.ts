import { MetadataRoute } from 'next';
import { HERITAGE_SITES } from '@/lib/heritage-data';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://handumanan.ph';

  const staticRoutes = [
    '',
    '/explore',
    '/discover',
    '/itinerary',
    '/auth',
    '/profile',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }));

  const siteRoutes = HERITAGE_SITES.map((site) => ({
    url: `${baseUrl}/site/${site.id}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...siteRoutes];
}
