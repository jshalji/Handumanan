export interface HeritageSite {
  id: string;
  name: string;
  description: string;
  significance: string;
  category: 
    | 'Churches & Religious Heritage Sites'
    | 'Ancestral Houses & Heritage Residences'
    | 'Museums & Cultural Institutions'
    | 'Historical Landmarks & Monuments'
    | 'Plazas, Parks & Public Spaces'
    | 'Government & Historic Buildings'
    | 'Cultural & Religious (Non-Catholic Sites)';
  location: string;
  city: 'Cebu City' | 'Lapu-Lapu City' | 'Mandaue City' | 'Talisay City';
  visitingHours: string;
  imageUrl: string;
  galleryImages: string[];
  rating: number;
  tags: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  googleMapsUrl: string;
  isMustVisit: boolean;
  needsVerification?: boolean;
}

export const HERITAGE_SITES: HeritageSite[] = [
  // --- CEBU CITY ---
  {
    id: 'cebu-1',
    name: "Basilica Minore del Santo Niño de Cebu",
    description: "The oldest Roman Catholic church in the Philippines, established in 1565. It is the heart of Cebuano devotion.",
    significance: "Birthplace of Christianity in the Philippines. Houses the original Santo Niño statue given by Magellan.",
    category: "Churches & Religious Heritage Sites",
    location: "Osmeña Blvd, Cebu City",
    city: "Cebu City",
    visitingHours: "6:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/basilica/800/600",
    galleryImages: ["https://picsum.photos/seed/basilica1/800/600"],
    rating: 4.9,
    tags: ["oldest church", "relic"],
    coordinates: { lat: 10.2942, lng: 123.9021 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Basilica+Minore+del+Santo+Nino",
    isMustVisit: true
  },
  {
    id: 'cebu-2',
    name: "Cebu Metropolitan Cathedral",
    description: "The seat of the Archdiocese of Cebu, featuring 'Earthquake Baroque' architecture.",
    significance: "Ecclesiastical center of the Visayas since the early Spanish period.",
    category: "Churches & Religious Heritage Sites",
    location: "Mabini St, Cebu City",
    city: "Cebu City",
    visitingHours: "5:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/cathedral/800/600",
    galleryImages: [],
    rating: 4.6,
    tags: ["cathedral", "baroque"],
    coordinates: { lat: 10.2954, lng: 123.9028 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cebu+Metropolitan+Cathedral",
    isMustVisit: false
  },
  {
    id: 'cebu-3',
    name: "Magellan’s Cross",
    description: "A Christian cross planted by Portuguese and Spanish explorers as ordered by Ferdinand Magellan.",
    significance: "Symbolizes the arrival of Christianity in the Philippines in 1521.",
    category: "Historical Landmarks & Monuments",
    location: "P. Burgos St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 6:00 PM",
    imageUrl: "https://picsum.photos/seed/magellan/800/600",
    galleryImages: [],
    rating: 4.8,
    tags: ["cross", "magellan"],
    coordinates: { lat: 10.2936, lng: 123.9019 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Magellan%27s+Cross",
    isMustVisit: true
  },
  {
    id: 'cebu-4',
    name: "Archdiocesan Museum of Cebu",
    description: "Church museum housing religious artifacts and historical documents.",
    significance: "Preserves the ecclesiastical history of Cebu and the surrounding islands.",
    category: "Museums & Cultural Institutions",
    location: "Mabini St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/museum1/800/600",
    galleryImages: [],
    rating: 4.4,
    tags: ["museum", "religious artifacts"],
    coordinates: { lat: 10.2951, lng: 123.9025 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Archdiocesan+Museum+of+Cebu",
    isMustVisit: false
  },
  {
    id: 'cebu-5',
    name: "Casa Gorordo Museum",
    description: "A 19th-century residential home showcasing the lifestyle of the Filipino-Spanish elite.",
    significance: "Former residence of the first Filipino Bishop of Cebu.",
    category: "Museums & Cultural Institutions",
    location: "Lopez Jaena St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/gorordo/800/600",
    galleryImages: [],
    rating: 4.7,
    tags: ["mansion", "lifestyle"],
    coordinates: { lat: 10.2995, lng: 123.9042 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Casa+Gorordo+Museum",
    isMustVisit: true
  },
  {
    id: 'cebu-6',
    name: "Yap-Sandiego Ancestral House",
    description: "One of the oldest residential houses in the Philippines, built in the late 17th century.",
    significance: "Represents the prosperity of the Chinese-Filipino merchant class in the Parian district.",
    category: "Ancestral Houses & Heritage Residences",
    location: "Mabini St, Parian, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 6:00 PM",
    imageUrl: "https://picsum.photos/seed/yap/800/600",
    galleryImages: [],
    rating: 4.7,
    tags: ["ancestral home", "oldest house"],
    coordinates: { lat: 10.2987, lng: 123.9034 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Yap-Sandiego+Ancestral+House",
    isMustVisit: true
  },
  {
    id: 'cebu-7',
    name: "1730 Jesuit House",
    description: "A century-old house hidden within a warehouse, showcasing Jesuit history in Cebu.",
    significance: "The oldest dated residence in the Philippines (1730).",
    category: "Museums & Cultural Institutions",
    location: "Zulueta St, Parian, Cebu City",
    city: "Cebu City",
    visitingHours: "8:30 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/jesuit/800/600",
    galleryImages: [],
    rating: 4.8,
    tags: ["jesuit", "hidden gem"],
    coordinates: { lat: 10.2982, lng: 123.9031 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Jesuit+House+Cebu",
    isMustVisit: true
  },
  {
    id: 'cebu-8',
    name: "National Museum of the Philippines – Cebu",
    description: "Housed in the historic Aduana (Customs) Building near the port area.",
    significance: "A premier institution for art and heritage in the Visayas.",
    category: "Museums & Cultural Institutions",
    location: "A. Pigafetta St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 6:00 PM",
    imageUrl: "https://picsum.photos/seed/natmuseum/800/600",
    galleryImages: [],
    rating: 4.8,
    tags: ["art", "aduana"],
    coordinates: { lat: 10.2925, lng: 123.9065 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=National+Museum+Cebu",
    isMustVisit: true
  },
  {
    id: 'cebu-9',
    name: "Jose R. Gullas Halad Museum",
    description: "Dedicated to the musical heritage of Cebu, focusing on local composers and artists.",
    significance: "Preserves Cebu's unique position as the musical capital of the Visayas.",
    category: "Museums & Cultural Institutions",
    location: "V. Gullas St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/halad/800/600",
    galleryImages: [],
    rating: 4.5,
    tags: ["music", "heritage"],
    coordinates: { lat: 10.2974, lng: 123.9051 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Jose+R.+Gullas+Halad+Museum",
    isMustVisit: false
  },
  {
    id: 'cebu-10',
    name: "University of San Carlos Museum",
    description: "Located within the USC Main Campus, housing archaeological and ethnographical collections.",
    significance: "One of the oldest university museums in the Philippines.",
    category: "Museums & Cultural Institutions",
    location: "P. del Rosario St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/uscmuseum/800/600",
    galleryImages: [],
    rating: 4.6,
    tags: ["university", "anthropology"],
    coordinates: { lat: 10.2992, lng: 123.8992 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=USC+Museum+Cebu",
    isMustVisit: false
  },
  {
    id: 'cebu-11',
    name: "Fort San Pedro",
    description: "A triangular bastion fort built by the Spanish under Miguel López de Legazpi.",
    significance: "The oldest and smallest fort in the Philippines.",
    category: "Historical Landmarks & Monuments",
    location: "A. Pigafetta Street, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 7:00 PM",
    imageUrl: "https://picsum.photos/seed/fort/800/600",
    galleryImages: [],
    rating: 4.6,
    tags: ["military", "spanish"],
    coordinates: { lat: 10.2924, lng: 123.9056 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Fort+San+Pedro",
    isMustVisit: true
  },
  {
    id: 'cebu-12',
    name: "Heritage of Cebu Monument",
    description: "A massive tableau of sculptures depicting Cebu's historical events and landmarks.",
    significance: "Artistic narrative of Cebu from Rajah Humabon to modern times.",
    category: "Historical Landmarks & Monuments",
    location: "Sikatuna St, Parian, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/monument/800/600",
    galleryImages: [],
    rating: 4.8,
    tags: ["sculpture", "history"],
    coordinates: { lat: 10.2990, lng: 123.9036 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Heritage+of+Cebu+Monument",
    isMustVisit: true
  },
  {
    id: 'cebu-13',
    name: "Colon Street and Obelisk",
    description: "The oldest street in the Philippines, named after Christopher Columbus.",
    significance: "Heart of Cebu's commerce and trade since the Spanish era.",
    category: "Historical Landmarks & Monuments",
    location: "Colon St, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/colon/800/600",
    galleryImages: [],
    rating: 4.3,
    tags: ["oldest street", "commerce"],
    coordinates: { lat: 10.2983, lng: 123.9038 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Colon+Street+Cebu",
    isMustVisit: false
  },
  {
    id: 'cebu-14',
    name: "Plaza Independencia",
    description: "A large public square and garden located near Fort San Pedro.",
    significance: "Site of many historical rallies and a symbol of Cebu's freedom.",
    category: "Plazas, Parks & Public Spaces",
    location: "M.J. Cuenco Ave, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/independencia/800/600",
    galleryImages: [],
    rating: 4.5,
    tags: ["park", "public square"],
    coordinates: { lat: 10.2928, lng: 123.9050 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Plaza+Independencia+Cebu",
    isMustVisit: true
  },
  {
    id: 'cebu-15',
    name: "Fuente Osmeña Circle",
    description: "A iconic traffic circle and park in the center of modern Cebu City.",
    significance: "Built in memory of the inauguration of the city's water system in 1912.",
    category: "Plazas, Parks & Public Spaces",
    location: "Osmeña Blvd, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/fuente/800/600",
    galleryImages: [],
    rating: 4.4,
    tags: ["fountain", "landmark"],
    coordinates: { lat: 10.3113, lng: 123.8925 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Fuente+Osmena+Circle",
    isMustVisit: false
  },
  {
    id: 'cebu-16',
    name: "Cebu Provincial Capitol",
    description: "A neoclassical building that serves as the seat of the provincial government.",
    significance: "Architectural symbol of the American colonial period in Cebu.",
    category: "Government & Historic Buildings",
    location: "Escario St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/capitol/800/600",
    galleryImages: [],
    rating: 4.8,
    tags: ["capitol", "government"],
    coordinates: { lat: 10.3175, lng: 123.8906 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cebu+Provincial+Capitol",
    isMustVisit: true
  },
  {
    id: 'cebu-17',
    name: "Cebu Taoist Temple",
    description: "A Chinese temple built by Cebu's prominent Chinese community.",
    significance: "Symbolizes the diverse religious landscape and Chinese influence in Cebu.",
    category: "Cultural & Religious (Non-Catholic Sites)",
    location: "Beverly Hills, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/taoist/800/600",
    galleryImages: [],
    rating: 4.6,
    tags: ["temple", "chinese heritage"],
    coordinates: { lat: 10.3344, lng: 123.8883 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cebu+Taoist+Temple",
    isMustVisit: true
  },
  // --- TALISAY CITY ---
  {
    id: 'talisay-1',
    name: "Talisay Landing Site",
    description: "Memorial site marking the landing of American forces during World War II.",
    significance: "Key site for the liberation of Cebu from Japanese occupation on March 26, 1945.",
    category: "Historical Landmarks & Monuments",
    location: "Larawan Beach, Talisay City",
    city: "Talisay City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/landing/800/600",
    galleryImages: [],
    rating: 4.4,
    tags: ["WWII", "liberation"],
    coordinates: { lat: 10.2525, lng: 123.8445 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Talisay+Landing+Site",
    isMustVisit: true
  },
  {
    id: 'talisay-2',
    name: "Sta. Teresa de Avila Parish Church",
    description: "The primary historical church of Talisay City.",
    significance: "Heritage church representing the town's colonial religious history.",
    category: "Churches & Religious Heritage Sites",
    location: "Talisay City",
    city: "Talisay City",
    visitingHours: "5:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/talisaychurch/800/600",
    galleryImages: [],
    rating: 4.5,
    tags: ["church", "talisay"],
    coordinates: { lat: 10.2443, lng: 123.8491 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Sta.+Teresa+de+Avila+Parish",
    isMustVisit: false
  },
  // --- MANDAUE CITY ---
  {
    id: 'mandaue-1',
    name: "National Shrine of Saint Joseph",
    description: "Established by the Jesuits in 1580, it is the center of Mandaue's religious life.",
    significance: "One of the oldest parishes in the province.",
    category: "Churches & Religious Heritage Sites",
    location: "P. Burgos St, Mandaue City",
    city: "Mandaue City",
    visitingHours: "6:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/mandauechurch/800/600",
    galleryImages: [],
    rating: 4.6,
    tags: ["shrine", "mandaue"],
    coordinates: { lat: 10.3295, lng: 123.9392 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=National+Shrine+of+St.+Joseph+Mandaue",
    isMustVisit: true
  },
  {
    id: 'mandaue-2',
    name: "Bantayan sa Hari",
    description: "Watchtower remains built to guard against pirate raids in the Spanish era.",
    significance: "Military heritage site located in Looc, Mandaue.",
    category: "Historical Landmarks & Monuments",
    location: "Looc, Mandaue City",
    city: "Mandaue City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/watchtower/800/600",
    galleryImages: [],
    rating: 4.1,
    tags: ["watchtower", "pirate defense"],
    coordinates: { lat: 10.3150, lng: 123.9495 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Bantayan+sa+Hari+Mandaue",
    isMustVisit: false,
    needsVerification: true
  },
  // --- LAPU-LAPU CITY ---
  {
    id: 'lapu-1',
    name: "Mactan Shrine (Liberty Shrine)",
    description: "Memorial park honoring Lapu-Lapu and Ferdinand Magellan.",
    significance: "Site of the Battle of Mactan in 1521, where Lapu-Lapu defeated Magellan.",
    category: "Historical Landmarks & Monuments",
    location: "Punta Engaño, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/mactanshrine/800/600",
    galleryImages: [],
    rating: 4.8,
    tags: ["hero", "battle"],
    coordinates: { lat: 10.3115, lng: 123.9585 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mactan+Shrine",
    isMustVisit: true
  }
];

export function getSiteById(id: string) {
  return HERITAGE_SITES.find(site => site.id === id);
}

export function searchSites(query: string, city?: string, category?: string) {
  return HERITAGE_SITES.filter(site => {
    const matchesQuery = query ? (
      site.name.toLowerCase().includes(query.toLowerCase()) ||
      site.description.toLowerCase().includes(query.toLowerCase()) ||
      site.significance.toLowerCase().includes(query.toLowerCase()) ||
      site.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    ) : true;
    
    const matchesCity = city && city !== 'All' ? site.city === city : true;
    const matchesCategory = category && category !== 'All' ? site.category === category : true;
    
    return matchesQuery && matchesCity && matchesCategory;
  });
}
