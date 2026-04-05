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
}

export const HERITAGE_SITES: HeritageSite[] = [
  // --- CEBU CITY ---
  {
    id: '1',
    name: "Magellan's Cross",
    description: "A Christian cross planted by Portuguese and Spanish explorers as ordered by Ferdinand Magellan upon arriving in Cebu on April 21, 1521.",
    significance: "It symbolizes the introduction of Christianity in the Philippines and marks the first mass in the islands.",
    category: "Religious",
    location: "P. Burgos St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 6:00 PM",
    imageUrl: "https://picsum.photos/seed/magellan1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/magellan2/800/600",
      "https://picsum.photos/seed/magellan3/800/600"
    ],
    rating: 4.8,
    tags: ["history", "christianity", "landmark"],
    coordinates: { lat: 10.2936, lng: 123.9019 }
  },
  {
    id: '2',
    name: "Fort San Pedro",
    description: "The oldest triangular bastion fort in the country, built by the Spanish under Miguel López de Legazpi.",
    significance: "Served as a military defense structure and a safe haven for Spanish settlers during the colonial era.",
    category: "Spanish Colonial",
    location: "A. Pigafetta Street, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 7:00 PM",
    imageUrl: "https://picsum.photos/seed/fort1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/fort2/800/600",
      "https://picsum.photos/seed/fort3/800/600"
    ],
    rating: 4.6,
    tags: ["military", "architecture", "fort"],
    coordinates: { lat: 10.2924, lng: 123.9056 }
  },
  {
    id: '3',
    name: "Basilica Minore del Santo Niño",
    description: "The oldest Roman Catholic church in the Philippines, established in 1565.",
    significance: "Housed the statuette of the Santo Niño, the oldest religious relic in the Philippines given by Magellan to Queen Juana.",
    category: "Religious",
    location: "Osmeña Blvd, Cebu City",
    city: "Cebu City",
    visitingHours: "6:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/basilica1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/basilica2/800/600",
      "https://picsum.photos/seed/basilica3/800/600"
    ],
    rating: 4.9,
    tags: ["church", "pilgrimage", "heritage"],
    coordinates: { lat: 10.2942, lng: 123.9021 }
  },
  {
    id: '4',
    name: "Yap-Sandiego Ancestral House",
    description: "Built in the late 17th century, one of the oldest residential houses in the Philippines.",
    significance: "Displays the lifestyle and architecture of the Parian district during the Spanish period, showing Chinese and Spanish influences.",
    category: "Ancestral House",
    location: "Mabini St, Parian, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 6:00 PM",
    imageUrl: "https://picsum.photos/seed/yap1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/yap2/800/600",
      "https://picsum.photos/seed/yap3/800/600"
    ],
    rating: 4.5,
    tags: ["parian", "chinese-heritage", "lifestyle"],
    coordinates: { lat: 10.2987, lng: 123.9034 }
  },
  {
    id: '5',
    name: "Casa Gorordo Museum",
    description: "Former residence of the first Filipino Bishop of Cebu, Juan Gorordo, showcasing colonial lifestyles.",
    significance: "Preserves the 19th-century 'Bahay na Bato' architecture and the cultural identity of upper-class Cebuanos.",
    category: "Museum",
    location: "Lopez Jaena St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/gorordo1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/gorordo2/800/600",
      "https://picsum.photos/seed/gorordo3/800/600"
    ],
    rating: 4.7,
    tags: ["bishop", "museum", "antiques"],
    coordinates: { lat: 10.2995, lng: 123.9042 }
  },
  {
    id: '6',
    name: "Museo Sugbo",
    description: "The Cebu Provincial Museum housed in the former Carcel de Cebu (Provincial Jail).",
    significance: "The building itself is a coral stone structure built in 1871, now preserving artifacts from pre-colonial to the American period.",
    category: "Museum",
    location: "M.J. Cuenco Ave, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:30 PM",
    imageUrl: "https://picsum.photos/seed/sugbo1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/sugbo2/800/600",
      "https://picsum.photos/seed/sugbo3/800/600"
    ],
    rating: 4.6,
    tags: ["history", "jail", "provincial"],
    coordinates: { lat: 10.3021, lng: 123.9068 }
  },
  {
    id: '7',
    name: "Heritage of Cebu Monument",
    description: "A massive tableau of sculptures depicting significant events in Cebu's history.",
    significance: "Commemorates the conversion of Rajah Humabon, the Battle of Mactan, and other pivotal Cebuano historical moments.",
    category: "Arts & Culture",
    location: "Sikatuna St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/monument1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/monument2/800/600",
      "https://picsum.photos/seed/monument3/800/600"
    ],
    rating: 4.5,
    tags: ["sculpture", "parian", "history"],
    coordinates: { lat: 10.2985, lng: 123.9038 }
  },
  {
    id: '8',
    name: "Jesuit House of 1730",
    description: "An 18th-century stone house that served as the residence of the Jesuit Superior in Cebu.",
    significance: "Recognized as the oldest dated house in the Philippines, hidden within a modern warehouse.",
    category: "Ancestral House",
    location: "Zulueta St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:30 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/jesuit1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/jesuit2/800/600"
    ],
    rating: 4.7,
    tags: ["hidden-gem", "jesuit", "parian"],
    coordinates: { lat: 10.2982, lng: 123.9031 }
  },
  {
    id: '9',
    name: "Cebu Metropolitan Cathedral",
    description: "The seat of the Archdiocese of Cebu, featuring Spanish-Filipino baroque architecture.",
    significance: "Established in 1565, it is the center of Catholic administration in the Visayas.",
    category: "Religious",
    location: "Mabini St, Cebu City",
    city: "Cebu City",
    visitingHours: "5:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/cathedral1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/cathedral2/800/600"
    ],
    rating: 4.6,
    tags: ["archdiocese", "cathedral", "church"],
    coordinates: { lat: 10.2954, lng: 123.9028 }
  },
  {
    id: '10',
    name: "Colon Street",
    description: "The oldest national road in the Philippines, established during the time of Miguel López de Legazpi.",
    significance: "It represents the commercial and social center of old Cebu, named after Christopher Columbus.",
    category: "Public Space",
    location: "Colon St, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/colon1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/colon2/800/600"
    ],
    rating: 4.2,
    tags: ["oldest-street", "downtown", "commerce"],
    coordinates: { lat: 10.2965, lng: 123.9015 }
  },
  {
    id: '11',
    name: "Plaza Independencia",
    description: "A historic park located in front of Fort San Pedro, a symbol of freedom and history.",
    significance: "A venue for political and social gatherings throughout Spanish, American, and modern eras.",
    category: "Public Space",
    location: "M.J. Cuenco Ave, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/plaza1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/plaza2/800/600"
    ],
    rating: 4.4,
    tags: ["park", "recreation", "plaza"],
    coordinates: { lat: 10.2928, lng: 123.9052 }
  },
  {
    id: '12',
    name: "San Nicolas de Tolentino Church",
    description: "One of the oldest parishes in Cebu, located where the Spanish first landed.",
    significance: "Known as the site of the original settlement of Cebu and a cradle of Cebuano resistance.",
    category: "Religious",
    location: "Tupas St, San Nicolas, Cebu City",
    city: "Cebu City",
    visitingHours: "6:00 AM - 7:00 PM",
    imageUrl: "https://picsum.photos/seed/sannicolas1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/sannicolas2/800/600"
    ],
    rating: 4.5,
    tags: ["parish", "revolution", "history"],
    coordinates: { lat: 10.2915, lng: 123.8955 }
  },
  {
    id: '13',
    name: "Jose R. Gullas Halad Museum",
    description: "A museum dedicated to Cebuano musical heritage and legendary composers.",
    significance: "Preserves the unique musical identity of Cebu through instruments, scores, and personal items of artists.",
    category: "Arts & Culture",
    location: "V. Gullas St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/halad1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/halad2/800/600"
    ],
    rating: 4.6,
    tags: ["music", "composers", "culture"],
    coordinates: { lat: 10.2958, lng: 123.9008 }
  },
  {
    id: '14',
    name: "Fuente Osmeña Circle",
    description: "A circular park and fountain commemorating President Sergio Osmeña.",
    significance: "A central landmark in Cebu City, symbolizing the city's progress and political history.",
    category: "Public Space",
    location: "Fuente Osmeña, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/fuente1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/fuente2/800/600"
    ],
    rating: 4.4,
    tags: ["landmark", "park", "osmeña"],
    coordinates: { lat: 10.3111, lng: 123.8915 }
  },
  {
    id: '15',
    name: "Cebu Provincial Capitol",
    description: "An iconic Neo-Classical building that serves as the seat of the provincial government.",
    significance: "Designed by Juan Arellano, it is a testament to the American colonial administration and civic architecture.",
    category: "Modern History",
    location: "Escario St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/capitol1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/capitol2/800/600"
    ],
    rating: 4.7,
    tags: ["architecture", "government", "heritage"],
    coordinates: { lat: 10.3168, lng: 123.8906 }
  },
  {
    id: '16',
    name: "Gotiaoco Building",
    description: "A historic commercial building recently restored as the Sugbo Chinese Heritage Museum.",
    significance: "Represented the early 20th-century commercial boom and the contribution of the Chinese community to Cebu's economy.",
    category: "Spanish Colonial",
    location: "M.C. Briones St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/gotiaoco1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/gotiaoco2/800/600"
    ],
    rating: 4.3,
    tags: ["chinese-heritage", "architecture", "restored"],
    coordinates: { lat: 10.2932, lng: 123.9012 }
  },
  {
    id: '17',
    name: "Parian District",
    description: "The historic district where Chinese merchants resided during the Spanish colonial period.",
    significance: "A cultural melting pot that was once the wealthiest and most influential district in Cebu.",
    category: "Arts & Culture",
    location: "Parian, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/parian1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/parian2/800/600"
    ],
    rating: 4.4,
    tags: ["district", "chinese", "colonial"],
    coordinates: { lat: 10.2991, lng: 123.9039 }
  },
  {
    id: '18',
    name: "Carbon Market",
    description: "Cebu's oldest and largest public market, reflecting local trade and life.",
    significance: "Named after the coal depot for the old railway, it is a living monument of Cebuano commerce.",
    category: "Public Space",
    location: "MC Briones St, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/carbon1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/carbon2/800/600"
    ],
    rating: 4.3,
    tags: ["market", "livelihood", "culture"],
    coordinates: { lat: 10.2925, lng: 123.9005 }
  },
  {
    id: '19',
    name: "Chu Un Temple",
    description: "A Buddhist temple in Banawa, representing the religious diversity of Metro Cebu.",
    significance: "Promotes Fo Guang Shan Buddhism and serves as a center for cultural exchanges.",
    category: "Religious",
    location: "Banawa, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/chuun1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/chuun2/800/600"
    ],
    rating: 4.7,
    tags: ["buddhist", "temple", "peaceful"],
    coordinates: { lat: 10.3155, lng: 123.8785 }
  },
  {
    id: '20',
    name: "Taboan Dried Fish Market",
    description: "The primary source of Cebu's famous 'danggit' and other preserved seafood.",
    significance: "A culinary heritage site where traditional food preservation techniques are still practiced.",
    category: "Public Space",
    location: "San Nicolas, Cebu City",
    city: "Cebu City",
    visitingHours: "6:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/taboan1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/taboan2/800/600"
    ],
    rating: 4.5,
    tags: ["culinary", "market", "tradition"],
    coordinates: { lat: 10.2945, lng: 123.8928 }
  },

  // --- LAPU-LAPU CITY ---
  {
    id: '21',
    name: "Mactan Shrine (Lapu-Lapu Monument)",
    description: "A memorial shrine marking the site of the historic Battle of Mactan in 1521.",
    significance: "Commemorates Datu Lapu-Lapu's victory over Magellan, representing the first successful resistance against foreign colonizers.",
    category: "National Monument",
    location: "Punta Engaño, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/lapulapu1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/lapulapu2/800/600",
      "https://picsum.photos/seed/lapulapu3/800/600"
    ],
    rating: 4.8,
    tags: ["hero", "battle", "mactan"],
    coordinates: { lat: 10.3115, lng: 123.9585 }
  },
  {
    id: '22',
    name: "Magellan Shrine",
    description: "A stone monument built in 1866 on the spot where Magellan reportedly fell.",
    significance: "Honors the Portuguese explorer who brought the first Christian relics to the Philippines.",
    category: "Spanish Colonial",
    location: "Punta Engaño, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/magellanshrine1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/magellanshrine2/800/600"
    ],
    rating: 4.6,
    tags: ["explorer", "history", "monument"],
    coordinates: { lat: 10.3112, lng: 123.9582 }
  },
  {
    id: '23',
    name: "Virgen de la Regla National Shrine",
    description: "A national shrine dedicated to Our Lady of the Rule, the patroness of Opon.",
    significance: "The center of religious devotion in Lapu-Lapu City, featuring a carved wooden image with Spanish roots.",
    category: "Religious",
    location: "B.M. Dimataga St, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "5:00 AM - 9:00 PM",
    imageUrl: "https://picsum.photos/seed/regla1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/regla2/800/600"
    ],
    rating: 4.7,
    tags: ["devotion", "patroness", "church"],
    coordinates: { lat: 10.3155, lng: 123.9442 }
  },
  {
    id: '24',
    name: "Olango Island Wildlife Sanctuary",
    description: "A critical habitat for migratory birds and a natural heritage site.",
    significance: "Preserves the ecological balance of the region and promotes sustainable community livelihoods.",
    category: "Arts & Culture",
    location: "Olango Island, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/olango1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/olango2/800/600"
    ],
    rating: 4.8,
    tags: ["nature", "birds", "island"],
    coordinates: { lat: 10.2642, lng: 124.0325 }
  },
  {
    id: '25',
    name: "Marcelo Fernan Bridge",
    description: "The second bridge connecting Mandaue and Mactan, an engineering feat.",
    significance: "Symbolizes the modernization and connectivity of the Metro Cebu urban sprawl.",
    category: "Modern History",
    location: "Mandaue-Lapu Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/fernan1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/fernan2/800/600"
    ],
    rating: 4.5,
    tags: ["bridge", "skyline", "progress"],
    coordinates: { lat: 10.3255, lng: 123.9485 }
  },
  {
    id: '26',
    name: "Caohagan Island",
    description: "A small island known for its traditional shell craft and sustainable tourism.",
    significance: "A showcase of traditional maritime livelihoods and natural island preservation.",
    category: "Public Space",
    location: "Caohagan, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/caohagan1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/caohagan2/800/600"
    ],
    rating: 4.4,
    tags: ["island", "livelihood", "nature"],
    coordinates: { lat: 10.2015, lng: 124.0185 }
  },

  // --- MANDAUE CITY ---
  {
    id: '27',
    name: "National Shrine of Saint Joseph",
    description: "The main church of Mandaue City, with a history dating back to the 16th century.",
    significance: "Houses the life-sized figures of the Last Supper used during the Holy Week 'Pasyon'.",
    category: "Religious",
    location: "P. Burgos St, Mandaue City",
    city: "Mandaue City",
    visitingHours: "6:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/joseph1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/joseph2/800/600"
    ],
    rating: 4.5,
    tags: ["shrine", "mandaue", "religious"],
    coordinates: { lat: 10.3295, lng: 123.9392 }
  },
  {
    id: '28',
    name: "Bantayan sa Hari (Mandaue)",
    description: "Spanish-era watchtower ruins used to defend the coastline against invaders.",
    significance: "A remnant of the colonial coastal defense system of Cebu.",
    category: "Spanish Colonial",
    location: "Brgy. Looc, Mandaue City",
    city: "Mandaue City",
    visitingHours: "Exterior viewing",
    imageUrl: "https://picsum.photos/seed/watchtower1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/watchtower2/800/600"
    ],
    rating: 4.1,
    tags: ["defensive", "ruins", "coastal"],
    coordinates: { lat: 10.3205, lng: 123.9425 }
  },
  {
    id: '29',
    name: "Mandaue Heritage Plaza",
    description: "The city's central plaza, integrating history with urban space.",
    significance: "A focal point for local civic life and cultural identity in Mandaue.",
    category: "Public Space",
    location: "Centro, Mandaue City",
    city: "Mandaue City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/mandaueplaza1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/mandaueplaza2/800/600"
    ],
    rating: 4.4,
    tags: ["plaza", "centro", "recreation"],
    coordinates: { lat: 10.3302, lng: 123.9388 }
  },
  {
    id: '30',
    name: "Eversley Childs Sanitarium (Heritage Wing)",
    description: "A century-old medical facility with American-period architecture.",
    significance: "Reflects the history of public health and institutional care in the Philippines.",
    category: "Modern History",
    location: "Jagobiao, Mandaue City",
    city: "Mandaue City",
    visitingHours: "8:00 AM - 4:00 PM",
    imageUrl: "https://picsum.photos/seed/eversley1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/eversley2/800/600"
    ],
    rating: 4.2,
    tags: ["medical", "american-era", "history"],
    coordinates: { lat: 10.3685, lng: 123.9315 }
  },
  {
    id: '31',
    name: "Ouano Ancestral House",
    description: "One of the oldest private residences in Mandaue City.",
    significance: "Represents the prominent Ouano family's legacy and the city's old urban fabric.",
    category: "Ancestral House",
    location: "Opao, Mandaue City",
    city: "Mandaue City",
    visitingHours: "Exterior viewing",
    imageUrl: "https://picsum.photos/seed/ouano1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/ouano2/800/600"
    ],
    rating: 4.0,
    tags: ["ancestral", "private", "mandaue"],
    coordinates: { lat: 10.3245, lng: 123.9485 }
  },

  // --- TALISAY CITY ---
  {
    id: '32',
    name: "Talisay Liberation Park",
    description: "Marks the site of the American liberation forces' landing in March 1945.",
    significance: "Commemorates the end of Japanese occupation in Cebu during WWII.",
    category: "National Monument",
    location: "Larawan Beach, Talisay City",
    city: "Talisay City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/talisay_liberation1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/talisay_liberation2/800/600",
      "https://picsum.photos/seed/talisay_liberation3/800/600"
    ],
    rating: 4.4,
    tags: ["ww2", "liberation", "beach"],
    coordinates: { lat: 10.2525, lng: 123.8445 }
  },
  {
    id: '33',
    name: "Archdiocesan Shrine of Sta. Teresa de Avila",
    description: "A grand colonial-era church in the heart of Talisay.",
    significance: "A masterpiece of Greco-Roman architecture and the center of Catholic life in Talisay.",
    category: "Religious",
    location: "Poblacion, Talisay City",
    city: "Talisay City",
    visitingHours: "5:30 AM - 8:30 PM",
    imageUrl: "https://picsum.photos/seed/avila1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/avila2/800/600"
    ],
    rating: 4.7,
    tags: ["shrine", "architecture", "heritage"],
    coordinates: { lat: 10.2515, lng: 123.8438 }
  },
  {
    id: '34',
    name: "Talisay City College Museum",
    description: "A repository of local Talisay history and cultural artifacts.",
    significance: "Preserves the agricultural and historical documents of the southern Metro Cebu region.",
    category: "Museum",
    location: "Talisay City College",
    city: "Talisay City",
    visitingHours: "9:00 AM - 4:00 PM",
    imageUrl: "https://picsum.photos/seed/talisay_museum1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/talisay_museum2/800/600"
    ],
    rating: 4.0,
    tags: ["local-history", "education", "museum"],
    coordinates: { lat: 10.2555, lng: 123.8485 }
  },
  {
    id: '35',
    name: "Lagundi Reef",
    description: "A natural heritage site representing Talisay's coastal biodiversity.",
    significance: "An important site for local livelihoods and environmental education.",
    category: "Arts & Culture",
    location: "Poblacion Beach, Talisay City",
    city: "Talisay City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/lagundi1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/lagundi2/800/600"
    ],
    rating: 4.3,
    tags: ["nature", "marine", "heritage"],
    coordinates: { lat: 10.2485, lng: 123.8415 }
  },
  {
    id: '36',
    name: "Gabaldon School Building",
    description: "A heritage school building from the American colonial period.",
    significance: "Part of the nationwide effort to modernize public education in the early 20th century.",
    category: "Spanish Colonial",
    location: "Talisay City",
    city: "Talisay City",
    visitingHours: "School hours",
    imageUrl: "https://picsum.photos/seed/gabaldon1/800/600",
    galleryImages: [
      "https://picsum.photos/seed/gabaldon2/800/600"
    ],
    rating: 4.0,
    tags: ["american-era", "school", "architecture"],
    coordinates: { lat: 10.2535, lng: 123.8455 }
  },

  // --- ADDITIONAL SITES TO REACH 50 ---
  {
    id: '37',
    name: "Senior Citizens Park (Waterfront)",
    description: "A coastal park with a chapel and a view of the CCLEX bridge.",
    significance: "Connects the historic waterfront with Cebu's modern infrastructure.",
    category: "Public Space",
    location: "Waterfront, Cebu City",
    city: "Cebu City",
    visitingHours: "6:00 AM - 10:00 PM",
    imageUrl: "https://picsum.photos/seed/senior_park1/800/600",
    galleryImages: ["https://picsum.photos/seed/senior_park2/800/600"],
    rating: 4.3,
    tags: ["waterfront", "park", "cclex"],
    coordinates: { lat: 10.2921, lng: 123.9015 }
  },
  {
    id: '38',
    name: "Archdiocesan Museum of Cebu",
    description: "Exhibits ecclesiastical art and artifacts within the Cathedral compound.",
    significance: "Showcases the rich artistic and religious history of the Cebu diocese.",
    category: "Museum",
    location: "Mabini St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/arch_museum1/800/600",
    galleryImages: ["https://picsum.photos/seed/arch_museum2/800/600"],
    rating: 4.4,
    tags: ["religious-art", "ecclesiastical", "cathedral"],
    coordinates: { lat: 10.2951, lng: 123.9025 }
  },
  {
    id: '39',
    name: "Gaisano Main Building",
    description: "A classic example of commercial architecture in downtown Cebu.",
    significance: "Represents the early modernization of retail in the Colon district.",
    category: "Modern History",
    location: "Colon St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/gaisano1/800/600",
    galleryImages: ["https://picsum.photos/seed/gaisano2/800/600"],
    rating: 4.1,
    tags: ["commerce", "downtown", "landmark"],
    coordinates: { lat: 10.2971, lng: 123.9018 }
  },
  {
    id: '40',
    name: "Cebu City Public Library",
    description: "The first public library in the Philippines to offer 24/7 service.",
    significance: "A modern landmark for learning and community heritage.",
    category: "Arts & Culture",
    location: "Osmeña Blvd, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/cebulibrary1/800/600",
    galleryImages: ["https://picsum.photos/seed/cebulibrary2/800/600"],
    rating: 4.6,
    tags: ["education", "community", "landmark"],
    coordinates: { lat: 10.3088, lng: 123.8932 }
  },
  {
    id: '41',
    name: "Rizal Memorial Library",
    description: "A historic building that houses the city's main library and museum.",
    significance: "Dedicated to the national hero Jose Rizal, and is a gem of Pre-War architecture.",
    category: "Museum",
    location: "Osmeña Blvd, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/rizalmuseum1/800/600",
    galleryImages: ["https://picsum.photos/seed/rizalmuseum2/800/600"],
    rating: 4.5,
    tags: ["rizal", "library", "museum"],
    coordinates: { lat: 10.3085, lng: 123.8935 }
  },
  {
    id: '42',
    name: "Liloan Lighthouse (Bagacay Point)",
    description: "A historic lighthouse originally built in 1857.",
    significance: "Critical for maritime navigation in the Mactan channel for over a century.",
    category: "Modern History",
    location: "Liloan (near Mandaue)",
    city: "Mandaue City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/lighthouse1/800/600",
    galleryImages: ["https://picsum.photos/seed/lighthouse2/800/600"],
    rating: 4.6,
    tags: ["maritime", "navigation", "landmark"],
    coordinates: { lat: 10.4015, lng: 124.0085 }
  },
  {
    id: '43',
    name: "Cebu Eastern College Heritage Wing",
    description: "The oldest Chinese-Filipino school building in Cebu.",
    significance: "Represents the educational aspirations of the early Chinese community.",
    category: "Arts & Culture",
    location: "Leon Kilat St, Cebu City",
    city: "Cebu City",
    visitingHours: "School hours",
    imageUrl: "https://picsum.photos/seed/cec1/800/600",
    galleryImages: ["https://picsum.photos/seed/cec2/800/600"],
    rating: 4.2,
    tags: ["school", "chinese-heritage", "education"],
    coordinates: { lat: 10.2985, lng: 123.8985 }
  },
  {
    id: '44',
    name: "San Miguel Brewery Historic Site",
    description: "The site of one of the oldest industrial breweries in the region.",
    significance: "Marks Mandaue's transition into an industrial powerhouse in the 20th century.",
    category: "Modern History",
    location: "Mandaue City",
    city: "Mandaue City",
    visitingHours: "By appointment",
    imageUrl: "https://picsum.photos/seed/brewery1/800/600",
    galleryImages: ["https://picsum.photos/seed/brewery2/800/600"],
    rating: 4.1,
    tags: ["industrial", "commerce", "mandaue"],
    coordinates: { lat: 10.3285, lng: 123.9355 }
  },
  {
    id: '45',
    name: "Talisay Central School Gabaldon",
    description: "Another well-preserved Gabaldon school building in Talisay.",
    significance: "Reflects the standard public education architecture during the American period.",
    category: "Spanish Colonial",
    location: "Poblacion, Talisay City",
    city: "Talisay City",
    visitingHours: "School hours",
    imageUrl: "https://picsum.photos/seed/talisay_school1/800/600",
    galleryImages: ["https://picsum.photos/seed/talisay_school2/800/600"],
    rating: 4.0,
    tags: ["school", "american-era", "talisay"],
    coordinates: { lat: 10.2511, lng: 123.8425 }
  },
  {
    id: '46',
    name: "Freedom Park (Old Railway)",
    description: "A public space that once housed the terminus of the Cebu Railway.",
    significance: "Remains a symbol of public discourse and political freedom in the city.",
    category: "Public Space",
    location: "Carbon, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/freedom1/800/600",
    galleryImages: ["https://picsum.photos/seed/freedom2/800/600"],
    rating: 4.0,
    tags: ["political", "market", "history"],
    coordinates: { lat: 10.2938, lng: 123.9001 }
  },
  {
    id: '47',
    name: "University of San Carlos Museum",
    description: "Academic museum showcasing anthropology and natural history.",
    significance: "The university is one of Asia's oldest, and its museum is a primary research center.",
    category: "Museum",
    location: "P. del Rosario St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/usc_museum1/800/600",
    galleryImages: ["https://picsum.photos/seed/usc_museum2/800/600"],
    rating: 4.6,
    tags: ["academic", "anthropology", "museum"],
    coordinates: { lat: 10.3005, lng: 123.8982 }
  },
  {
    id: '48',
    name: "The Cebu Zoo Legacy Site",
    description: "A site reflecting the early 20th-century natural heritage education.",
    significance: "Served as a community landmark for natural preservation for decades.",
    category: "Public Space",
    location: "Capitol Hills, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/zoo1/800/600",
    galleryImages: ["https://picsum.photos/seed/zoo2/800/600"],
    rating: 3.8,
    tags: ["nature", "legacy", "education"],
    coordinates: { lat: 10.3345, lng: 123.8885 }
  },
  {
    id: '49',
    name: "Shamrock Building Heritage",
    description: "Landmark building known for traditional Cebuano snacks.",
    significance: "Preserves the 'Rosquillos' and 'Otap' culinary heritage of Liloan and Cebu.",
    category: "Modern History",
    location: "Fuente, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 9:00 PM",
    imageUrl: "https://picsum.photos/seed/shamrock1/800/600",
    galleryImages: ["https://picsum.photos/seed/shamrock2/800/600"],
    rating: 4.3,
    tags: ["food-heritage", "commercial", "fuente"],
    coordinates: { lat: 10.3115, lng: 123.8918 }
  },
  {
    id: '50',
    name: "Jose Rizal Monument",
    description: "The primary monument dedicated to the national hero in Cebu.",
    significance: "A central point for national holidays and civic commemorations.",
    category: "National Monument",
    location: "Plaza Independencia, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/rizal_mon1/800/600",
    galleryImages: ["https://picsum.photos/seed/rizal_mon2/800/600"],
    rating: 4.5,
    tags: ["rizal", "monument", "national"],
    coordinates: { lat: 10.2925, lng: 123.9055 }
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
