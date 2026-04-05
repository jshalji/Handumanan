'use client';

import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { generatePersonalizedItinerary, type GeneratePersonalizedItineraryOutput } from '@/ai/flows/generate-personalized-itinerary';
import { HERITAGE_SITES } from '@/lib/heritage-data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { Sparkles, Calendar, Clock, MapPin, Loader2, ArrowRight, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const INTERESTS_OPTIONS = [
  "History", "Architecture", "Religious Sites", "Photography", "Spanish Heritage", "Parks", "WWII History"
];

export default function ItineraryPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratePersonalizedItineraryOutput | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [startLocation, setStartLocation] = useState('Cebu City Center');
  const [timeHours, setTimeHours] = useState([4]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const handleToggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const output = await generatePersonalizedItinerary({
        startingLocation: startLocation,
        availableTimeHours: timeHours[0],
        interests: selectedInterests.length > 0 ? selectedInterests : ["General Interest"],
        siteDatabase: JSON.stringify(HERITAGE_SITES)
      });
      setResult(output);
    } catch (error) {
      console.error("Failed to generate itinerary:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItinerary = () => {
    if (!user || !db || !result) {
      toast({
        title: "Login Required",
        description: "Please login to save your itineraries.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    const itineraryRef = doc(collection(db, 'users', user.uid, 'itineraries'));
    
    setDocumentNonBlocking(itineraryRef, {
      userId: user.uid,
      itineraryData: JSON.stringify(result),
      summary: result.summary,
      createdAt: serverTimestamp()
    }, { merge: true });

    setIsSaving(false);
    toast({ title: "Itinerary Saved", description: "You can view this in your profile anytime." });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-12">
        <header className="max-w-3xl mx-auto text-center mb-12">
          <Badge className="bg-primary/10 text-primary mb-4 border-none px-4 py-1">AI-Powered Experience</Badge>
          <h1 className="font-headline text-5xl font-bold text-primary mb-4">Plan Your Journey</h1>
          <p className="text-muted-foreground text-lg">
            Let our AI generate a personalized heritage tour based on your interests and available time.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 max-w-6xl mx-auto">
          {/* Settings Panel */}
          <div className="lg:col-span-1 space-y-8">
            <Card className="shadow-lg border-primary/10">
              <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                  <Sparkles size={20} className="text-primary" /> Tour Preferences
                </CardTitle>
                <CardDescription>Tell us what you're looking for.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <Label>Starting Point</Label>
                  <Input 
                    placeholder="e.g. Mactan Airport" 
                    value={startLocation}
                    onChange={(e) => setStartLocation(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Label>Time Available</Label>
                    <span className="text-sm font-bold text-primary">{timeHours[0]} hours</span>
                  </div>
                  <Slider 
                    value={timeHours} 
                    onValueChange={setTimeHours} 
                    max={12} 
                    min={2} 
                    step={1} 
                  />
                </div>

                <div className="space-y-3">
                  <Label>Interests</Label>
                  <div className="grid grid-cols-1 gap-2">
                    {INTERESTS_OPTIONS.map(interest => (
                      <div key={interest} className="flex items-center space-x-2">
                        <Checkbox 
                          id={interest} 
                          checked={selectedInterests.includes(interest)}
                          onCheckedChange={() => handleToggleInterest(interest)}
                        />
                        <label 
                          htmlFor={interest}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          {interest}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <Button 
                  className="w-full h-12 bg-primary hover:bg-primary/90 rounded-full" 
                  disabled={loading}
                  onClick={handleGenerate}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                      Generating...
                    </>
                  ) : (
                    <>
                      Generate Itinerary <Sparkles className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Area */}
          <div className="lg:col-span-2">
            {!result && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-muted/30 rounded-3xl border-2 border-dashed">
                <Calendar size={64} className="text-muted-foreground mb-6 opacity-20" />
                <h3 className="font-headline text-2xl font-bold mb-2">No Itinerary Yet</h3>
                <p className="text-muted-foreground max-w-sm">
                  Complete your preferences on the left and click "Generate" to see your custom tour plan.
                </p>
              </div>
            )}

            {loading && (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4">
                <Loader2 size={48} className="text-primary animate-spin" />
                <p className="text-lg font-medium animate-pulse">Our AI is mapping out your journey...</p>
              </div>
            )}

            {result && !loading && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                <Card className="bg-primary text-primary-foreground border-none overflow-hidden relative">
                  <CardContent className="p-8">
                    <div className="flex justify-between items-start">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2 mb-4">
                          <Clock size={20} className="opacity-80" />
                          <span className="font-medium">Total Duration: {Math.round(result.totalEstimatedDurationMinutes / 60 * 10) / 10} hours</span>
                        </div>
                        <h2 className="font-headline text-3xl font-bold">Your Custom Metro Cebu Tour</h2>
                        <p className="opacity-90 italic">"{result.summary}"</p>
                      </div>
                      <Button 
                        onClick={handleSaveItinerary}
                        disabled={isSaving}
                        className="bg-white/20 hover:bg-white/30 backdrop-blur rounded-full px-6 gap-2"
                      >
                        {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Save Trip
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  {result.itinerary.map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                          {idx + 1}
                        </div>
                        {idx !== result.itinerary.length - 1 && (
                          <div className="w-0.5 h-full bg-border my-1"></div>
                        )}
                      </div>
                      <Card className="flex-1 shadow-sm border-none bg-white">
                        <CardHeader className="py-4 px-6 flex flex-row items-center justify-between space-y-0">
                          <CardTitle className="font-headline text-xl">{item.siteName}</CardTitle>
                          <Badge variant="outline" className="text-xs font-medium">
                            {item.estimatedVisitDurationMinutes} mins visit
                          </Badge>
                        </CardHeader>
                        <CardContent className="px-6 pb-4">
                          <p className="text-muted-foreground text-sm">
                             {item.notes}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
