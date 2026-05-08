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
  isActive: boolean;
  status: 'Active' | 'Inactive';
  demolitionStatus: 'Non-Demolished' | 'Demolished' | 'Partially Demolished';
  accessibilityStatus: string;
}

export const HERITAGE_SITES: HeritageSite[] = [
  // --- CEBU CITY ---
  {
    id: 'cebu-basilica',
    name: "Basilica Minore del Santo Niño de Cebu",
    description: "The oldest Roman Catholic church in the Philippines, established in 1565.",
    overview: "The Basilica Minore del Santo Niño is the spiritual heart of Cebu. This massive stone structure was established in 1565 by Fray Andres de Urdaneta and Miguel Lopez de Legazpi. The current building, completed in 1739, features a blend of Romanesque and Muslim architectural influences. It is the primary site of devotion for the Santo Niño, the holy child image given by Magellan to Rajah Humabon's wife in 1521. Visitors can witness the fervent prayers of devotees and the traditional 'Sinulog' dance offerings within its hallowed grounds.",
    significance: "As the birthplace of Christianity in the Philippines, the Basilica is a National Historical Landmark. It houses the oldest religious relic in the country and serves as the center of the annual Sinulog Festival, a global celebration of Cebuano faith and culture. Its preservation through centuries of conflict and natural disasters makes it a primary symbol of Cebu's resilience and enduring identity.",
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
    coordinates: { lat: 10.29419, lng: 123.90212 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Basilica+Minore+del+Santo+Nino",
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Fully Accessible'
  },
  {
    id: 'cebu-cathedral',
    name: "Metropolitan Cebu Cathedral",
    description: "The ecclesiastical seat of the Archdiocese of Cebu.",
    overview: "Located just blocks from the Basilica, the Metropolitan Cathedral of the Holy Guardian Angels is a masterpiece of Spanish colonial architecture. Its thick, low-slung walls were designed to withstand earthquakes, and its facade is decorated with traditional relief carvings. The interior is spacious and grand, featuring a stunning altar and beautiful stained glass windows. It serves as the primary seat of the Catholic Church in the Visayas and is a frequent venue for major religious and civic ceremonies.",
    significance: "Established as a parish in 1595, it is a testament to the growth of the ecclesiastical administration in the region. It holds the remains of several notable Cebuano bishops and stands as a symbol of the city's enduring religious governance. The cathedral has been rebuilt multiple times, reflecting the historical layers of Cebu's urban development.",
    category: "Churches & Religious Heritage Sites",
    location: "Mabini St, Cebu City",
    city: "Cebu City",
    visitingHours: "5:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/cathedral/800/600",
    galleryImages: [
      "https://picsum.photos/seed/cathedral-2/800/600",
      "https://picsum.photos/seed/cathedral-3/800/600"
    ],
    rating: 4.7,
    tags: ["cathedral", "baroque"],
    coordinates: { lat: 10.29564, lng: 123.90297 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cebu+Metropolitan+Cathedral",
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Fully Accessible'
  },
  {
    id: 'cebu-cross',
    name: "Magellan’s Cross",
    description: "The site where the first Christian cross was planted in 1521.",
    overview: "Housed in an octagonal stone kiosk next to the Basilica, Magellan's Cross is the most iconic symbol of Cebu City. The wooden cross visible to the public is said to contain fragments of the original cross planted by Ferdinand Magellan's expedition on April 14, 1521. The ceiling of the pavilion is adorned with murals depicting the first baptism of the native Filipinos. It is a site of deep historical reverence and is often visited by tourists and locals who offer prayers and lighting of candles.",
    significance: "This site marks the beginning of the Spanish colonial era and the introduction of Christianity to the archipelago. It is a powerful emblem of the historical encounter between the West and the East in the 16th century, representing the foundational moment of Philippine colonial history and religious transformation.",
    category: "Churches & Religious Heritage Sites",
    location: "P. Burgos St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 6:00 PM",
    imageUrl: "https://picsum.photos/seed/magellan/800/600",
    galleryImages: [
      "https://picsum.photos/seed/magellan-ceiling/800/600",
      "https://picsum.photos/seed/magellan-pavilion/800/600"
    ],
    rating: 4.8,
    tags: ["cross", "magellan"],
    coordinates: { lat: 10.29365, lng: 123.90196 }, 
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Magellan%27s+Cross",
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Fully Accessible'
  },
  {
    id: 'cebu-archdiocesan-museum',
    name: "Archdiocesan Museum of Cebu",
    description: "A museum showcasing the religious history and artifacts of the Archdiocese.",
    overview: "Located within the Cebu Cathedral complex, this museum is housed in the historic 'Bahay na Bato' that once served as the rectory of the cathedral. The museum features several galleries displaying a vast collection of ecclesiastical treasures, including century-old vestments, silver altarpieces, and religious statues from various parishes across Cebu. The architecture of the building itself is a highlight, showcasing the traditional Filipino stone house design of the 19th century.",
    significance: "The museum preserves the material culture of the Catholic faith in Cebu. It provides a rare look at the artistic and historical development of religious practice in the Visayas since the early Spanish period, serving as an important resource for researchers and devotees alike.",
    category: "Churches & Religious Heritage Sites",
    location: "Cathedral Complex, Mabini St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/archmuseum/800/600",
    galleryImages: [
      "https://picsum.photos/seed/museum-interior/800/600",
      "https://picsum.photos/seed/religious-art/800/600"
    ],
    rating: 4.5,
    tags: ["museum", "religious-art"],
    coordinates: { lat: 10.29604, lng: 123.90350 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Archdiocesan+Museum+of+Cebu",
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible'
  },
  {
    id: 'cebu-casa-gorordo',
    name: "Casa Gorordo Museum",
    description: "A restored 19th-century residence of the Gorordo family.",
    overview: "Casa Gorordo is a classic example of a 'Bahay na Bato' (house of stone) located in the historic Parian district. Built in the mid-19th century, it was once the home of the first Filipino Bishop of Cebu, Juan Gorordo. The house features coral stone ground floors and fine hardwood upper floors, filled with period furniture, costumes, and artifacts that depict the daily life of a prominent Cebuano family during the late Spanish and American periods.",
    significance: "This museum provides a window into the lifestyle of the Filipino elite (mestizo) during the 19th century. It highlights the cultural synthesis of Spanish, Chinese, and native influences that defined Cebu's social history and serves as a vital anchor for the Parian heritage district.",
    category: "Ancestral Houses & Heritage Residences",
    location: "Lopez Jaena St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/gorordo/800/600",
    galleryImages: [
      "https://picsum.photos/seed/gorordo-garden/800/600",
      "https://picsum.photos/seed/gorordo-interior/800/600"
    ],
    rating: 4.7,
    tags: ["mansion", "lifestyle"],
    coordinates: { lat: 10.29990, lng: 123.90483 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Casa+Gorordo+Museum",
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible'
  },
  {
    id: 'cebu-yap-sandiego',
    name: "Yap-Sandiego Ancestral House",
    description: "One of the oldest private residential houses in the Philippines.",
    overview: "Built in the late 17th century, this house is made of coral stones and molave wood. It was built by Chinese merchants and remains one of the few surviving residential structures from that era in the Parian district. The interior is a treasure trove of antiques, religious icons, and curiosities collected by the descendants of the original owners over many generations. The house is maintained with its original structure largely intact, offering an authentic experience of pre-modern urban life.",
    significance: "It is a rare surviving link to the prosperous Chinese merchant community that thrived in Cebu centuries ago. Its structural integrity and original materials make it a primary artifact of Philippine residential architecture and a symbol of the Parian's historical significance as a commercial hub.",
    category: "Ancestral Houses & Heritage Residences",
    location: "Mabini St, Parian, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 6:00 PM",
    imageUrl: "https://picsum.photos/seed/yap/800/600",
    galleryImages: [
      "https://picsum.photos/seed/yap-house-inside/800/600",
      "https://picsum.photos/seed/yap-antiques/800/600"
    ],
    rating: 4.7,
    tags: ["ancestral", "parian"],
    coordinates: { lat: 10.29928, lng: 123.90400 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Yap-Sandiego+Ancestral+House",
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible'
  },
  {
    id: 'cebu-jesuit-house',
    name: "1730 Jesuit House",
    description: "A historic 18th-century structure tucked away in a modern warehouse.",
    overview: "Located deep within a modern hardware warehouse in Parian, this house dates back to 1730. It once served as the residence of the Jesuit Superior in Cebu. The structure features massive coral walls and a traditional roof structure that has survived for nearly 300 years. Inside, visitors can see various historical exhibits and the unique juxtaposition of ancient stone walls with modern business operations.",
    significance: "As one of the oldest dated residences in the country, it offers unique insights into the architectural transitions of the early 18th century and the historical presence of the Jesuit order in the Visayas. It is a testament to the layers of history hidden within Cebu's urban fabric.",
    category: "Ancestral Houses & Heritage Residences",
    location: "Zulueta St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 4:30 PM",
    imageUrl: "https://picsum.photos/seed/jesuit/800/600",
    galleryImages: [
      "https://picsum.photos/seed/jesuit-interior/800/600",
      "https://picsum.photos/seed/jesuit-walls/800/600"
    ],
    rating: 4.6,
    tags: ["jesuit", "hidden-gem"],
    coordinates: { lat: 10.29869, lng: 123.90401 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=1730+Jesuit+House",
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible'
  },
  {
    id: 'cebu-national-museum',
    name: "National Museum of the Philippines – Cebu",
    description: "Housed in the historic Aduana (Customhouse) building.",
    overview: "Located near the port area, the National Museum of the Philippines – Cebu is housed in the neoclassical Aduana Building, also known as Malacañang sa Sugbo. The museum features various galleries dedicated to Cebu's archaeological finds, ethnographic history, and fine arts. The grand architecture of the building, with its imposing columns and wide halls, provides a fitting backdrop for the nation's cultural treasures.",
    significance: "The building itself is a landmark of American colonial architecture, completed in 1910. As a museum, it serves as the central repository for the cultural and natural heritage of the Visayas, showcasing the island's deep historical roots from the pre-colonial era to the modern day.",
    category: "Museums & Cultural Institutions",
    location: "A. Pigafetta St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 6:00 PM",
    imageUrl: "https://picsum.photos/seed/natmuseum/800/600",
    galleryImages: [
      "https://picsum.photos/seed/nat-museum-hall/800/600",
      "https://picsum.photos/seed/nat-museum-art/800/600"
    ],
    rating: 4.8,
    tags: ["museum", "aduana"],
    coordinates: { lat: 10.29199, lng: 123.90441 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=National+Museum+Cebu",
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Fully Accessible'
  },
  {
    id: 'cebu-halad-museum',
    name: "Jose R. Gullas Halad Museum",
    description: "A museum dedicated to the musical heritage of Cebu.",
    overview: "This museum pays tribute to the composers and musicians of Cebu. It displays musical scores, traditional instruments, and memorabilia of the golden age of Cebuano music. Visitors can learn about the lives of legendary artists and the evolution of local musical traditions such as the 'Harana' and 'Visayan Love Song'. It is an essential destination for those interested in the intangible heritage of the island.",
    significance: "It preserves the history of Cebuano music, ensuring that the contributions of local artists to the Philippine cultural landscape are remembered and celebrated. It serves as a community center for musical research and appreciation.",
    category: "Museums & Cultural Institutions",
    location: "D. Jakosalem St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/halad/800/600",
    galleryImages: [
      "https://picsum.photos/seed/halad-instruments/800/600",
      "https://picsum.photos/seed/halad-gallery/800/600"
    ],
    rating: 4.5,
    tags: ["music", "culture"],
    coordinates: { lat: 10.29707, lng: 123.90203 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Jose+R.+Gullas+Halad+Museum",
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible'
  },
  {
    id: 'cebu-usc-museum',
    name: "University of San Carlos Museum",
    description: "An academic museum with extensive archaeological and ethnographic collections.",
    overview: "Located within the USC Main Campus, this museum features four main galleries: Archaeological, Ethnological, Biological, and Ceramics. It is one of the most comprehensive university museums in the country, showcasing artifacts from the pre-colonial era, Chinese trade ceramics, and indigenous crafts from across the Visayas and Mindanao.",
    significance: "The USC Museum is a center for academic research and cultural preservation. Its collections highlight the sophistication of early Philippine societies and their extensive trade networks with mainland Asia centuries before Spanish contact.",
    category: "Museums & Cultural Institutions",
    location: "P. del Rosario St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:30 AM - 5:30 PM",
    imageUrl: "https://picsum.photos/seed/uscmuseum/800/600",
    galleryImages: [
      "https://picsum.photos/seed/usc-ceramics/800/600",
      "https://picsum.photos/seed/usc-archaeology/800/600"
    ],
    rating: 4.6,
    tags: ["academic", "artifacts"],
    coordinates: { lat: 10.30027, lng: 123.89835 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=USC+Museum+Cebu",
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible'
  },
  {
    id: 'cebu-fort-san-pedro',
    name: "Fort San Pedro",
    description: "The oldest and smallest bastion fort in the Philippines.",
    overview: "Built in 1565 by Miguel Lopez de Legazpi, this triangular bastion fort served as a military defense structure for the first Spanish settlement. It is made of coral stones and features three bastions: La Concepcion, Ignacio de Loyola, and San Miguel. Visitors can walk along the ramparts, explore the small museum within the barracks, and enjoy the tranquil gardens in the courtyard.",
    significance: "It is a symbol of early Spanish military presence in Asia and the foundation of Cebu as a colonial city. Its surviving walls tell the story of Cebu's evolution from a defensive outpost to a bustling trade city and finally a historic park.",
    category: "Historical Landmarks & Monuments",
    location: "A. Pigafetta St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 7:00 PM",
    imageUrl: "https://picsum.photos/seed/fort/800/600",
    galleryImages: [
      "https://picsum.photos/seed/fort-cannons/800/600",
      "https://picsum.photos/seed/fort-garden/800/600"
    ],
    rating: 4.6,
    tags: ["military", "bastion"],
    coordinates: { lat: 10.29257, lng: 123.90566 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Fort+San+Pedro",
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Fully Accessible'
  },
  {
    id: 'cebu-heritage-monument',
    name: "Heritage of Cebu Monument",
    description: "A massive bronze sculpture depicting the history of Cebu.",
    overview: "Located in Plaza Parian, this monumental sculpture by Edgardo Castrillo depicts major historical events in Cebu, including the Battle of Mactan, the canonization of St. Pedro Calungsod, and the first baptism. The monument is made of dark bronze and stone, standing as a permanent history book in the middle of a busy street. The detail of the sculptures is intricate, capturing the expressions and actions of historical figures.",
    significance: "It serves as a collective memory of the Cebuano people, visually summarizing the pivotal moments that shaped the island's identity over five centuries. It is a major landmark of the Parian district and a popular site for historical education.",
    category: "Historical Landmarks & Monuments",
    location: "Plaza Parian, Mabini St, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/heritagemonument/800/600",
    galleryImages: [
      "https://picsum.photos/seed/monument-detail/800/600",
      "https://picsum.photos/seed/monument-night/800/600"
    ],
    rating: 4.7,
    tags: ["sculpture", "parian"],
    coordinates: { lat: 10.29889, lng: 123.90362 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Heritage+of+Cebu+Monument",
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Open Access'
  },
  {
    id: 'cebu-colon-street',
    name: "Colon Street & Historical Marker",
    description: "The oldest national road in the Philippines.",
    overview: "Named after Cristobal Colon (Christopher Columbus), this street was developed by the Spanish in the 16th century. It was once the center of Cebu's social and commercial life, lined with theaters, shops, and mansions. Today, a historic obelisk and marker stand at its intersection with Mabini Street to commemorate its status as the country's oldest street. While now a busy commercial zone, the area still retains hints of its historical grandeur.",
    significance: "Colon Street is a living landmark of urban planning and commercial history. It represents the enduring spirit of Cebuano trade and resilience, serving as the backbone of the city's economic life for over 400 years.",
    category: "Historical Landmarks & Monuments",
    location: "Colon St, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/colon/800/600",
    galleryImages: [
      "https://picsum.photos/seed/colon-marker/800/600",
      "https://picsum.photos/seed/colon-street-view/800/600"
    ],
    rating: 4.3,
    tags: ["oldest-street", "commercial"],
    coordinates: { lat: 10.29800, lng: 123.90367 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Colon+Street+Marker",
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Open Access'
  },
  {
    id: 'cebu-plaza-independencia',
    name: "Plaza Independencia",
    description: "A grand historic plaza near Fort San Pedro.",
    overview: "Plaza Independencia is a large public square that has served as a center for social and political gatherings since the Spanish period. It features century-old acacia trees, well-manicured gardens, and several monuments dedicated to national and local heroes. It is a popular spot for recreation, morning exercises, and family outings, providing a green lung in the city's busy port area.",
    significance: "It is a symbol of Cebuano freedom and public life. Its proximity to the fort and the port makes it a historic gateway that has witnessed the evolution of the city from a colonial settlement to a modern metropolis.",
    category: "Plazas, Parks & Public Spaces",
    location: "M.J. Cuenco Ave, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/independencia/800/600",
    galleryImages: [
      "https://picsum.photos/seed/plaza-trees/800/600",
      "https://picsum.photos/seed/plaza-monument/800/600"
    ],
    rating: 4.5,
    tags: ["plaza", "park"],
    coordinates: { lat: 10.29320, lng: 123.90505 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Plaza+Independencia+Cebu",
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Open Access'
  },
  {
    id: 'cebu-plaza-sugbo',
    name: "Plaza Sugbo",
    description: "The plaza fronting Magellan's Cross and City Hall.",
    overview: "This open space is the primary staging area for many of Cebu City's civic ceremonies. It is situated between Magellan's Cross and the Cebu City Hall, serving as a connector for the city's religious and political centers. The plaza is often bustling with activity, from tourists taking photos to vendors and city workers passing through.",
    significance: "Significant as the site of the original foundation of the city's civic center. It is a popular spot for photography and public events, maintaining its role as the 'front yard' of Cebu City and a symbolic meeting point of church and state.",
    category: "Plazas, Parks & Public Spaces",
    location: "Magallanes St, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/sugbo/800/600",
    galleryImages: [
      "https://picsum.photos/seed/sugbo-view/800/600"
    ],
    rating: 4.4,
    tags: ["plaza", "civic"],
    coordinates: { lat: 10.29343, lng: 123.90190 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Plaza+Sugbo",
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Open Access'
  },
  {
    id: 'cebu-plaza-hamabar',
    name: "Plaza Hamabar",
    description: "A plaza dedicated to Rajah Humabon, the native ruler of Cebu.",
    overview: "Located near the Cathedral, this plaza features a statue of Rajah Humabon, the first native ruler to be baptized in 1521. It is a quiet, shaded area that honors the pre-colonial leadership of the island. The statue stands as a reminder of the complex relationship between the native nobility and the arriving Spanish explorers.",
    significance: "It commemorates the native roots of Cebuano leadership and the initial encounter between the local nobility and the Spanish expedition. It is an important site for reflecting on Cebu's pre-colonial history and its eventual Christianization.",
    category: "Plazas, Parks & Public Spaces",
    location: "Mabini St, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/hamabar/800/600",
    galleryImages: [
      "https://picsum.photos/seed/hamabar-statue/800/600"
    ],
    rating: 4.2,
    tags: ["rajah", "history"],
    coordinates: { lat: 10.29605, lng: 123.90381 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Plaza+Hamabar",
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Open Access'
  },
  {
    id: 'cebu-fuente-osmena',
    name: "Fuente Osmeña Circle",
    description: "An iconic rotunda and fountain honoring Sergio Osmeña.",
    overview: "Located at the heart of Cebu City's uptown area, Fuente Osmeña is a circular park with a grand fountain at its center. It was built in 1912 to mark the opening of the city's water system and is named after Cebu's most famous son, President Sergio Osmeña. The park is a popular venue for evening walks, local gatherings, and city-wide celebrations like the Sinulog Mardi Gras.",
    significance: "It is a symbol of the modernization of Cebu during the American period. Today, it remains a focal point for city celebrations and a symbolic heart for the 'Uptown' heritage district, representing the city's growth beyond the old Spanish core.",
    category: "Plazas, Parks & Public Spaces",
    location: "Osmeña Blvd, Cebu City",
    city: "Cebu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/fuente/800/600",
    galleryImages: [
      "https://picsum.photos/seed/fuente-fountain/800/600",
      "https://picsum.photos/seed/fuente-night/800/600"
    ],
    rating: 4.5,
    tags: ["fountain", "osmeña"],
    coordinates: { lat: 10.30966, lng: 123.89327 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Fuente+Osmena+Circle",
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Open Access'
  },
  {
    id: 'cebu-city-hall',
    name: "Cebu City Hall",
    description: "The seat of the local government of Cebu City.",
    overview: "The Cebu City Hall is a prominent administrative building located in the heart of the heritage district. The current structure stands on the site of previous town halls, overlooking Plaza Sugbo and Magellan's Cross. It is a center of civic life where city business is conducted, featuring a mix of modern and traditional administrative architecture.",
    significance: "It represents the administrative heart of the oldest city in the Philippines. As a civic landmark, it facilitates the governance of a rapidly growing metropolis while anchoring the city's commitment to preserving its historical surroundings.",
    category: "Government & Historic Buildings",
    location: "M.C. Briones St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/cityhall/800/600",
    galleryImages: [
      "https://picsum.photos/seed/cityhall-front/800/600"
    ],
    rating: 4.1,
    tags: ["government", "civic"],
    coordinates: { lat: 10.29305, lng: 123.90178 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cebu+City+Hall",
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible'
  },
  {
    id: 'cebu-capitol',
    name: "Cebu Provincial Capitol",
    description: "A neoclassical masterpiece and seat of the provincial government.",
    overview: "Designed by Juan Arellano and completed in 1938, the Capitol is a grand neoclassical building with a central dome. It is considered one of the most beautiful government buildings in the country, featuring ornate interiors, historic murals, and a majestic grand staircase. The building sits at the end of Osmeña Boulevard, commanding a view of the city's primary uptown thoroughfare.",
    significance: "A protected National Historical Landmark, it symbolizes the political importance of Cebu province and is a premier example of American-era architecture in the Philippines. Its design reflects the aspirations of the Commonwealth period and the enduring power of provincial governance.",
    category: "Government & Historic Buildings",
    location: "Escario St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/capitol/800/600",
    galleryImages: [
      "https://picsum.photos/seed/capitol-dome/800/600",
      "https://picsum.photos/seed/capitol-stairs/800/600"
    ],
    rating: 4.8,
    tags: ["capitol", "neoclassical"],
    coordinates: { lat: 10.31684, lng: 123.89063 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cebu+Provincial+Capitol",
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible'
  },
  {
    id: 'cebu-patria',
    name: "Patria de Cebu",
    description: "A historic Catholic center and commercial building.",
    overview: "Located across from the Cathedral, Patria de Cebu has served for decades as a community center for the Catholic youth. The original structure features classic mid-20th-century architecture. It is currently being integrated into a modern development that aims to preserve its facade while repurposing the site for contemporary use. It remains a notable landmark of the city's religious social history.",
    significance: "It is a landmark of the Catholic Church's social mission in Cebu, serving as a hub for various religious, civic, and athletic activities for generations of Cebuanos. Its transformation represents the ongoing dialogue between heritage preservation and urban renewal.",
    category: "Government & Historic Buildings",
    location: "P. Burgos St, Cebu City",
    city: "Cebu City",
    visitingHours: "Daylight Hours",
    imageUrl: "https://picsum.photos/seed/patria/800/600",
    galleryImages: [
      "https://picsum.photos/seed/patria-facade/800/600"
    ],
    rating: 4.0,
    tags: ["catholic", "commercial"],
    coordinates: { lat: 10.29539, lng: 123.90369 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Patria+de+Cebu",
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible / Under Development'
  },
  {
    id: 'cebu-taoist',
    name: "Cebu Taoist Temple",
    description: "A colorful temple and cultural landmark of the Chinese community.",
    overview: "Built in 1972, this multi-tiered temple sits high in Beverly Hills. It features vibrant dragons, pagodas, and a replica of the Great Wall. It is the center of worship for the Taoist community in Cebu and offers several prayer halls and a library. Visitors are required to follow traditional protocols when entering the prayer areas. The temple grounds offer one of the best panoramic views of the city below.",
    significance: "It highlights the deep Chinese-Cebuano heritage and the religious diversity of the island. It serves as a spiritual and cultural anchor for the significant Chinese-Filipino population in Cebu, showcasing the integration of various traditions into the local cultural landscape.",
    category: "Cultural & Religious (Non-Catholic Sites)",
    location: "Beverly Hills, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/taoist/800/600",
    galleryImages: [
      "https://picsum.photos/seed/taoist-dragons/800/600",
      "https://picsum.photos/seed/taoist-view/800/600"
    ],
    rating: 4.6,
    tags: ["temple", "chinese"],
    coordinates: { lat: 10.33442, lng: 123.88831 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cebu+Taoist+Temple",
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible'
  },

  // --- TALISAY CITY ---
  {
    id: 'talisay-landing',
    name: "Talisay Landing Site",
    description: "The site of the American liberation landing in 1945.",
    overview: "The Talisay Landing Site at Larawan Beach marks the spot where American liberation forces landed on March 26, 1945. This historic event led to the final defeat of Japanese forces in Cebu during World War II. The site features a monument with life-sized statues of soldiers wading ashore, symbolizing the restoration of freedom on the island. It is a quiet coastal spot where history meets the sea.",
    significance: "This site is a critical World War II landmark for the Visayas. It serves as a permanent memorial to the bravery of Filipino and American soldiers and is the focal point for annual liberation day ceremonies, preserving the memory of Cebu's difficult path to peace during the 20th century.",
    category: "Historical Landmarks & Monuments",
    location: "Larawan Beach, Talisay City",
    city: "Talisay City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/talisay-landing/800/600",
    galleryImages: [
      "https://picsum.photos/seed/landing-monument/800/600",
      "https://picsum.photos/seed/larawan-beach/800/600"
    ],
    rating: 4.7,
    tags: ["WWII", "memorial", "liberation"],
    coordinates: { lat: 10.241786, lng: 123.848947 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Talisay+Landing+Site",
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible'
  },
  {
    id: 'talisay-church',
    name: "Sta. Teresa de Avila Parish Church",
    description: "A historic church and religious anchor of Talisay City.",
    overview: "The Sta. Teresa de Avila Parish Church is a prominent religious landmark in the heart of Talisay's Poblacion. Originally founded as a 'visita', the church has grown into a majestic structure that serves as the center of spiritual life for the local community. It is known for its traditional architecture and its vibrant annual fiesta celebration in honor of its patron saint every October.",
    significance: "This parish represents the deep spiritual roots of the Talisaynon people. Its historical development mirrors the growth of Talisay from a small fishing town to a bustling component city of Metro Cebu, standing as a testament to the community's enduring faith and social organization.",
    category: "Churches & Religious Heritage Sites",
    location: "Poblacion, Talisay City",
    city: "Talisay City",
    visitingHours: "5:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/talisay-church/800/600",
    galleryImages: [
      "https://picsum.photos/seed/talisay-altar/800/600"
    ],
    rating: 4.6,
    tags: ["church", "religious", "heritage"],
    coordinates: { lat: 10.243770, lng: 123.848012 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Sta.+Teresa+de+Avila+Parish+Church+Talisay",
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible'
  },
  {
    id: 'talisay-plaza',
    name: "Talisay City Plaza",
    description: "The historic civic center and public gathering space of Talisay.",
    overview: "Talisay City Plaza is a beautifully maintained open space that serves as the city's civic hub. Surrounded by the historic church and administrative buildings, the plaza is a favorite spot for recreation, community events, and evening gatherings. It reflects the typical Spanish-era urban planning where the church and plaza acted as the center of community life.",
    significance: "The plaza is the social heart of Talisay, acting as a 'living room' for the city's residents. It preserves the traditional Cebuano culture of public interaction and serves as a site for many of the city's most important cultural, religious, and political milestones.",
    category: "Plazas, Parks & Public Spaces",
    location: "Poblacion, Talisay City",
    city: "Talisay City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/talisay-plaza/800/600",
    galleryImages: [
      "https://picsum.photos/seed/talisay-park-view/800/600"
    ],
    rating: 4.3,
    tags: ["plaza", "civic", "gathering"],
    coordinates: { lat: 10.242643, lng: 123.848928 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Talisay+City+Plaza",
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible'
  },
  {
    id: 'talisay-city-hall',
    name: "Talisay City Hall",
    description: "The administrative seat of the Talisay local government.",
    overview: "The Talisay City Hall is a modern government building located along the city's primary development corridor. It manages the city's rapid industrial and residential growth while providing a central location for public services. The building's design reflects the city's transition into a modern urban center within the larger Metro Cebu region.",
    significance: "As the center of governance, it represents the administrative progress and economic growth of Talisay City. It stands as a symbol of the city's commitment to modernization and its role as a key contributor to the regional economy of southern Cebu.",
    category: "Government & Historic Buildings",
    location: "Biasong-Dumlog, Talisay City",
    city: "Talisay City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/talisay-cityhall/800/600",
    galleryImages: [
      "https://picsum.photos/seed/talisay-gov-front/800/600"
    ],
    rating: 4.2,
    tags: ["government", "civic", "modern"],
    coordinates: { lat: 10.253285, lng: 123.829350 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Talisay+City+Hall",
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible'
  },

  // --- MANDAUE CITY ---
  {
    id: 'mandaue-church',
    name: "National Shrine of Saint Joseph",
    description: "The historic mother church of Mandaue City, established in 1601.",
    overview: "The National Shrine of Saint Joseph is the spiritual heart of Mandaue City, with roots tracing back to the early Jesuit missions of 1601. The current stone structure is a landmark of religious perseverance, having survived the trials of World War II and various natural disasters. It is famous for its unique life-sized tableau of the Holy Family and remains the focal point of the city's annual 'Traslacion' during the Sinulog festival. The interior is known for its serene atmosphere and historic statues.",
    significance: "As a National Shrine, it symbolizes Mandaue's deep Catholic roots and its role as a regional hub for religious tradition. The church is a primary repository of the city's colonial history and serves as the guardian of Mandaue's spiritual identity for over four centuries.",
    category: "Churches & Religious Heritage Sites",
    location: "P. Burgos St, Mandaue City",
    city: "Mandaue City",
    visitingHours: "5:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/mandaue-church/800/600",
    galleryImages: [
      "https://picsum.photos/seed/mandaue-church-inside/800/600",
      "https://picsum.photos/seed/mandaue-holy-family/800/600"
    ],
    rating: 4.8,
    tags: ["shrine", "religious", "jesuit"],
    coordinates: { lat: 10.327479, lng: 123.942176 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=National+Shrine+of+Saint+Joseph+Mandaue",
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible'
  },
  {
    id: 'mandaue-library',
    name: "Mandaue City Public Library",
    description: "An educational landmark featuring a historic spiral staircase.",
    overview: "The Mandaue City Public Library is more than just a house of books; it is a historic civic structure located in the heart of the city's heritage zone. Visitors are often drawn to its classic architecture and the iconic internal spiral staircase, which stands as a testament to the mid-20th-century design aesthetic of Mandaue's public institutions. It houses local archives and provides a quiet space for research and study.",
    significance: "The library represents the intellectual heritage of Mandaue City. It serves as a vital link between the city's past governance and its commitment to modern public education, preserving archival knowledge and promoting literacy for future generations of Mandauehanons.",
    category: "Museums & Cultural Institutions",
    location: "Poblacion, Mandaue City",
    city: "Mandaue City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/mandaue-library/800/600",
    galleryImages: [
      "https://picsum.photos/seed/library-stairs/800/600"
    ],
    rating: 4.2,
    tags: ["library", "educational", "architecture"],
    coordinates: { lat: 10.325832, lng: 123.942101 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mandaue+City+Public+Library",
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible'
  },
  {
    id: 'mandaue-watchtower',
    name: "Bantayan sa Hari",
    description: "A Spanish-era watchtower used for coastal defense against pirates.",
    overview: "Bantayan sa Hari is a massive coral stone watchtower located in Barangay Looc. Built during the Spanish colonial period, it was part of a strategic defensive network designed to warn the city of approaching Moro pirates. The tower's thick walls and coastal position offer a glimpse into the military architecture used to protect Cebu's trade routes centuries ago. While weathered by time, its imposing presence remains a powerful reminder of the island's defensive history.",
    significance: "It is one of the few remaining physical links to Mandaue's coastal defense history. The structure stands as a monument to the resilience and strategic ingenuity of the island's early settlers against external threats and the importance of Mandaue's location along the Mactan Channel.",
    category: "Historical Landmarks & Monuments",
    location: "Looc, Mandaue City",
    city: "Mandaue City",
    visitingHours: "Daylight Hours",
    imageUrl: "https://picsum.photos/seed/bantayan/800/600",
    galleryImages: [
      "https://picsum.photos/seed/watchtower-sea/800/600"
    ],
    rating: 4.0,
    tags: ["watchtower", "spanish", "military"],
    coordinates: { lat: 10.322712, lng: 123.954833 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Bantayan+sa+Hari+Mandaue",
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible'
  },
  {
    id: 'mandaue-presidencia',
    name: "Mandaue Presidencia",
    description: "The historic city hall of Mandaue, built in 1937.",
    overview: "The Mandaue Presidencia is an elegant neoclassical building that has served as the administrative center of Mandaue since its completion in 1937. Located at the intersection of the city's primary historic streets, the building features imposing pillars and a grand facade that reflects the Commonwealth-era architectural style prevalent during the American period. It continues to function as a focal point for city government activities and civic pride.",
    significance: "As a protected National Historical Landmark, the Presidencia is the ultimate symbol of Mandaue's political autonomy and administrative history. It represents the city's growth from a historic town into a major industrial powerhouse of Metro Cebu while maintaining its architectural links to the past.",
    category: "Historical Landmarks & Monuments",
    location: "Poblacion, Mandaue City",
    city: "Mandaue City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/mandaue-presidencia/800/600",
    galleryImages: [
      "https://picsum.photos/seed/presidencia-columns/800/600"
    ],
    rating: 4.6,
    tags: ["government", "neoclassical", "cityhall"],
    coordinates: { lat: 10.327418, lng: 123.943134 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mandaue+Presidencia",
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible'
  },
  {
    id: 'mandaue-bridge',
    name: "Mandaue-Mactan Bridge",
    description: "The first bridge connecting Mactan Island to the mainland.",
    overview: "The Mandaue-Mactan Bridge, often called the 'First Bridge,' is an iconic engineering feat completed in 1972. Spanning the Mactan Channel, it linked Mandaue City to Lapu-Lapu City, fundamentally changing the economic landscape of the region by providing direct land access to the international airport and industrial zones. The bridge offers stunning views of the channel and is a vital artery for daily commuters and commerce.",
    significance: "This bridge is a symbol of modern Cebuano connectivity and industrial progress. Its completion marked the beginning of a new era of urban expansion and trade for both Mandaue and Mactan island, integrating the two major hubs of Metro Cebu into a single economic engine.",
    category: "Historical Landmarks & Monuments",
    location: "Mandaue City",
    city: "Mandaue City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/mandaue-bridge/800/600",
    galleryImages: [
      "https://picsum.photos/seed/bridge-sunset/800/600",
      "https://picsum.photos/seed/bridge-traffic/800/600"
    ],
    rating: 4.4,
    tags: ["bridge", "iconic", "channel"],
    coordinates: { lat: 10.319733, lng: 123.955731 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mandaue+Mactan+Bridge",
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Fully Accessible'
  },
  {
    id: 'mandaue-plaza',
    name: "Mandaue City Heritage Plaza",
    description: "A public space that highlights Mandaue's historic civic center.",
    overview: "The Heritage Plaza is a beautifully designed public square located directly in front of the Mandaue Presidencia and the National Shrine of Saint Joseph. It serves as a landscaped sanctuary for residents and a venue for the city's largest cultural gatherings, including the annual fiesta celebrations and official civic rites. The plaza features historical plaques and seating areas, making it a comfortable spot for observing the city's heartbeat.",
    significance: "The plaza is the social heart of Mandaue, designed to unite the city's religious, political, and historical landmarks into one cohesive community space. It preserves the tradition of the 'Plaza' as the center of urban life in the Philippines, fostering community interaction and cultural continuity.",
    category: "Plazas, Parks & Public Spaces",
    location: "Poblacion, Mandaue City",
    city: "Mandaue City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/mandaue-plaza/800/600",
    galleryImages: [
      "https://picsum.photos/seed/mandaue-park-walk/800/600"
    ],
    rating: 4.3,
    tags: ["plaza", "civic", "park"],
    coordinates: { lat: 10.327944, lng: 123.942767 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mandaue+City+Heritage+Plaza",
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Open Access'
  },

  // --- LAPU-LAPU CITY ---
  {
    id: 'llc-shrine',
    name: "Virgen de la Regla National Shrine",
    description: "A major pilgrimage site in Lapu-Lapu City dedicated to Our Lady of the Rule.",
    overview: "The Virgen de la Regla National Shrine is the spiritual heart of Lapu-Lapu City. It is a major pilgrimage destination for devotees from across the Visayas. The shrine houses the miraculous image of Our Lady of the Rule, which has been the object of profound veneration since the Spanish period. The current structure is a beautiful architectural landmark that serves as the site of the city's most important religious festivals, especially during the annual feast day in November.",
    significance: "This shrine is the primary symbol of the deep-rooted faith of the Oponganons (residents of Mactan). As a National Shrine, it holds immense religious and cultural importance, representing the spiritual continuity and protection of the island through centuries of change and challenges.",
    category: "Churches & Religious Heritage Sites",
    location: "B.M. Dimataga St, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "5:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/llc-shrine/800/600",
    galleryImages: [
      "https://picsum.photos/seed/shrine-statue/800/600",
      "https://picsum.photos/seed/shrine-inside/800/600"
    ],
    rating: 4.9,
    tags: ["shrine", "pilgrimage", "devotion"],
    coordinates: { lat: 10.312571, lng: 123.948726 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Virgen+de+la+Regla+National+Shrine",
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Fully Accessible'
  },
  {
    id: 'llc-happyworld',
    name: "Cebu Happy World Museum",
    description: "A modern 3D art museum and cultural destination.",
    overview: "Cebu Happy World Museum is an interactive cultural institution located in Mactan. It features an extensive collection of 3D paintings and optical illusions that allow visitors to 'step into' the artwork. The museum combines traditional artistic skills with modern creative concepts to provide an engaging educational experience for all ages, making it a unique stop on the island's cultural circuit.",
    significance: "While a modern addition to the city's cultural landscape, the museum represents the creative and tourism-driven heritage of Lapu-Lapu City. It serves as a significant destination for cultural recreation and creative education on the island, showcasing the evolution of artistic expression in Cebu.",
    category: "Museums & Cultural Institutions",
    location: "Cordova - Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "9:00 AM - 6:00 PM",
    imageUrl: "https://picsum.photos/seed/happyworld/800/600",
    galleryImages: [
      "https://picsum.photos/seed/3d-art-1/800/600",
      "https://picsum.photos/seed/3d-art-2/800/600"
    ],
    rating: 4.5,
    tags: ["museum", "interactive", "3D-art"],
    coordinates: { lat: 10.261763, lng: 123.959442 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cebu+Happy+World+Museum",
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible'
  },
  {
    id: 'llc-mactan-shrine',
    name: "Mactan Shrine",
    description: "A historical park commemorating the Battle of Mactan in 1521.",
    overview: "The Mactan Shrine, also known as the Liberty Shrine, is located in Punta Engaño on the spot where the Battle of Mactan occurred on April 27, 1521. The shrine features a massive bronze statue of Lapu-Lapu, the native chieftain who defeated the Spanish expedition led by Ferdinand Magellan. The site is a serene park that includes historical plaques, a memorial to Magellan, and a panoramic view of the coastline. It is a place of deep national pride and reflection.",
    significance: "This is one of the most important historical sites in the Philippines. It marks the first successful resistance of native Filipinos against European colonization. It is a National Historical Landmark and the site of annual reenactments of the 'Kadaugan sa Mactan', celebrating Cebuano valor and the birth of Filipino freedom.",
    category: "Historical Landmarks & Monuments",
    location: "Punta Engaño Rd, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/mactan/800/600",
    galleryImages: [
      "https://picsum.photos/seed/lapu-lapu-statue/800/600",
      "https://picsum.photos/seed/mactan-shore/800/600",
      "https://picsum.photos/seed/mactan-park/800/600"
    ],
    rating: 4.9,
    tags: ["hero", "battle", "liberty"],
    coordinates: { lat: 10.310855, lng: 124.015244 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mactan+Shrine",
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Open Access'
  },
  {
    id: 'llc-magellan-marker',
    name: "Magellan’s Marker",
    description: "A historic obelisk marking the believed site of Magellan's death.",
    overview: "Located within the same complex as the Mactan Shrine, Magellan's Marker is a stone obelisk erected in 1866 by the Spanish government. It was built to honor the Portuguese explorer Ferdinand Magellan, who is believed to have fallen during the Battle of Mactan while fighting under the service of Spain. The marker stands as a counterpart to the Lapu-Lapu statue, acknowledging the complex historical legacy of the expedition.",
    significance: "The marker represents the multifaceted history of the Philippines. While the shrine honors the native victor, the marker acknowledges the historical impact of the Magellan expedition, which completed the first circumnavigation of the globe and introduced Christianity to the archipelago, fundamentally altering the course of world history.",
    category: "Historical Landmarks & Monuments",
    location: "Mactan Shrine, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/magellan-marker/800/600",
    galleryImages: [
      "https://picsum.photos/seed/marker-obelisk/800/600"
    ],
    rating: 4.6,
    tags: ["magellan", "obelisk", "history"],
    coordinates: { lat: 10.310949, lng: 124.015283 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Magellans+Marker+Lapu-Lapu",
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Open Access'
  },
  {
    id: 'llc-plaza-rizal',
    name: "Plaza Rizal (Rizal Park)",
    description: "The historic central plaza of Lapu-Lapu City.",
    overview: "Plaza Rizal is the primary civic park of Lapu-Lapu City, located in front of the historic church and the old city hall. It is a bustling urban green space featuring a monument to the Philippine national hero, Dr. Jose Rizal. The plaza serves as the venue for the city's major civic ceremonies, political rallies, and community festivities, acting as the heartbeat of the Poblacion district.",
    significance: "The plaza is the symbolic heart of the city's civic life. It has witnessed the historical evolution of Opon (now Lapu-Lapu City) and continues to serve as the community's primary space for public discourse, social interaction, and historical commemoration.",
    category: "Plazas, Parks & Public Spaces",
    location: "Poblacion, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/llc-plaza/800/600",
    galleryImages: [
      "https://picsum.photos/seed/rizal-monument/800/600"
    ],
    rating: 4.2,
    tags: ["plaza", "rizal", "civic"],
    coordinates: { lat: 10.312681, lng: 123.949028 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Plaza+Rizal+Lapu-Lapu",
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Open Access'
  },
  {
    id: 'llc-millennium-park',
    name: "Millennium Park",
    description: "A scenic coastal park overlooking the Mactan Channel.",
    overview: "Millennium Park is a contemporary public space located in Pajo, near the base of the Mactan-Mandaue bridges. It offers residents and visitors a place to relax and enjoy the breeze and the active maritime traffic of the Mactan Channel. The park is especially popular in the evenings for its view of the lit bridges and the cool sea air, providing a modern urban escape.",
    significance: "This park represents the modern urban development and coastal heritage of Lapu-Lapu City. It provides a vital public recreational space that links the city's industrial bridge infrastructure with community life and maritime scenery, reflecting the island's 21st-century growth.",
    category: "Plazas, Parks & Public Spaces",
    location: "Pajo, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/millennium/800/600",
    galleryImages: [
      "https://picsum.photos/seed/bridge-view-park/800/600"
    ],
    rating: 4.1,
    tags: ["park", "coastal", "bridge-view"],
    coordinates: { lat: 10.324856, lng: 123.968125 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Millennium+Park+Lapu-Lapu",
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Open Access'
  },
  {
    id: 'llc-bridge-park',
    name: "Old Bridge Park",
    description: "A community park located under the First Mactan-Mandaue Bridge.",
    overview: "The Old Bridge Park is a unique public space reclaimed from the industrial area beneath the first Mactan-Mandaue Bridge. It has been transformed into a community destination featuring courts, sitting areas, and views of the channel. The park provides an unconventional urban getaway that showcases the industrial heritage and the creative spirit of the local residents.",
    significance: "This park is an excellent example of adaptive urban design, turning infrastructural space into a cultural and recreational asset. It represents the resilience and community spirit of the local residents who utilize this space for social activities, physical exercise, and local events.",
    category: "Plazas, Parks & Public Spaces",
    location: "Pajo, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/bridgepark/800/600",
    galleryImages: [
      "https://picsum.photos/seed/under-bridge-park/800/600"
    ],
    rating: 4.0,
    tags: ["park", "industrial-heritage", "community"],
    coordinates: { lat: 10.317816, lng: 123.956807 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Old+Bridge+Park+Lapu-Lapu",
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Open Access'
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
    
    const matchesCity = city && city !== 'All' ? site.city === city : true;
    const matchesCategory = category && category !== 'All' ? site.category === category : true;
    
    return matchesQuery && matchesCity && matchesCategory;
  });
}
