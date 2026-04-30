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
  // Churches
  {
    id: 'cebu-1',
    name: "Basilica Minore del Santo Niño de Cebu",
    description: "The oldest Roman Catholic church in the Philippines, established in 1565. It serves as the heart of Cebuano faith and is home to the original Santo Niño statue.",
    significance: "Birthplace of Christianity in the Philippines; it is the center of the annual Sinulog Festival, the country's grandest cultural celebration.",
    category: "Churches & Religious Heritage Sites",
    location: "Osmeña Blvd, Cebu City",
    city: "Cebu City",
    visitingHours: "6:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/basilica/800/600",
    galleryImages: [
      "https://picsum.photos/seed/basilica-2/800/600",
      "https://picsum.photos/seed/basilica-3/800/600",
      "https://picsum.photos/seed/basilica-4/800/600"
    ],
    rating: 4.9,
    tags: ["oldest church", "religious", "sinulog"],
    coordinates: { lat: 10.2942, lng: 123.9021 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Basilica+Minore+del+Santo+Nino",
    isMustVisit: true
  },
  {
    id: 'cebu-2',
    name: "Metropolitan Cebu Cathedral",
    description: "The seat of the Archdiocese of Cebu, showcasing unique 'Earthquake Baroque' architectural features with thick walls to withstand natural disasters.",
    significance: "Ecclesiastical center of the Visayas since the early Spanish period; its construction was interrupted multiple times by wars and calamities.",
    category: "Churches & Religious Heritage Sites",
    location: "Mabini St, Cebu City",
    city: "Cebu City",
    visitingHours: "5:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/cathedral/800/600",
    galleryImages: ["https://picsum.photos/seed/cathedral-2/800/600"],
    rating: 4.6,
    tags: ["cathedral", "baroque"],
    coordinates: { lat: 10.2954, lng: 123.9028 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cebu+Metropolitan+Cathedral",
    isMustVisit: false
  },
  {
    id: 'cebu-3',
    name: "Magellan’s Cross",
    description: "A Christian cross planted by Portuguese and Spanish explorers as ordered by Ferdinand Magellan in 1521, housed in an octagonal stone kiosk.",
    significance: "Symbolizes the arrival of Christianity in the Philippines; the ceiling of the kiosk features a painting depicting the first baptism in Cebu.",
    category: "Churches & Religious Heritage Sites",
    location: "P. Burgos St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 6:00 PM",
    imageUrl: "https://picsum.photos/seed/magellan/800/600",
    galleryImages: ["https://picsum.photos/seed/magellan-2/800/600"],
    rating: 4.8,
    tags: ["cross", "magellan"],
    coordinates: { lat: 10.2936, lng: 123.9019 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Magellan%27s+Cross",
    isMustVisit: true
  },
  {
    id: 'cebu-4',
    name: "Archdiocesan Museum of Cebu",
    description: "A specialized church museum housing significant religious artifacts, vestments, and historical ecclesiastical documents of the region.",
    significance: "Preserves the spiritual and organizational history of the Cebuano church; it is located in the former residence of the Cathedral's parish priests.",
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
  // Ancestral Houses
  {
    id: 'cebu-5',
    name: "Casa Gorordo Museum",
    description: "A 19th-century residential home showcasing the refined lifestyle of the Filipino-Spanish elite in Cebu with traditional woodwork and stone foundations.",
    significance: "Former residence of Juan Gorordo, the first Filipino Bishop of Cebu; it serves as a window into the mestizo culture of the Parian district.",
    category: "Ancestral Houses & Heritage Residences",
    location: "Lopez Jaena St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/gorordo/800/600",
    galleryImages: ["https://picsum.photos/seed/gorordo-2/800/600"],
    rating: 4.7,
    tags: ["mansion", "lifestyle"],
    coordinates: { lat: 10.2995, lng: 123.9042 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Casa+Gorordo+Museum",
    isMustVisit: true
  },
  {
    id: 'cebu-6',
    name: "Yap-Sandiego Ancestral House",
    description: "One of the oldest residential houses in the Philippines, built in the late 17th century by Chinese merchants using coral stone and molave wood.",
    significance: "Represents the prosperity of the Chinese-Filipino merchant class in the Parian district during the early colonial era.",
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
    id: 'cebu-7',
    name: "1730 Jesuit House",
    description: "A century-old house hidden within a modern warehouse, revealing layers of Jesuit history and architecture in the city's historic core.",
    significance: "Considered the oldest dated residence in the Philippines (1730); it survived the Jesuit expulsion and multiple ownership changes.",
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
  // Museums
  {
    id: 'cebu-8',
    name: "National Museum of the Philippines – Cebu",
    description: "Located in the historic Aduana (Customs) Building, it houses significant collections of Visayan art, archaeology, and natural history.",
    significance: "The regional hub for cultural preservation in Central Visayas, occupying one of the city's most prominent waterfront landmarks.",
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
    id: 'cebu-9',
    name: "Jose R. Gullas Halad Museum",
    description: "A musically-themed museum dedicated to Cebuano composers and the province's rich musical history from folk to classical.",
    significance: "Preserves the musical heritage and traditions of the Cebuano people, showcasing rare musical instruments and manuscripts.",
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
    id: 'cebu-10',
    name: "University of San Carlos Museum",
    description: "Housed within one of Asia's oldest universities, this museum features vast archaeological and ethnographical finds from the Visayas and Mindanao.",
    significance: "One of the premier academic museums in the Philippines, essential for researchers studying pre-colonial Visayan life.",
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
  // Landmarks
  {
    id: 'cebu-11',
    name: "Fort San Pedro",
    description: "A triangular bastion fort built by the Spanish under the command of Miguel López de Legazpi to protect the early settlement.",
    significance: "The smallest and oldest fort in the Philippines; it has served as an army garrison, a prison, and a zoo over the centuries.",
    category: "Historical Landmarks & Monuments",
    location: "A. Pigafetta Street, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 7:00 PM",
    imageUrl: "https://picsum.photos/seed/fort/800/600",
    galleryImages: ["https://picsum.photos/seed/fort-2/800/600"],
    rating: 4.6,
    tags: ["military", "spanish"],
    coordinates: { lat: 10.2924, lng: 123.9056 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Fort+San+Pedro",
    isMustVisit: true
  },
  {
    id: 'cebu-12',
    name: "Heritage of Cebu Monument",
    description: "A massive tableau of sculptures depicting significant historical events and landmarks of Cebu, from pre-colonial times to modern day.",
    significance: "An artistic summary of Cebu's history; the monument is located on the site of the former San Juan Bautista Church.",
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
    id: 'cebu-13',
    name: "Colon Street, Obelisk, and Historical Marker",
    description: "The oldest street in the Philippines, functioning as the historic center of Cebuano commerce and trade.",
    significance: "Named after Cristóbal Colón (Christopher Columbus); it has been the economic lifeblood of the city for over 400 years.",
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
  // Plazas
  {
    id: 'cebu-14',
    name: "Plaza Independencia",
    description: "A sprawling public square located near Fort San Pedro, often used for community gatherings, protests, and casual recreation.",
    significance: "A symbolic site of freedom; it marks the transition from Spanish colonial rule to American and Japanese occupation.",
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
    id: 'cebu-15',
    name: "Plaza Sugbo",
    description: "The public space between Magellan's Cross and the Cebu City Hall, marking the city's civic heart.",
    significance: "The primary site for the city's major religious and civic ceremonies, including the Sinulog grand parade kick-off.",
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
    id: 'cebu-16',
    name: "Plaza Hamabar",
    description: "A historical plaza named after Rajah Humabar, the pre-colonial ruler of Cebu who was the first chieftain to be baptized.",
    significance: "Commemorates the pre-colonial leadership and the pivotal transition to Christianity in the 16th century.",
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
    id: 'cebu-17',
    name: "Fuente Osmeña Circle",
    description: "An iconic traffic circle and public park featuring a landmark fountain in the center of the city's modern midtown.",
    significance: "Commemorates the 1912 inauguration of Cebu's modern water system and remains the hub for the Sinulog Festival.",
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
  // Government
  {
    id: 'cebu-18',
    name: "Cebu City Hall",
    description: "The administrative seat of the Cebu City government, located at the heart of the historic district.",
    significance: "The modern administrative center for the oldest city in the Philippines, overlooking the historic Plaza Sugbo.",
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
    id: 'cebu-19',
    name: "Cebu Provincial Capitol",
    description: "A neoclassical building that serves as the administrative center for the Province of Cebu.",
    significance: "Regarded as one of the most beautiful capitol buildings in the country; its facade is a prominent Cebu City landmark.",
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
    id: 'cebu-20',
    name: "Patria de Cebu",
    description: "A historic building that has served various social and religious purposes throughout the decades, particularly for Catholic youth.",
    significance: "A landmark of social and community service; it is currently undergoing careful adaptive reuse to preserve its heritage.",
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
  // Non-Catholic
  {
    id: 'cebu-21',
    name: "Cebu Taoist Temple",
    description: "A prominent temple built by the city's Chinese community, featuring intricate multi-tiered roofs and dragon motifs.",
    significance: "Symbolizes the religious diversity and long-standing influence of the Chinese-Cebuano community in the region.",
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
    id: 'talisay-1',
    name: "Talisay Landing Site",
    description: "A memorial site marking the spot where American liberation forces landed on March 26, 1945.",
    significance: "Commemorates the liberation of Cebu from Japanese occupation during World War II.",
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
    id: 'talisay-2',
    name: "Sta. Teresa de Avila Parish Church",
    description: "The primary historical and religious center of Talisay City, showcasing Spanish colonial architectural influence.",
    significance: "A heritage church that has stood as the spiritual anchor of the Talisay community for generations.",
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
    id: 'talisay-3',
    name: "Talisay City Plaza",
    description: "The central public park and gathering space for the residents of Talisay City, located near the city hall.",
    significance: "The civic and social heart of Talisay, hosting various local festivities and historical commemorations.",
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
    id: 'talisay-4',
    name: "Talisay City Hall",
    description: "The modern administrative center for the Talisay City local government, reflecting the city's growth.",
    significance: "The seat of governance for the city of Talisay, essential for the city's administrative functions.",
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
    id: 'mandaue-1',
    name: "National Shrine of Saint Joseph",
    description: "A centuries-old church established by the Jesuits in the early 17th century, serving as the spiritual center of Mandaue.",
    significance: "One of the oldest parishes in Cebu; it houses life-sized statues of the Last Supper, a rare ecclesiastical feature.",
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
    id: 'mandaue-2',
    name: "Our Lady of the Sacred Heart Church",
    description: "A significant historical parish in Mandaue City that has served as a center for local religious life for decades.",
    significance: "A vital spiritual landmark for Mandauehanons, known for its community-centered religious activities.",
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
    id: 'mandaue-3',
    name: "Suico Ancestral House",
    description: "A well-preserved heritage residence showcasing Mandaue's traditional residential architectural style from the mid-20th century.",
    significance: "Represents the historical lifestyle and domestic architecture of prominent Mandaue families.",
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
    id: 'mandaue-4',
    name: "Luis Cabrera Ancestral House and Museum",
    description: "A heritage home turned museum that preserves the family heirlooms and local history of the Mandaue community.",
    significance: "A window into the domestic and cultural history of early Mandaue, essential for local heritage students.",
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
    id: 'mandaue-5',
    name: "Quijano Museum",
    description: "A private museum in Mandaue showcasing historical artifacts, family records, and local cultural items.",
    significance: "A key private institution dedicated to documenting the history of one of Mandaue's historic clans.",
    category: "Museums & Cultural Institutions",
    location: "Mandaue City",
    city: "Mandaue City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/quijano/800/600",
    rating: 4.1,
    tags: ["museum", "private"],
    coordinates: { lat: 10.3302, lng: 123.9402 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Quijano+Museum+Mandaue",
    isMustVisit: false
  },
  {
    id: 'mandaue-6',
    name: "Mandaue City Public Library",
    description: "The city's primary repository for knowledge, featuring local history collections and academic resources.",
    significance: "A vital hub for education and research into Mandaue's local history and development.",
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
    id: 'mandaue-7',
    name: "Bantayan sa Hari",
    description: "The historic ruins of a Spanish-era watchtower that once guarded the coast against pirate raids.",
    significance: "A strategic remnant of the city's early defensive network; it was used to warn the local population of incoming threats.",
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
    id: 'mandaue-8',
    name: "Mandaue Presidencia",
    description: "The historic city hall building of Mandaue, reflecting the city's administrative identity during the Commonwealth era.",
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
    id: 'mandaue-9',
    name: "Mandaue-Mactan Bridge",
    description: "The first bridge connecting the mainland (Mandaue) to Mactan Island, a landmark of engineering for the region.",
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
    id: 'mandaue-10',
    name: "Mandaue City Heritage Plaza",
    description: "A well-designed public space in the city center, serving as the heart of Mandaue's social and community life.",
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
    id: 'mandaue-11',
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
