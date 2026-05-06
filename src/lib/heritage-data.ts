export interface HeritageSite {
  id: string;
  name: string;
  description: string; // Short preview for cards
  overview: string;    // Full informative description
  significance: string; // Historical value
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
  galleryImages?: string[];
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
    id: 'cebu-basilica',
    name: "Basilica Minore del Santo Niño de Cebu",
    description: "The oldest Roman Catholic church in the Philippines, home to the miraculous image of the Santo Niño.",
    overview: "The Basilica Minore del Santo Niño is a massive stone structure located in the heart of Cebu City. Established in 1565 by Fray Andres de Urdaneta and Miguel Lopez de Legazpi, the current church building was completed in 1739. Visitors can expect to see a blend of Romanesque, Muslim, and Neoclassical architectural styles, featuring thick coral stone walls and a beautifully ornate interior.",
    significance: "Historically, the Basilica marks the birthplace of Christianity in the Far East. It was built on the spot where the image of the Santo Niño was found preserved in a pine box, an event seen as miraculous by the early Spanish explorers.",
    category: "Churches & Religious Heritage Sites",
    location: "Osmeña Blvd, Cebu City",
    city: "Cebu City",
    visitingHours: "6:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/basilica/800/600",
    galleryImages: ["https://picsum.photos/seed/basilica-2/800/600", "https://picsum.photos/seed/basilica-3/800/600"],
    rating: 4.9,
    tags: ["oldest church", "religious", "sinulog"],
    coordinates: { lat: 10.29419, lng: 123.90212 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Basilica+Minore+del+Santo+Nino",
    isMustVisit: true
  },
  {
    id: 'cebu-cathedral',
    name: "Metropolitan Cebu Cathedral",
    description: "The ecclesiastical seat of the Archdiocese of Cebu, featuring distinct Baroque architecture.",
    overview: "The Metropolitan Cathedral of the Holy Guardian Angels is located just blocks away from the Basilica del Santo Niño. It is a large stone church known for its low-slung, earthquake-proof Baroque design.",
    significance: "The Cebu Cathedral is significant as the center of religious administration in the Visayas. It serves as a physical record of the growth of the Catholic Church in the region.",
    category: "Churches & Religious Heritage Sites",
    location: "Mabini St, Cebu City",
    city: "Cebu City",
    visitingHours: "5:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/cathedral/800/600",
    rating: 4.6,
    tags: ["cathedral", "baroque"],
    coordinates: { lat: 10.29544, lng: 123.90284 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cebu+Metropolitan+Cathedral",
    isMustVisit: false
  },
  {
    id: 'cebu-cross',
    name: "Magellan’s Cross",
    description: "The iconic symbol of Cebu, marking the site where the first Christian cross was planted in 1521.",
    overview: "Magellan's Cross is housed in a small octagonal stone pavilion known as a kiosk. The central feature is a large wooden cross that is believed to contain the original fragments of the cross planted by Magellan's expedition.",
    significance: "This site is arguably the most important historical landmark in Cebu, representing the very moment the Philippines encountered the West and Christianity.",
    category: "Churches & Religious Heritage Sites",
    location: "P. Burgos St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 6:00 PM",
    imageUrl: "https://picsum.photos/seed/magellan/800/600",
    rating: 4.8,
    tags: ["cross", "magellan"],
    coordinates: { lat: 10.29362, lng: 123.90192 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Magellan%27s+Cross",
    isMustVisit: true
  },
  {
    id: 'cebu-arch-museum',
    name: "Archdiocesan Museum of Cebu",
    description: "A museum dedicated to the rich religious and liturgical history of the Cebuano people.",
    overview: "Located within the grounds of the Cebu Metropolitan Cathedral, this museum is housed in the 'bahay na bato' style rectory that once served as the residence for the cathedral's clergy.",
    significance: "The museum is significant for preserving the tangible religious heritage of the Visayas, featuring antique religious icons and centuries-old documents.",
    category: "Museums & Cultural Institutions",
    location: "Mabini St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/archmuseum/800/600",
    rating: 4.4,
    tags: ["museum", "religious"],
    coordinates: { lat: 10.29515, lng: 123.90251 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Archdiocesan+Museum+of+Cebu",
    isMustVisit: false
  },
  {
    id: 'cebu-gorordo',
    name: "Casa Gorordo Museum",
    description: "A beautifully restored 19th-century residence depicting the lifestyle of the Filipino elite.",
    overview: "Originally built in the 1850s, Casa Gorordo was the home of the Gorordo family. It is a classic example of 'Bahay na Bato' architecture, featuring a coral stone ground floor and fine hardwood upper floor.",
    significance: "Casa Gorordo is significant as a window into Cebu's social history during the 19th and early 20th centuries, reflecting the cultural synthesis of Spanish, Chinese, and native Filipino influences.",
    category: "Ancestral Houses & Heritage Residences",
    location: "Lopez Jaena St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/gorordo/800/600",
    rating: 4.7,
    tags: ["mansion", "lifestyle"],
    coordinates: { lat: 10.29952, lng: 123.90424 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Casa+Gorordo+Museum",
    isMustVisit: true
  },
  {
    id: 'cebu-yap-sandiego',
    name: "Yap-Sandiego Ancestral House",
    description: "One of the oldest residential houses in the Philippines, built by Chinese merchants in the 17th century.",
    overview: "Built in the late 17th century, it is recognized as one of the oldest private homes in the country. The structure is built with coral stones glued with egg whites.",
    significance: "This house is a rare surviving link to the prosperous Chinese-Filipino merchant community that thrived in the Parian district centuries ago.",
    category: "Ancestral Houses & Heritage Residences",
    location: "Mabini St, Parian, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 6:00 PM",
    imageUrl: "https://picsum.photos/seed/yap/800/600",
    rating: 4.7,
    tags: ["ancestral", "parian"],
    coordinates: { lat: 10.29871, lng: 123.90342 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Yap-Sandiego+Ancestral+House",
    isMustVisit: true
  },
  {
    id: 'cebu-jesuit-house',
    name: "1730 Jesuit House",
    description: "A hidden gem dating back to the Jesuit era, tucked inside a modern warehouse.",
    overview: "Also known as Museo de Parian, this house dates back to 1730 and served as the residence for the Jesuit superior in Cebu. It is hidden behind the walls of a modern hardware warehouse.",
    significance: "The Jesuit House is significant as the oldest dated residential house in the Philippines, providing insight into early Jesuit missionary activities.",
    category: "Ancestral Houses & Heritage Residences",
    location: "Zulueta St, Parian, Cebu City",
    city: "Cebu City",
    visitingHours: "8:30 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/jesuit/800/600",
    rating: 4.8,
    tags: ["jesuit", "oldest"],
    coordinates: { lat: 10.29821, lng: 123.90311 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Jesuit+House+Cebu",
    isMustVisit: true
  },
  {
    id: 'cebu-nat-museum',
    name: "National Museum of the Philippines – Cebu",
    description: "The regional branch of the National Museum, housed in the historic Aduana (Customs) Building.",
    overview: "Located in the beautifully restored Aduana Building, this museum features galleries dedicated to natural history, archaeology, and ethnography of the Visayas.",
    significance: "This institution is significant as the primary caretaker of the Visayan region's cultural treasures, revitalizing the historical port area.",
    category: "Museums & Cultural Institutions",
    location: "A. Pigafetta St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 6:00 PM",
    imageUrl: "https://picsum.photos/seed/natmuseum/800/600",
    rating: 4.8,
    tags: ["art", "archaeology"],
    coordinates: { lat: 10.29251, lng: 123.90652 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=National+Museum+Cebu",
    isMustVisit: true
  },
  {
    id: 'cebu-halad-museum',
    name: "Jose R. Gullas Halad Museum",
    description: "A musically-themed museum that pays tribute to Cebuano composers and musicians.",
    overview: "A unique cultural institution dedicated to the musical heritage of the Cebuano people, specifically honoring maestros from the 20th century.",
    significance: "The Halad Museum is significant for preserving the distinct musical identity of Cebu, documenting classics like the Harana and Kundiman.",
    category: "Museums & Cultural Institutions",
    location: "V. Gullas St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/halad/800/600",
    rating: 4.5,
    tags: ["music", "composers"],
    coordinates: { lat: 10.29744, lng: 123.90512 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Jose+R.+Gullas+Halad+Museum",
    isMustVisit: false
  },
  {
    id: 'cebu-usc-museum',
    name: "University of San Carlos Museum",
    description: "A research-oriented museum featuring extensive archaeological and ethnographic collections.",
    overview: "Located within the USC main campus, this museum features four main galleries focusing on archaeology, ethnography, natural science, and ceramics.",
    significance: "A vital institution for understanding pre-colonial history and biodiversity, representing decades of academic field research.",
    category: "Museums & Cultural Institutions",
    location: "P. del Rosario St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/uscmuseum/800/600",
    rating: 4.6,
    tags: ["university", "anthropology"],
    coordinates: { lat: 10.29922, lng: 123.89921 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=USC+Museum+Cebu",
    isMustVisit: false
  },
  {
    id: 'cebu-fort-san-pedro',
    name: "Fort San Pedro",
    description: "The oldest and smallest bastion fort in the Philippines, built by the Spanish in 1565.",
    overview: "A triangular military defense structure built in 1565. Its walls are made of coral stone and lime, featuring three historic bastions.",
    significance: "Historically, Fort San Pedro served as the nucleus of the first Spanish settlement in the Philippines, protecting against pirate raids.",
    category: "Historical Landmarks & Monuments",
    location: "A. Pigafetta Street, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 7:00 PM",
    imageUrl: "https://picsum.photos/seed/fort/800/600",
    rating: 4.6,
    tags: ["military", "spanish"],
    coordinates: { lat: 10.29242, lng: 123.90562 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Fort+San+Pedro",
    isMustVisit: true
  },
  {
    id: 'cebu-heritage-monument',
    name: "Heritage of Cebu Monument",
    description: "A monumental tableau of sculptures depicting major events in the history of Cebu.",
    overview: "Created by Eduardo Castrillo, this massive tableau depicts a timeline of Cebu's history from pre-colonial times to the modern day.",
    significance: "Significant as a visual encyclopedia of Cebuano identity, consolidates pivotal historical moments into a single artistic expression.",
    category: "Historical Landmarks & Monuments",
    location: "Sikatuna St, Parian, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/monument/800/600",
    rating: 4.8,
    tags: ["sculpture", "parian"],
    coordinates: { lat: 10.29902, lng: 123.90362 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Heritage+of+Cebu+Monument",
    isMustVisit: true
  },
  {
    id: 'cebu-colon-street',
    name: "Colon Street, Obelisk, and Historical Marker",
    description: "The oldest street in the Philippines, established in 1565 by the Spanish expedition.",
    overview: "Colon Street is the oldest national road in the country. Today it is a bustling commercial area with an obelisk marking its historical origin.",
    significance: "Significant as the commercial axis around which the city grew, named after Christopher Columbus.",
    category: "Historical Landmarks & Monuments",
    location: "Colon St, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/colon/800/600",
    rating: 4.3,
    tags: ["oldest street", "commerce"],
    coordinates: { lat: 10.29831, lng: 123.90382 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Colon+Street+Cebu",
    isMustVisit: false
  },
  {
    id: 'cebu-plaza-independencia',
    name: "Plaza Independencia",
    description: "The largest and most important historic park in Cebu City, located near Fort San Pedro.",
    overview: "A large public park featuring century-old acacia trees and monuments dedicated to Filipino heroes.",
    significance: "Significant as a silent witness to various colonial eras, its name reflects the transition of the Philippines to a sovereign nation.",
    category: "Plazas, Parks & Public Spaces",
    location: "M.J. Cuenco Ave, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/independencia/800/600",
    rating: 4.5,
    tags: ["park", "plaza"],
    coordinates: { lat: 10.29282, lng: 123.90502 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Plaza+Independencia+Cebu",
    isMustVisit: true
  },
  {
    id: 'cebu-fuente-circle',
    name: "Fuente Osmeña Circle",
    description: "A historic rotunda and public park that serves as the heart of midtown Cebu City.",
    overview: "A circular public park and fountain built in 1912 to commemorate the city's new water system.",
    significance: "Significant as a symbol of the city's modernization, honoring Sergio Osmeña, the first Filipino Speaker of the House.",
    category: "Plazas, Parks & Public Spaces",
    location: "Osmeña Blvd, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/fuente/800/600",
    rating: 4.4,
    tags: ["fountain", "modern"],
    coordinates: { lat: 10.31131, lng: 123.89251 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Fuente+Osmena+Circle",
    isMustVisit: false
  },
  {
    id: 'cebu-capitol',
    name: "Cebu Provincial Capitol",
    description: "A neoclassical masterpiece and the seat of the provincial government of Cebu.",
    overview: "Designed by Juan Arellano and completed in 1938, it is a grand neoclassical masterpiece with a prominent dome.",
    significance: "Masterpiece of American colonial architecture and symbol of the province's political and economic importance.",
    category: "Government & Historic Buildings",
    location: "Escario St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/capitol/800/600",
    rating: 4.8,
    tags: ["capitol", "government"],
    coordinates: { lat: 10.31752, lng: 123.89062 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cebu+Provincial+Capitol",
    isMustVisit: true
  },
  {
    id: 'cebu-taoist',
    name: "Cebu Taoist Temple",
    description: "A colorful temple and major cultural landmark for the local Chinese community.",
    overview: "Built in 1972, this temple sits 300 meters above sea level and features colorful multi-tiered roofs and dragon motifs.",
    significance: "Significant as the primary symbol of the religious and cultural influence of the Chinese-Filipino community in Cebu.",
    category: "Cultural & Religious (Non-Catholic Sites)",
    location: "Beverly Hills, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/taoist/800/600",
    rating: 4.6,
    tags: ["temple", "chinese"],
    coordinates: { lat: 10.33442, lng: 123.88831 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cebu+Taoist+Temple",
    isMustVisit: true
  },
  {
    id: 'talisay-landing',
    name: "Talisay Landing Site",
    description: "The historic beach where American liberation forces landed in 1945 to free Cebu.",
    overview: "A WWII memorial featuring large statues of American liberation forces wading ashore on March 26, 1945.",
    significance: "Significant as the turning point for the liberation of Cebu from Japanese occupation during the Pacific theater of WWII.",
    category: "Historical Landmarks & Monuments",
    location: "Larawan Beach, Talisay City",
    city: "Talisay City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/landing/800/600",
    rating: 4.4,
    tags: ["WWII", "memorial"],
    coordinates: { lat: 10.25251, lng: 123.84452 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Talisay+Landing+Site",
    isMustVisit: true
  },
  {
    id: 'mandaue-st-joseph',
    name: "National Shrine of Saint Joseph",
    description: "A historic church and major pilgrimage site, home to life-sized statues of the Last Supper.",
    overview: "Historic stone church established by Jesuits in the early 17th century, famous for life-sized statues of the Last Supper.",
    significance: "Significant as one of the oldest parishes in the region, established before Mandaue became a city.",
    category: "Churches & Religious Heritage Sites",
    location: "P. Burgos St, Mandaue City",
    city: "Mandaue City",
    visitingHours: "6:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/mandauechurch/800/600",
    rating: 4.6,
    tags: ["shrine", "religious"],
    coordinates: { lat: 10.32952, lng: 123.93921 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=National+Shrine+of+St.+Joseph+Mandaue",
    isMustVisit: true
  },
  {
    id: 'mandaue-presidencia',
    name: "Mandaue Presidencia",
    description: "The historic city hall building, a symbol of Mandaue's civic identity since 1937.",
    overview: "Historic municipal hall building completed in 1937, featuring a distinctive Commonwealth-era architectural style.",
    significance: "Significant as the primary symbol of Mandaue's transition from a town to a city, serving as the symbolic heart of its governance.",
    category: "Historical Landmarks & Monuments",
    location: "Mandaue City",
    city: "Mandaue City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/presidencia/800/600",
    rating: 4.5,
    tags: ["civic", "landmark"],
    coordinates: { lat: 10.33041, lng: 123.93882 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mandaue+Presidencia",
    isMustVisit: true
  },
  {
    id: 'llc-mactan-shrine',
    name: "Mactan Shrine (Liberty Shrine)",
    description: "The historic site of the Battle of Mactan, commemorating Lapu-Lapu's victory in 1521.",
    overview: "Marks the site of the historic Battle of Mactan. Features the Lapu-Lapu Monument and Magellan's Marker obelisk.",
    significance: "Significant as the symbol of Filipino courage and the first successful resistance against European colonization.",
    category: "Historical Landmarks & Monuments",
    location: "Punta Engaño Rd, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/mactan/800/600",
    rating: 4.8,
    tags: ["hero", "history", "battle"],
    coordinates: { lat: 10.33471, lng: 124.01502 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mactan+Shrine",
    isMustVisit: true
  },
  {
    id: 'llc-regla',
    name: "Virgen de la Regla National Shrine",
    description: "A major pilgrimage site dedicated to the patroness of Lapu-Lapu City.",
    overview: "Historic stone church located in Opon district, dedicated to Our Lady of the Rule whose image has been venerated since the 18th century.",
    significance: "Significant as the spiritual soul of Lapu-Lapu City, a defining part of the Oponganon identity.",
    category: "Churches & Religious Heritage Sites",
    location: "B.M. Dimataga St, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "6:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/regla/800/600",
    rating: 4.7,
    tags: ["shrine", "religious", "opon"],
    coordinates: { lat: 10.31031, lng: 123.94942 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Virgen+de+la+Regla+Shrine",
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
      site.overview.toLowerCase().includes(query.toLowerCase()) ||
      site.significance.toLowerCase().includes(query.toLowerCase()) ||
      site.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    ) : true;
    
    // Strict Filtering
    const matchesCity = city && city !== 'All' ? site.city === city : true;
    const matchesCategory = category && category !== 'All' ? site.category === category : true;
    
    return matchesQuery && matchesCity && matchesCategory;
  });
}
