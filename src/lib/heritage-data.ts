
export interface HeritageSite {
  id: string;
  name: string;
  description: string;
  category: string;
  location: string;
  city: 'Cebu City' | 'Lapu-Lapu City' | 'Mandaue City' | 'Talisay City';
  visitingHours: string;
  imageUrl: string;
  rating: number;
  tags: string[];
}

export const HERITAGE_SITES: HeritageSite[] = [
  {
    id: '1',
    name: "Magellan's Cross",
    description: "A Christian cross planted by Portuguese and Spanish explorers as ordered by Ferdinand Magellan upon arriving in Cebu in the Philippines on April 21, 1521.",
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
    description: "Fuerza de San Pedro is a military defense structure in Cebu, built by the Spanish under the command of Miguel López de Legazpi, first governor of the Captaincy General of the Philippines.",
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
    description: "The oldest Roman Catholic church in the Philippines, built on the spot where the image of the Santo Niño de Cebú was found in 1565.",
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
    name: "Mactan Shrine (Lapu-Lapu Monument)",
    description: "A memorial shrine located on Mactan Island in Cebu, marking the site of the Battle of Mactan where Ferdinand Magellan was killed by Lapu-Lapu's warriors.",
    category: "National Monument",
    location: "Punta Engaño, Lapu-Lapu City",
    city: "Lapu-Lapu City",
    visitingHours: "24 Hours",
    imageUrl: "https://picsum.photos/seed/lapulapu/800/600",
    rating: 4.7,
    tags: ["hero", "battle", "oceanview"]
  },
  {
    id: '5',
    name: "Heritage of Cebu Monument",
    description: "A tableau of sculptures made of concrete, bronze, brass and steel showing scenes about the history of Cebu.",
    category: "Arts & Culture",
    location: "Sikatuna St, Cebu City",
    city: "Cebu City",
    visitingHours: "8:00 AM - 5:00 PM",
    imageUrl: "https://picsum.photos/seed/sculpture/800/600",
    rating: 4.5,
    tags: ["sculpture", "history", "parian"]
  },
  {
    id: '6',
    name: "Talisay Liberation Park",
    description: "Marks the site of the landing of the American liberation forces in 1945 during World War II.",
    category: "Modern History",
    location: "Poblacion, Talisay City",
    city: "Talisay City",
    visitingHours: "6:00 AM - 10:00 PM",
    imageUrl: "https://picsum.photos/seed/talisay/800/600",
    rating: 4.3,
    tags: ["ww2", "park", "liberation"]
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
