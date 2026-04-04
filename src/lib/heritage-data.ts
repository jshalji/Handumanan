export interface HeritageSite {
  id: string;
  name: string;
  description: string;
  category: 'Religious' | 'Spanish Colonial' | 'National Monument' | 'Arts & Culture' | 'Modern History' | 'Ancestral House' | 'Museum' | 'Public Space';
  location: string;
  city: 'Cebu City' | 'Lapu-Lapu City' | 'Mandaue City' | 'Talisay City';
  visitingHours: string;
  imageUrl: string;
  rating: number;
  tags: string[];
}

export const HERITAGE_SITES: HeritageSite[] = [
  // CEBU CITY
  {
    id: '1',
    name: "Magellan's Cross",
    description: "A Christian cross planted by Portuguese and Spanish explorers as ordered by Ferdinand Magellan upon arriving in Cebu on April 21, 1521. It is housed in an octagonal pavilion adjacent to the Basilica del Santo Niño.",
    category: "Religious",
    location: "P. Burgos St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 6:00 PM",
    imageUrl: "https://picsum.photos/seed/magellan/800/600",
    rating: 4.8,
    tags: ["history", "christianity", "landmark"]
  },
  {
    id: '2',
    name: "Fort San Pedro",
    description: "The oldest triangular bastion fort in the country, built by the Spanish under Miguel López de Legazpi. It served as a military defense structure and now houses a museum of Spanish artifacts.",
    category: "Spanish Colonial",
    location: "A. Pigafetta Street, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 7:00 PM",
    imageUrl: "https://picsum.photos/seed/fort/800/600",
    rating: 4.6,
    tags: ["military", "architecture", "fort"]
  },
  {
    id: '3',
    name: "Basilica Minore del Santo Niño",
    description: "The oldest Roman Catholic church in the Philippines, established in 1565. It houses the famed Flemish statuette of the Santo Niño, the oldest religious relic in the country.",
    category: "Religious",
    location: "Osmeña Blvd, Cebu City",
    city: "Cebu City",
    visitingHours: "6:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/basilica/800/600",
    rating: 4.9,
    tags: ["church", "pilgrimage", "heritage"]
  },
  {
    id: '4',
    name: "Yap-Sandiego Ancestral House",
    description: "Built in the late 17th century, this is one of the oldest residential houses in the Philippines. It showcases a blend of Chinese, Spanish, and Filipino architectural influences.",
    category: "Ancestral House",
    location: "Mabini St, Parian, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 6:00 PM",
    imageUrl: "https://picsum.photos/seed/yap/800/600",
    rating: 4.5,
    tags: ["parian", "chinese-heritage", "lifestyle"]
  },
  {
    id: '5',
    name: "Casa Gorordo Museum",
    description: "The former residence of the first Filipino Bishop of Cebu, Juan Gorordo. It provides a glimpse into the lifestyle of upper-class Cebuano families in the 19th and early 20th centuries.",
    category: "Museum",
    location: "Lopez Jaena St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/gorordo/800/600",
    rating: 4.7,
    tags: ["bishop", "museum", "antiques"]
  },
  {
    id: '6',
    name: "Museo Sugbo",
    description: "The Cebu Provincial Museum housed in the former Carcel de Cebu (Provincial Jail). It features galleries on pre-colonial Cebu, the Spanish era, and American occupation.",
    category: "Museum",
    location: "M.J. Cuenco Ave, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:30 PM",
    imageUrl: "https://picsum.photos/seed/sugbo/800/600",
    rating: 4.6,
    tags: ["history", "jail", "provincial"]
  },
  {
    id: '7',
    name: "Heritage of Cebu Monument",
    description: "A grand tableau of sculptures depicting significant events in Cebu's history, from the conversion of Rajah Humabon to the beatification of Pedro Calungsod.",
    category: "Arts & Culture",
    location: "Sikatuna St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/monument/800/600",
    rating: 4.5,
    tags: ["sculpture", "parian", "history"]
  },
  {
    id: '8',
    name: "Jesuit House of 1730 (Museo de Parian)",
    description: "A hidden gem located inside a warehouse, this 18th-century stone house served as the residence of the Jesuit Superior in Cebu. It is considered one of the best-preserved Spanish-era houses.",
    category: "Ancestral House",
    location: "Zulueta St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:30 AM - 12:00 PM, 1:00 PM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/jesuit/800/600",
    rating: 4.7,
    tags: ["hidden-gem", "jesuit", "parian"]
  },
  {
    id: '9',
    name: "Cebu Metropolitan Cathedral",
    description: "The seat of the Archdiocese of Cebu, rebuilt after being destroyed during WWII. It is a prime example of Spanish-Filipino baroque architecture.",
    category: "Religious",
    location: "Mabini St, Cebu City",
    city: "Cebu City",
    visitingHours: "5:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/cathedral/800/600",
    rating: 4.6,
    tags: ["archdiocese", "cathedral", "church"]
  },
  {
    id: '10',
    name: "Colon Street",
    description: "The oldest and shortest national road in the Philippines, named after Christopher Columbus. It remains a bustling commercial center with a rich historical legacy.",
    category: "Public Space",
    location: "Colon St, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours (Business hours vary)",
    imageUrl: "https://picsum.photos/seed/colon/800/600",
    rating: 4.2,
    tags: ["oldest-street", "downtown", "commerce"]
  },

  // LAPU-LAPU CITY
  {
    id: '11',
    name: "Mactan Shrine (Lapu-Lapu Monument)",
    description: "A memorial shrine marking the site of the Battle of Mactan in 1521. It features a 20-meter bronze statue of Datu Lapu-Lapu, the first Filipino hero to resist foreign rule.",
    category: "National Monument",
    location: "Punta Engaño, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/lapulapu/800/600",
    rating: 4.8,
    tags: ["hero", "battle", "mactan"]
  },
  {
    id: '12',
    name: "Magellan Shrine",
    description: "A large coral stone monument erected in 1866 to mark the spot where the explorer Ferdinand Magellan was killed during the Battle of Mactan.",
    category: "Spanish Colonial",
    location: "Punta Engaño, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/magellanshrine/800/600",
    rating: 4.6,
    tags: ["explorer", "history", "monument"]
  },
  {
    id: '13',
    name: "Virgen de la Regla National Shrine",
    description: "A historic church dedicated to Our Lady of the Rule, the patroness of Opon (now Lapu-Lapu City). The devotion began in the 18th century and remains a central part of local culture.",
    category: "Religious",
    location: "B.M. Dimataga St, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "5:00 AM - 9:00 PM",
    imageUrl: "https://picsum.photos/seed/regla/800/600",
    rating: 4.7,
    tags: ["devotion", "patroness", "church"]
  },

  // MANDAUE CITY
  {
    id: '14',
    name: "National Shrine of Saint Joseph",
    description: "The center of Mandaue's spiritual life, this church features unique Life-Size statues of the Last Supper, locally known as 'Señor de la Cena'.",
    category: "Religious",
    location: "P. Burgos St, Mandaue City",
    city: "Mandaue City",
    visitingHours: "6:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/joseph/800/600",
    rating: 4.5,
    tags: ["last-supper", "shrine", "mandaue"]
  },
  {
    id: '15',
    name: "Bantayan sa Hari (Watchtower)",
    description: "A Spanish-era watchtower located at the Mactan-Mandaue bridge base, used to warn the local population of incoming pirate raids.",
    category: "Spanish Colonial",
    location: "Brgy. Looc, Mandaue City",
    city: "Mandaue City",
    visitingHours: "Viewing from outside",
    imageUrl: "https://picsum.photos/seed/watchtower/800/600",
    rating: 4.1,
    tags: ["defensive", "ruins", "coastal"]
  },
  {
    id: '16',
    name: "Mandaue City Public Library (Heritage Section)",
    description: "A repository of Mandaue's local history and cultural artifacts, documenting the city's transformation from a salt-making village to an industrial hub.",
    category: "Arts & Culture",
    location: "Mandaue City Hall Compound",
    city: "Mandaue City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/mandaue_library/800/600",
    rating: 4.3,
    tags: ["education", "archives", "mandaue"]
  },

  // TALISAY CITY
  {
    id: '17',
    name: "Talisay Liberation Park",
    description: "A historical park commemorating the landing of American forces in 1945, which began the liberation of Cebu from Japanese occupation during WWII.",
    category: "Modern History",
    location: "Larawan Beach, Talisay City",
    city: "Talisay City",
    visitingHours: "6:00 AM - 10:00 PM",
    imageUrl: "https://picsum.photos/seed/talisay_liberation/800/600",
    rating: 4.4,
    tags: ["ww2", "beach", "liberation"]
  },
  {
    id: '18',
    name: "Archdiocesan Shrine of Sta. Teresa de Avila",
    description: "A majestic Greco-Roman style church built in the mid-19th century, serving as the spiritual heart of Talisay City.",
    category: "Religious",
    location: "Poblacion, Talisay City",
    city: "Talisay City",
    visitingHours: "5:30 AM - 8:30 PM",
    imageUrl: "https://picsum.photos/seed/avila/800/600",
    rating: 4.7,
    tags: ["greco-roman", "shrine", "architecture"]
  },
  {
    id: '19',
    name: "Talisay City College Museum",
    description: "A local educational museum that houses artifacts related to Talisay's pre-colonial and colonial past, including agricultural tools used in the past.",
    category: "Museum",
    location: "Talisay City College, Talisay City",
    city: "Talisay City",
    visitingHours: "9:00 AM - 4:00 PM (By appointment)",
    imageUrl: "https://picsum.photos/seed/talisay_museum/800/600",
    rating: 4.0,
    tags: ["local-history", "education", "agriculture"]
  },

  // MORE SITES (UNDERRATED & HIDDEN)
  {
    id: '20',
    name: "Jose R. Gullas Halad Museum",
    description: "A musically-themed museum dedicated to Cebuano composers and artists, showcasing the rich musical heritage of the Visayas.",
    category: "Arts & Culture",
    location: "V. Gullas St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/halad/800/600",
    rating: 4.6,
    tags: ["music", "composers", "culture"]
  },
  {
    id: '21',
    name: "Archdiocesan Museum of Cebu",
    description: "Located within the Cathedral compound, this museum exhibits ecclesiastical art and artifacts from the early Spanish period.",
    category: "Museum",
    location: "Mabini St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/arch_museum/800/600",
    rating: 4.4,
    tags: ["religious-art", "ecclesiastical", "cathedral"]
  },
  {
    id: '22',
    name: "Senior Citizens Park",
    description: "A newly developed public space in the waterfront area of Cebu City, offering views of the Mactan channel and featuring a modern chapel dedicated to Sto. Niño.",
    category: "Public Space",
    location: "Waterfront, Cebu City",
    city: "Cebu City",
    visitingHours: "6:00 AM - 10:00 PM",
    imageUrl: "https://picsum.photos/seed/senior_park/800/600",
    rating: 4.3,
    tags: ["waterfront", "park", "modern"]
  },
  {
    id: '23',
    name: "Marcelo Fernan Bridge (2nd Bridge)",
    description: "An engineering feat connecting Mandaue and Lapu-Lapu. While modern, it has become a symbol of Metro Cebu's progress and unity.",
    category: "Modern History",
    location: "Mandaue-Lapu Lapu City",
    city: "Mandaue City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/fernan/800/600",
    rating: 4.5,
    tags: ["bridge", "engineering", "skyline"]
  },
  {
    id: '24',
    name: "Olango Island Wildlife Sanctuary",
    description: "A critical habitat for migratory birds, representing the natural heritage that has sustained the island's coastal communities for generations.",
    category: "Arts & Culture",
    location: "Olango Island, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/olango/800/600",
    rating: 4.8,
    tags: ["nature", "birds", "island"]
  },
  {
    id: '25',
    name: "Plaza Independencia",
    description: "A historic park located in front of Fort San Pedro. It has served as a center for social and political gatherings since the Spanish era.",
    category: "Public Space",
    location: "M.J. Cuenco Ave, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/plaza/800/600",
    rating: 4.4,
    tags: ["park", "recreation", "plaza"]
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
      site.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
    ) : true;
    
    const matchesCity = city && city !== 'All' ? site.city === city : true;
    const matchesCategory = category && category !== 'All' ? site.category === category : true;
    
    return matchesQuery && matchesCity && matchesCategory;
  });
}
