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
}

export const HERITAGE_SITES: HeritageSite[] = [
  // --- CEBU CITY ---
  {
    id: 'cebu-1',
    name: "Basilica Minore del Santo Niño de Cebu",
    description: "The Basilica Minore del Santo Niño de Cebu is the oldest Roman Catholic church in the Philippines, established in 1565. It is located in the heart of downtown Cebu City, right next to the historic Magellan's Cross. The church was built on the exact spot where Spanish explorers found a holy statue of the Child Jesus in a burnt box. Its current stone structure features a beautiful mix of Muslim, Romanesque, and Neoclassical architectural styles that have been preserved for centuries. Every year, millions of pilgrims visit the basilica to pay their respects and light candles in the open-air courtyard. It serves as the primary religious center for the island and is a major landmark for international tourism. The church complex includes a museum, a large library, and peaceful gardens for prayer and reflection. It remains a living symbol of the deep faith and religious heritage of the Cebuano people. The building has been declared a National Historical Landmark and a treasure of Philippine culture.",
    significance: "This site is of immense importance because it marks the birthplace of Christianity in the Philippines and Southeast Asia. The basilica was established by the Augustinian friars during the historic expedition led by Miguel López de Legazpi. Its most precious treasure is the original wooden statue of the Santo Niño, which was a gift from Ferdinand Magellan to the Queen of Cebu in 1521. This relic is the oldest religious icon in the country and has survived multiple fires and wars over the centuries. The church played a central role in the Spanish colonization and the spread of the Catholic faith throughout the islands. It is also the focal point of the Sinulog Festival, which is one of the grandest and most famous cultural celebrations in Asia. Historically, it represents the transition from indigenous beliefs to a global religious tradition that defines the nation. The basilica serves as a constant reminder of the long-standing spiritual bond between the Philippines and the Spanish-speaking world. It stands as a monument to the resilience and enduring devotion of the Filipino people.",
    category: "Churches & Religious Heritage Sites",
    location: "Osmeña Blvd, Cebu City",
    city: "Cebu City",
    visitingHours: "6:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/basilica/800/600",
    galleryImages: [
      "https://picsum.photos/seed/basilica_alt_1/800/600",
      "https://picsum.photos/seed/basilica_alt_2/800/600",
      "https://picsum.photos/seed/basilica_alt_3/800/600",
      "https://picsum.photos/seed/basilica_alt_4/800/600"
    ],
    rating: 4.9,
    tags: ["oldest church", "relic", "pilgrimage"],
    coordinates: { lat: 10.2942, lng: 123.9021 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Basilica+Minore+del+Santo+Nino",
    isMustVisit: true
  },
  {
    id: 'cebu-2',
    name: "Cebu Metropolitan Cathedral",
    description: "The Cebu Metropolitan Cathedral is the seat of the Archdiocese of Cebu and one of the most prominent religious structures in the city. It is located just a few blocks away from the Basilica del Santo Niño and Magellan's Cross in the historic downtown area. The cathedral's design is characterized by its thick walls and a massive belfry, built specifically to withstand the frequent earthquakes and typhoons of the region. Its clean white facade stands out among the busy streets, welcoming both local worshippers and curious tourists. Inside, the church features a grand altar and beautiful stained glass windows that depict various religious scenes and local saints. The surrounding grounds are well-maintained, providing a quiet and shaded space for reflection amidst the city's noise. It currently functions as the main administrative church for the large Catholic community across the province. The structure has undergone several renovations over the years to preserve its classic look while improving its durability. It remains an active place of worship with daily masses and grand ceremonies for weddings and holidays.",
    significance: "The history of the Cebu Metropolitan Cathedral dates back to the early Spanish colonial period in 1565. It was one of the first churches established in the Philippines, serving as a center of ecclesiastical power for the Spanish Crown for centuries. The site is important because it represents the long-standing religious authority and the organizational growth of the Church in the Visayas. Throughout the centuries, the cathedral has witnessed the rise and fall of colonial governments and the birth of the Philippine Republic. It was heavily damaged during World War II but was rebuilt as a powerful symbol of the city's resilience and spiritual recovery. The architecture is a prime example of 'Earthquake Baroque,' designed for strength and stability against natural disasters. It holds a significant place in the hearts of Cebuanos as a place of historical continuity and constant spiritual guidance. The cathedral is also a repository of historical records and religious artifacts that tell the story of Cebu's conversion to Christianity. It serves as a reminder of the enduring cultural and religious link between the Philippines and the wider global community.",
    category: "Churches & Religious Heritage Sites",
    location: "Mabini St, Cebu City",
    city: "Cebu City",
    visitingHours: "5:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/cathedral/800/600",
    galleryImages: [
      "https://picsum.photos/seed/cathedral_alt_1/800/600",
      "https://picsum.photos/seed/cathedral_alt_2/800/600",
      "https://picsum.photos/seed/cathedral_alt_3/800/600"
    ],
    rating: 4.6,
    tags: ["cathedral", "archdiocese", "baroque"],
    coordinates: { lat: 10.2954, lng: 123.9028 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Cebu+Metropolitan+Cathedral",
    isMustVisit: false
  },
  {
    id: 'cebu-3',
    name: "Magellan's Cross",
    description: "Magellan’s Cross is a world-famous historical monument housed in a small stone pavilion in the heart of Cebu City. It is located in Plaza Sugbo, right next to the Cebu City Hall and the Basilica del Santo Niño. The cross itself is made of wood and is said to be the original one planted by Portuguese and Spanish explorers in 1521. Today, the original cross is protected inside another hollow cross made of dark tindalo wood to prevent people from taking chips of it. The ceiling of the pavilion features a beautiful mural that depicts the planting of the cross and the first Catholic baptism in the Philippines. Visitors often gather here to pray, take photos, and buy colored candles from local women who perform a traditional dance of prayer. The site is open to the public daily and is one of the most photographed landmarks in the entire country. It is a simple yet powerful structure that marks the very center of historic Cebu. The pavilion's architecture fits perfectly with the colonial-era surroundings, making it a key stop for any heritage tour.",
    significance: "This site is globally significant as it symbolizes the arrival of the Spanish expedition led by Ferdinand Magellan to the Philippine islands. It marks the precise moment in 1521 when the Philippines was first introduced to the Western world and the Christian faith. The planting of the cross signifies the beginning of Spanish influence, which would last for over 300 years and shape the nation's culture, laws, and language. It also represents the first recorded friendship and alliance between a European explorer and a local Filipino ruler, Rajah Humabon. The site is a constant reminder of the cultural fusion that occurred when indigenous traditions met European exploration. Historically, it is considered the 'ground zero' of the Philippines' colonial history and its conversion to Catholicism. The cross is a National Cultural Treasure and a key element of the country's national identity and pride. Its preservation is a top priority for the government as it tells the foundational story of how the Philippines became a unique nation in Asia. The mural above the cross serves as a visual history book, educating all who visit about their ancestral roots.",
    category: "Historical Landmarks & Monuments",
    location: "P. Burgos St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 6:00 PM",
    imageUrl: "https://picsum.photos/seed/magellan/800/600",
    galleryImages: [
      "https://picsum.photos/seed/magellan_alt_1/800/600",
      "https://picsum.photos/seed/magellan_alt_2/800/600",
      "https://picsum.photos/seed/magellan_alt_3/800/600"
    ],
    rating: 4.8,
    tags: ["cross", "magellan", "landmark"],
    coordinates: { lat: 10.2936, lng: 123.9019 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Magellan%27s+Cross+Cebu",
    isMustVisit: true
  },
  {
    id: 'cebu-5',
    name: "Casa Gorordo Museum",
    description: "Casa Gorordo Museum is a beautifully restored historic home that offers a glimpse into 19th-century Cebuano lifestyle. It was once the private residence of Juan Gorordo, the first Filipino Bishop of Cebu, and was later acquired by a local foundation for preservation. The museum is situated in the Parian district, which was the elite neighborhood of old Cebu during the Spanish era. The house is built in the traditional 'bahay na bato' style, with a heavy stone base and a spacious wooden upper floor. Visitors can explore the dining areas, bedrooms, and family chapel, all furnished with original period pieces and antique decor. The ground floor now houses a modern cafe and a gift shop, blending the old with the new in a natural way. The museum also features a well-curated garden and a courtyard that often hosts cultural events and workshops. It provides an immersive experience that makes history feel alive and accessible to everyone who walks through its doors. The museum is known for its excellent guided tours that explain every detail of the house.",
    significance: "Casa Gorordo is a National Historical Landmark that represents the height of Filipino-Spanish-Chinese social blending in the 1800s. It is important because it showcases the lifestyle of the 'Mestizo de Parian,' the influential merchant class of that era. The house survived the heavy bombing of World War II, making it a rare surviving example of pre-war urban architecture in Cebu. Historically, it served as a social center for the city's elite and a residence for one of the most important religious figures in the country. It illustrates the transition from a traditional colonial society to a more modern and independent Filipino identity. The museum's collections explain the cultural practices, religious devotions, and daily habits of the time in great detail. It is a vital educational resource for understanding the social structure and economic history of Cebu. The preservation of this site ensures that the unique architectural heritage of the Parian district is not forgotten. It stands as a symbol of Cebuano pride and the city's rich multi-cultural history. Visiting this house is like stepping into a time machine to a more elegant era.",
    category: "Museums & Cultural Institutions",
    location: "Lopez Jaena St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/gorordo/800/600",
    galleryImages: [
      "https://picsum.photos/seed/gorordo_alt_1/800/600",
      "https://picsum.photos/seed/gorordo_alt_2/800/600",
      "https://picsum.photos/seed/gorordo_alt_3/800/600"
    ],
    rating: 4.7,
    tags: ["lifestyle", "mansion", "museum"],
    coordinates: { lat: 10.2995, lng: 123.9042 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Casa+Gorordo+Museum",
    isMustVisit: true
  },
  {
    id: 'cebu-6',
    name: "Yap-Sandiego Ancestral House",
    description: "The Yap-Sandiego Ancestral House is one of the oldest residential homes in the Philippines, built in the late 17th century. It is located in the heart of the Parian district in Cebu City and is still owned by the descendants of the original family. The house is constructed from coral stone and molave wood, held together by ancient building techniques like using egg whites in the mortar. Its roof is made of heavy red clay tiles, which is a classic and beautiful feature of Spanish colonial architecture. Inside, the house is filled with a staggering collection of antiques, religious icons, and family heirlooms passed down through generations. Despite its age, the structure remains sturdy and is open to the public as a private museum. Visitors can walk through the narrow hallways and see the original kitchen, bedrooms, and prayer rooms. The house is famous for its 'lived-in' feel, as if the original owners might walk in at any moment to welcome you. It is a unique place where history feels very close and personal.",
    significance: "This site is a rare and precious survivor of the early Spanish colonial period, pre-dating many other heritage sites in the country. It is important because it represents the prosperity and influence of the Chinese-Filipino community in the Parian district during the 1600s. The house was built by Don Juan Yap and Doña Maria Florido, who were part of the early merchant class that drove Cebu's economy. Historically, it is a testament to the durability of indigenous materials combined with European design principles and Chinese craftsmanship. The preservation of the house by the Sandiego family for over 300 years is a remarkable feat of cultural stewardship and family pride. It provides a direct link to the early days of the Spanish occupation and the birth of the unique mestizo culture. The house is a National Historical Landmark and is recognized as a treasure of Philippine domestic architecture. It tells a story of family resilience, heritage, and the enduring nature of Cebuano culture. Visiting this house helps people appreciate the strength of traditional building methods. It remains a key part of the city's historical narrative.",
    category: "Ancestral Houses & Heritage Residences",
    location: "Mabini St, Parian, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 6:00 PM",
    imageUrl: "https://picsum.photos/seed/yap/800/600",
    galleryImages: [
      "https://picsum.photos/seed/yap_alt_1/800/600",
      "https://picsum.photos/seed/yap_alt_2/800/600",
      "https://picsum.photos/seed/yap_alt_3/800/600"
    ],
    rating: 4.7,
    tags: ["ancestral house", "parian", "colonial"],
    coordinates: { lat: 10.2987, lng: 123.9034 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Yap-Sandiego+Ancestral+House",
    isMustVisit: true
  },
  {
    id: 'cebu-11',
    name: "Fort San Pedro",
    description: "Fort San Pedro is a historic military defense structure located near the waterfront in downtown Cebu City. It is the oldest and smallest triangular bastion fort in the Philippines, with a history dating back to 1565. The fort is built of coral stone and features three massive bastions: San Miguel, La Concepcion, and Ignacio de Loyola. Today, it is a peaceful public park and a museum where visitors can walk along the high ramparts and see ancient cannons. The interior courtyard is filled with lush gardens, tropical plants, and stone benches, making it a popular spot for relaxation and photography. There is also a small gallery that displays maps, paintings, and artifacts from the Spanish colonial era. The fort overlooks the Plaza Independencia and provides a great view of the city's busy port area. It is well-preserved and offers a quiet, cool escape from the surrounding urban traffic and noise. It is one of the city's most beloved heritage landmarks.",
    significance: "This site is historically important as the very first military stronghold established by the Spanish in the Philippines. It was built under the direction of Miguel López de Legazpi to protect the early settlement from local attackers and foreign pirates. Over the centuries, the fort served many roles, including a barracks, a prison, and even a city zoo during the post-war era. It symbolizes the arrival of Spanish colonial power and the beginning of the city's modern administrative history. The architecture of the fort is a prime example of Spanish military engineering adapted to local materials like coral stone and lime. During the Philippine Revolution, it was a site of struggle between Filipino revolutionaries and the Spanish military forces. It also played a role during the American and Japanese occupations of the island in the 20th century. Today, it stands as a National Historical Landmark and a symbol of Cebu's enduring strength and resilience. It is a vital part of the city's heritage trail and its national identity. The fort remains a powerful monument to the city's long and complex history.",
    category: "Historical Landmarks & Monuments",
    location: "A. Pigafetta Street, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 7:00 PM",
    imageUrl: "https://picsum.photos/seed/fort/800/600",
    galleryImages: [
      "https://picsum.photos/seed/fort_alt_1/800/600",
      "https://picsum.photos/seed/fort_alt_2/800/600",
      "https://picsum.photos/seed/fort_alt_3/800/600",
      "https://picsum.photos/seed/fort_alt_4/800/600"
    ],
    rating: 4.6,
    tags: ["fort", "spanish", "military history"],
    coordinates: { lat: 10.2924, lng: 123.9056 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Fort+San+Pedro+Cebu",
    isMustVisit: true
  },
  {
    id: 'lapu-4',
    name: "Mactan Shrine (Liberty Shrine)",
    description: "The Mactan Shrine, also known widely as the Liberty Shrine, is a major historic memorial park located in Punta Engaño, Lapu-Lapu City. The park features two main and grand monuments: a 20-meter tall bronze statue of the local hero Lapu-Lapu and a smaller stone obelisk for Ferdinand Magellan. The statue of Lapu-Lapu depicts him as a powerful and brave warrior holding a shield and a traditional kampilan sword, facing the sea. The park is a well-maintained open-air museum with large, colorful murals and detailed plaques that tell the story of the famous Battle of Mactan. It is situated on the exact spot where the historic battle is believed to have taken place in April 1521. Visitors can explore the gardens, walk along the historic shore, and learn about the first successful resistance against foreign rule in the islands. The park is a top tourist destination and is the site of a grand reenactment ceremony held every April. It is a place of deep national pride, history, and natural seaside beauty. The shrine is a landmark for all Filipinos.",
    significance: "This site is historically significant as the location of the Battle of Mactan on April 27, 1521, which changed the course of world history. It is important because it marks the very first time that a native Filipino leader successfully defeated a powerful European expedition. Lapu-Lapu is honored here as the 'First Filipino Hero' for his incredible bravery in defending his people's sovereignty and land. Historically, the site represents the clash and the first encounter between the indigenous culture of the islands and the expanding Spanish empire. The double monuments—one for the native victor and one for the fallen explorer—symbolize the complex and multi-layered nature of Philippine history. The park is a National Historical Landmark and a powerful symbol of national identity, freedom, and courage for all Filipinos. It is a vital and essential educational resource that teaches the values of patriotism, independence, and international history. The shrine ensures that the memory of the first act of resistance against colonization in the Philippines is preserved for all time. It stands as a powerful and lasting monument to the strength, dignity, and sovereignty of the Filipino people. It is a place of reflection on the nation's origins.",
    category: "Historical Landmarks & Monuments",
    location: "Punta Engaño, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/mactan_shrine/800/600",
    galleryImages: [
      "https://picsum.photos/seed/mactan_alt_1/800/600",
      "https://picsum.photos/seed/mactan_alt_2/800/600",
      "https://picsum.photos/seed/mactan_alt_3/800/600"
    ],
    rating: 4.8,
    tags: ["national monument", "hero", "battle of mactan"],
    coordinates: { lat: 10.3115, lng: 123.9585 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Mactan+Shrine+Lapu-Lapu",
    isMustVisit: true
  },
  // Add other sites with simplified gallery data or leave as empty arrays
  {
    id: 'cebu-4',
    name: "Archdiocesan Museum of Cebu",
    description: "The Archdiocesan Museum of Cebu is a cultural institution dedicated to preserving the deep religious history of the Visayas region...",
    significance: "This museum is important because it holds the key to understanding the deep-rooted Catholic traditions of the Cebuano people...",
    category: "Museums & Cultural Institutions",
    location: "Mabini St, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/arch_museum/800/600",
    galleryImages: [],
    rating: 4.4,
    tags: ["museum", "religious art", "history"],
    coordinates: { lat: 10.2951, lng: 123.9025 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Archdiocesan+Museum+of+Cebu",
    isMustVisit: false
  },
  {
    id: 'cebu-7',
    name: "1730 Jesuit House (Museo de Parian)",
    description: "The 1730 Jesuit House, also known as Museo de Parian, is a hidden gem tucked inside a modern warehouse...",
    significance: "This site is historically significant as one of the oldest dated residences in the entire Philippines...",
    category: "Museums & Cultural Institutions",
    location: "Zulueta St, Parian, Cebu City",
    city: "Cebu City",
    visitingHours: "8:30 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/jesuit/800/600",
    galleryImages: [
      "https://picsum.photos/seed/jesuit_alt_1/800/600",
      "https://picsum.photos/seed/jesuit_alt_2/800/600"
    ],
    rating: 4.7,
    tags: ["jesuit", "hidden history", "museum"],
    coordinates: { lat: 10.2982, lng: 123.9031 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Jesuit+House+of+1730",
    isMustVisit: true
  },
  {
    id: 'cebu-8',
    name: "National Museum of the Philippines – Cebu (Aduana Building)",
    description: "The National Museum of the Philippines – Cebu is located in the magnificent Aduana Building...",
    significance: "The Aduana Building is a National Historical Landmark and one of the finest examples of American colonial architecture...",
    category: "Museums & Cultural Institutions",
    location: "Aduana Building, Cebu City",
    city: "Cebu City",
    visitingHours: "9:00 AM - 6:00 PM",
    imageUrl: "https://picsum.photos/seed/aduana/800/600",
    galleryImages: [
      "https://picsum.photos/seed/aduana_alt_1/800/600",
      "https://picsum.photos/seed/aduana_alt_2/800/600"
    ],
    rating: 4.8,
    tags: ["national museum", "aduana", "gallery"],
    coordinates: { lat: 10.2925, lng: 123.9065 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=National+Museum+Cebu",
    isMustVisit: true
  },
  {
    id: 'talisay-1',
    name: "Talisay Landing Site",
    description: "The Talisay Landing Site is a powerful historical memorial located along the shores of Larawan Beach in Talisay City...",
    significance: "This site is historically significant as the location of the 'Liberation of Cebu' which began on March 26, 1945...",
    category: "Historical Landmarks & Monuments",
    location: "Larawan Beach, Talisay City",
    city: "Talisay City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/talisay_landing/800/600",
    galleryImages: [
      "https://picsum.photos/seed/talisay_alt_1/800/600",
      "https://picsum.photos/seed/talisay_alt_2/800/600"
    ],
    rating: 4.4,
    tags: ["ww2", "liberation", "beach"],
    coordinates: { lat: 10.2525, lng: 123.8445 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=Talisay+Landing+Site",
    isMustVisit: true
  },
  {
    id: 'mandaue-1',
    name: "National Shrine of Saint Joseph",
    description: "The National Shrine of Saint Joseph is the primary and historic Catholic church of Mandaue City...",
    significance: "This shrine is historically significant as one of the oldest parishes in Cebu, established originally by the Jesuits in 1580...",
    category: "Churches & Religious Heritage Sites",
    location: "P. Burgos St, Mandaue City",
    city: "Mandaue City",
    visitingHours: "6:00 AM - 8:00 PM",
    imageUrl: "https://picsum.photos/seed/mandaue_church/800/600",
    galleryImages: [
      "https://picsum.photos/seed/mandaue_alt_1/800/600",
      "https://picsum.photos/seed/mandaue_alt_2/800/600"
    ],
    rating: 4.5,
    tags: ["shrine", "mandaue", "religious heritage"],
    coordinates: { lat: 10.3295, lng: 123.9392 },
    googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=National+Shrine+of+St.+Joseph",
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
