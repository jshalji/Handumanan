'use client';

import { use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';
import { getSiteById } from '@/lib/heritage-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Clock, Star, Share2, Info, ArrowLeft, MessageSquare, Landmark, Images, ExternalLink } from 'lucide-react';

export default function SiteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const site = getSiteById(id);

  if (!site) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <h2 className="text-2xl font-bold mb-4 text-primary">Site not found</h2>
        <Button asChild>
          <Link href="/explore">Back to Explore</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      
      {/* Hero Header */}
      <div className="relative h-[60vh] w-full">
        <Image
          src={site.imageUrl}
          alt={site.name}
          fill
          className="object-cover brightness-75"
          priority
          data-ai-hint="heritage landmark"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
          <div className="container mx-auto">
            <Link 
              href="/explore" 
              className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors"
            >
              <ArrowLeft className="mr-2" size={20} /> Back to explore
            </Link>
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <Badge className="bg-primary hover:bg-primary text-white border-none px-3 py-1">
                {site.category}
              </Badge>
              {site.isMustVisit && (
                <Badge variant="secondary" className="bg-accent text-white border-none px-3 py-1">
                  Must Visit
                </Badge>
              )}
              <div className="flex items-center gap-1 text-yellow-400 bg-black/20 backdrop-blur px-2 py-1 rounded">
                <Star size={14} fill="currentColor" />
                <span className="text-sm font-bold">{site.rating}</span>
              </div>
            </div>
            <h1 className="font-headline text-4xl md:text-6xl font-bold text-white mb-4">
              {site.name}
            </h1>
            <div className="flex flex-wrap items-center gap-6 text-white/90">
              <div className="flex items-center gap-2">
                <MapPin size={20} className="text-primary" />
                <span>{site.location}, {site.city}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={20} className="text-primary" />
                <span>{site.visitingHours}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            <section>
              <h2 className="font-headline text-3xl font-bold mb-6 flex items-center gap-3 text-primary">
                <Info size={28} /> Overview
              </h2>
              <div className="prose prose-slate max-w-none">
                <p className="text-lg leading-relaxed text-slate-700">
                  {site.description}
                </p>
              </div>
            </section>

            <section className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
              <h2 className="font-headline text-2xl font-bold mb-4 flex items-center gap-3 text-primary">
                <Landmark size={24} /> Historical Significance
              </h2>
              <p className="text-slate-600 leading-relaxed italic">
                "{site.significance}"
              </p>
            </section>

            <section>
              <h2 className="font-headline text-3xl font-bold mb-8 flex items-center gap-3 text-primary">
                <Images size={28} /> Visual Gallery
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {site.galleryImages.map((img, index) => (
                  <div key={index} className="relative h-64 rounded-2xl overflow-hidden group">
                    <Image
                      src={img}
                      alt={`${site.name} gallery ${index + 1}`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                      data-ai-hint="heritage detail"
                    />
                  </div>
                ))}
              </div>
            </section>

            <Separator />

            <section>
              <h2 className="font-headline text-3xl font-bold mb-6 flex items-center gap-3">
                <MessageSquare className="text-primary" /> User Feedback
              </h2>
              <div className="bg-muted/30 p-8 rounded-3xl text-center space-y-4 border-2 border-dashed">
                <p className="text-muted-foreground italic">"One of the most meaningful historical landmarks I've visited in Metro Cebu. The architectural details are stunning and the atmosphere is very solemn."</p>
                <div className="flex justify-center gap-1 text-yellow-500">
                  <Star fill="currentColor" size={16} />
                  <Star fill="currentColor" size={16} />
                  <Star fill="currentColor" size={16} />
                  <Star fill="currentColor" size={16} />
                  <Star fill="currentColor" size={16} />
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary">— Local Tourist, August 2024</p>
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-white rounded-3xl p-8 shadow-xl border border-primary/5 sticky top-24">
              <h3 className="font-headline text-2xl font-bold mb-6">Plan Your Visit</h3>
              
              <div className="space-y-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <MapPin size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Address</h4>
                    <p className="font-medium">{site.location}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-muted-foreground uppercase tracking-wider">Visiting Hours</h4>
                    <p className="font-medium">{site.visitingHours}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button className="w-full h-12 bg-primary hover:bg-primary/90 rounded-full font-bold shadow-lg" asChild>
                  <a href={site.googleMapsUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink size={18} className="mr-2" /> Open in Google Maps
                  </a>
                </Button>
                <Button variant="outline" className="w-full h-12 rounded-full font-bold">
                  <Share2 size={18} className="mr-2" /> Share Site
                </Button>
              </div>

              <div className="mt-8 p-4 bg-muted/50 rounded-2xl">
                <h4 className="font-bold text-sm mb-2 text-primary">Heritage Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {site.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="bg-white text-[10px] uppercase font-bold text-muted-foreground">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
