export interface HeritageSite {
  id: string;
  name: string;
  description: string;
  significance: string;
  category: 'Religious' | 'Spanish Colonial' | 'National Monument' | 'Arts & Culture' | 'Modern History' | 'Ancestral House' | 'Museum' | 'Public Space';
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
}

export const HERITAGE_SITES: HeritageSite[] = [
  // --- CEBU CITY ---
  {
    id: '1',
    name: "Magellan's Cross",
    description: "A Christian cross planted by Portuguese and Spanish explorers as ordered by Ferdinand Magellan in 1521.",
    significance: "Symbolizes the birth of Christianity in the Philippines and is one of the most iconic landmarks in the country.",
    category: "Religious",
    location: "P. Burgos St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 6:00 PM",
    imageUrl: "https://picsum.photos/seed/magellan/800/600",
    galleryImages: ["https://picsum.photos/seed/magellan_1/800/600", "https://picsum.photos/seed/magellan_2/800/600"],
    rating: 4.8,
    tags: ["history", "christianity", "landmark"],
    coordinates: { lat: 10.2936, lng: 123.9019 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Magellan%27s+Cross+Cebu",
    isMustVisit: true
  },
  {
    id: '2',
    name: "Basilica Minore del Santo Niño de Cebu",
    description: "The oldest Roman Catholic church in the Philippines, established in 1565.",
    significance: "Home to the original statuette of the Santo Niño, the oldest religious relic in the Philippines.",
    category: "Religious",
    location: "Osmeña Blvd, Cebu City",
    city: "Cebu City",
    visitingHours: "6:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/basilica/800/600",
    galleryImages: ["https://picsum.photos/seed/basilica_1/800/600"],
    rating: 4.9,
    tags: ["church", "relic", "pilgrimage"],
    coordinates: { lat: 10.2942, lng: 123.9021 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Basilica+Minore+del+Santo+Nino",
    isMustVisit: true
  },
  {
    id: '3',
    name: "Fort San Pedro",
    description: "A military defense structure built by the Spanish under the command of Miguel López de Legazpi.",
    significance: "The oldest and smallest triangular bastion fort in the Philippines.",
    category: "Spanish Colonial",
    location: "A. Pigafetta Street, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 7:00 PM",
    imageUrl: "https://picsum.photos/seed/fort/800/600",
    galleryImages: ["https://picsum.photos/seed/fort_1/800/600"],
    rating: 4.6,
    tags: ["fort", "military", "spanish"],
    coordinates: { lat: 10.2924, lng: 123.9056 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Fort+San+Pedro+Cebu",
    isMustVisit: true
  },
  {
    id: '4',
    name: "Yap-Sandiego Ancestral House",
    description: "One of the oldest residential houses in the Philippines, built in the late 17th century.",
    significance: "A premier example of the 'Bahay na Bato' architecture in the historic Parian district.",
    category: "Ancestral House",
    location: "Mabini St, Parian, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 6:00 PM",
    imageUrl: "https://picsum.photos/seed/yap/800/600",
    galleryImages: ["https://picsum.photos/seed/yap_1/800/600"],
    rating: 4.7,
    tags: ["parian", "ancestral", "lifestyle"],
    coordinates: { lat: 10.2987, lng: 123.9034 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Yap-Sandiego+Ancestral+House",
    isMustVisit: true
  },
  {
    id: '5',
    name: "Casa Gorordo Museum",
    description: "Former residence of the first Filipino Bishop of Cebu, now a museum of 19th-century life.",
    significance: "National Historical Landmark showcasing Cebuano-Spanish lifestyle and artifacts.",
    category: "Museum",
    location: "Lopez Jaena St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/gorordo/800/600",
    galleryImages: ["https://picsum.photos/seed/gorordo_1/800/600"],
    rating: 4.7,
    tags: ["museum", "bishop", "history"],
    coordinates: { lat: 10.2995, lng: 123.9042 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Casa+Gorordo+Museum",
    isMustVisit: true
  },
  {
    id: '6',
    name: "Heritage of Cebu Monument",
    description: "A massive tableau of sculptures depicting significant events in Cebu's history.",
    significance: "Located on the original site of the San Juan Bautista Church in Parian.",
    category: "Arts & Culture",
    location: "Sikatuna St, Parian, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/parian_monument/800/600",
    galleryImages: ["https://picsum.photos/seed/parian_monument_1/800/600"],
    rating: 4.5,
    tags: ["monument", "sculpture", "history"],
    coordinates: { lat: 10.2985, lng: 123.9038 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Heritage+of+Cebu+Monument",
    isMustVisit: true
  },
  {
    id: '7',
    name: "Museo Sugbo",
    description: "The Cebu Provincial Museum housed in the historic 'Carcel de Cebu' (Provincial Jail).",
    significance: "A coral stone structure built in 1871, now housing extensive regional historical collections.",
    category: "Museum",
    location: "M.J. Cuenco Ave, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:30 PM",
    imageUrl: "https://picsum.photos/seed/sugbo/800/600",
    galleryImages: ["https://picsum.photos/seed/sugbo_1/800/600"],
    rating: 4.6,
    tags: ["museum", "jail", "provincial"],
    coordinates: { lat: 10.3021, lng: 123.9068 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Museo+Sugbo",
    isMustVisit: true
  },
  {
    id: '8',
    name: "Cebu Metropolitan Cathedral",
    description: "The seat of the Archdiocese of Cebu, featuring unique baroque architecture.",
    significance: "One of the first churches in the Philippines, established in 1565.",
    category: "Religious",
    location: "Mabini St, Cebu City",
    city: "Cebu City",
    visitingHours: "5:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/cathedral/800/600",
    galleryImages: ["https://picsum.photos/seed/cathedral_1/800/600"],
    rating: 4.6,
    tags: ["cathedral", "church", "archdiocese"],
    coordinates: { lat: 10.2954, lng: 123.9028 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cebu+Metropolitan+Cathedral",
    isMustVisit: false
  },
  {
    id: '9',
    name: "Jesuit House of 1730 (Museo de Parian)",
    description: "An 18th-century stone house that is one of the oldest dated residences in the country.",
    significance: "Hidden inside a modern warehouse, it provides a rare glimpse into Jesuit colonial life.",
    category: "Ancestral House",
    location: "Zulueta St, Parian, Cebu City",
    city: "Cebu City",
    visitingHours: "8:30 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/jesuit/800/600",
    galleryImages: ["https://picsum.photos/seed/jesuit_1/800/600"],
    rating: 4.7,
    tags: ["jesuit", "hidden", "parian"],
    coordinates: { lat: 10.2982, lng: 123.9031 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Jesuit+House+of+1730",
    isMustVisit: true
  },
  {
    id: '10',
    name: "Plaza Independencia",
    description: "A historic park that served as a military training ground and public square during the Spanish era.",
    significance: "A premier public space connecting Fort San Pedro to the city center.",
    category: "Public Space",
    location: "M.J. Cuenco Ave, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/plaza/800/600",
    galleryImages: ["https://picsum.photos/seed/plaza_1/800/600"],
    rating: 4.5,
    tags: ["park", "plaza", "colonial"],
    coordinates: { lat: 10.2928, lng: 123.9052 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Plaza+Independencia+Cebu",
    isMustVisit: false
  },
  {
    id: '11',
    name: "Cebu Provincial Capitol",
    description: "An iconic Neo-Classical building that serves as the seat of the provincial government.",
    significance: "Designed by Juan Arellano and completed in 1938, a National Historical Landmark.",
    category: "Modern History",
    location: "Escario St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/capitol/800/600",
    galleryImages: ["https://picsum.photos/seed/capitol_1/800/600"],
    rating: 4.7,
    tags: ["government", "architecture", "landmark"],
    coordinates: { lat: 10.3168, lng: 123.8906 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cebu+Provincial+Capitol",
    isMustVisit: true
  },
  {
    id: '12',
    name: "Colon Street",
    description: "The oldest national road in the Philippines, established during the Spanish period.",
    significance: "Named after Christopher Columbus (Cristobal Colon), it remains the commercial heart of downtown Cebu.",
    category: "Public Space",
    location: "Colon St, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/colon/800/600",
    galleryImages: ["https://picsum.photos/seed/colon_1/800/600"],
    rating: 4.2,
    tags: ["oldest-street", "downtown", "history"],
    coordinates: { lat: 10.2965, lng: 123.9015 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Colon+Street+Cebu",
    isMustVisit: false
  },
  {
    id: '13',
    name: "Jose R. Gullas Halad Museum",
    description: "A musical heritage museum dedicated to Cebuano composers and artists.",
    significance: "Preserves the unique musical culture and identity of the Visayan region.",
    category: "Museum",
    location: "V. Gullas St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/halad/800/600",
    galleryImages: ["https://picsum.photos/seed/halad_1/800/600"],
    rating: 4.6,
    tags: ["music", "culture", "museum"],
    coordinates: { lat: 10.2958, lng: 123.9008 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Halad+Museum+Cebu",
    isMustVisit: false
  },
  {
    id: '14',
    name: "San Nicolas de Tolentino Parish",
    description: "Known as the first site where the Spanish landed and the original settlement of Cebu.",
    significance: "The cradle of Cebuano resistance and home to unique Lenten traditions.",
    category: "Religious",
    location: "Tupas St, San Nicolas, Cebu City",
    city: "Cebu City",
    visitingHours: "6:00 AM - 7:00 PM",
    imageUrl: "https://picsum.photos/seed/san_nicolas/800/600",
    galleryImages: ["https://picsum.photos/seed/san_nicolas_1/800/600"],
    rating: 4.5,
    tags: ["parish", "revolution", "history"],
    coordinates: { lat: 10.2915, lng: 123.8955 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=San+Nicolas+de+Tolentino+Parish+Cebu",
    isMustVisit: false
  },
  {
    id: '15',
    name: "Archdiocesan Museum of Cebu",
    description: "A museum showcasing ecclesiastical treasures and church artifacts.",
    significance: "Housed in the former rectory of the Cebu Metropolitan Cathedral.",
    category: "Museum",
    location: "Mabini St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/arch_museum/800/600",
    galleryImages: ["https://picsum.photos/seed/arch_museum_1/800/600"],
    rating: 4.4,
    tags: ["religious-art", "cathedral", "museum"],
    coordinates: { lat: 10.2951, lng: 123.9025 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Archdiocesan+Museum+of+Cebu",
    isMustVisit: false
  },

  // --- LAPU-LAPU CITY ---
  {
    id: '16',
    name: "Mactan Shrine (Lapu-Lapu Monument)",
    description: "A bronze statue of Datu Lapu-Lapu on the site of the Battle of Mactan.",
    significance: "Honors the first Filipino hero who defeated Magellan in 1521.",
    category: "National Monument",
    location: "Punta Engaño, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/mactan_shrine/800/600",
    galleryImages: ["https://picsum.photos/seed/mactan_shrine_1/800/600"],
    rating: 4.8,
    tags: ["hero", "battle", "mactan"],
    coordinates: { lat: 10.3115, lng: 123.9585 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mactan+Shrine+Lapu-Lapu",
    isMustVisit: true
  },
  {
    id: '17',
    name: "Magellan Shrine",
    description: "A stone obelisk built by the Spanish in 1866 to honor Ferdinand Magellan.",
    significance: "Located within the Mactan Shrine complex, it marks the spot where Magellan fell.",
    category: "Spanish Colonial",
    location: "Punta Engaño, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/magellan_shrine/800/600",
    galleryImages: ["https://picsum.photos/seed/magellan_shrine_1/800/600"],
    rating: 4.6,
    tags: ["monument", "explorer", "history"],
    coordinates: { lat: 10.3112, lng: 123.9582 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Magellan+Shrine+Mactan",
    isMustVisit: true
  },
  {
    id: '18',
    name: "Virgen de la Regla National Shrine",
    description: "A prominent church dedicated to Our Lady of the Rule, the patroness of Lapu-Lapu.",
    significance: "A center of deep religious devotion for the people of Opon (Lapu-Lapu).",
    category: "Religious",
    location: "B.M. Dimataga St, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "5:00 AM - 9:00 PM",
    imageUrl: "https://picsum.photos/seed/regla/800/600",
    galleryImages: ["https://picsum.photos/seed/regla_1/800/600"],
    rating: 4.7,
    tags: ["shrine", "patroness", "religious"],
    coordinates: { lat: 10.3155, lng: 123.9442 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Virgen+de+la+Regla+Shrine",
    isMustVisit: true
  },
  {
    id: '19',
    name: "Marcelo Fernan Bridge",
    description: "The second bridge connecting Mactan and Mandaue, an iconic cable-stayed bridge.",
    significance: "A symbol of the modern connectivity and infrastructure of Metro Cebu.",
    category: "Modern History",
    location: "Mandaue-Lapu Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/fernan/800/600",
    galleryImages: ["https://picsum.photos/seed/fernan_1/800/600"],
    rating: 4.5,
    tags: ["bridge", "skyline", "modern"],
    coordinates: { lat: 10.3255, lng: 123.9485 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Marcelo+Fernan+Bridge",
    isMustVisit: false
  },

  // --- MANDAUE CITY ---
  {
    id: '20',
    name: "National Shrine of Saint Joseph",
    description: "The primary church of Mandaue City, with history dating to the 16th century.",
    significance: "Houses life-sized figures of the Last Supper used during Holy Week.",
    category: "Religious",
    location: "P. Burgos St, Mandaue City",
    city: "Mandaue City",
    visitingHours: "6:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/st_joseph/800/600",
    galleryImages: ["https://picsum.photos/seed/st_joseph_1/800/600"],
    rating: 4.5,
    tags: ["shrine", "mandaue", "church"],
    coordinates: { lat: 10.3295, lng: 123.9392 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=St.+Joseph+Shrine+Mandaue",
    isMustVisit: true
  },
  {
    id: '21',
    name: "Mandaue Heritage Plaza",
    description: "The civic heart of Mandaue City, reflecting its history and culture.",
    significance: "Features monuments and spaces dedicated to the city's identity.",
    category: "Public Space",
    location: "Centro, Mandaue City",
    city: "Mandaue City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/mandaue_plaza/800/600",
    galleryImages: ["https://picsum.photos/seed/mandaue_plaza_1/800/600"],
    rating: 4.4,
    tags: ["plaza", "civic", "mandaue"],
    coordinates: { lat: 10.3302, lng: 123.9388 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mandaue+Heritage+Plaza",
    isMustVisit: false
  },
  {
    id: '22',
    name: "Bantayan sa Hari (Mandaue)",
    description: "Ruins of an 18th-century watchtower used for coastal defense.",
    significance: "A remnant of the Spanish defense network against invaders in the Mactan channel.",
    category: "Spanish Colonial",
    location: "Brgy. Looc, Mandaue City",
    city: "Mandaue City",
    visitingHours: "Exterior Viewing",
    imageUrl: "https://picsum.photos/seed/mandaue_watchtower/800/600",
    galleryImages: ["https://picsum.photos/seed/mandaue_watchtower_1/800/600"],
    rating: 4.0,
    tags: ["watchtower", "ruins", "coastal"],
    coordinates: { lat: 10.3205, lng: 123.9425 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Bantayan+sa+Hari+Mandaue",
    isMustVisit: false
  },

  // --- TALISAY CITY ---
  {
    id: '23',
    name: "Talisay Liberation Park",
    description: "Commemorates the landing of American forces on March 26, 1945.",
    significance: "A National Historical Landmark marking the end of WWII occupation in Cebu.",
    category: "National Monument",
    location: "Larawan Beach, Talisay City",
    city: "Talisay City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/talisay_liberation/800/600",
    galleryImages: ["https://picsum.photos/seed/talisay_liberation_1/800/600"],
    rating: 4.4,
    tags: ["ww2", "liberation", "history"],
    coordinates: { lat: 10.2525, lng: 123.8445 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Talisay+Liberation+Park",
    isMustVisit: true
  },
  {
    id: '24',
    name: "Archdiocesan Shrine of Sta. Teresa de Avila",
    description: "A grand church with Greco-Roman architecture built during the Spanish era.",
    significance: "One of the architectural gems of southern Metro Cebu.",
    category: "Religious",
    location: "Poblacion, Talisay City",
    city: "Talisay City",
    visitingHours: "5:30 AM - 8:30 PM",
    imageUrl: "https://picsum.photos/seed/avila/800/600",
    galleryImages: ["https://picsum.photos/seed/avila_1/800/600"],
    rating: 4.7,
    tags: ["shrine", "architecture", "talisay"],
    coordinates: { lat: 10.2515, lng: 123.8438 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Sta.+Teresa+de+Avila+Shrine+Talisay",
    isMustVisit: true
  },

  // --- ADDITIONAL VERIFIED SITES ---
  {
    id: '25',
    name: "University of San Carlos Museum",
    description: "One of the oldest university museums in the Philippines.",
    significance: "Focuses on anthropology and natural history of the Visayan region.",
    category: "Museum",
    location: "P. del Rosario St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/usc_museum/800/600",
    galleryImages: ["https://picsum.photos/seed/usc_museum_1/800/600"],
    rating: 4.6,
    tags: ["museum", "academic", "anthropology"],
    coordinates: { lat: 10.3005, lng: 123.8982 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=USC+Museum+Cebu",
    isMustVisit: false
  },
  {
    id: '26',
    name: "Carbon Market",
    description: "Cebu's oldest and largest public market, active for over a century.",
    significance: "Named after the coal depot for the old railway, it is a monument to Cebuano commerce.",
    category: "Public Space",
    location: "MC Briones St, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/carbon_market/800/600",
    galleryImages: ["https://picsum.photos/seed/carbon_market_1/800/600"],
    rating: 4.3,
    tags: ["market", "commerce", "living-history"],
    coordinates: { lat: 10.2925, lng: 123.9005 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Carbon+Market+Cebu",
    isMustVisit: false
  },
  {
    id: '27',
    name: "Cebu Taoist Temple",
    description: "A Taoist temple built by Cebu's substantial Chinese community in 1972.",
    significance: "Reflects the cultural diversity and Chinese heritage of Metro Cebu.",
    category: "Arts & Culture",
    location: "Beverly Hills, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/taoist/800/600",
    galleryImages: ["https://picsum.photos/seed/taoist_1/800/600"],
    rating: 4.6,
    tags: ["temple", "chinese", "culture"],
    coordinates: { lat: 10.3345, lng: 123.8885 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cebu+Taoist+Temple",
    isMustVisit: true
  },
  {
    id: '28',
    name: "Senior Citizens Park",
    description: "A waterfront park near Cebu City Hall with a view of the CCLEX bridge.",
    significance: "Part of the ongoing waterfront redevelopment and urban heritage project.",
    category: "Public Space",
    location: "Waterfront, Cebu City",
    city: "Cebu City",
    visitingHours: "6:00 AM - 10:00 PM",
    imageUrl: "https://picsum.photos/seed/senior_citizens/800/600",
    galleryImages: ["https://picsum.photos/seed/senior_citizens_1/800/600"],
    rating: 4.3,
    tags: ["park", "waterfront", "modern"],
    coordinates: { lat: 10.2921, lng: 123.9015 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Senior+Citizens+Park+Cebu",
    isMustVisit: false
  },
  {
    id: '29',
    name: "Fuente Osmeña Circle",
    description: "A circular park and fountain commemorating President Sergio Osmeña.",
    significance: "A central landmark and venue for many of Cebu's civic celebrations.",
    category: "Public Space",
    location: "Fuente Osmeña, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/fuente_circle/800/600",
    galleryImages: ["https://picsum.photos/seed/fuente_circle_1/800/600"],
    rating: 4.4,
    tags: ["park", "landmark", "osmeña"],
    coordinates: { lat: 10.3111, lng: 123.8915 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Fuente+Osmena+Circle",
    isMustVisit: false
  },
  {
    id: '30',
    name: "Taboan Dried Fish Market",
    description: "The primary source of Cebu's famous 'danggit' and preserved seafood.",
    significance: "A culinary heritage site where traditional preservation methods are alive.",
    category: "Public Space",
    location: "San Nicolas, Cebu City",
    city: "Cebu City",
    visitingHours: "6:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/taboan/800/600",
    galleryImages: ["https://picsum.photos/seed/taboan_1/800/600"],
    rating: 4.5,
    tags: ["culinary", "market", "tradition"],
    coordinates: { lat: 10.2945, lng: 123.8928 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Taboan+Dried+Fish+Market",
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
    
    const matchesCity = city && city !== 'All' ? site.city === city : true;
    const matchesCategory = category && category !== 'All' ? site.category === category : true;
    
    return matchesQuery && matchesCity && matchesCategory;
  });
}
