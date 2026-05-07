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
    overview: "The Basilica Minore del Santo Niño is a massive stone structure located in the heart of Cebu City. Established in 1565 by Fray Andres de Urdaneta and Miguel Lopez de Legazpi, the current church building was completed in 1739. Visitors can expect to see a blend of Romanesque, Muslim, and Neoclassical architectural styles, featuring thick coral stone walls and a beautifully ornate interior. It serves as the center of the annual Sinulog Festival, drawing millions of pilgrims globally.",
    significance: "Historically, the Basilica marks the birthplace of Christianity in the Far East. It was built on the spot where the image of the Santo Niño was found preserved in a pine box, an event seen as miraculous by the early Spanish explorers. It is a National Historical Landmark and a center of religious life that defines the Cebuano identity.",
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
    overview: "The Metropolitan Cathedral of the Holy Guardian Angels is located just blocks away from the Basilica del Santo Niño. It is a large stone church known for its low-slung, earthquake-proof Baroque design, featuring thick walls and a facade that has survived multiple reconstructions. The interior is characterized by its grand altar and serene ambiance, serving as a primary site for major liturgical celebrations in the region.",
    significance: "The Cebu Cathedral is significant as the center of religious administration in the Visayas. Established as a parish in 1595, it serves as a physical record of the growth of the Catholic Church in the region and holds the remains of several notable Cebuano bishops. Its architecture reflects the resilience of the local community against natural disasters.",
    category: "Churches & Religious Heritage Sites",
    location: "Mabini St, Cebu City",
    city: "Cebu City",
    visitingHours: "5:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/cathedral/800/600",
    galleryImages: ["https://picsum.photos/seed/cathedral-altar/800/600"],
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
    overview: "Magellan's Cross is housed in a small octagonal stone pavilion known as a kiosk. The central feature is a large wooden cross that is believed to contain the original fragments of the cross planted by Magellan's expedition on April 14, 1521. The ceiling of the pavilion features vibrant murals depicting the first baptism of Cebuano natives, providing a visual history of the event.",
    significance: "This site is arguably the most important historical landmark in Cebu, representing the very moment the Philippines encountered the West and Christianity. It symbolizes the beginning of the Spanish colonial era and the spiritual foundation of the nation. It is a powerful emblem of Cebu's place in world history.",
    category: "Churches & Religious Heritage Sites",
    location: "P. Burgos St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 6:00 PM",
    imageUrl: "https://picsum.photos/seed/magellan/800/600",
    galleryImages: ["https://picsum.photos/seed/cross-ceiling/800/600"],
    rating: 4.8,
    tags: ["cross", "magellan"],
    coordinates: { lat: 10.29362, lng: 123.90192 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Magellan%27s+Cross",
    isMustVisit: true
  },
  {
    id: 'cebu-gorordo',
    name: "Casa Gorordo Museum",
    description: "A beautifully restored 19th-century residence depicting the lifestyle of the Filipino elite.",
    overview: "Originally built in the 1850s, Casa Gorordo was the home of the Gorordo family, including Juan Gorordo, the first Filipino Bishop of Cebu. It is a classic example of 'Bahay na Bato' architecture, featuring a coral stone ground floor and fine hardwood upper floor. The museum displays period furniture, costumes, and religious art that showcase the domestic life of the 19th-century Cebuano elite.",
    significance: "Casa Gorordo is significant as a window into Cebu's social history during the 19th and early 20th centuries, reflecting the cultural synthesis of Spanish, Chinese, and native Filipino influences. It preserves the 'Parian' district's legacy as a wealthy merchant enclave and provides context for the city's urban evolution.",
    category: "Ancestral Houses & Heritage Residences",
    location: "Lopez Jaena St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/gorordo/800/600",
    galleryImages: ["https://picsum.photos/seed/gorordo-interior/800/600"],
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
    overview: "Built in the late 17th century, it is recognized as one of the oldest private homes in the country. The structure is built with coral stones glued with egg whites and molave wood. It remains owned by the descendants of the original family, who have curated a collection of antiques and curiosities that date back centuries.",
    significance: "This house is a rare surviving link to the prosperous Chinese-Filipino merchant community that thrived in the Parian district centuries ago. It demonstrates the structural ingenuity of the era and stands as a testament to the endurance of Filipino-Chinese heritage in Cebu's commercial history.",
    category: "Ancestral Houses & Heritage Residences",
    location: "Mabini St, Parian, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 6:00 PM",
    imageUrl: "https://picsum.photos/seed/yap/800/600",
    galleryImages: ["https://picsum.photos/seed/yap-dining/800/600"],
    rating: 4.7,
    tags: ["ancestral", "parian"],
    coordinates: { lat: 10.29871, lng: 123.90342 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Yap-Sandiego+Ancestral+House",
    isMustVisit: true
  },
  {
    id: 'cebu-fort-san-pedro',
    name: "Fort San Pedro",
    description: "The oldest and smallest bastion fort in the Philippines, built by the Spanish in 1565.",
    overview: "A triangular military defense structure built in 1565 under the command of Miguel Lopez de Legazpi. Its walls are made of coral stone and lime, featuring three historic bastions named La Concepcion, Ignacio de Loyola, and San Miguel. Today, the fort houses a museum and a serene garden, offering a quiet escape in the middle of the city's port area.",
    significance: "Historically, Fort San Pedro served as the nucleus of the first Spanish settlement in the Philippines, protecting against pirate raids and later serving as a barracks and a prison. It is a symbol of Spanish military power and the early days of the colonial era in Asia.",
    category: "Historical Landmarks & Monuments",
    location: "A. Pigafetta Street, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 7:00 PM",
    imageUrl: "https://picsum.photos/seed/fort/800/600",
    galleryImages: ["https://picsum.photos/seed/fort-walls/800/600"],
    rating: 4.6,
    tags: ["military", "spanish"],
    coordinates: { lat: 10.29242, lng: 123.90562 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Fort+San+Pedro",
    isMustVisit: true
  },
  {
    id: 'llc-mactan-shrine',
    name: "Mactan Shrine (Liberty Shrine)",
    description: "The historic site of the Battle of Mactan, commemorating Lapu-Lapu's victory in 1521.",
    overview: "Located in Punta Engaño, the Mactan Shrine marks the site of the historic Battle of Mactan where local chieftain Lapu-Lapu defeated the Spanish expedition led by Ferdinand Magellan. The shrine features a 20-meter bronze statue of Lapu-Lapu holding a sword and shield, as well as the Magellan Marker, an obelisk built by the Spanish to honor the fallen explorer.",
    significance: "Significant as the symbol of Filipino courage and the first successful resistance against European colonization. It commemorates the bravery of the natives who fought for their land and sovereignty. The shrine is a central point for Cebuano pride and a reminder of the region's warrior heritage.",
    category: "Historical Landmarks & Monuments",
    location: "Punta Engaño Rd, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/mactan/800/600",
    galleryImages: ["https://picsum.photos/seed/lapulapu-statue/800/600"],
    rating: 4.8,
    tags: ["hero", "history", "battle"],
    coordinates: { lat: 10.33471, lng: 124.01502 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mactan+Shrine",
    isMustVisit: true
  },
  {
    id: 'mandaue-presidencia',
    name: "Mandaue Presidencia",
    description: "The historic city hall building, a symbol of Mandaue's civic identity since 1937.",
    overview: "The Mandaue Presidencia is a historic municipal hall building completed in 1937. It features a distinctive Commonwealth-era architectural style, characterized by its clean lines and neoclassical touches. Located in the heart of Mandaue's Heritage Plaza, it continues to serve as the seat of local government while maintaining its status as a landmark of the city's political history.",
    significance: "Significant as the primary symbol of Mandaue's transition from a town to a city, serving as the symbolic heart of its governance for nearly a century. It survived the Second World War and remains a proud reminder of the city's administrative continuity and heritage.",
    category: "Historical Landmarks & Monuments",
    location: "Mandaue City Center",
    city: "Mandaue City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/presidencia/800/600",
    galleryImages: ["https://picsum.photos/seed/presidencia-plaza/800/600"],
    rating: 4.5,
    tags: ["civic", "landmark"],
    coordinates: { lat: 10.33041, lng: 123.93882 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mandaue+Presidencia",
    isMustVisit: true
  },
  {
    id: 'talisay-landing',
    name: "Talisay Landing Site",
    description: "The historic beach where American liberation forces landed in 1945 to free Cebu.",
    overview: "The Talisay Landing Site, located at Larawan Beach, is a WWII memorial featuring larger-than-life statues of American liberation forces wading ashore. This site commemorates the landing on March 26, 1945, which began the liberation of the island of Cebu from Japanese occupation. The park provides a space for reflection on the cost of freedom and the alliance between the US and the Philippines.",
    significance: "Significant as the turning point for the liberation of Cebu during the Pacific theater of WWII. The 'Liberation of Cebu' is celebrated annually here, and the statues serve as a tangible link to the veterans and the history of Talisay as a gateway to freedom.",
    category: "Historical Landmarks & Monuments",
    location: "Larawan Beach, Talisay City",
    city: "Talisay City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/landing/800/600",
    galleryImages: ["https://picsum.photos/seed/talisay-monument/800/600"],
    rating: 4.4,
    tags: ["WWII", "memorial"],
    coordinates: { lat: 10.25251, lng: 123.84452 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Talisay+Landing+Site",
    isMustVisit: true
  },
  {
    id: 'cebu-capitol',
    name: "Cebu Provincial Capitol",
    description: "A neoclassical masterpiece and the seat of the provincial government of Cebu.",
    overview: "Designed by renowned architect Juan Arellano and completed in 1938, the Cebu Provincial Capitol is a grand neoclassical building with a prominent central dome and a symmetrical facade. It is considered one of the most beautiful government buildings in the Philippines. The structure houses various provincial offices and a grand session hall with ornate woodwork and historic murals.",
    significance: "A masterpiece of American colonial architecture and a symbol of the province's political and economic importance. Its location at the end of the Osmeña Boulevard represents the city's planned expansion and modernization during the early 20th century. It is a protected National Historical Landmark.",
    category: "Government & Historic Buildings",
    location: "Escario St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/capitol/800/600",
    galleryImages: ["https://picsum.photos/seed/capitol-dome/800/600"],
    rating: 4.8,
    tags: ["capitol", "government"],
    coordinates: { lat: 10.31752, lng: 123.89062 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cebu+Provincial+Capitol",
    isMustVisit: true
  },
  // --- ADDITIONAL SITES FROM AUDIT ---
  {
    id: 'cebu-city-hall',
    name: "Cebu City Hall",
    description: "The administrative center of Cebu City, located near the historic Plaza Sugbo.",
    overview: "The Cebu City Hall is a modern administrative building that serves as the executive center of the city. While the building itself is relatively modern, its location is deeply historical, situated directly across from the Basilica del Santo Niño and Magellan's Cross. It overlooks Plaza Sugbo and serves as the hub for the city's civic life.",
    significance: "It represents the continuity of governance in the oldest city in the Philippines. Its proximity to religious landmarks highlights the close relationship between the church and state in Cebu's historical development. It is the heart of the 'Heritage District' where many of the city's oldest traditions are managed.",
    category: "Government & Historic Buildings",
    location: "M.C. Briones St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/cityhall/800/600",
    rating: 4.2,
    tags: ["government", "civic"],
    coordinates: { lat: 10.29312, lng: 123.90151 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cebu+City+Hall",
    isMustVisit: false
  },
  {
    id: 'cebu-taoist',
    name: "Cebu Taoist Temple",
    description: "A colorful temple and major cultural landmark for the local Chinese community.",
    overview: "Built in 1972, this temple sits 300 meters above sea level in the Beverly Hills subdivision. It features colorful multi-tiered roofs, dragon motifs, and a replica of the Great Wall of China. Visitors can participate in Taoist rituals, enjoy the panoramic view of the city, and explore the beautifully manicured gardens and pagodas.",
    significance: "Significant as the primary symbol of the religious and cultural influence of the Chinese-Filipino community in Cebu. It is a center of the Taoist faith and a popular destination for tourists seeking a cultural contrast to the city's many Catholic landmarks. It highlights the multi-cultural fabric of Metro Cebu.",
    category: "Cultural & Religious (Non-Catholic Sites)",
    location: "Beverly Hills, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/taoist/800/600",
    galleryImages: ["https://picsum.photos/seed/taoist-view/800/600"],
    rating: 4.6,
    tags: ["temple", "chinese"],
    coordinates: { lat: 10.33442, lng: 123.88831 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cebu+Taoist+Temple",
    isMustVisit: true
  },
  {
    id: 'mandaue-bridge',
    name: "Mandaue-Mactan Bridge",
    description: "The first iconic bridge connecting mainland Cebu to Mactan Island.",
    overview: "The Mandaue-Mactan Bridge, also known as the First Cebu-Mactan Bridge, is a truss bridge that spans the Mactan Channel. Completed in 1972, it was the first permanent link between the industrial mainland and the island home of the international airport. It offers a scenic view of the channel and the growing industrial skyline of Mandaue City.",
    significance: "Significant as a vital infrastructure project that transformed the economy of Metro Cebu. It symbolized the modernization of the region and remains an iconic part of the skyline. Historically, it ended the era of ferry-only transport to Mactan, paving the way for the island's tourism and industrial boom.",
    category: "Historical Landmarks & Monuments",
    location: "Mandaue City - Lapu-Lapu City",
    city: "Mandaue City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/bridge/800/600",
    rating: 4.4,
    tags: ["bridge", "landmark"],
    coordinates: { lat: 10.32451, lng: 123.94821 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mandaue+Mactan+Bridge",
    isMustVisit: false
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
