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
  // --- CEBU CITY ---
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
    visitingHours: "8:30 AM - 5:00 PM",
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
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/colon/800/600",
    rating: 4.2,
    tags: ["oldest-street", "downtown", "commerce"]
  },
  {
    id: '11',
    name: "Plaza Independencia",
    description: "A historic park located in front of Fort San Pedro. It has served as a center for social and political gatherings since the Spanish era.",
    category: "Public Space",
    location: "M.J. Cuenco Ave, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/plaza/800/600",
    rating: 4.4,
    tags: ["park", "recreation", "plaza"]
  },
  {
    id: '12',
    name: "San Nicolas de Tolentino Church",
    description: "The second oldest parish in Cebu, located in the original site of Legazpi's first settlement. It is historically known as the cradle of the Cebuano resistance.",
    category: "Religious",
    location: "Tupas St, San Nicolas, Cebu City",
    city: "Cebu City",
    visitingHours: "6:00 AM - 7:00 PM",
    imageUrl: "https://picsum.photos/seed/sannicolas/800/600",
    rating: 4.5,
    tags: ["parish", "revolution", "history"]
  },
  {
    id: '13',
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
    id: '14',
    name: "Fuente Osmeña Circle",
    description: "A park and fountain dedicated to President Sergio Osmeña. It is the center of many of Cebu's social activities and festivals, particularly during Sinulog.",
    category: "Public Space",
    location: "Fuente Osmeña, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/fuente/800/600",
    rating: 4.4,
    tags: ["landmark", "park", "osmeña"]
  },
  {
    id: '15',
    name: "Cebu Provincial Capitol",
    description: "An iconic Neo-Classical building that serves as the seat of the provincial government. It was designed by Juan Arellano and is considered one of the most beautiful capitols in the Philippines.",
    category: "Modern History",
    location: "Escario St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM (Exterior viewing 24h)",
    imageUrl: "https://picsum.photos/seed/capitol/800/600",
    rating: 4.7,
    tags: ["architecture", "government", "heritage"]
  },
  {
    id: '16',
    name: "University of San Carlos (Main Library)",
    description: "One of the oldest educational institutions in Asia, the main campus houses significant archives and a museum of natural history and anthropology.",
    category: "Arts & Culture",
    location: "P. del Rosario St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/usc/800/600",
    rating: 4.5,
    tags: ["education", "archives", "academic"]
  },
  {
    id: '17',
    name: "Gotiaoco Building",
    description: "A historic building in front of Cebu City Hall, once the first skyscraper in Cebu. It has been restored into the Sugbo Chinese Heritage Museum.",
    category: "Spanish Colonial",
    location: "M.C. Briones St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/gotiaoco/800/600",
    rating: 4.3,
    tags: ["chinese-heritage", "architecture", "restored"]
  },
  {
    id: '18',
    name: "Parian District",
    description: "The historic district of Cebu where the Chinese community lived during the Spanish era. It was the center of wealth and political influence in old Cebu.",
    category: "Arts & Culture",
    location: "Parian, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/parian/800/600",
    rating: 4.4,
    tags: ["district", "chinese", "colonial"]
  },
  {
    id: '19',
    name: "Freedom Park",
    description: "Formerly the site of a railway station, it became a space for political rallies and public discourse. Today it is part of the historic Carbon Market area revitalization.",
    category: "Public Space",
    location: "Carbon, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/freedom/800/600",
    rating: 4.0,
    tags: ["political", "market", "history"]
  },
  {
    id: '20',
    name: "Carbon Market",
    description: "The oldest and largest farmer's market in Cebu City. Its name derives from the coal (carbon) depot that used to exist on the railway site.",
    category: "Public Space",
    location: "MC Briones St, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/carbon/800/600",
    rating: 4.3,
    tags: ["market", "livelihood", "culture"]
  },

  // --- LAPU-LAPU CITY ---
  {
    id: '21',
    name: "Mactan Shrine (Lapu-Lapu Monument)",
    description: "A memorial shrine marking the site of the Battle of Mactan in 1521. It features a 20-meter bronze statue of Datu Lapu-Lapu, the first Filipino hero.",
    category: "National Monument",
    location: "Punta Engaño, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/lapulapu/800/600",
    rating: 4.8,
    tags: ["hero", "battle", "mactan"]
  },
  {
    id: '22',
    name: "Magellan Shrine",
    description: "A monument built in 1866 to mark the spot where Ferdinand Magellan was killed. It stands in the same compound as the Lapu-Lapu monument, representing a dual historical perspective.",
    category: "Spanish Colonial",
    location: "Punta Engaño, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/magellanshrine/800/600",
    rating: 4.6,
    tags: ["explorer", "history", "monument"]
  },
  {
    id: '23',
    name: "Virgen de la Regla National Shrine",
    description: "A historic church dedicated to Our Lady of the Rule. The devotion is a central part of Oponganon culture and attracts thousands of pilgrims.",
    category: "Religious",
    location: "B.M. Dimataga St, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "5:00 AM - 9:00 PM",
    imageUrl: "https://picsum.photos/seed/regla/800/600",
    rating: 4.7,
    tags: ["devotion", "patroness", "church"]
  },
  {
    id: '24',
    name: "Olango Island Wildlife Sanctuary",
    description: "A natural heritage site critical for migratory birds. It represents the ecological heritage and traditional coastal living of the region.",
    category: "Arts & Culture",
    location: "Olango Island, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/olango/800/600",
    rating: 4.8,
    tags: ["nature", "birds", "island"]
  },
  {
    id: '25',
    name: "Opon Mercado (Old Public Market)",
    description: "The traditional commercial heart of Lapu-Lapu City, reflecting the city's growth from a small town (Opon) to a major urban center.",
    category: "Public Space",
    location: "Lapu-Lapu City Proper",
    city: "Lapu-Lapu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/oponmarket/800/600",
    rating: 4.2,
    tags: ["commerce", "local", "history"]
  },
  {
    id: '26',
    name: "Marcelo Fernan Bridge",
    description: "The second bridge connecting Cebu and Mactan, an engineering marvel that has become a symbol of the city's modernity and connectivity.",
    category: "Modern History",
    location: "Mandaue-Lapu Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/fernan/800/600",
    rating: 4.5,
    tags: ["bridge", "skyline", "progress"]
  },
  {
    id: '27',
    name: "Dona Maria House (Heritage Hub)",
    description: "A lesser-known ancestral structure that serves as a reminder of the residential heritage of old Opon families.",
    category: "Ancestral House",
    location: "Poblacion, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "By appointment",
    imageUrl: "https://picsum.photos/seed/donamaria/800/600",
    rating: 4.1,
    tags: ["ancestral", "private", "hidden"]
  },

  // --- MANDAUE CITY ---
  {
    id: '28',
    name: "National Shrine of Saint Joseph",
    description: "The spiritual center of Mandaue, featuring life-size statues of the Last Supper used during Holy Week processions.",
    category: "Religious",
    location: "P. Burgos St, Mandaue City",
    city: "Mandaue City",
    visitingHours: "6:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/joseph/800/600",
    rating: 4.5,
    tags: ["shrine", "mandaue", "religious"]
  },
  {
    id: '29',
    name: "Bantayan sa Hari",
    description: "A Spanish-era watchtower used to guard against pirate raids. It is one of the few remaining coastal fortifications in Mandaue.",
    category: "Spanish Colonial",
    location: "Brgy. Looc, Mandaue City",
    city: "Mandaue City",
    visitingHours: "Exterior viewing",
    imageUrl: "https://picsum.photos/seed/watchtower/800/600",
    rating: 4.1,
    tags: ["defensive", "ruins", "coastal"]
  },
  {
    id: '30',
    name: "Mandaue City Public Library",
    description: "Housed in a historic building, it serves as the repository of local history and documents the city's industrial evolution.",
    category: "Arts & Culture",
    location: "Mandaue City Hall Compound",
    city: "Mandaue City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/mandaue_library/800/600",
    rating: 4.3,
    tags: ["education", "archives", "mandaue"]
  },
  {
    id: '31',
    name: "Monkey Tree (Historical Site)",
    description: "A legendary tree in Mandaue that has survived generations, associated with many local myths and historical anecdotes of the town.",
    category: "Public Space",
    location: "Mandaue City",
    city: "Mandaue City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/monkeytree/800/600",
    rating: 3.9,
    tags: ["myth", "nature", "landmark"]
  },
  {
    id: '32',
    name: "Eversley Childs Sanitarium (Heritage Wing)",
    description: "Founded in 1930, this medical facility has a rich history of serving the community and contains buildings of architectural significance from the American period.",
    category: "Modern History",
    location: "Jagobiao, Mandaue City",
    city: "Mandaue City",
    visitingHours: "8:00 AM - 4:00 PM",
    imageUrl: "https://picsum.photos/seed/eversley/800/600",
    rating: 4.2,
    tags: ["medical", "american-era", "history"]
  },
  {
    id: '33',
    name: "Mandaue Heritage Plaza",
    description: "A newly renovated plaza that integrates modern public space with elements highlighting Mandaue's industrial and cultural past.",
    category: "Public Space",
    location: "Centro, Mandaue City",
    city: "Mandaue City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/mandaueplaza/800/600",
    rating: 4.4,
    tags: ["plaza", "centro", "recreation"]
  },

  // --- TALISAY CITY ---
  {
    id: '34',
    name: "Talisay Liberation Park",
    description: "Marks the site where American forces landed in 1945 to liberate Cebu from Japanese occupation. It features statues of the soldiers landing on the beach.",
    category: "National Monument",
    location: "Larawan Beach, Talisay City",
    city: "Talisay City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/talisay_liberation/800/600",
    rating: 4.4,
    tags: ["ww2", "liberation", "beach"]
  },
  {
    id: '35',
    name: "Archdiocesan Shrine of Sta. Teresa de Avila",
    description: "A majestic Greco-Roman church built in 1836, known for its architectural elegance and spiritual significance to Talisaynons.",
    category: "Religious",
    location: "Poblacion, Talisay City",
    city: "Talisay City",
    visitingHours: "5:30 AM - 8:30 PM",
    imageUrl: "https://picsum.photos/seed/avila/800/600",
    rating: 4.7,
    tags: ["shrine", "architecture", "heritage"]
  },
  {
    id: '36',
    name: "Talisay City College Museum",
    description: "A small but significant museum showcasing artifacts from Talisay's agricultural and colonial past.",
    category: "Museum",
    location: "Talisay City College, Talisay City",
    city: "Talisay City",
    visitingHours: "9:00 AM - 4:00 PM",
    imageUrl: "https://picsum.photos/seed/talisay_museum/800/600",
    rating: 4.0,
    tags: ["local-history", "education", "museum"]
  },
  {
    id: '37',
    name: "Tabunok Market (Cultural Hub)",
    description: "The bustling public market of Talisay, serving as a hub for local trades and reflecting the vibrant commercial culture of the city.",
    category: "Public Space",
    location: "Tabunok, Talisay City",
    city: "Talisay City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/tabunok/800/600",
    rating: 4.1,
    tags: ["market", "commerce", "local"]
  },
  {
    id: '38',
    name: "Lagundi Reef (Natural Heritage)",
    description: "A marine sanctuary that represents the natural heritage providing livelihood to Talisay's coastal communities for generations.",
    category: "Arts & Culture",
    location: "Poblacion Beach, Talisay City",
    city: "Talisay City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/lagundi/800/600",
    rating: 4.3,
    tags: ["nature", "marine", "heritage"]
  },

  // --- ADDITIONAL SITES ---
  {
    id: '39',
    name: "Senior Citizens Park",
    description: "A waterfront park in Cebu City featuring a modern chapel and views of the Mactan channel and the new CCLEX bridge.",
    category: "Public Space",
    location: "Waterfront, Cebu City",
    city: "Cebu City",
    visitingHours: "6:00 AM - 10:00 PM",
    imageUrl: "https://picsum.photos/seed/senior_park/800/600",
    rating: 4.3,
    tags: ["waterfront", "park", "cclex"]
  },
  {
    id: '40',
    name: "Archdiocesan Museum of Cebu",
    description: "Exhibits ecclesiastical art and historical items from the early Spanish period, located within the Cathedral compound.",
    category: "Museum",
    location: "Mabini St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/arch_museum/800/600",
    rating: 4.4,
    tags: ["religious-art", "ecclesiastical", "cathedral"]
  },
  {
    id: '41',
    name: "Cebu City Public Library",
    description: "The first public library in the Philippines to be open 24/7, serving as a modern landmark for education and community heritage.",
    category: "Arts & Culture",
    location: "Osmeña Blvd, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/cebulibrary/800/600",
    rating: 4.6,
    tags: ["education", "community", "landmark"]
  },
  {
    id: '42',
    name: "Gaisano Main (Old Building)",
    description: "A classic example of commercial architecture in downtown Cebu, representing the retail heritage of the Colon area.",
    category: "Modern History",
    location: "Colon St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/gaisano/800/600",
    rating: 4.1,
    tags: ["commerce", "downtown", "landmark"]
  },
  {
    id: '43',
    name: "USJ-R Recoletos Museum",
    description: "Houses religious artifacts and historical documents from the Order of Augustinian Recollects' mission in Cebu.",
    category: "Museum",
    location: "Magallanes St, Cebu City",
    city: "Cebu City",
    visitingHours: "By appointment",
    imageUrl: "https://picsum.photos/seed/usjr/800/600",
    rating: 4.3,
    tags: ["recoletos", "museum", "religious"]
  },
  {
    id: '44',
    name: "Chu Un Temple",
    description: "A Buddhist temple representing the Chinese-Cebuano religious diversity and cultural integration in the hills of Banawa.",
    category: "Religious",
    location: "Banawa, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/chuun/800/600",
    rating: 4.7,
    tags: ["buddhist", "temple", "peaceful"]
  },
  {
    id: '45',
    name: "Cebu Eastern College (Heritage Wing)",
    description: "The oldest Chinese school in Cebu, reflecting the educational heritage of the Chinese-Filipino community.",
    category: "Arts & Culture",
    location: "Leon Kilat St, Cebu City",
    city: "Cebu City",
    visitingHours: "School hours",
    imageUrl: "https://picsum.photos/seed/cec/800/600",
    rating: 4.2,
    tags: ["school", "chinese-heritage", "education"]
  },
  {
    id: '46',
    name: "Rizal Memorial Library and Museum",
    description: "A historic building that houses the city library and a museum featuring Cebuano history and the life of Dr. Jose Rizal.",
    category: "Museum",
    location: "Osmeña Blvd, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/rizalmuseum/800/600",
    rating: 4.5,
    tags: ["rizal", "library", "museum"]
  },
  {
    id: '47',
    name: "Talisay Central School (Gabaldon Building)",
    description: "A heritage school building from the American era, part of the Gabaldon school system designed to improve public education.",
    category: "Spanish Colonial",
    location: "Talisay City",
    city: "Talisay City",
    visitingHours: "School hours",
    imageUrl: "https://picsum.photos/seed/gabaldon/800/600",
    rating: 4.0,
    tags: ["american-era", "school", "architecture"]
  },
  {
    id: '48',
    name: "Shamrock Building (Liloan heritage roots)",
    description: "While commercial, it is a landmark of Cebu's snack heritage (otap and rosquillos), rooted in the traditional baking culture of the region.",
    category: "Modern History",
    location: "Fuente Osmeña, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 9:00 PM",
    imageUrl: "https://picsum.photos/seed/shamrock/800/600",
    rating: 4.3,
    tags: ["food-heritage", "commercial", "landmark"]
  },
  {
    id: '49',
    name: "Taboan Dried Fish Market",
    description: "A cultural and culinary landmark known for 'danggit'. It is the center of Cebu's traditional food preservation heritage.",
    category: "Public Space",
    location: "San Nicolas, Cebu City",
    city: "Cebu City",
    visitingHours: "6:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/taboan/800/600",
    rating: 4.5,
    tags: ["culinary", "market", "tradition"]
  },
  {
    id: '50',
    name: "The Cebu Zoo (Heritage of Conservation)",
    description: "A space that has served as an educational hub for local wildlife for decades, reflecting the city's early efforts in natural heritage education.",
    category: "Public Space",
    location: "Capitol Hills, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/cebuzoo/800/600",
    rating: 3.8,
    tags: ["wildlife", "education", "legacy"]
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
