export interface HeritageSite {
  id: string;
  name: string;
  description: string; // Used as Overview
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
    description: "The Basilica Minore del Santo Niño is the oldest Roman Catholic church in the Philippines, established in 1565. It is a massive stone structure built to house the miraculous image of the Santo Niño, which was presented by Ferdinand Magellan to Queen Juana in 1521.",
    significance: "As the birthplace of Christianity in the Philippines, it serves as the spiritual heart of Cebu. It is the center of the annual Sinulog Festival, where millions of pilgrims gather to honor the Holy Child. The church has survived numerous fires and wars, remaining a symbol of enduring Cebuano faith.",
    category: "Churches & Religious Heritage Sites",
    location: "Osmeña Blvd, Cebu City",
    city: "Cebu City",
    visitingHours: "6:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/basilica/800/600",
    galleryImages: ["https://picsum.photos/seed/basilica-2/800/600", "https://picsum.photos/seed/basilica-3/800/600"],
    rating: 4.9,
    tags: ["oldest church", "religious", "sinulog"],
    coordinates: { lat: 10.2942, lng: 123.9021 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Basilica+Minore+del+Santo+Nino",
    isMustVisit: true
  },
  {
    id: 'cebu-cathedral',
    name: "Metropolitan Cebu Cathedral",
    description: "The Metropolitan Cathedral of the Holy Guardian Angels is the seat of the Archdiocese of Cebu. The current stone structure features a distinct Baroque design with thick walls intended to withstand earthquakes and natural calamities.",
    significance: "It is the ecclesiastical center of the Visayas region. Its construction spanned centuries, interrupted by various colonial changes and WWII, making it a living record of Cebu's religious and political history.",
    category: "Churches & Religious Heritage Sites",
    location: "Mabini St, Cebu City",
    city: "Cebu City",
    visitingHours: "5:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/cathedral/800/600",
    rating: 4.6,
    tags: ["cathedral", "baroque"],
    coordinates: { lat: 10.2954, lng: 123.9028 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cebu+Metropolitan+Cathedral",
    isMustVisit: false
  },
  {
    id: 'cebu-cross',
    name: "Magellan’s Cross",
    description: "Magellan's Cross is a Christian cross planted by Portuguese and Spanish explorers as ordered by Ferdinand Magellan upon arriving in Cebu in 1521. It is housed in an octagonal stone kiosk next to the Basilica.",
    significance: "It symbolizes the introduction of Christianity to the Philippines. The original cross is said to be encased within the wooden cross currently visible, protecting it from people who used to chip away pieces as souvenirs.",
    category: "Churches & Religious Heritage Sites",
    location: "P. Burgos St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 6:00 PM",
    imageUrl: "https://picsum.photos/seed/magellan/800/600",
    rating: 4.8,
    tags: ["cross", "magellan"],
    coordinates: { lat: 10.2936, lng: 123.9019 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Magellan%27s+Cross",
    isMustVisit: true
  },
  {
    id: 'cebu-arch-museum',
    name: "Archdiocesan Museum of Cebu",
    description: "Located within the Cebu Cathedral complex, this museum is housed in the former residence of the Cathedral's parish priests (the rectory). It preserves a vast collection of religious art, vestments, and ecclesiastical records.",
    significance: "The museum showcases the rich liturgical heritage of the region, including rare silver altars, antique santos, and historical documents that trace the expansion of the Catholic faith in Cebu.",
    category: "Churches & Religious Heritage Sites",
    location: "Mabini St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/archmuseum/800/600",
    rating: 4.4,
    tags: ["museum", "religious"],
    coordinates: { lat: 10.2951, lng: 123.9025 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Archdiocesan+Museum+of+Cebu",
    isMustVisit: false
  },
  {
    id: 'cebu-gorordo',
    name: "Casa Gorordo Museum",
    description: "Casa Gorordo is a 19th-century residence that served as the home of Juan Gorordo, the first Filipino Bishop of Cebu. The house features a unique blend of Spanish and native Filipino architectural styles, known as the 'Bahay na Bato'.",
    significance: "It offers an intimate look into the lifestyle of the Filipino elite during the late Spanish and early American periods. It is a centerpiece of the historic Parian district, reflecting the cultural synthesis of the era.",
    category: "Ancestral Houses & Heritage Residences",
    location: "Lopez Jaena St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/gorordo/800/600",
    rating: 4.7,
    tags: ["mansion", "lifestyle"],
    coordinates: { lat: 10.2995, lng: 123.9042 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Casa+Gorordo+Museum",
    isMustVisit: true
  },
  {
    id: 'cebu-yap-sandiego',
    name: "Yap-Sandiego Ancestral House",
    description: "Built in the late 17th century, this is one of the oldest residential houses in the Philippines. It was constructed by Chinese merchants and is made of coral stone and molave wood.",
    significance: "It remains in the care of the original family's descendants. The house stands as a testament to the prosperity of the Chinese-Filipino merchant community in the old Parian district.",
    category: "Ancestral Houses & Heritage Residences",
    location: "Mabini St, Parian, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 6:00 PM",
    imageUrl: "https://picsum.photos/seed/yap/800/600",
    rating: 4.7,
    tags: ["ancestral", "parian"],
    coordinates: { lat: 10.2987, lng: 123.9034 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Yap-Sandiego+Ancestral+House",
    isMustVisit: true
  },
  {
    id: 'cebu-jesuit-house',
    name: "1730 Jesuit House",
    description: "Tucked inside a modern hardware warehouse, this house dates back to 1730 and served as the residence for Jesuit priests until their expulsion from the Philippines in 1768.",
    significance: "It is considered the oldest dated residential house in the country. Its discovery and restoration revealed layers of Cebuano history, from the Jesuit era to the house's later use as a residence for prominent local families.",
    category: "Ancestral Houses & Heritage Residences",
    location: "Zulueta St, Parian, Cebu City",
    city: "Cebu City",
    visitingHours: "8:30 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/jesuit/800/600",
    rating: 4.8,
    tags: ["jesuit", "oldest"],
    coordinates: { lat: 10.2982, lng: 123.9031 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Jesuit+House+Cebu",
    isMustVisit: true
  },
  {
    id: 'cebu-nat-museum',
    name: "National Museum of the Philippines – Cebu",
    description: "Housed in the historic Aduana (Customs) Building, which also briefly served as Malacañang sa Sugbo, this museum is the regional branch of the National Museum. The building itself is a landmark of American colonial architecture.",
    significance: "It serves as the premier institution for the preservation of Visayan art, archaeology, and natural history. The site was historically the gateway for trade in Cebu's bustling port.",
    category: "Museums & Cultural Institutions",
    location: "A. Pigafetta St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 6:00 PM",
    imageUrl: "https://picsum.photos/seed/natmuseum/800/600",
    rating: 4.8,
    tags: ["art", "archaeology"],
    coordinates: { lat: 10.2925, lng: 123.9065 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=National+Museum+Cebu",
    isMustVisit: true
  },
  {
    id: 'cebu-halad-museum',
    name: "Jose R. Gullas Halad Museum",
    description: "The Halad Museum is a musically-themed museum that pays tribute to Cebuano composers and musicians. It showcases vintage musical instruments, original scores, and memorabilia from the golden age of Cebuano music.",
    significance: "It preserves the distinct musical identity of Cebu, ensuring that the works of local maestros are remembered by future generations.",
    category: "Museums & Cultural Institutions",
    location: "V. Gullas St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/halad/800/600",
    rating: 4.5,
    tags: ["music", "composers"],
    coordinates: { lat: 10.2974, lng: 123.9051 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Jose+R.+Gullas+Halad+Museum",
    isMustVisit: false
  },
  {
    id: 'cebu-usc-museum',
    name: "University of San Carlos Museum",
    description: "This museum, located within one of the oldest universities in Asia, features extensive collections of archaeological artifacts, ethnographic items, and natural history specimens from across the Philippines.",
    significance: "It is a vital research hub for understanding pre-colonial Visayan life and the rich biodiversity of the region.",
    category: "Museums & Cultural Institutions",
    location: "P. del Rosario St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/uscmuseum/800/600",
    rating: 4.6,
    tags: ["university", "anthropology"],
    coordinates: { lat: 10.2992, lng: 123.8992 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=USC+Museum+Cebu",
    isMustVisit: false
  },
  {
    id: 'cebu-fort-san-pedro',
    name: "Fort San Pedro",
    description: "Fort San Pedro is a triangular military defense structure built by the Spanish under the command of Miguel López de Legazpi. It is the oldest bastion fort in the Philippines.",
    significance: "Originally built to repel hostile locals and later pirates, it served as a stronghold during various colonial conflicts. Today, its lush gardens and thick stone walls offer a peaceful historical sanctuary.",
    category: "Historical Landmarks & Monuments",
    location: "A. Pigafetta Street, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 7:00 PM",
    imageUrl: "https://picsum.photos/seed/fort/800/600",
    rating: 4.6,
    tags: ["military", "spanish"],
    coordinates: { lat: 10.2924, lng: 123.9056 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Fort+San+Pedro",
    isMustVisit: true
  },
  {
    id: 'cebu-heritage-monument',
    name: "Heritage of Cebu Monument",
    description: "This massive tableau of sculptures by Eduardo Castrillo depicts major events in Cebu's history, including the Battle of Mactan, the baptism of Rajah Humabon, and the canonization of San Pedro Calungsod.",
    significance: "Located in the heart of the old Parian district, it serves as a visual encyclopedia of Cebuano history, rendered in a dynamic and monumental scale.",
    category: "Historical Landmarks & Monuments",
    location: "Sikatuna St, Parian, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/monument/800/600",
    rating: 4.8,
    tags: ["sculpture", "parian"],
    coordinates: { lat: 10.2990, lng: 123.9036 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Heritage+of+Cebu+Monument",
    isMustVisit: true
  },
  {
    id: 'cebu-colon-street',
    name: "Colon Street, Obelisk, and Historical Marker",
    description: "Colon Street is the oldest street in the Philippines, established in 1565. It served as the central hub for Cebu's commercial and social life for centuries.",
    significance: "Named after Christopher Columbus, the street's historical marker and obelisk commemorate its role as the economic heart of the city through the Spanish, American, and Japanese eras.",
    category: "Historical Landmarks & Monuments",
    location: "Colon St, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/colon/800/600",
    rating: 4.3,
    tags: ["oldest street", "commerce"],
    coordinates: { lat: 10.2983, lng: 123.9038 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Colon+Street+Cebu",
    isMustVisit: false
  },
  {
    id: 'cebu-plaza-independencia',
    name: "Plaza Independencia",
    description: "Plaza Independencia is a historic public square and the largest park in Cebu City. It is located directly across from Fort San Pedro.",
    significance: "It is a symbolic site of Cebu's history, having served as a site for protests, celebrations, and military drills. The plaza features monuments to various heroes and leaders.",
    category: "Plazas, Parks & Public Spaces",
    location: "M.J. Cuenco Ave, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/independencia/800/600",
    rating: 4.5,
    tags: ["park", "plaza"],
    coordinates: { lat: 10.2928, lng: 123.9050 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Plaza+Independencia+Cebu",
    isMustVisit: true
  },
  {
    id: 'cebu-plaza-sugbo',
    name: "Plaza Sugbo",
    description: "Plaza Sugbo is the open space located between the Cebu City Hall and Magellan's Cross. It is the geographic center of the city's old district.",
    significance: "It is the primary venue for city-wide religious and civic ceremonies, including the Sinulog grand parade starting ceremonies.",
    category: "Plazas, Parks & Public Spaces",
    location: "Magallanes St, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/sugbo/800/600",
    rating: 4.4,
    tags: ["civic", "plaza"],
    coordinates: { lat: 10.2936, lng: 123.9022 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Plaza+Sugbo",
    isMustVisit: false
  },
  {
    id: 'cebu-plaza-hamabar',
    name: "Plaza Hamabar",
    description: "A small, quiet plaza named after Rajah Humabon (Hamabar), the pre-colonial ruler of Cebu who was the first native chieftain to embrace Christianity.",
    significance: "The plaza commemorates the pivotal moment of baptism and the early alliance between the Spanish crown and Cebuano leadership.",
    category: "Plazas, Parks & Public Spaces",
    location: "Mabini St, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/hamabar/800/600",
    rating: 4.2,
    tags: ["rajah", "plaza"],
    coordinates: { lat: 10.2951, lng: 123.9029 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Plaza+Hamabar",
    isMustVisit: false
  },
  {
    id: 'cebu-fuente-circle',
    name: "Fuente Osmeña Circle",
    description: "Fuente Osmeña is a rotunda and public park featuring a landmark fountain built in 1912 to celebrate the city's new water system.",
    significance: "It is the heart of Cebu City's midtown district and serves as the primary hub for Sinulog street celebrations and city night life.",
    category: "Plazas, Parks & Public Spaces",
    location: "Osmeña Blvd, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/fuente/800/600",
    rating: 4.4,
    tags: ["fountain", "modern"],
    coordinates: { lat: 10.3113, lng: 123.8925 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Fuente+Osmena+Circle",
    isMustVisit: false
  },
  {
    id: 'cebu-city-hall',
    name: "Cebu City Hall",
    description: "The official seat of government for Cebu City, this building overlooks Plaza Sugbo and Magellan's Cross. The current structure is a mix of modern and classical design.",
    significance: "It represents the administrative continuity of the Philippines' oldest city and is a central landmark in the heritage district.",
    category: "Government & Historic Buildings",
    location: "Magallanes St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/cityhall/800/600",
    rating: 4.5,
    tags: ["civic", "government"],
    coordinates: { lat: 10.2931, lng: 123.9019 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cebu+City+Hall",
    isMustVisit: false
  },
  {
    id: 'cebu-capitol',
    name: "Cebu Provincial Capitol",
    description: "The Cebu Provincial Capitol is a neoclassical building that houses the provincial government. It is widely considered one of the most beautiful government buildings in the country.",
    significance: "Designed by Juan Arellano, it stands as a symbol of the province's political importance and architectural grandeur. Its inscription 'The Authority of the Government Emanates from the People' is iconic.",
    category: "Government & Historic Buildings",
    location: "Escario St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/capitol/800/600",
    rating: 4.8,
    tags: ["capitol", "government"],
    coordinates: { lat: 10.3175, lng: 123.8906 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cebu+Provincial+Capitol",
    isMustVisit: true
  },
  {
    id: 'cebu-patria',
    name: "Patria de Cebu",
    description: "Patria de Cebu is a historic building that served as an recreation center and dormitory for young Catholics and travelers. It is an important landmark along the Colon district.",
    significance: "It holds social and religious value as a hub for community service and youth development for several decades.",
    category: "Government & Historic Buildings",
    location: "P. Burgos St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/patria/800/600",
    rating: 4.1,
    tags: ["landmark", "social"],
    coordinates: { lat: 10.2947, lng: 123.9018 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Patria+de+Cebu",
    isMustVisit: false
  },
  {
    id: 'cebu-taoist',
    name: "Cebu Taoist Temple",
    description: "Built in 1972, this temple is located in Beverly Hills and features multi-tiered roofs, dragon motifs, and intricate carvings. It is a major place of worship for the local Chinese community.",
    significance: "It represents the religious diversity and influence of the Chinese-Filipino community in Cebu. Its elevated location offers a panoramic view of the city.",
    category: "Cultural & Religious (Non-Catholic Sites)",
    location: "Beverly Hills, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/taoist/800/600",
    rating: 4.6,
    tags: ["temple", "chinese"],
    coordinates: { lat: 10.3344, lng: 123.8883 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cebu+Taoist+Temple",
    isMustVisit: true
  },

  // --- TALISAY CITY ---
  {
    id: 'talisay-landing',
    name: "Talisay Landing Site",
    description: "The Talisay Landing Site marks the spot where American liberation forces landed on March 26, 1945, to free Cebu from Japanese occupation during World War II.",
    significance: "It is a site of major historical importance, commemorating the bravery of the Allied forces and the local guerrillas who fought for Cebu's freedom.",
    category: "Historical Landmarks & Monuments",
    location: "Larawan Beach, Talisay City",
    city: "Talisay City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/landing/800/600",
    rating: 4.4,
    tags: ["WWII", "memorial"],
    coordinates: { lat: 10.2525, lng: 123.8445 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Talisay+Landing+Site",
    isMustVisit: true
  },
  {
    id: 'talisay-church',
    name: "Sta. Teresa de Avila Parish Church",
    description: "The primary historical church of Talisay City, Sta. Teresa de Avila showcases classical Spanish colonial architecture.",
    significance: "It has served as the spiritual anchor for the people of Talisay since the early 19th century and remains a central landmark of the city.",
    category: "Churches & Religious Heritage Sites",
    location: "Talisay City",
    city: "Talisay City",
    visitingHours: "5:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/talisaychurch/800/600",
    rating: 4.5,
    tags: ["church", "religious"],
    coordinates: { lat: 10.2443, lng: 123.8491 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Sta.+Teresa+de+Avila+Parish",
    isMustVisit: false
  },
  {
    id: 'talisay-plaza',
    name: "Talisay City Plaza",
    description: "The central public gathering space for Talisay residents, located near the city hall and the parish church.",
    significance: "It is the heart of civic activity in Talisay, hosting city festivals and community gatherings.",
    category: "Plazas, Parks & Public Spaces",
    location: "Talisay City",
    city: "Talisay City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/talisayplaza/800/600",
    rating: 4.2,
    tags: ["park", "plaza"],
    coordinates: { lat: 10.2448, lng: 123.8494 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Talisay+City+Plaza",
    isMustVisit: false
  },
  {
    id: 'talisay-hall',
    name: "Talisay City Hall",
    description: "The administrative center for the local government of Talisay City. It is a modern facility that reflects the city's progress.",
    significance: "The hub for governance and public service for the growing population of Talisay.",
    category: "Government & Historic Buildings",
    location: "Talisay City",
    city: "Talisay City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/talisayhall/800/600",
    rating: 4.3,
    tags: ["civic", "government"],
    coordinates: { lat: 10.2589, lng: 123.8394 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Talisay+City+Hall",
    isMustVisit: false
  },

  // --- MANDAUE CITY ---
  {
    id: 'mandaue-st-joseph',
    name: "National Shrine of Saint Joseph",
    description: "Commonly known as the Mandaue Church, this shrine was established by the Jesuits in the early 17th century. It features life-sized statues of the Last Supper.",
    significance: "It is one of the oldest parishes in the region and serves as a major pilgrimage site during the Lenten season.",
    category: "Churches & Religious Heritage Sites",
    location: "P. Burgos St, Mandaue City",
    city: "Mandaue City",
    visitingHours: "6:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/mandauechurch/800/600",
    rating: 4.6,
    tags: ["shrine", "religious"],
    coordinates: { lat: 10.3295, lng: 123.9392 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=National+Shrine+of+St.+Joseph+Mandaue",
    isMustVisit: true
  },
  {
    id: 'mandaue-sacred-heart',
    name: "Our Lady of the Sacred Heart Church",
    description: "Also known as the Monastery of the Holy Eucharist, this church in Mandaue is a significant spiritual center for local parishioners.",
    significance: "A peaceful place of worship that serves as a landmark of faith for the Mandaue community.",
    category: "Churches & Religious Heritage Sites",
    location: "Mandaue City",
    city: "Mandaue City",
    visitingHours: "5:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/mandaueheart/800/600",
    rating: 4.4,
    tags: ["church", "religious"],
    coordinates: { lat: 10.3400, lng: 123.9200 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Our+Lady+of+the+Sacred+Heart+Mandaue",
    isMustVisit: false
  },
  {
    id: 'mandaue-suico',
    name: "Suico Ancestral House",
    description: "A well-preserved heritage home in Mandaue that showcases the traditional residential architecture of the mid-20th century.",
    significance: "Represents the historical lifestyle and domestic architecture of a prominent Mandaue family.",
    category: "Ancestral Houses & Heritage Residences",
    location: "Mandaue City",
    city: "Mandaue City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/suico/800/600",
    rating: 4.2,
    tags: ["ancestral", "residence"],
    coordinates: { lat: 10.3300, lng: 123.9400 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Suico+Ancestral+House",
    isMustVisit: false
  },
  {
    id: 'mandaue-cabrera',
    name: "Luis Cabrera Ancestral House and Museum",
    description: "A private heritage home that has been converted into a museum to preserve family heirlooms and historical records.",
    significance: "Offers a glimpse into the local history and cultural traditions of early 20th-century Mandaue.",
    category: "Ancestral Houses & Heritage Residences",
    location: "Mandaue City",
    city: "Mandaue City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/cabrera/800/600",
    rating: 4.3,
    tags: ["museum", "ancestral"],
    coordinates: { lat: 10.3301, lng: 123.9401 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Luis+Cabrera+Ancestral+House",
    isMustVisit: false
  },
  {
    id: 'mandaue-library',
    name: "Mandaue City Public Library",
    description: "The city's primary repository for knowledge, famous for its historic spiral staircase and collection of local history.",
    significance: "A vital resource for students and researchers interested in Mandaue's civic and cultural development.",
    category: "Museums & Cultural Institutions",
    location: "P. Burgos St, Mandaue City",
    city: "Mandaue City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/library/800/600",
    rating: 4.4,
    tags: ["library", "education"],
    coordinates: { lat: 10.3323, lng: 123.9378 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mandaue+City+Public+Library",
    isMustVisit: false
  },
  {
    id: 'mandaue-watchtower',
    name: "Bantayan sa Hari",
    description: "The ruins of a Spanish-era watchtower that once guarded the coast against pirate raids. It is one of the few surviving colonial defensive structures in Mandaue.",
    significance: "A strategic remnant of the city's early defensive network, symbolizing the community's protection and vigilance.",
    category: "Historical Landmarks & Monuments",
    location: "Looc, Mandaue City",
    city: "Mandaue City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/mandauefort/800/600",
    rating: 4.0,
    tags: ["watchtower", "military"],
    coordinates: { lat: 10.3150, lng: 123.9495 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Bantayan+sa+Hari+Mandaue",
    isMustVisit: false
  },
  {
    id: 'mandaue-presidencia',
    name: "Mandaue Presidencia",
    description: "The historic city hall building of Mandaue, reflecting the city's identity during the Commonwealth era. It is a landmark of civic architecture.",
    significance: "A prominent civic landmark and the symbol of Mandaue's administrative history and governance.",
    category: "Historical Landmarks & Monuments",
    location: "Mandaue City",
    city: "Mandaue City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/presidencia/800/600",
    rating: 4.5,
    tags: ["civic", "landmark"],
    coordinates: { lat: 10.3304, lng: 123.9388 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mandaue+Presidencia",
    isMustVisit: true
  },
  {
    id: 'mandaue-bridge',
    name: "Mandaue-Mactan Bridge",
    description: "The first bridge connecting mainland Cebu to Mactan Island, a massive engineering feat for its time.",
    significance: "An essential infrastructure landmark that enabled the rapid industrialization and growth of Metro Cebu.",
    category: "Historical Landmarks & Monuments",
    location: "Mandaue City",
    city: "Mandaue City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/bridge/800/600",
    rating: 4.6,
    tags: ["bridge", "landmark"],
    coordinates: { lat: 10.3255, lng: 123.9572 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mandaue-Mactan+Bridge",
    isMustVisit: false
  },
  {
    id: 'mandaue-plaza',
    name: "Mandaue City Heritage Plaza",
    description: "A beautifully designed public space in the city center, serving as the heart of Mandaue's social and community life.",
    significance: "A central gathering point and the site for major city festivities and cultural events.",
    category: "Plazas, Parks & Public Spaces",
    location: "Mandaue City",
    city: "Mandaue City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/mandaueplaza/800/600",
    rating: 4.3,
    tags: ["plaza", "park"],
    coordinates: { lat: 10.3302, lng: 123.9389 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mandaue+City+Heritage+Plaza",
    isMustVisit: false
  },
  {
    id: 'mandaue-leg-building',
    name: "Mandaue Legislative Building",
    description: "The modern administrative center for Mandaue's local legislative body and city council functions.",
    significance: "A symbol of modern governance and democratic legislative processes in the city of Mandaue.",
    category: "Government & Historic Buildings",
    location: "Mandaue City",
    city: "Mandaue City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/legislative/800/600",
    rating: 4.4,
    tags: ["civic", "government"],
    coordinates: { lat: 10.3308, lng: 123.9395 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mandaue+Legislative+Building",
    isMustVisit: false
  },

  // --- LAPU-LAPU CITY ---
  {
    id: 'llc-regla',
    name: "Virgen de la Regla National Shrine",
    description: "The Virgen de la Regla National Shrine is a major pilgrimage site dedicated to Our Lady of the Rule, the patroness of Opon (now Lapu-Lapu City).",
    significance: "The image of the Virgin has been venerated by Cebuanos since the 18th century. The shrine is a testament to the deep-seated religious devotion of the people of Opon.",
    category: "Churches & Religious Heritage Sites",
    location: "B.M. Dimataga St, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "6:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/regla/800/600",
    rating: 4.7,
    tags: ["shrine", "religious", "opon"],
    coordinates: { lat: 10.3103, lng: 123.9494 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Virgen+de+la+Regla+Shrine",
    isMustVisit: true
  },
  {
    id: 'llc-happy-world',
    name: "Cebu Happy World Museum",
    description: "Cebu Happy World Museum is a unique art museum featuring 3D paintings and interactive exhibits that play with optical illusions.",
    significance: "It is a modern cultural institution that offers a creative and educational experience for families and art enthusiasts in Lapu-Lapu City.",
    category: "Museums & Cultural Institutions",
    location: "Lot 2, Brgy. Marigondon, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "9:00 AM - 6:00 PM",
    imageUrl: "https://picsum.photos/seed/happyworld/800/600",
    rating: 4.2,
    tags: ["museum", "3d art"],
    coordinates: { lat: 10.2750, lng: 123.9550 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cebu+Happy+World+Museum",
    isMustVisit: false
  },
  {
    id: 'llc-mactan-shrine',
    name: "Mactan Shrine (Liberty Shrine)",
    description: "Mactan Shrine is the site of the historic Battle of Mactan in 1521, where the native chieftain Lapu-Lapu defeated the Portuguese explorer Ferdinand Magellan.",
    significance: "The shrine features the Lapu-Lapu Monument, a 20-meter bronze statue of the hero, and the Magellan's Marker. It commemorates the first Filipino resistance against foreign colonization.",
    category: "Historical Landmarks & Monuments",
    location: "Punta Engaño Rd, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/mactan/800/600",
    rating: 4.8,
    tags: ["hero", "history", "battle"],
    coordinates: { lat: 10.3347, lng: 124.0150 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mactan+Shrine",
    isMustVisit: true
  },
  {
    id: 'llc-plaza-rizal',
    name: "Plaza Rizal (Rizal Park)",
    description: "Plaza Rizal is the central public park of Lapu-Lapu City, located in front of the city's parish church and old municipal hall.",
    significance: "It serves as the civic heart of the city, honoring the national hero Dr. Jose Rizal and providing a space for community interaction.",
    category: "Plazas, Parks & Public Spaces",
    location: "Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/llcplaza/800/600",
    rating: 4.1,
    tags: ["park", "plaza"],
    coordinates: { lat: 10.3100, lng: 123.9490 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Plaza+Rizal+Lapu-Lapu",
    isMustVisit: false
  },
  {
    id: 'llc-millennium-park',
    name: "Millennium Park",
    description: "Millennium Park is a waterfront public space that offers scenic views of the Mactan Channel and the Mandaue-Mactan bridges.",
    significance: "It is a popular spot for relaxation and watching the sunset, reflecting the maritime identity of Opon.",
    category: "Plazas, Parks & Public Spaces",
    location: "Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/millennium/800/600",
    rating: 4.0,
    tags: ["park", "waterfront"],
    coordinates: { lat: 10.3200, lng: 123.9550 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Millennium+Park+Lapu-Lapu",
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
      site.significance.toLowerCase().includes(query.toLowerCase()) ||
      site.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    ) : true;
    
    // Strict Filtering
    const matchesCity = city && city !== 'All' ? site.city === city : true;
    const matchesCategory = category && category !== 'All' ? site.category === category : true;
    
    return matchesQuery && matchesCity && matchesCategory;
  });
}
