export type VerificationStatus = 'Pending Verification' | 'LGU Verified' | 'Needs Revision' | 'Rejected';

/**
 * 1. Physical Preservation Status (distinct from operating hours and visitor access)
 */
export type PhysicalPreservationStatus =
  | 'Standing'
  | 'Restored'
  | 'Partially Ruined / Ruins'
  | 'Damaged / Under Restoration'
  | 'Demolished / Lost';

/**
 * 2. Administrative Visitor-Access Status (configured by administrators, NOT calculated from the clock)
 */
export type VisitorAccessStatus =
  | 'Publicly Accessible'
  | 'Guided / Ticketed Entry'
  | 'Exterior Access Only'
  | 'Restricted Grounds'
  | 'By Appointment Only'
  | 'Private Residence'
  | 'Temporarily Closed'
  | 'Temporarily Closed Interior'
  | 'Temporarily Closed Grounds'
  | 'Permanently Closed'
  | 'Demolished / Lost'
  | 'Unknown / Unverified';

/**
 * 3. Calculated Real-Time Status (dynamically computed in Asia/Manila timezone, UTC+8)
 */
export type CalculatedRealtimeStatus =
  | 'Open Now'
  | 'Closing Soon'
  | 'Closed'
  | 'Open 24 Hours'
  | 'Exterior Viewable Now'
  | 'By Appointment Only'
  | 'Temporarily Closed'
  | 'Permanently Closed'
  | 'Private Residence'
  | 'Hours Unverified'
  | 'Requires Confirmation';

export type DayOfWeek =
  | 'sunday'
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday';

export const ALL_DAYS_OF_WEEK: DayOfWeek[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export const WEEKDAYS_MONDAY_TO_SATURDAY: DayOfWeek[] = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

/**
 * 24-hour time period ("HH:mm").
 * - `open`: "00:00" to "23:59" (0..1439 minutes)
 * - `close`: "00:01" to "24:00" (1..1440 minutes), or "00:00".."23:59" when close < open (overnight)
 */
export interface OperatingTimePeriod {
  open: string;
  close: string;
  label?: string;
}

export type DailyScheduleState =
  | 'open'
  | 'open_24_hours'
  | 'closed'
  | 'by_appointment'
  | 'not_specified';

export interface DailyOperatingSchedule {
  state: DailyScheduleState;
  periods: OperatingTimePeriod[];
  notes?: string;
}

export type EvaluatorTargetScope = 'interior' | 'exterior_grounds';

export type AccessScope =
  | 'full_site'
  | 'interior_only'
  | 'exterior_grounds_only';

/**
 * Canonical Scope Mapping Helper (used identically for main-site and sub-facility evaluation):
 * - 'full_site' applies to BOTH 'interior' and 'exterior_grounds'
 * - 'interior_only' applies ONLY to 'interior'
 * - 'exterior_grounds_only' applies ONLY to 'exterior_grounds'
 */
export function doesAccessScopeApply(
  ruleScope: AccessScope,
  targetScope: EvaluatorTargetScope
): boolean {
  if (ruleScope === 'full_site') return true;
  if (ruleScope === 'interior_only') return targetScope === 'interior';
  if (ruleScope === 'exterior_grounds_only') return targetScope === 'exterior_grounds';
  return false;
}

export type VerifiableClaimType =
  | 'global_visitor_access_policy'
  | 'interior_access_policy'
  | 'interior_regular_schedule'
  | 'exterior_grounds_access_policy'
  | 'exterior_grounds_regular_schedule'
  | 'exterior_street_visibility'
  | 'temporary_closure'
  | 'special_schedule'
  | 'sub_facility_access_policy'
  | 'sub_facility_regular_schedule';

export interface ScheduleVerificationSource {
  id?: string;
  title: string;
  publisher: string;
  url: string;
  sourceType:
    | 'Official Museum / Institution Website'
    | 'Official LGU / Tourism Portal'
    | 'Official Church / Basilica Website'
    | 'Official Institutional Announcement'
    | 'Verified News Report';
  checkedDate: string; // "YYYY-MM-DD"
  supportedClaims: VerifiableClaimType[];
  notes?: string;
}

export interface ExteriorStreetVisibilityInfo {
  status:
    | 'Viewable from Public Street'
    | 'Partially Viewable from Street'
    | 'Not Viewable from Public Street'
    | 'Unknown / Unverified';
  isVerified: boolean;
  sources: ScheduleVerificationSource[];
  lastVerifiedDate: string | null;
  notes?: string;
}

export interface InteriorAccessInfo {
  policyStatus:
    | 'Publicly Accessible Interior'
    | 'Guided / Ticketed Interior'
    | 'By Appointment Only'
    | 'No Public Interior Access'
    | 'Temporarily Closed Interior'
    | 'Not Applicable (Open-Air / Exterior Landmark)'
    | 'Unknown / Unverified';
  policyVerified: boolean;
  policySources: ScheduleVerificationSource[];
  scheduleVerified: boolean;
  verifiedDays: DayOfWeek[];
  weeklyCoverage: 'all_7_days' | 'partial_days_only' | 'none';
  regularHours: Record<DayOfWeek, DailyOperatingSchedule>;
  scheduleSources: ScheduleVerificationSource[];
  lastVerifiedDate: string | null;
  notes?: string;
}

export interface ExteriorGroundsAccessInfo {
  policyStatus:
    | 'Publicly Accessible Grounds'
    | 'Accessible Within Gate Hours'
    | 'Ticketed / Guided Grounds'
    | 'Restricted / Gated Compound'
    | 'Private Property Grounds'
    | 'Temporarily Closed Grounds'
    | 'Unknown / Unverified';
  policyVerified: boolean;
  policySources: ScheduleVerificationSource[];
  scheduleVerified: boolean;
  verifiedDays: DayOfWeek[];
  weeklyCoverage: 'all_7_days' | 'partial_days_only' | 'none';
  regularHours: Record<DayOfWeek, DailyOperatingSchedule>;
  scheduleSources: ScheduleVerificationSource[];
  lastVerifiedDate: string | null;
  notes?: string;
}

export interface TemporaryClosureEntry {
  id: string;
  startDate: string; // "YYYY-MM-DD" in Asia/Manila
  endDate: string;   // "YYYY-MM-DD" in Asia/Manila (inclusive)
  startTime?: string; // Optional "HH:mm" ("00:00" - "23:59")
  endTime?: string;   // Optional "HH:mm" ("00:01" - "24:00", or overnight "00:00" - "23:59")
  multiDayTimeMode?: 'continuous' | 'daily_window';
  reason: string;
  scope: AccessScope;
  isVerified: boolean;
  sources: ScheduleVerificationSource[];
  lastVerifiedDate?: string;
}

export interface SpecialScheduleEntry {
  id: string;
  label: string;
  date?: string;      // Exact date "YYYY-MM-DD"
  startDate?: string; // Range start "YYYY-MM-DD"
  endDate?: string;   // Range end "YYYY-MM-DD"
  scope: AccessScope;
  state: 'open' | 'open_24_hours' | 'closed' | 'by_appointment';
  periods: OperatingTimePeriod[];
  priority?: number;
  allowYesterdayOvernightCarryOver?: boolean;
  enforceOnSubFacilities?: boolean;
  isVerified: boolean;
  sources: ScheduleVerificationSource[];
  lastVerifiedDate?: string;
  notes?: string;
}

export interface AccessVerificationMetadata {
  scheduleVerified: boolean;
  visitorAccessStatusVerified: boolean;
  visitorAccessStatusSources: ScheduleVerificationSource[];
  verifiedDays: DayOfWeek[];
  weeklyCoverage: 'all_7_days' | 'partial_days_only' | 'none';
  interiorAccessPolicyVerified: boolean;
  interiorScheduleVerified: boolean;
  exteriorGroundsPolicyVerified: boolean;
  exteriorGroundsScheduleVerified: boolean;
  exteriorStreetVisibilityVerified: boolean;
  verificationStatusLabel:
    | 'Verified'
    | 'Verified (Listed Days Only)'
    | 'Verified Schedule (Access Policy Unverified)'
    | 'Partially Verified (Sub-Facility Only)'
    | 'Requires Clarification (Official Source Discrepancy)'
    | 'Unverified';
  lastVerifiedDate: string | null;
  sources: ScheduleVerificationSource[];
  verificationNotes?: string;
}

export interface SubFacilitySchedule {
  id: string;
  name: string;
  targetScope: EvaluatorTargetScope;
  visitorAccessStatus: VisitorAccessStatus;
  visitorAccessStatusVerified: boolean;
  policySources: ScheduleVerificationSource[];
  allowParentPolicyOverride?: boolean;
  overrideReason?: string;
  isVerified: boolean;
  verifiedDays: DayOfWeek[];
  weeklyCoverage: 'all_7_days' | 'partial_days_only' | 'none';
  regularHours: Record<DayOfWeek, DailyOperatingSchedule>;
  scheduleSources: ScheduleVerificationSource[];
  temporaryClosures?: TemporaryClosureEntry[];
  specialSchedules?: SpecialScheduleEntry[];
  lastVerifiedDate: string | null;
  notes?: string;
}

export interface OperatingSchedule {
  timezone: 'Asia/Manila';
  physicalPreservationStatus: PhysicalPreservationStatus;
  visitorAccessStatus: VisitorAccessStatus;
  primaryVisitorScope: EvaluatorTargetScope;
  interiorAccess: InteriorAccessInfo;
  exteriorGroundsAccess: ExteriorGroundsAccessInfo;
  exteriorStreetVisibility: ExteriorStreetVisibilityInfo;
  regularHours: Record<DayOfWeek, DailyOperatingSchedule>;
  specialSchedules: SpecialScheduleEntry[];
  temporaryClosures: TemporaryClosureEntry[];
  subFacilities?: SubFacilitySchedule[];
  verification: AccessVerificationMetadata;
  displaySummary: string;
  publicNotes?: string;
}

export type AdmissionStatus = 'free' | 'paid' | 'unverified' | 'not_available';

export type AdmissionPolicyKind =
  | 'formal_policy'
  | 'open_public_access'
  | 'mixed_subfacilities'
  | 'unverified';

export interface AdmissionCategoryRate {
  category: string;
  amount: string;
  notes?: string;
}

export interface AdmissionSubFacility {
  name: string;
  status: AdmissionStatus;
  isVerified: boolean;
  label: string;
  notes?: string;
}

export interface AdmissionSourceReference {
  title: string;
  publisher: string;
  url: string;
  checkedDate: string;
}

export interface AdmissionInfo {
  status: AdmissionStatus;
  isVerified: boolean;
  policyKind?: AdmissionPolicyKind;
  scope?: string;
  displayLabel: string;
  rates?: AdmissionCategoryRate[];
  subFacilities?: AdmissionSubFacility[];
  sources?: AdmissionSourceReference[];
  notes?: string;
}

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
  visitingHours: string; // Compatibility/display field only — never treated as evidence of verified hours
  operatingSchedule?: OperatingSchedule;
  admissionInfo?: AdmissionInfo;
  imageUrl: string;
  galleryImages?: string[];
  imageAttributions?: { url: string; creator: string; license: string; licenseUrl: string }[];
  rating?: number;
  tags: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  isMustVisit: boolean;
  needsVerification?: boolean;
  verificationStatus?: VerificationStatus;
  verifiedBy?: string;
  verifiedByUid?: string;
  verifiedAt?: string;
  verificationNotes?: string;
  isActive: boolean;
  status: 'Active' | 'Inactive';
  demolitionStatus: 'Non-Demolished' | 'Demolished' | 'Partially Demolished';
  accessibilityStatus: string;
  entranceFee?: string;
}

export const DEPRECATED_HERITAGE_SITE_IDS = [
  'llc-happyworld',
  'cebu-provincial-capitol',
  'fuente-osmeña-circle',
];

const BASE_HERITAGE_SITES: HeritageSite[] = [
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
    visitingHours: "Monday to Sunday, 6:00 AM - 8:00 PM",
    imageUrl: "/heritage-sites/basilica1.jpg",
    galleryImages: [
      "/heritage-sites/basilica1.jpg",
      "/heritage-sites/basilica2.jpg",
      "/heritage-sites/basilica3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/1/1c/Basilica_Minore_del_Santo_Nino.jpg",
    ],

    rating: 4.9,
    tags: ["oldest church", "religious", "sinulog"],
    coordinates: { lat: 10.29419, lng: 123.90212 },
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
    entranceFee: 'Free Admission'
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
    visitingHours: "Monday to Sunday, 5:00 AM - 8:00 PM",
    imageUrl: "/heritage-sites/metropolitancebucathedral1.jpg",
    galleryImages: [
      "/heritage-sites/metropolitancebucathedral1.jpg",
      "/heritage-sites/metropolitancebucathedral2.jpg",
      "/heritage-sites/metropolitancebucathedral3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/4/4a/Cebu_Metropolitan_Cathedral.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/5/59/Inside_the_Cebu_Metropolitan_Cathedral..jpg",
    ],
    rating: 4.7,
    tags: ["cathedral", "baroque"],
    coordinates: { lat: 10.29564, lng: 123.90297 },
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
    entranceFee: 'Free Admission'
  },
  {
    id: 'cebu-cross',
    name: "Magellan’s Cross",
    description: "The site where the first Christian cross was planted in 1521.",
    overview: "Housed in an octagonal stone kiosk next to the Basilica, Magellan's Cross is the most iconic symbol of Cebu City. The wooden cross visible to the public is said to contain fragments of the original cross planted by Ferdinand Magellan's expedition on April 14, 1521. The ceiling of the pavilion is adorned with murals depicting the first baptism of the native Filipinos. It is a site of deep historical reverence and is often visited by tourists and locals who offer prayers and lighting of candles.",
    significance: "This site marks the beginning of the Spanish colonial era and the introduction of Christianity to the archipelago. It is a powerful emblem of the historical encounter between the West and the East in the 16th century, representing the foundational moment of Philippine colonial history and religious transformation.",
    category: "Historical Landmarks & Monuments",
    location: "P. Burgos St, Cebu City",
    city: "Cebu City",
    visitingHours: "Monday to Sunday, 8:00 AM - 6:00 PM",
    imageUrl: "/heritage-sites/magellanscross1.jpg",
    galleryImages: [
      "/heritage-sites/magellanscross1.jpg",
      "/heritage-sites/magellanscross2.jpg",
      "/heritage-sites/magellanscross3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/0/05/Magellan's_Cross_Cebu.jpg",
    ],
    rating: 4.8,
    tags: ["cross", "magellan"],
    coordinates: { lat: 10.29365, lng: 123.90196 },
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
    entranceFee: 'Free Admission'
  },
  {
    id: 'cebu-archdiocesan-museum',
    name: "Archdiocesan Museum of Cebu",
    description: "A museum showcasing the religious history and artifacts of the Archdiocese.",
    overview: "Located within the Cebu Cathedral complex, this museum is housed in the historic 'Bahay na Bato' that once served as the rectory of the cathedral. The museum features several galleries displaying a vast collection of ecclesiastical treasures, including century-old vestments, silver altarpieces, and religious statues from various parishes across Cebu. The architecture of the building itself is a highlight, showcasing the traditional Filipino stone house design of the 19th century.",
    significance: "The museum preserves the material culture of the Catholic faith in Cebu. It provides a rare look at the artistic and historical development of religious practice in the Visayas since the early Spanish period, serving as an important resource for researchers and devotees alike.",
    category: "Museums & Cultural Institutions",
    location: "Cathedral Complex, Mabini St, Cebu City",
    city: "Cebu City",
    visitingHours: "Monday to Sunday, 9:00 AM - 5:00 PM",
    imageUrl: "/heritage-sites/Archdiocesanmuseumofcebu1.jpg",
    galleryImages: [
      "/heritage-sites/Archdiocesanmuseumofcebu1.jpg",
      "/heritage-sites/Archdiocesanmuseumofcebu2.jpg",
      "/heritage-sites/Archdiocesanmuseumofcebu3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/e/e6/The_Archdiocesan_Museum_of_Cebu_3.jpg",
    ],
    rating: 4.5,
    tags: ["museum", "religious-art"],
    coordinates: { lat: 10.29604, lng: 123.90350 },
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
    entranceFee: '₱50'
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
    visitingHours: "Monday to Sunday, 9:00 AM - 5:00 PM",
    imageUrl: "/heritage-sites/casagorordomuseum1.jpg",
    galleryImages: [
      "/heritage-sites/casagorordomuseum1.jpg",
      "/heritage-sites/casagorordomuseum2.jpg",
      "/heritage-sites/casagorordomuseum3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/9/9e/Casa_Gorordo_Museum_(E._Aboitiz,_Cebu_City;_09-05-2022).jpg",
    ],
    rating: 4.7,
    tags: ["mansion", "lifestyle"],
    coordinates: { lat: 10.29990, lng: 123.90483 },
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
    entranceFee: "₱100 (self-guided) / ₱150 (guided) / ₱50 (students, seniors, PWD)",
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
    visitingHours: "Monday to Sunday, 9:00 AM - 6:00 PM",
    imageUrl: "/heritage-sites/yapsandiegoancestralhouse1.jpg",
    galleryImages: [
      "/heritage-sites/yapsandiegoancestralhouse1.jpg",
      "/heritage-sites/yapsandiegoancestralhouse2.jpg",
      "/heritage-sites/yapsandiegoancestralhouse3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/f/fe/Yap-Sandiego_Ancestral_House,_Cebu_City.jpg",
    ],
    rating: 4.7,
    tags: ["ancestral", "parian"],
    coordinates: { lat: 10.29928, lng: 123.90400 },
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
    entranceFee: '₱50'
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
    visitingHours: "Monday to Sunday, 9:00 AM - 4:30 PM",
    imageUrl: "/heritage-sites/1730jesuithouse1.jpg",
    galleryImages: [
      "/heritage-sites/1730jesuithouse1.jpg",
      "/heritage-sites/1730jesuithouse2.jpg",
      "/heritage-sites/1730jesuithouse3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/5/5f/1730_Jesuit_House_Museum.jpg",
    ],
    rating: 4.6,
    tags: ["jesuit", "hidden-gem"],
    coordinates: { lat: 10.29869, lng: 123.90401 },
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
    entranceFee: "₱50–100 (approx.)",
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
    visitingHours: "Monday to Sunday, 9:00 AM - 6:00 PM",
    imageUrl: "/heritage-sites/nationalmuseumofthephilippinsecebu1.jpg",
    galleryImages: [
      "/heritage-sites/nationalmuseumofthephilippinsecebu1.jpg",
      "/heritage-sites/nationalmuseumofthephilippinsecebu2.jpg",
      "/heritage-sites/nationalmuseumofthephilippinsecebu3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/5/59/National_Museum_of_the_Philippines-Cebu.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/9/98/Exploring_Cebu_Plaza_Independencia_and_National_Museum_of_the_Philippines_in_Cebu_City,_Cebu,_Philippines_2.jpg",

    ],
    rating: 4.8,
    tags: ["museum", "aduana"],
    coordinates: { lat: 10.29199, lng: 123.90441 },
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
    entranceFee: 'Free Admission'
  },
  {
    id: 'cebu-sugbu-chinese-museum',
    name: "Sugbu Chinese Heritage Museum",
    description: "A museum preserving the history and cultural legacy of the Chinese-Cebuano community.",
    overview: "The Sugbu Chinese Heritage Museum is housed in the historic Gotiaoco Building near Cebu City Hall and Magellan's Cross. Its galleries highlight centuries of exchange between Cebu and China through dioramas, trade artifacts, family archives, and cultural exhibits. The museum presents the long presence and contributions of Chinese-Filipino communities in Cebu, from early maritime trade to contemporary civic, commercial, and cultural life.",
    significance: "This museum fills an important gap in Cebu's heritage landscape by documenting Chinese-Cebuano history as part of the broader story of the city. Located inside a historic commercial building, it connects the material heritage of Cebu's old port district with the social history of migration, trade, entrepreneurship, and cultural exchange.",
    category: "Museums & Cultural Institutions",
    location: "Gotiaoco Building, M.C. Briones St. corner P. Burgos St., Cebu City",
    city: "Cebu City",
    visitingHours: "Monday to Sunday, 10:00 AM - 5:00 PM",
    imageUrl: "/heritage-sites/sugbuchineseheritagemuseum1.jpg",
    galleryImages: [
      "/heritage-sites/sugbuchineseheritagemuseum1.jpg",
      "/heritage-sites/sugbuchineseheritagemuseum2.jpg",
      "/heritage-sites/sugbuchineseheritagemuseum3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/1/14/Sugbu_Chinese_Heritage_Museum,_Cebu_City,_Jan_2024.jpg",
    ],
    rating: 4.6,
    tags: ["museum", "chinese", "gotiaoco", "trade", "culture"],
    coordinates: { lat: 10.29386, lng: 123.90268 },
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
    entranceFee: 'Estimated Fee: ₱100'
  },
  {
    id: 'cebu-museo-sugbo',
    name: "Museo Sugbo",
    description: "Cebu's provincial museum housed in the former Carcel de Cebu jail complex.",
    overview: "Museo Sugbo is the Cebu Provincial Museum located along M.J. Cuenco Avenue. The museum occupies the former Carcel de Cebu, a Spanish-era jail later used as the Cebu Provincial Detention and Rehabilitation Center. Its galleries present Cebuano and Philippine history through archaeological finds, political history exhibits, presidential memorabilia, religious objects, and artifacts connected to trade and colonial life.",
    significance: "The site is important both as a museum collection and as a preserved historic structure. By adapting a former jail into a public museum, Museo Sugbo allows visitors to understand Cebu's civic, political, and social history inside a building that witnessed major phases of the province's colonial and modern development.",
    category: "Museums & Cultural Institutions",
    location: "731 M.J. Cuenco Ave., Cebu City",
    city: "Cebu City",
    visitingHours: "Monday to Sunday, 9:00 AM - 4:30 PM",
    imageUrl: "/heritage-sites/museosugbo1.jpg",
    galleryImages: [
      "/heritage-sites/museosugbo1.jpg",
      "/heritage-sites/museosugbo2.jpg",
      "/heritage-sites/museosugbo3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/9/93/Facade_of_Museo_Sugbo.jpg",
    ],
    rating: 4.6,
    tags: ["museum", "provincial", "carcel", "jail", "history"],
    coordinates: { lat: 10.3037910, lng: 123.9064311 },
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
    entranceFee: "₱30–75 (local/foreigner)",
  },
  {
    id: 'cebu-uspf-jose-rizal-museum',
    name: "USPF Mabini Campus - Jose Rizal Museum",
    description: "A Rizaliana museum associated with the University of Southern Philippines Foundation's Mabini Campus.",
    overview: "The USPF Mabini Campus - Jose Rizal Museum, also known as the USPF Rizaliana Museum, is associated with the University of Southern Philippines Foundation campus on Mabini Street in Cebu City. The museum has been known for exhibits about Dr. Jose Rizal's life, writings, travels, and legacy, including Rizaliana materials connected to the university's historical collection. It has served as an educational stop for students and heritage visitors interested in the national hero's influence beyond Luzon.",
    significance: "The museum is significant because Rizaliana collections outside Manila help show how Jose Rizal's memory and writings shaped civic education throughout the Philippines. Within the context of USPF's historic Mabini Campus, the museum connects Cebu's educational history with national memory, patriotism, and the continued interpretation of Rizal's life for younger generations.",
    category: "Museums & Cultural Institutions",
    location: "University of Southern Philippines Foundation Mabini Campus, Mabini St., Cebu City",
    city: "Cebu City",
    visitingHours: "Monday to Sunday, 9:00 AM - 5:00 PM",
    imageUrl: "/heritage-sites/uspfmabinicampusjoserizalmuseum1.jpg",
    galleryImages: [
      "/heritage-sites/uspfmabinicampusjoserizalmuseum1.jpg",
      "/heritage-sites/uspfmabinicampusjoserizalmuseum2.jpg",
      "/heritage-sites/uspfmabinicampusjoserizalmuseum3.jpg"
    ],
    rating: 4.5,
    tags: ["museum", "rizal", "rizaliana", "uspf", "education"],
    coordinates: { lat: 10.29627440778886, lng: 123.90358046564594 },
    isMustVisit: false,
    needsVerification: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
    entranceFee: 'Free Admission'
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
    visitingHours: "Monday to Sunday, 8:30 AM - 5:30 PM",
    imageUrl: "/heritage-sites/universityofsancarlosmuseum1.jpg",
    galleryImages: [
      "/heritage-sites/universityofsancarlosmuseum1.jpg",
      "/heritage-sites/universityofsancarlosmuseum2.jpg",
      "/heritage-sites/universityofsancarlosmuseum3.jpg"
    ],
    rating: 4.6,
    tags: ["academic", "artifacts"],
    coordinates: { lat: 10.30027, lng: 123.89835 },
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
    entranceFee: "₱30–75 (free for USC students)",
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
    visitingHours: "Monday to Sunday, 8:00 AM - 7:00 PM",
    imageUrl: "/heritage-sites/fortsanpedro1.jpg",
    galleryImages: [
      "/heritage-sites/fortsanpedro1.jpg",
      "/heritage-sites/fortsanpedro2.jpg",
      "/heritage-sites/fortsanpedro3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/5/52/Fort_San_Pedro_-_main_entrance.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/2/24/Fort_San_Pedro_scenery.jpg",

    ],
    rating: 4.6,
    tags: ["military", "bastion"],
    coordinates: { lat: 10.29257, lng: 123.90566 },
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
    entranceFee: "₱40–50",
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
    visitingHours: "Monday to Sunday, 24 Hours",
    imageUrl: "/heritage-sites/heritageofcebumonument1.jpg",
    galleryImages: [
      "/heritage-sites/heritageofcebumonument1.jpg",
      "/heritage-sites/heritageofcebumonument2.jpg",
      "/heritage-sites/heritageofcebumonument3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/d/d7/Heritage_of_Cebu_Monument_in_Cebu_city.jpg",
    ],
    rating: 4.7,
    tags: ["sculpture", "parian"],
    coordinates: { lat: 10.29889, lng: 123.90362 },
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
    entranceFee: 'Free Admission'
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
    visitingHours: "Monday to Sunday, 24 Hours",
    imageUrl: "/heritage-sites/colonstreetandhistoricalmarker1.jpg",
    galleryImages: [
      "/heritage-sites/colonstreetandhistoricalmarker1.jpg",
      "/heritage-sites/colonstreetandhistoricalmarker2.jpg",
      "/heritage-sites/colonstreetandhistoricalmarker3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/1/1c/Colon_Street_1961_NHCP_Historical_Marker.jpg",
    ],
    rating: 4.3,
    tags: ["oldest-street", "commercial"],
    coordinates: { lat: 10.29800, lng: 123.90367 },
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
    entranceFee: 'Free Admission'
  },
  {
    id: 'cebu-tres-de-abril-marker',
    name: "Battle of Tres de Abril Marker",
    description: "An NHCP historical marker commemorating the 1898 Cebuano uprising against Spanish rule.",
    overview: "The Battle of Tres de Abril Marker stands along Tres de Abril Street in Cebu City, near the historic San Nicolas district. It commemorates the April 1898 uprising associated with the Cebuano Katipuneros led by Pantaleon Villegas, better known as Leon Kilat. The marker recalls the brief but significant revolutionary action in which local forces challenged Spanish colonial authority in Cebu during the final months of Spanish rule in the Philippines.",
    significance: "The marker preserves public memory of Cebu's role in the Philippine Revolution. It honors the Cebuano revolutionaries who fought for freedom and connects present-day visitors to the urban spaces where anti-colonial resistance unfolded. As a street-side historical marker, it is an important educational stop for understanding the revolutionary heritage of Cebu City beyond the better-known colonial religious and civic landmarks.",
    category: "Historical Landmarks & Monuments",
    location: "Tres de Abril St., Cebu City",
    city: "Cebu City",
    visitingHours: "Monday to Sunday, 24 Hours",
    imageUrl: "/heritage-sites/battleoftresdeabril1.jpg",
    galleryImages: [
      "/heritage-sites/battleoftresdeabril1.jpg",
      "/heritage-sites/battleoftresdeabril2.jpg",
      "/heritage-sites/battleoftresdeabril3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/c/c8/Tres_de_Abril_Street,_Cebu_City,_historical_marker.jpg",
    ],
    rating: 4.4,
    tags: ["revolution", "leon-kilat", "katipunan", "marker", "san-nicolas"],
    coordinates: { lat: 10.296875, lng: 123.888817 },
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
    entranceFee: 'Free Admission'
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
    visitingHours: "Monday to Sunday, 24 Hours",
    imageUrl: "/heritage-sites/plazaindenpencia1.jpg",
    galleryImages: [
      "/heritage-sites/plazaindenpencia1.jpg",
      "/heritage-sites/plazaindenpencia2.jpg",
      "/heritage-sites/plazaindenpencia3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/6/62/Plaza_Independencia,_Cebu_City_-_Welcome_1.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/6/6e/Exploring_Cebu_Plaza_Independencia_and_National_Museum_of_the_Philippines_in_Cebu_City,_Cebu,_Philippines_1.jpg",

    ],
    rating: 4.5,
    tags: ["plaza", "park"],
    coordinates: { lat: 10.29320, lng: 123.90505 },
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
    entranceFee: 'Free Admission'
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
    visitingHours: "Monday to Sunday, 24 Hours",
    imageUrl: "/heritage-sites/plazasugbo1.jpg",
    galleryImages: [
      "/heritage-sites/plazasugbo1.jpg",
      "/heritage-sites/plazasugbo2.jpg",
      "/heritage-sites/plazasugbo3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/d/dc/Cebu_City_Hall,_Plaza_Sugbo_night_view_(P._Burgos,_Cebu_City;_01-23-2024).jpg",
      "https://upload.wikimedia.org/wikipedia/commons/1/18/Plaza_Sugbu,_Cebu_City,_Jan_2024.jpg",

    ],
    rating: 4.4,
    tags: ["plaza", "civic"],
    coordinates: { lat: 10.29343, lng: 123.90190 },
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
    entranceFee: 'Free Admission'
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
    visitingHours: "Monday to Sunday, 24 Hours",
    imageUrl: "/heritage-sites/plazahamabar1.jpg",
    galleryImages: [
      "/heritage-sites/plazahamabar1.jpg",
      "/heritage-sites/plazahamabar2.jpg",
      "/heritage-sites/plazahamabar3.jpg"
    ],
    rating: 4.2,
    tags: ["rajah", "history"],
    coordinates: { lat: 10.29605, lng: 123.90381 },
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
    entranceFee: 'Free Admission'
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
    visitingHours: "Monday to Sunday, 24 Hours",
    imageUrl: "/heritage-sites/fuenteosmenacircle1.jpg",
    galleryImages: [
      "/heritage-sites/fuenteosmenacircle1.jpg",
      "/heritage-sites/fuenteosmenacircle2.jpg",
      "/heritage-sites/fuenteosmenacircle3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/4/4e/Cebu_Fuente_Osmeña_Circle_top_view_(Cebu_City;_09-09-2022).jpg",
    ],
    rating: 4.5,
    tags: ["fountain", "osmeña"],
    coordinates: { lat: 10.30966, lng: 123.89327 },
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
    entranceFee: 'Free Admission'
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
    visitingHours: "Monday to Sunday, 8:00 AM - 5:00 PM",
    imageUrl: "/heritage-sites/cebucityhall1.jpg",
    galleryImages: [
      "/heritage-sites/cebucityhall1.jpg",
      "/heritage-sites/cebucityhall2.jpg",
      "/heritage-sites/cebucityhall3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/8/86/Cebu_City_Hall.jpg",
    ],
    rating: 4.1,
    tags: ["government", "civic"],
    coordinates: { lat: 10.29305, lng: 123.90178 },
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
    entranceFee: 'Free Admission'
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
    visitingHours: "Monday to Sunday, 8:00 AM - 5:00 PM",
    imageUrl: "/heritage-sites/cebuprovincialhall1.jpg.jpg",
    galleryImages: [
      "/heritage-sites/cebuprovincialhall1.jpg.jpg",
      "/heritage-sites/cebuprovincialhall2.jpg.jpg",
      "/heritage-sites/cebuprovincialhall3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/1/13/Cebu_Provincial_Capitol_Building.jpg",
    ],
    rating: 4.8,
    tags: ["capitol", "neoclassical"],
    coordinates: { lat: 10.31684, lng: 123.89063 },
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
    entranceFee: 'Free Admission'
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
    visitingHours: "Monday to Sunday, Daylight Hours",
    imageUrl: "/heritage-sites/patriadecebu1.jpg",
    galleryImages: [
      "/heritage-sites/patriadecebu1.jpg",
      "/heritage-sites/patriadecebu2.jpg",
      "/heritage-sites/patriadecebu3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/3/3f/Patria_de_Cebu,_Aug_2026.jpg",
    ],
    rating: 4.0,
    tags: ["catholic", "commercial"],
    coordinates: { lat: 10.29539, lng: 123.90369 },
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
    entranceFee: 'Free Admission'
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
    visitingHours: "Monday to Sunday, 8:00 AM - 5:00 PM",
    imageUrl: "https://commons.wikimedia.org/wiki/Special:FilePath/Taoist%20Temple%2C%20Cebu.jpg?width=1400",
    galleryImages: [
      "https://commons.wikimedia.org/wiki/Special:FilePath/Cebu%20Taoist%20Temple%20%28Beverly%20Hills%2C%20Lahug%2C%20Cebu%20City%3B%2009-06-2022%29.jpg?width=1400",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Cebu%20Taoist%20Temple%202022%2009%20001.jpg?width=1400",
      "https://commons.wikimedia.org/wiki/Special:FilePath/Taoist%20temple%2C%20Cebu%20%289237707280%29.jpg?width=1400"
    ],
    rating: 4.6,
    entranceFee: "Free Admission",
    tags: ["temple", "chinese"],
    coordinates: { lat: 10.33442, lng: 123.88831 },
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible'
  },
  {
    id: 'cebu-rizal-memorial-library',
    name: "Rizal Memorial Library and Museum",
    description: "Rizal Memorial Library and Museum is a historic landmark in Cebu City that houses the Cebu City Public Library. The building is associated with Cebu's educational, cultural, and historical heritage and serves as an important public cultural institution.",
    overview: "Rizal Memorial Library and Museum is a historic landmark in Cebu City that houses the Cebu City Public Library. The building is associated with Cebu's educational, cultural, and historical heritage and serves as an important public cultural institution.",
    significance: "Built in 1939 and designed by architect Juan M. Arellano, the Rizal Memorial Library and Museum is an important part of Cebu City's architectural and cultural history. The building also has historical significance from the World War II period and continues to serve the public as a library and cultural institution.",
    category: "Historical Landmarks & Monuments",
    location: "Osmeña Blvd, Cebu City",
    city: "Cebu City",
    visitingHours: "Monday to Friday, 8:00 AM - 5:00 PM",
    imageUrl: "/heritage-sites/rizalmemoriallibraryandmuseum1.jpg",
    galleryImages: [
      "/heritage-sites/rizalmemoriallibraryandmuseum1.jpg",
      "/heritage-sites/rizalmemoriallibraryandmuseum2.jpg",
      "/heritage-sites/rizalmemoriallibraryandmuseum3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/8/87/Rizal_Memorial_Library_and_Museum_in_Cebu_City,_Cebu,_Philippines.jpg",
    ],
    rating: 4.6,
    tags: ["library", "museum", "arellano", "cebu-city-public-library", "rizal"],
    coordinates: { lat: 10.30931, lng: 123.89274 },
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
    entranceFee: 'Free Admission'
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
    visitingHours: "Monday to Sunday, 24 Hours",
    imageUrl: "/heritage-sites/talisaylandingsite1.jpg",
    galleryImages: [
      "/heritage-sites/talisaylandingsite1.jpg",
      "/heritage-sites/talisaylandingsite2.jpg",
      "/heritage-sites/talisaylandingsite3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/7/74/Talisay_Landing_Historical_Marker.jpg",
    ],
    rating: 4.7,
    entranceFee: "Free Admission",
    tags: ["WWII", "memorial", "liberation"],
    coordinates: { lat: 10.241786, lng: 123.848947 },
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
    visitingHours: "Monday to Sunday, 5:00 AM - 8:00 PM",
    imageUrl: "/heritage-sites/stateresadeavilaparishchurch1.jpg",
    galleryImages: [
      "/heritage-sites/stateresadeavilaparishchurch1.jpg",
      "/heritage-sites/stateresadeavilaparishchurch2.jpg",
      "/heritage-sites/stateresadeavilaparishchurch3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/f/f2/Santa._Teresa_de_Avila_Church,_Talisay_City,_Cebu.jpg",
    ],
    rating: 4.6,
    entranceFee: "Free Admission",
    tags: ["church", "religious", "heritage"],
    coordinates: { lat: 10.243770, lng: 123.848012 },
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
    visitingHours: "Monday to Sunday, 24 Hours",
    imageUrl: "/heritage-sites/talisaycityplaza1.jpg",
    galleryImages: [
      "/heritage-sites/talisaycityplaza1.jpg",
      "/heritage-sites/talisaycityplaza2.jpg",
      "/heritage-sites/talisaycityplaza3.jpg"
    ],
    rating: 4.3,
    entranceFee: "Free Admission",
    tags: ["plaza", "civic", "gathering"],
    coordinates: { lat: 10.242643, lng: 123.848928 },
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
    visitingHours: "Monday to Sunday, 8:00 AM - 5:00 PM",
    imageUrl: "https://scontent-mnl1-1.xx.fbcdn.net/v/t39.30808-6/481917279_955405756777072_6098639633689308509_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=2a1932&_nc_eui2=AeHVn4ImoGrZBk3C2Tlt0WKe8PvCYRBjAcvw-8JhEGMBy57gwnB71BmaOumxIW-XWVO3DJHCjJNeggSvENvmCSBM&_nc_ohc=-i_cMDei8QIQ7kNvwHeinZv&_nc_oc=AdpDas466HxICzxrrKl6qBF9svaB4m_yEVBJ7Vu58nkmkMR3bWu_IGaFgY3QCC5jWVY&_nc_zt=23&_nc_ht=scontent-mnl1-1.xx&_nc_gid=jo-Ux59i_yiBxHgj7ARueQ&_nc_ss=7b2a8&oh=00_Af5ydnQtXwUu2GxXbcS9UILKQCRp9jPHr3e1zIXC6zXXqg&oe=6A09022B",
    galleryImages: [
      "https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEh31VytXEXxCFSHgWioUoRGDIjEbyLzgYlyz_XRupUgCAn5MiNlmI_tNQPOdK0Y-4OIq8UxNlFKdhQRBLFoGe_oXiTrTu6NPV2xNVwk0JkJn_m6-wKrx8zxMITw7FwSQneyCtwXP0mCn-xh/s1600/Talisay.jpg",
      "https://d3fphkxyf5o5bm.cloudfront.net/image-resize/format=webp,w=1920/QwRY54Li1HMwD7oNfohTXA9vkVQ3gtUneIMRDxpWKv"
    ],
    rating: 4.2,
    entranceFee: "Free Admission",
    tags: ["government", "civic", "modern"],
    coordinates: { lat: 10.253285, lng: 123.829350 },
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
    visitingHours: "Monday to Sunday, 5:00 AM - 8:00 PM",
    imageUrl: "/heritage-sites/nationalshrineofsaintjoseph1.jpg",
    galleryImages: [
      "/heritage-sites/nationalshrineofsaintjoseph1.jpg",
      "/heritage-sites/nationalshrineofsaintjoseph2.jpg",
      "/heritage-sites/nationalshrineofsaintjoseph3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/c/ca/Mandaue_Saint_Joseph_National_Shrine_2026-07-11.jpg",
    ],
    rating: 4.8,
    entranceFee: "Free Admission",
    tags: ["shrine", "religious", "jesuit"],
    coordinates: { lat: 10.327479, lng: 123.942176 },
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
    visitingHours: "Monday to Sunday, 8:00 AM - 5:00 PM",
    imageUrl: "/heritage-sites/mandauecitypubliclibary1.jpg",
    galleryImages: [
      "/heritage-sites/mandauecitypubliclibary1.jpg",
      "/heritage-sites/mandauecitypubliclibary2.jpg",
      "/heritage-sites/mandauecitypubliclibary3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/3/3e/Mandaue_City_Public_Library,_Cebu,_Jan_2024.jpg",
    ],
    rating: 4.2,
    entranceFee: "Free Admission",
    tags: ["library", "educational", "architecture"],
    coordinates: { lat: 10.325832, lng: 123.942101 },
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
    visitingHours: "Monday to Sunday, Daylight Hours",
    imageUrl: "/heritage-sites/bantayansahari1.jpg",
    galleryImages: [
      "/heritage-sites/bantayansahari1.jpg",
      "/heritage-sites/bantayansahari2.jpg",
      "/heritage-sites/bantayansahari3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/b/b7/Petron_Mandaue_Depot_and_Bantayan_sa_Hari_(Looc,_Mandaue,_Cebu;_01-19-2024).jpg",
      "https://upload.wikimedia.org/wikipedia/commons/a/a8/Petron_Mandaue_Depot_and_Bantayan_sa_Hari_(Looc,_Mandaue,_Cebu;_09-04-2022).jpg",

    ],
    rating: 4.0,
    entranceFee: "Free Admission",
    tags: ["watchtower", "spanish", "military"],
    coordinates: { lat: 10.322712, lng: 123.954833 },
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
    category: "Government & Historic Buildings",
    location: "Poblacion, Mandaue City",
    city: "Mandaue City",
    visitingHours: "Monday to Sunday, 8:00 AM - 5:00 PM",
    imageUrl: "/heritage-sites/mandauepresidencia1.jpg",
    galleryImages: [
      "/heritage-sites/mandauepresidencia1.jpg",
      "/heritage-sites/mandauepresidencia2.jpg",
      "/heritage-sites/mandauepresidencia3jpg.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/6/65/Mandaue_Presidencia_Marker,_Cebu.jpg",
    ],
    rating: 4.6,
    entranceFee: "Free Admission",
    tags: ["government", "neoclassical", "cityhall"],
    coordinates: { lat: 10.327418, lng: 123.943134 },
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
    visitingHours: "Monday to Sunday, 24 Hours",
    imageUrl: "/heritage-sites/mandauemactanbridge1.jpg",
    galleryImages: [
      "/heritage-sites/mandauemactanbridge1.jpg",
      "/heritage-sites/mandauemactanbridge2.jpg",
      "/heritage-sites/mandauemactanbridge3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/3/36/Mandaue-Mactan_Bridge_I.jpg",
    ],
    rating: 4.4,
    entranceFee: "Free Admission",
    tags: ["bridge", "iconic", "channel"],
    coordinates: { lat: 10.319733, lng: 123.955731 },
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible'
  },
  {
    id: 'marcelo-fernan-bridge',
    name: "Marcelo Fernan Bridge",
    description: "An extradosed cable-stayed bridge connecting Mandaue City and Lapu-Lapu City across the Mactan Channel.",
    overview: "The Marcelo Fernan Bridge is an extradosed cable-stayed bridge spanning the Mactan Channel, connecting Mandaue City on mainland Cebu to Lapu-Lapu City on Mactan Island. Opened in August 1999, it was constructed to relieve heavy traffic on the older Mandaue-Mactan Bridge. Named after Senator Marcelo B. Fernan, a distinguished Cebuano statesman and Chief Justice, the 1,237-meter bridge features a 185-meter central span and is one of the longest cable-stayed bridges in the Philippines. It serves as a vital transportation artery for tourism, commerce, and access to Mactan-Cebu International Airport.",
    significance: "Named in honor of Senator Marcelo B. Fernan—the only Filipino to serve as both Chief Justice of the Supreme Court and Senate President—this landmark bridge represents modern engineering and Cebuano statesmanship. It plays an essential role in Metro Cebu's urban infrastructure, facilitating seamless economic and social connection between Mandaue City and Lapu-Lapu City.",
    category: "Historical Landmarks & Monuments",
    location: "Mactan Channel, connecting Mandaue City and Lapu-Lapu City",
    city: "Mandaue City",
    visitingHours: "Monday to Sunday, 24 Hours",
    imageUrl: "/heritage-sites/marcelofernanbridge1.jpg",
    galleryImages: [
      "/heritage-sites/marcelofernanbridge1.jpg",
      "/heritage-sites/marcelofernanbridge2.jpg",
      "/heritage-sites/marcelofernanbridge3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/e/e9/MARCELO_FERNAN_BRIDGE_(6259265564).jpg"
    ],
    rating: 4.7,
    tags: ["bridge", "cable-stayed", "mandaue", "lapu-lapu", "mactan-channel", "marcelo-fernan", "second-bridge"],
    coordinates: { lat: 10.3302, lng: 123.9611 },
    isMustVisit: true,
    needsVerification: true,
    verificationStatus: 'Pending Verification',
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible',
    entranceFee: 'Free Admission'
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
    visitingHours: "Monday to Sunday, 24 Hours",
    imageUrl: "/heritage-sites/mandauecityheritageplaza1.jpg",
    galleryImages: [
      "/heritage-sites/mandauecityheritageplaza1.jpg",
      "/heritage-sites/mandauecityheritageplaza2.jpg",
      "/heritage-sites/mandauecityheritageplaza3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/9/98/Mandaue_City_Plaza_(2024-10-27).jpg",
    ],
    rating: 4.3,
    entranceFee: "Free Admission",
    tags: ["plaza", "civic", "park"],
    coordinates: { lat: 10.327944, lng: 123.942767 },
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible'
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
    visitingHours: "Monday to Sunday, 5:00 AM - 8:00 PM",
    imageUrl: "/heritage-sites/virgendelareglanationalshrine1.jpg",
    galleryImages: [
      "/heritage-sites/virgendelareglanationalshrine1.jpg",
      "/heritage-sites/virgendelareglanationalshrine2.jpg",
      "/heritage-sites/virgendelareglanationalshrine3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/6/6b/Virgen_de_la_Regla_church.JPG"
    ],
    rating: 4.9,
    entranceFee: "Free Admission",
    tags: ["shrine", "pilgrimage", "devotion"],
    coordinates: { lat: 10.312571, lng: 123.948726 },
    isMustVisit: true,
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
    visitingHours: "Monday to Sunday, 24 Hours",
    imageUrl: "/heritage-sites/mactanshrine1.jpg",
    galleryImages: [
      "/heritage-sites/mactanshrine1.jpg",
      "/heritage-sites/mactanshrine2.jpg",
      "/heritage-sites/mactanshrine3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/f/f4/Mactan_Shrine_in_Lapu-Lapu_City.JPG",
      "https://upload.wikimedia.org/wikipedia/commons/f/f0/Mactan_Shrine,_Cebu_city.jpg",

    ],
    rating: 4.9,
    entranceFee: "Free Admission",
    tags: ["hero", "battle", "liberty"],
    coordinates: { lat: 10.310855, lng: 124.015244 },
    isMustVisit: true,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible'
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
    visitingHours: "Monday to Sunday, 24 Hours",
    imageUrl: "/heritage-sites/magellansmarker1.jpg",
    galleryImages: [
      "/heritage-sites/magellansmarker1.jpg",
      "/heritage-sites/magellansmarker2.jpg",
      "/heritage-sites/magellansmarker3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/d/d3/Magellan's_marker_(9237742220).jpg",
    ],
    rating: 4.6,
    entranceFee: "Free Admission",
    tags: ["magellan", "obelisk", "history"],
    coordinates: { lat: 10.310949, lng: 124.015283 },
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible'
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
    visitingHours: "Monday to Sunday, 24 Hours",
    imageUrl: "/heritage-sites/plazarizal(rizalpark)1.jpg",
    galleryImages: [
      "/heritage-sites/plazarizal(rizalpark)1.jpg",
      "/heritage-sites/plazarizal(rizalpark)2.jpg",
      "/heritage-sites/plazarizal(rizalpark)3.jpg"
    ],
    rating: 4.2,
    entranceFee: "Free Admission",
    tags: ["plaza", "rizal", "civic"],
    coordinates: { lat: 10.312681, lng: 123.949028 },
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible'
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
    visitingHours: "Monday to Sunday, 24 Hours",
    imageUrl: "/heritage-sites/millenniumpark1.jpg",
    galleryImages: [
      "/heritage-sites/millenniumpark1.jpg",
      "/heritage-sites/millenniumpark2.jpg",
      "/heritage-sites/millenniumpark3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/d/d3/Millennium_Park_%2810-30-2022%29.jpg"
    ],
    rating: 4.1,
    entranceFee: "Free Admission",
    tags: ["park", "coastal", "bridge-view"],
    coordinates: { lat: 10.324856, lng: 123.968125 },
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible'
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
    visitingHours: "Monday to Sunday, 24 Hours",
    imageUrl: "/heritage-sites/oldbridgepark1.jpg",
    galleryImages: [
      "/heritage-sites/oldbridgepark1.jpg",
      "/heritage-sites/oldbridgepark2.jpg",
      "/heritage-sites/oldbridgepark3.jpg",
      "https://upload.wikimedia.org/wikipedia/commons/e/e7/Lapu-Lapu_2026-04-27_001.jpg",

    ],
    rating: 4.0,
    entranceFee: "Free Admission",
    tags: ["park", "industrial-heritage", "community"],
    coordinates: { lat: 10.317816, lng: 123.956807 },
    isMustVisit: false,
    isActive: true,
    status: 'Active',
    demolitionStatus: 'Non-Demolished',
    accessibilityStatus: 'Accessible'
  }
];

const ENRICHED_SITE_CONTENT: Record<string, Pick<HeritageSite, 'overview' | 'significance'>> = {
  'cebu-basilica': {
    overview: "The Basilica Minore del Santo Nino de Cebu is one of the most important religious and historical places in the Philippines. Standing in Cebu City's old colonial core, the basilica grew from the earliest Spanish missionary settlement and continues to receive thousands of devotees, pilgrims, and visitors. Its stone church, convent spaces, open pilgrim center, candle-lighting areas, and processional grounds show how worship, public ritual, and heritage tourism meet in one living sacred site.",
    significance: "The basilica is central to understanding the Christianization of Cebu and the wider Philippines. It keeps public memory of the Santo Nino devotion, the 1521 encounter between local rulers and the Magellan expedition, and the later Spanish settlement under Legazpi. Its connection to Sinulog also makes it a living cultural landmark, where faith, dance, music, family devotion, and Cebuano identity are renewed every year rather than preserved only as museum history."
  },
  'cebu-cathedral': {
    overview: "The Metropolitan Cebu Cathedral is the ecclesiastical seat of the Archdiocese of Cebu and one of the major anchors of the city's historic religious district. Its thick walls, formal facade, spacious nave, and carefully rebuilt interiors reflect centuries of construction, damage, restoration, and adaptation. Located near the Basilica, Plaza Hamabar, and the Archdiocesan Museum, the cathedral helps visitors understand how Spanish-period Cebu was organized around church, plaza, and civic authority.",
    significance: "The cathedral represents the growth of Catholic administration in the Visayas, from early missionary activity to an established archdiocese with influence across the region. Its repeated rebuilding after wars, fires, and earthquakes mirrors Cebu's own resilience. As a setting for ordinations, funerals, civic masses, and major religious ceremonies, it remains a place where public memory and spiritual authority are expressed through architecture, ritual, and community gathering."
  },
  'cebu-cross': {
    overview: "Magellan's Cross is housed in a small octagonal pavilion beside the Basilica and Cebu City Hall, making it one of the most visited points in the city's heritage core. The site is associated with the planting of a Christian cross by the Magellan expedition in 1521 and is visually interpreted through ceiling paintings, devotional practices, and the constant movement of visitors. It functions as both a symbolic landmark and an active prayer space.",
    significance: "The cross is important because it represents one of the earliest recorded encounters between Europeans and the people of the Philippine archipelago. For many visitors it symbolizes the arrival of Christianity, but it also invites reflection on cultural exchange, conversion, diplomacy, and colonial expansion. Its location beside church and government landmarks makes it a compact lesson in how religion, politics, and memory shaped the historical center of Cebu."
  },
  'cebu-archdiocesan-museum': {
    overview: "The Archdiocesan Museum of Cebu preserves religious objects, artworks, vestments, documents, and architectural spaces connected to the Catholic history of Cebu. Housed in a historic structure within the cathedral complex, it allows visitors to see how faith was expressed through craftsmanship, ritual objects, parish life, and domestic-style colonial architecture. The museum setting makes the experience more intimate than a church visit because objects can be studied closely.",
    significance: "The museum is significant because it protects the material culture of Cebu's religious history outside the normal rhythm of church use. Its collections show how local artisans, clergy, donors, and communities contributed to religious life across generations. It helps users understand that heritage is not only found in monumental buildings, but also in textiles, images, vessels, records, and devotional objects that carried meaning in everyday worship."
  },
  'cebu-casa-gorordo': {
    overview: "Casa Gorordo Museum presents the domestic world of a prominent Cebuano family in the Parian district. The house combines coral-stone foundations, hardwood upper floors, capiz windows, period furniture, household tools, religious objects, and curated rooms that show how families lived, entertained guests, practiced faith, and managed social relationships during the Spanish and early American periods. It turns a private residence into a detailed classroom of urban Cebuano life.",
    significance: "Casa Gorordo matters because it explains social history through architecture and everyday objects. The house reveals the blending of local, Spanish, and Chinese influences that shaped elite life in Cebu, especially in the old trading district of Parian. By preserving a lived-in environment rather than only a monument, it helps visitors understand class, family, religion, commerce, and identity in a way that feels human and tangible."
  },
  'cebu-yap-sandiego': {
    overview: "The Yap-Sandiego Ancestral House is one of the most atmospheric heritage houses in Cebu's Parian district. Its coral-stone base, timber upper structure, antique furnishings, religious images, kitchen objects, and family collections create a dense picture of old domestic life. Unlike many restored museums, the house retains a strong sense of age and continuity, allowing visitors to feel the layers of family memory embedded in the structure.",
    significance: "The house is culturally important because it connects Cebu's urban history to the Chinese-Cebuano merchant families who helped shape Parian as a commercial district. Its survival demonstrates the value of privately preserved heritage in a city where many old structures have disappeared. It also teaches that cultural identity in Cebu has long been mixed, with local, Chinese, Catholic, and colonial influences coexisting inside one home."
  },
  'cebu-jesuit-house': {
    overview: "The 1730 Jesuit House is a rare historic structure hidden within a working commercial compound, making it one of Cebu's most surprising heritage experiences. Its coral-stone walls, old beams, courtyard spaces, and religious associations reveal an earlier layer of Parian that remains embedded inside the modern city. The contrast between warehouse activity and centuries-old architecture makes the site especially useful for understanding how heritage can survive in unexpected places.",
    significance: "The site is significant as evidence of the Jesuit presence in Cebu and of early colonial residential architecture. It shows that the city is built in layers: missionary activity, trade, domestic life, commerce, and modern business can occupy the same ground over time. Its preservation encourages visitors to look beyond obvious landmarks and recognize hidden heritage within ordinary urban blocks."
  },
  'cebu-national-museum': {
    overview: "The National Museum of the Philippines - Cebu occupies the former Aduana or customs house near Cebu's port, a location deeply tied to trade, governance, and the movement of goods and people. Its galleries present archaeological, ethnographic, artistic, and historical materials that place Cebu within broader Philippine and Southeast Asian stories. The building itself, with its formal civic architecture, is part of the museum experience.",
    significance: "This museum is important because it transforms a government and port-related landmark into a public space for cultural education. It connects Cebu's maritime position, colonial administration, precolonial communities, and modern artistic production in one institution. For users, it offers a wider frame: Cebu heritage is not only religious or colonial, but also archaeological, ecological, artistic, and national in scope."
  },
  'cebu-sugbu-chinese-museum': {
    overview: "The Sugbu Chinese Heritage Museum focuses on the long relationship between Cebu and Chinese communities through trade, migration, family life, business, and cultural exchange. Located in the historic Gotiaoco Building near the old port and civic center, the museum uses exhibits and artifacts to explain how Chinese-Cebuano families contributed to commerce, philanthropy, foodways, education, and urban development in Cebu.",
    significance: "The museum is significant because it gives visibility to a community that has shaped Cebu for centuries but is often treated as a background presence in heritage narratives. It helps visitors understand Cebu as a multicultural port city where identity was formed through exchange across seas. By preserving Chinese-Cebuano stories, it broadens the meaning of local heritage beyond churches, forts, and plazas."
  },
  'cebu-museo-sugbo': {
    overview: "Museo Sugbo occupies the former Carcel de Cebu, a historic prison complex later adapted into the Cebu Provincial Museum. Its galleries present archaeology, political history, religious artifacts, memorabilia, and objects connected to Cebu's social development. The experience is shaped by the building itself: visitors move through spaces once associated with confinement and authority, now repurposed for public learning.",
    significance: "Museo Sugbo is important because it turns a difficult institutional past into an educational resource. It helps users understand how justice, colonial governance, province-building, and memory intersect in Cebu's history. The adaptive reuse of the jail complex also shows a productive model for heritage preservation: old buildings can be retained, reinterpreted, and given new civic value instead of being erased."
  },
  'cebu-uspf-jose-rizal-museum': {
    overview: "The USPF Mabini Campus - Jose Rizal Museum is associated with Rizaliana materials and educational interpretation of Dr. Jose Rizal's life, writings, and national legacy. Located in an academic setting, the museum links heritage learning with classroom culture and civic formation. Its collections and displays invite students and visitors to connect Cebu's local educational history with the larger story of Philippine nationalism.",
    significance: "The museum matters because Rizal's memory is not confined to Manila or Calamba; it is interpreted and taught across the country through schools, museums, and local collections. In Cebu, a Rizaliana site helps explain how national heroes become part of regional civic education. It reinforces themes of literacy, reform, patriotism, and historical consciousness for younger generations."
  },
  'cebu-usc-museum': {
    overview: "The University of San Carlos Museum is an academic museum with collections that include archaeology, ethnography, ceramics, natural history, and cultural materials from Cebu and neighboring regions. Its galleries help visitors see the depth of precolonial life, trade networks, craftsmanship, and ecological knowledge before and beyond Spanish contact. As a university museum, it connects public viewing with research and teaching.",
    significance: "The museum is significant because it supports evidence-based heritage education. Its archaeological and ethnographic collections challenge the idea that Philippine history begins with colonization, showing instead that earlier communities had complex technologies, trade relationships, beliefs, and artistic practices. It also demonstrates the role of schools and universities in safeguarding cultural memory."
  },
  'cebu-fort-san-pedro': {
    overview: "Fort San Pedro is a triangular coral-stone fort that began as part of the first Spanish settlement in Cebu. Its bastions, ramparts, inner courtyard, museum rooms, and garden spaces show how military architecture was used to secure colonial presence near the port. Today visitors can walk the walls and read the fort as both a defensive structure and a public heritage park.",
    significance: "The fort is significant because it marks the militarized beginning of Spanish colonial rule in Cebu and the transformation of the settlement into a strategic port city. Over time it served different civic and military purposes, showing how buildings can change meaning across centuries. Its survival helps users understand defense, colonization, trade protection, and urban memory in one compact site."
  },
  'cebu-heritage-monument': {
    overview: "The Heritage of Cebu Monument is a sculptural narrative of major events, figures, and symbols associated with Cebu's past. Located in Parian, it gathers scenes of encounter, faith, conflict, trade, and local leadership into one dramatic public artwork. The monument works like a visual timeline, encouraging visitors to move around it and read history through figures, gestures, and layered forms.",
    significance: "The monument is important because it translates complex history into a public artwork accessible to everyday passersby. It strengthens Parian's role as a heritage district and gives visitors a starting point for discussing how Cebu remembers itself. Its value is not only artistic but educational: it turns a street corner into an outdoor history lesson about identity, memory, and continuity."
  },
  'cebu-colon-street': {
    overview: "Colon Street is widely recognized as the oldest street established under Spanish urban planning in the Philippines. Over time it became a center of shops, theaters, schools, transport, and everyday commerce. The current street is busy and modern, but its historical marker and surrounding district still point to its long role as a commercial spine of old Cebu.",
    significance: "Colon Street is significant as living urban heritage. Unlike a preserved museum, it remains an active commercial environment where the past is mixed with traffic, vendors, signs, and daily work. This makes it useful for teaching how cities change without completely losing memory. It represents Cebuano enterprise, adaptation, and the continuing importance of downtown Cebu."
  },
  'cebu-tres-de-abril-marker': {
    overview: "The Battle of Tres de Abril Marker commemorates the 1898 uprising in Cebu associated with Pantaleon Villegas, known as Leon Kilat, and local revolutionary forces. Located along Tres de Abril Street near San Nicolas, the marker places visitors close to the urban spaces where anti-colonial action unfolded. It is modest in scale but heavy with historical meaning.",
    significance: "The marker is significant because it recognizes Cebu's role in the Philippine Revolution. It expands the city's heritage story beyond early Spanish contact and religious landmarks by highlighting resistance, sacrifice, and local political awakening. For users, it shows that Cebuano history includes not only conversion and trade, but also struggle for freedom and participation in national transformation."
  },
  'cebu-plaza-independencia': {
    overview: "Plaza Independencia is a large civic park beside Fort San Pedro and near Cebu's port area. Its open lawns, shaded paths, monuments, and gathering spaces make it both a recreational park and a historic public square. The plaza's location places it near some of the oldest layers of the city, where colonial defense, maritime movement, and civic ceremony meet.",
    significance: "The plaza is significant as a public space of memory, leisure, and civic expression. It has witnessed changing forms of authority from colonial rule to modern city life while remaining a shared ground for residents. Its name and monuments encourage reflection on independence, public identity, and the importance of open spaces in a dense historic city."
  },
  'cebu-plaza-sugbo': {
    overview: "Plaza Sugbo is the open civic space fronting Cebu City Hall and near Magellan's Cross, placing it between local government and major religious heritage. It is used by residents, visitors, workers, and officials as a passageway, photo stop, and ceremonial ground. Its compact location makes it one of the clearest examples of how Cebu's old center connects church, state, and public movement.",
    significance: "Plaza Sugbo is significant because it keeps the traditional idea of a civic plaza alive in the middle of a busy government district. It helps users see how urban space can communicate power and identity: city hall, church landmarks, monuments, and crowds all share the same visual field. The plaza remains a symbolic front yard for Cebu City's public life."
  },
  'cebu-plaza-hamabar': {
    overview: "Plaza Hamabar honors Rajah Humabon, one of the central local figures in the early 16th-century encounter between Cebuanos and the Magellan expedition. Located near the cathedral area, the plaza offers a quieter space for remembering precolonial leadership within a district often dominated by Spanish-period landmarks. Its statue and marker invite visitors to ask who is remembered in public space.",
    significance: "The plaza is significant because it foregrounds local leadership and precolonial Cebuano society. It reminds users that Cebu had rulers, alliances, trade relationships, and political structures before Spanish colonization. By placing Humabon in the heritage landscape, the site helps balance the story of conversion and colonization with the agency of local people."
  },
  'cebu-fuente-osmena': {
    overview: "Fuente Osmena Circle is an iconic uptown landmark centered on a fountain and public rotunda. Built around the rise of modern civic infrastructure, it became a social and geographic marker for Cebu City's expansion beyond the old downtown core. The circle is associated with parades, public gatherings, evening recreation, and the movement of people through one of the city's busiest districts.",
    significance: "Fuente Osmena is significant because it represents modernization, public utilities, and the growth of a new civic center during the American period and after. It also remains emotionally important to residents as a recognizable city symbol. Its role in Sinulog routes and public celebrations shows how a traffic circle can become a stage for collective identity."
  },
  'cebu-city-hall': {
    overview: "Cebu City Hall is the administrative center of the country's oldest city and stands within a dense historic district near Plaza Sugbo and Magellan's Cross. The building serves practical government functions while also shaping the visual identity of the civic core. Its location reminds visitors that heritage districts are not only tourist spaces; they are also places where present-day governance continues.",
    significance: "The city hall is significant because it connects Cebu's historic status with contemporary public service. It represents local democracy, urban management, and the continuity of civic authority from earlier town centers to the modern metropolis. For users, it helps explain how government buildings can be heritage sites when they anchor public life and preserve institutional memory."
  },
  'cebu-capitol': {
    overview: "The Cebu Provincial Capitol is a grand neoclassical government building designed as a visual endpoint of Osmena Boulevard. Its dome, columns, broad steps, and formal composition express the ideals of order, dignity, and civic ambition associated with the Commonwealth period. The building continues to function as the seat of provincial government while remaining one of Cebu's most recognizable architectural landmarks.",
    significance: "The capitol is significant as both a working government building and a landmark of American-era public architecture. It communicates the political importance of Cebu Province and the aspirations of provincial governance before Philippine independence. Its protected status and continued use show how heritage can remain active, not frozen, while still carrying architectural and historical value."
  },
  'cebu-patria': {
    overview: "Patria de Cebu is a historic Catholic social and commercial landmark near the cathedral district. For many Cebuanos, it is associated with church-related activities, community gatherings, lodging, and the everyday life of the old downtown. Its current transformation and facade-sensitive redevelopment make it a visible case study in how heritage buildings face pressure from modern urban growth.",
    significance: "Patria de Cebu is significant because it represents the social mission of Catholic institutions beyond worship spaces. It also raises important questions about preservation, adaptive reuse, and development in heritage districts. The site helps users understand that cultural value may be found in buildings tied to community memory, youth activities, hospitality, and civic life, even when their use changes over time."
  },
  'cebu-taoist': {
    overview: "Cebu Taoist Temple sits above the city in Beverly Hills and is known for its colorful architecture, dragon details, tiered forms, prayer spaces, and panoramic views. Built by Cebu's Chinese community, it remains an active religious and cultural site where visitors are expected to observe proper behavior in sacred areas. The temple offers a different visual and spiritual language from the Catholic landmarks of downtown Cebu.",
    significance: "The temple is significant because it highlights Cebu's religious diversity and Chinese-Cebuano heritage. It shows that the city's cultural identity was shaped not only by Spanish Catholic traditions but also by migration, trade, and plural spiritual practices. As a popular landmark, it helps users appreciate multicultural Cebu and the continuing presence of non-Catholic sacred spaces."
  },
  'talisay-landing': {
    overview: "The Talisay Landing Site marks the coastal area where American liberation forces landed in 1945 during the campaign to free Cebu from Japanese occupation. Its monument, beach setting, and commemorative atmosphere connect visitors to the final phase of World War II on the island. The site is quieter than many urban landmarks, but its openness allows reflection on war, return, and recovery.",
    significance: "The site is significant because it preserves memory of liberation and the wartime experiences of Cebuanos. It honors the sacrifices of Filipino guerrillas, civilians, and Allied forces while reminding visitors that global conflict reached local shores. Annual commemorations help keep this memory active, making the site an educational anchor for understanding Cebu's 20th-century history."
  },
  'talisay-church': {
    overview: "Sta. Teresa de Avila Parish Church is a major religious landmark in Talisay's poblacion and a focal point of community life. Its parish history reflects the growth of Talisay from a coastal settlement into a city within Metro Cebu. The church remains active through masses, devotions, fiestas, and family ceremonies that connect generations of residents to the same sacred space.",
    significance: "The church is significant because it anchors Talisay's spiritual and social identity. Like many Philippine town centers, it helps explain how parish life shaped calendars, neighborhoods, celebrations, and community organization. Its continuing role in local worship and fiesta traditions makes it a living heritage site rather than simply an old structure."
  },
  'talisay-plaza': {
    overview: "Talisay City Plaza is the public open space of the poblacion, surrounded by civic and religious landmarks. It provides a setting for everyday rest, community programs, holiday displays, local ceremonies, and informal social life. Its layout reflects the long Philippine tradition of the plaza as a shared outdoor room where residents gather and the city presents itself.",
    significance: "The plaza is significant because it preserves the social function of public space in a growing urban area. It gives residents a common ground for civic identity, cultural events, and intergenerational gathering. For users, it shows that heritage is not only about age or architecture; it is also about repeated public use and shared community meaning."
  },
  'talisay-city-hall': {
    overview: "Talisay City Hall is the administrative center for a rapidly urbanizing city in southern Metro Cebu. Its location and functions reflect Talisay's shift from a historic coastal community into a modern residential, commercial, and government center. The building supports public services while symbolizing the city's continuing effort to manage growth and local identity.",
    significance: "The city hall is significant because it represents contemporary civic heritage: the institutions that shape how residents experience the city today. While newer than colonial landmarks, it is important for understanding Talisay's development, autonomy, and role in the wider metropolitan region. It shows that heritage includes the evolving story of local governance."
  },
  'mandaue-church': {
    overview: "The National Shrine of Saint Joseph is the historic mother church of Mandaue and a major religious center of the city. Its roots reach back to early missionary activity, and it remains closely tied to local devotions, fiesta traditions, and the famous Holy Family tableau. The church stands in the poblacion near civic landmarks, making it part of Mandaue's historic core.",
    significance: "The shrine is significant because it expresses Mandaue's Catholic identity across centuries. It connects religious practice with family devotion, local history, and citywide celebrations. As a national shrine, it also draws meaning beyond the immediate parish, showing how Mandaue participates in the broader devotional landscape of Cebu and the Philippines."
  },
  'mandaue-library': {
    overview: "The Mandaue City Public Library is a civic and educational landmark in the city's heritage area. Beyond its book collections, the building is valued for its architectural character, including its well-known spiral staircase and historic atmosphere. It functions as a place for reading, study, archives, and public learning in the middle of a busy urban center.",
    significance: "The library is significant because it represents intellectual heritage and the public value of education. It helps preserve local memory through records and reading culture while giving residents access to knowledge. In a heritage district dominated by church and government landmarks, the library adds another dimension: the city as a place of learning, literacy, and civic formation."
  },
  'mandaue-watchtower': {
    overview: "Bantayan sa Hari is a Spanish-period watchtower in Looc, built from coral stone as part of coastal defense against seaborne raids. Its location near the Mactan Channel reflects the strategic importance of watching the coast and protecting communities, trade, and settlements. Though weathered, the tower remains a strong physical reminder of the dangers and defensive systems of earlier centuries.",
    significance: "The watchtower is significant because it connects Mandaue to the wider history of maritime defense in the Visayas. It teaches users that coastal communities were shaped not only by trade and fishing, but also by vulnerability and vigilance. As one of the surviving defensive structures in the area, it gives material form to stories of protection, warning, and resilience."
  },
  'mandaue-presidencia': {
    overview: "The Mandaue Presidencia is a historic government building completed during the Commonwealth era and located at the center of the old poblacion. Its neoclassical features, formal facade, and prominent civic position express the authority and aspirations of local government. The building continues to define the visual identity of Mandaue's heritage core alongside the church and plaza.",
    significance: "The Presidencia is significant because it represents Mandaue's political history and institutional continuity. As a recognized historic landmark, it helps users understand the city's growth from a historic settlement into a major urban and industrial center. Its preservation strengthens the link between civic pride, architecture, and local self-governance."
  },
  'mandaue-bridge': {
    overview: "The Mandaue-Mactan Bridge, often called the First Bridge, connects mainland Cebu to Mactan Island across the Mactan Channel. Completed in the early 1970s, it changed daily movement, trade, airport access, and regional development. Although primarily infrastructure, its scale, age, and impact have made it part of Metro Cebu's modern heritage landscape.",
    significance: "The bridge is significant because it marks a turning point in regional connectivity. It helped integrate Mandaue and Lapu-Lapu into a stronger metropolitan economy, supporting tourism, industry, commuting, and airport-linked growth. For users, it shows that heritage can include engineering works that reshape how communities live, travel, and imagine their region."
  },
  'marcelo-fernan-bridge': {
    overview: "The Marcelo Fernan Bridge is an extradosed cable-stayed bridge spanning the Mactan Channel, connecting Mandaue City on mainland Cebu to Lapu-Lapu City on Mactan Island. Opened in August 1999, it was constructed to relieve heavy traffic on the older Mandaue-Mactan Bridge. Named after Senator Marcelo B. Fernan, a distinguished Cebuano statesman and Chief Justice, the 1,237-meter bridge features a 185-meter central span and is one of the longest cable-stayed bridges in the Philippines. It serves as a vital transportation artery for tourism, commerce, and access to Mactan-Cebu International Airport.",
    significance: "Named in honor of Senator Marcelo B. Fernan—the only Filipino to serve as both Chief Justice of the Supreme Court and Senate President—this landmark bridge represents modern engineering and Cebuano statesmanship. It plays an essential role in Metro Cebu's urban infrastructure, facilitating seamless economic and social connection between Mandaue City and Lapu-Lapu City."
  },
  'mandaue-plaza': {
    overview: "Mandaue City Heritage Plaza is a landscaped public space in the historic poblacion, visually connected to the Mandaue Presidencia and the National Shrine of Saint Joseph. It provides room for ceremonies, festivals, casual gatherings, and public rest. The plaza helps frame nearby landmarks as one coherent heritage district rather than isolated buildings.",
    significance: "The plaza is significant because it preserves the traditional relationship between church, government, and public space. It serves as Mandaue's civic living room, where residents gather for celebrations and official events. By tying together religious and political landmarks, it strengthens the community's sense of place and continuity."
  },
  'llc-shrine': {
    overview: "The Virgen de la Regla National Shrine is the leading Catholic pilgrimage site of Lapu-Lapu City and a spiritual anchor for Oponganon identity. Devotees come to honor Our Lady of the Rule through masses, prayers, processions, and annual feast celebrations. Located in the old town center, the shrine links religious devotion with the civic life of the former town of Opon.",
    significance: "The shrine is significant because it preserves a devotion that has shaped family life, local identity, and public celebrations on Mactan Island for generations. As a national shrine, it carries meaning for pilgrims beyond the city itself. It also balances the city's famous warrior heritage with a strong story of faith, protection, and community belonging."
  },
  'llc-mactan-shrine': {
    overview: "Mactan Shrine is a historical park in Punta Engano associated with the Battle of Mactan on April 27, 1521. The site includes the Lapu-Lapu monument, commemorative markers, open grounds, and coastal views that help visitors imagine the place where local resistance confronted the Magellan expedition. It is both a tourist landmark and a space of national memory.",
    significance: "The shrine is significant because it commemorates one of the earliest recorded acts of armed resistance against European intrusion in the archipelago. Lapu-Lapu's victory has become a symbol of courage, autonomy, and local pride. The annual Kadaugan sa Mactan celebration keeps the story alive through performance, ritual, and civic commemoration."
  },
  'llc-magellan-marker': {
    overview: "Magellan's Marker stands within the Mactan Shrine complex as a stone monument to Ferdinand Magellan, who died during the Battle of Mactan. Its presence beside the Lapu-Lapu memorial creates a layered historical landscape where different memories are held together. Visitors encounter not a single simple story, but a site shaped by exploration, conflict, conversion, and resistance.",
    significance: "The marker is significant because it reminds users that heritage sites can carry multiple perspectives. Magellan's voyage changed world history through global navigation and contact, while his death at Mactan became central to local memory of resistance. The marker encourages a more critical understanding of history as both global encounter and local consequence."
  },
  'llc-plaza-rizal': {
    overview: "Plaza Rizal is the central civic park of Lapu-Lapu City's poblacion, located near religious and government landmarks. It features public seating, monuments, and open space for ceremonies, gatherings, and everyday social life. As a traditional town plaza, it continues to function as a place where residents meet, rest, celebrate, and participate in public life.",
    significance: "The plaza is significant because it links the former town of Opon with the modern city of Lapu-Lapu. Its Rizal monument connects local civic space to national ideals of reform, education, and patriotism. The plaza's continued use shows how public spaces sustain community identity even as the surrounding city grows and changes."
  },
  'llc-millennium-park': {
    overview: "Millennium Park is a coastal public space in Pajo with views of the Mactan Channel and nearby bridge infrastructure. It gives residents a place to walk, gather, and enjoy the maritime landscape that has long shaped life on Mactan Island. The park is modern in character but rooted in the island's relationship with water, transport, and urban growth.",
    significance: "The park is significant as contemporary public heritage. It shows how cities create new shared spaces around infrastructure and coastlines, turning views, sea breeze, and bridge scenery into part of everyday civic life. For users, it broadens the heritage map by including places that represent present-day community experience, not only older monuments."
  },
  'llc-bridge-park': {
    overview: "Old Bridge Park is a community space located beneath and near the First Mactan-Mandaue Bridge. It transforms an area associated with transport infrastructure into a place for recreation, exercise, informal gathering, and local events. Its setting gives visitors a close view of the bridge and the channel, linking public life with the engineering landscape of Metro Cebu.",
    significance: "The park is significant because it demonstrates adaptive use of urban space. Rather than treating the underside of infrastructure as leftover land, the community uses it as a social and recreational asset. It helps users understand modern heritage as something made through daily use, local creativity, and the ability of residents to claim space within a changing city."
  }
};

export function createNotSpecifiedWeeklySchedule(
  notes?: string
): Record<DayOfWeek, DailyOperatingSchedule> {
  return {
    sunday: { state: 'not_specified', periods: [], ...(notes ? { notes } : {}) },
    monday: { state: 'not_specified', periods: [], ...(notes ? { notes } : {}) },
    tuesday: { state: 'not_specified', periods: [], ...(notes ? { notes } : {}) },
    wednesday: { state: 'not_specified', periods: [], ...(notes ? { notes } : {}) },
    thursday: { state: 'not_specified', periods: [], ...(notes ? { notes } : {}) },
    friday: { state: 'not_specified', periods: [], ...(notes ? { notes } : {}) },
    saturday: { state: 'not_specified', periods: [], ...(notes ? { notes } : {}) },
  };
}

export function cloneWeeklySchedule(
  schedule?: Partial<Record<DayOfWeek, DailyOperatingSchedule>> | null
): Record<DayOfWeek, DailyOperatingSchedule> {
  const base = createNotSpecifiedWeeklySchedule();
  if (!schedule || typeof schedule !== 'object') return base;
  for (const day of ALL_DAYS_OF_WEEK) {
    const entry = schedule[day];
    if (entry && typeof entry === 'object') {
      base[day] = {
        state: entry.state || 'not_specified',
        periods: Array.isArray(entry.periods)
          ? entry.periods.map(p => ({
              open: String(p.open || ''),
              close: String(p.close || ''),
              ...(p.label ? { label: String(p.label) } : {}),
            }))
          : [],
        ...(entry.notes ? { notes: String(entry.notes) } : {}),
      };
    }
  }
  return base;
}

const EXTERIOR_PRIMARY_SITE_IDS = new Set<string>([
  'cebu-cross',
  'cebu-heritage-monument',
  'cebu-colon-street',
  'cebu-tres-de-abril-marker',
  'cebu-plaza-independencia',
  'cebu-plaza-sugbo',
  'cebu-plaza-hamabar',
  'cebu-fuente-osmena',
  'talisay-landing',
  'talisay-plaza',
  'mandaue-watchtower',
  'mandaue-bridge',
  'marcelo-fernan-bridge',
  'mandaue-plaza',
  'llc-mactan-shrine',
  'llc-magellan-marker',
  'llc-plaza-rizal',
  'llc-millennium-park',
  'llc-bridge-park',
]);

export function inferPrimaryVisitorScopeForSite(
  site?: Partial<HeritageSite> | null
): EvaluatorTargetScope {
  if (!site) return 'interior';
  if (site.id && EXTERIOR_PRIMARY_SITE_IDS.has(site.id)) {
    return 'exterior_grounds';
  }
  if (
    site.category === 'Plazas, Parks & Public Spaces' ||
    site.category === 'Historical Landmarks & Monuments'
  ) {
    if (site.id === 'cebu-fort-san-pedro' || site.id === 'cebu-rizal-memorial-library') {
      return 'interior';
    }
    return 'exterior_grounds';
  }
  return 'interior';
}

const CASA_GORORDO_OFFICIAL_SOURCE: ScheduleVerificationSource = {
  id: 'casa-gorordo-official-2026',
  title: 'Casa Gorordo Museum – Official Visitor Information',
  publisher: 'Ramon Aboitiz Foundation Inc. (RAFI) / Casa Gorordo Museum',
  url: 'https://casagorordomuseum.org/',
  sourceType: 'Official Museum / Institution Website',
  checkedDate: '2026-11-23',
  supportedClaims: [
    'global_visitor_access_policy',
    'interior_access_policy',
    'interior_regular_schedule',
  ],
  notes:
    'Official website states that all guests are hosted by guides and lists operating hours as Monday–Saturday, 9:00 AM–5:00 PM; Sunday is not specified.',
};

const NMP_CEBU_RESERVATION_SOURCE: ScheduleVerificationSource = {
  id: 'nmp-cebu-reservation-2026',
  title: 'National Museum of the Philippines – Regional Museum Reservation Portal (Cebu)',
  publisher: 'National Museum of the Philippines (NMP)',
  url: 'https://reservation.nationalmuseum.gov.ph/reservation/book/region-museum',
  sourceType: 'Official Museum / Institution Website',
  checkedDate: '2026-11-23',
  supportedClaims: [
    'global_visitor_access_policy',
    'interior_access_policy',
    'interior_regular_schedule',
  ],
  notes: 'Lists National Museum of the Philippines – Cebu operating hours as Monday–Sunday, 9:00 AM–6:00 PM with free public admission.',
};

const NMP_CEBU_OFFICIAL_PAGE_SOURCE: ScheduleVerificationSource = {
  id: 'nmp-cebu-official-page-2026',
  title: 'National Museum of the Philippines – Cebu Regional Museum',
  publisher: 'National Museum of the Philippines (NMP)',
  url: 'https://www.nationalmuseum.gov.ph/our-museums/regional-area-and-site-museums/cebu/',
  sourceType: 'Official Museum / Institution Website',
  checkedDate: '2026-11-23',
  supportedClaims: [
    'global_visitor_access_policy',
    'interior_access_policy',
    'interior_regular_schedule',
  ],
  notes: 'Confirms public admission and daily museum operations for NMP Cebu.',
};

const USC_MUSEUM_OFFICIAL_SOURCE: ScheduleVerificationSource = {
  id: 'usc-museum-visit-usc-2026',
  title: 'Visit USC – University of San Carlos Museum',
  publisher: 'University of San Carlos (USC)',
  url: 'https://usc.edu.ph/catholic-educational-institution-visit-usc',
  sourceType: 'Official Museum / Institution Website',
  checkedDate: '2026-11-23',
  supportedClaims: ['interior_regular_schedule'],
  notes:
    'Lists USC Museum hours as Monday–Friday 8:30 AM–5:30 PM and Saturday 8:00 AM–12:00 PM, except holidays. Sunday is not specified, and external visitor campus gate security/entry policy is not specified on this page.',
};

const BASILICA_GATES_OFFICIAL_SOURCE: ScheduleVerificationSource = {
  id: 'basilica-gates-schedule-2026',
  title: 'Basilica Minore del Santo Niño – Mass, Confession, and Gate Opening & Closing Schedules',
  publisher: 'Basilica Minore del Santo Niño de Cebu',
  url: 'https://santoninodecebubasilica.org/basilica-minore-del-santo-nino/mass-and-confession-schedules/',
  sourceType: 'Official Church / Basilica Website',
  checkedDate: '2026-11-23',
  supportedClaims: [
    'sub_facility_access_policy',
    'sub_facility_regular_schedule',
  ],
  notes:
    'Separate "Gate Opening & Closing" section explicitly confirms 4:00 AM–9:00 PM daily for Basilica Complex Gates. Does not specify church sanctuary interior tourist hours or Pilgrim Center visitor access hours.',
};

const BASILICA_MUSEUM_OFFICIAL_SOURCE: ScheduleVerificationSource = {
  id: 'basilica-basement-museum-2026',
  title: 'Basilica Minore del Santo Niño Museum (Pilgrim Center Basement)',
  publisher: 'Basilica Minore del Santo Niño de Cebu',
  url: 'https://santoninodecebubasilica.org/basilica-minore-del-santo-nino/museum/',
  sourceType: 'Official Church / Basilica Website',
  checkedDate: '2026-11-23',
  supportedClaims: [
    'sub_facility_access_policy',
    'sub_facility_regular_schedule',
  ],
  notes:
    'Confirms basement museum visitor hours as 8:00 AM–11:45 AM and 1:00 PM–4:45 PM daily inside the Pilgrim Center basement.',
};

const CCPL_GMA_2025_SOURCE: ScheduleVerificationSource = {
  id: 'ccpl-gma-june-2025',
  title: 'Cebu City Public Library reopens 24/7 beginning June 30, 2025',
  publisher: 'GMA Regional TV',
  url: 'https://www.gmanetwork.com/regionaltv/features/108864/cebu-city-public-library-reopens-247-beginning-june-30-2025/story/',
  sourceType: 'Verified News Report',
  checkedDate: '2026-11-23',
  supportedClaims: [],
  notes:
    'Reports the June 30, 2025 resumption of 24/7 operations for the ground-floor Cebu City Public Library only; does not independently confirm current 2026 live status or upper-floor Rizal Memorial Museum hours.',
};

const CCPL_SUNSTAR_2025_SOURCE: ScheduleVerificationSource = {
  id: 'ccpl-sunstar-june-2025',
  title: 'Cebu City Public Library relaunches with focus on PWD inclusivity',
  publisher: 'SunStar Cebu',
  url: 'https://www.sunstar.com.ph/cebu/cebu-city-public-library-relaunches-with-focus-on-pwd-inclusivity',
  sourceType: 'Verified News Report',
  checkedDate: '2026-11-23',
  supportedClaims: [],
  notes:
    'Reports the June 30, 2025 relaunch of the ground-floor Cebu City Public Library; does not verify upper-floor museum gallery hours or current 2026 uninterrupted 24/7 status.',
};

const SUGBU_CHINESE_DISCREPANCY_SOURCE: ScheduleVerificationSource = {
  id: 'sugbu-chinese-official-discrepancy-2026',
  title: 'Sugbu Chinese Heritage Museum Official Website',
  publisher: 'Sugbu Chinese Heritage Museum Foundation, Inc.',
  url: 'https://sugbuchinese.com/',
  sourceType: 'Official Museum / Institution Website',
  checkedDate: '2026-11-23',
  supportedClaims: [],
  notes:
    'Official website displays a schedule discrepancy across its sections between Friday–Sunday 8:00 AM–5:00 PM and Friday–Sunday 10:00 AM–5:00 PM; Monday–Thursday hours are not specified.',
};

export function buildDefaultUnverifiedOperatingSchedule(
  site: Partial<HeritageSite> = {}
): OperatingSchedule {
  const primaryScope = inferPrimaryVisitorScopeForSite(site);
  const isDemolished = site.demolitionStatus === 'Demolished';
  const emptyHours = createNotSpecifiedWeeklySchedule();
  const legacyHoursNote = site.visitingHours
    ? `Unverified directory note: ${site.visitingHours}`
    : 'Operating hours require official verification';

  return {
    timezone: 'Asia/Manila',
    physicalPreservationStatus: isDemolished ? 'Demolished / Lost' : 'Standing',
    visitorAccessStatus: isDemolished ? 'Demolished / Lost' : 'Unknown / Unverified',
    primaryVisitorScope: primaryScope,
    interiorAccess: {
      policyStatus:
        primaryScope === 'exterior_grounds'
          ? 'Not Applicable (Open-Air / Exterior Landmark)'
          : 'Unknown / Unverified',
      policyVerified: false,
      policySources: [],
      scheduleVerified: false,
      verifiedDays: [],
      weeklyCoverage: 'none',
      regularHours: createNotSpecifiedWeeklySchedule(),
      scheduleSources: [],
      lastVerifiedDate: null,
    },
    exteriorGroundsAccess: {
      policyStatus: 'Unknown / Unverified',
      policyVerified: false,
      policySources: [],
      scheduleVerified: false,
      verifiedDays: [],
      weeklyCoverage: 'none',
      regularHours: createNotSpecifiedWeeklySchedule(),
      scheduleSources: [],
      lastVerifiedDate: null,
    },
    exteriorStreetVisibility: {
      status: 'Unknown / Unverified',
      isVerified: false,
      sources: [],
      lastVerifiedDate: null,
    },
    regularHours: emptyHours,
    specialSchedules: [],
    temporaryClosures: [],
    subFacilities: [],
    verification: {
      scheduleVerified: false,
      visitorAccessStatusVerified: isDemolished,
      visitorAccessStatusSources: [],
      verifiedDays: [],
      weeklyCoverage: 'none',
      interiorAccessPolicyVerified: false,
      interiorScheduleVerified: false,
      exteriorGroundsPolicyVerified: false,
      exteriorGroundsScheduleVerified: false,
      exteriorStreetVisibilityVerified: false,
      verificationStatusLabel: 'Unverified',
      lastVerifiedDate: null,
      sources: [],
      verificationNotes: legacyHoursNote,
    },
    displaySummary: site.visitingHours || 'Hours Unverified',
  };
}

function buildAuditedOperatingSchedules(): Record<string, OperatingSchedule> {
  // 1. Casa Gorordo Museum (Group A #1 — Mon-Sat verified interior policy + schedule; Sun not_specified)
  const casaGorordoHours = createNotSpecifiedWeeklySchedule();
  for (const day of WEEKDAYS_MONDAY_TO_SATURDAY) {
    casaGorordoHours[day] = {
      state: 'open',
      periods: [{ open: '09:00', close: '17:00' }],
    };
  }
  casaGorordoHours.sunday = {
    state: 'not_specified',
    periods: [],
    notes: 'Sunday is not listed on the official website; do not assume closed without confirmation.',
  };

  // 2. National Museum of the Philippines - Cebu (Group A #2 — All 7 days verified interior policy + schedule)
  const nationalMuseumHours = createNotSpecifiedWeeklySchedule();
  for (const day of ALL_DAYS_OF_WEEK) {
    nationalMuseumHours[day] = {
      state: 'open',
      periods: [{ open: '09:00', close: '18:00' }],
    };
  }

  // 3. University of San Carlos Museum (Group A #3 — Mon-Sat verified interior schedule; interior access policy unverified; Sun not_specified)
  const uscMuseumHours = createNotSpecifiedWeeklySchedule();
  for (const day of ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as DayOfWeek[]) {
    uscMuseumHours[day] = {
      state: 'open',
      periods: [{ open: '08:30', close: '17:30' }],
      notes: 'Except holidays',
    };
  }
  uscMuseumHours.saturday = {
    state: 'open',
    periods: [{ open: '08:00', close: '12:00' }],
    notes: 'Except holidays',
  };
  uscMuseumHours.sunday = {
    state: 'not_specified',
    periods: [],
    notes: 'Sunday is not specified on the official Visit USC page.',
  };

  // 4. Basilica Minore del Santo Niño de Cebu (Group B #4 — Sub-facilities verified; main sanctuary interior & Pilgrim Center unverified)
  const basilicaGateHours = createNotSpecifiedWeeklySchedule();
  const basilicaMuseumHours = createNotSpecifiedWeeklySchedule();
  for (const day of ALL_DAYS_OF_WEEK) {
    basilicaGateHours[day] = {
      state: 'open',
      periods: [{ open: '04:00', close: '21:00', label: 'Complex Gate Hours' }],
    };
    basilicaMuseumHours[day] = {
      state: 'open',
      periods: [
        { open: '08:00', close: '11:45', label: 'Morning Session' },
        { open: '13:00', close: '16:45', label: 'Afternoon Session' },
      ],
    };
  }

  return {
    'cebu-casa-gorordo': {
      timezone: 'Asia/Manila',
      physicalPreservationStatus: 'Restored',
      visitorAccessStatus: 'Guided / Ticketed Entry',
      primaryVisitorScope: 'interior',
      interiorAccess: {
        policyStatus: 'Guided / Ticketed Interior',
        policyVerified: true,
        policySources: [CASA_GORORDO_OFFICIAL_SOURCE],
        scheduleVerified: true,
        verifiedDays: [...WEEKDAYS_MONDAY_TO_SATURDAY],
        weeklyCoverage: 'partial_days_only',
        regularHours: cloneWeeklySchedule(casaGorordoHours),
        scheduleSources: [CASA_GORORDO_OFFICIAL_SOURCE],
        lastVerifiedDate: '2026-11-23',
        notes: 'All guests are hosted by museum guides.',
      },
      exteriorGroundsAccess: {
        policyStatus: 'Unknown / Unverified',
        policyVerified: false,
        policySources: [],
        scheduleVerified: false,
        verifiedDays: [],
        weeklyCoverage: 'none',
        regularHours: createNotSpecifiedWeeklySchedule(),
        scheduleSources: [],
        lastVerifiedDate: null,
        notes: 'Courtyard/compound access without a guided tour is not specified on the official page.',
      },
      exteriorStreetVisibility: {
        status: 'Unknown / Unverified',
        isVerified: false,
        sources: [],
        lastVerifiedDate: null,
      },
      regularHours: cloneWeeklySchedule(casaGorordoHours),
      specialSchedules: [],
      temporaryClosures: [],
      subFacilities: [],
      verification: {
        scheduleVerified: true,
        visitorAccessStatusVerified: true,
        visitorAccessStatusSources: [CASA_GORORDO_OFFICIAL_SOURCE],
        verifiedDays: [...WEEKDAYS_MONDAY_TO_SATURDAY],
        weeklyCoverage: 'partial_days_only',
        interiorAccessPolicyVerified: true,
        interiorScheduleVerified: true,
        exteriorGroundsPolicyVerified: false,
        exteriorGroundsScheduleVerified: false,
        exteriorStreetVisibilityVerified: false,
        verificationStatusLabel: 'Verified (Listed Days Only)',
        lastVerifiedDate: '2026-11-23',
        sources: [CASA_GORORDO_OFFICIAL_SOURCE],
        verificationNotes: 'Verified Monday–Saturday 9:00 AM–5:00 PM; Sunday hours not specified.',
      },
      displaySummary: 'Mon–Sat: 9:00 AM – 5:00 PM; Sun: Not specified',
      publicNotes: 'All guests are hosted by museum guides. Sunday operating status requires direct confirmation.',
    },

    'cebu-national-museum': {
      timezone: 'Asia/Manila',
      physicalPreservationStatus: 'Restored',
      visitorAccessStatus: 'Publicly Accessible',
      primaryVisitorScope: 'interior',
      interiorAccess: {
        policyStatus: 'Publicly Accessible Interior',
        policyVerified: true,
        policySources: [NMP_CEBU_RESERVATION_SOURCE, NMP_CEBU_OFFICIAL_PAGE_SOURCE],
        scheduleVerified: true,
        verifiedDays: [...ALL_DAYS_OF_WEEK],
        weeklyCoverage: 'all_7_days',
        regularHours: cloneWeeklySchedule(nationalMuseumHours),
        scheduleSources: [NMP_CEBU_RESERVATION_SOURCE, NMP_CEBU_OFFICIAL_PAGE_SOURCE],
        lastVerifiedDate: '2026-11-23',
        notes: 'Free public walk-in admission for individuals and small groups under 20 pax.',
      },
      exteriorGroundsAccess: {
        policyStatus: 'Unknown / Unverified',
        policyVerified: false,
        policySources: [],
        scheduleVerified: false,
        verifiedDays: [],
        weeklyCoverage: 'none',
        regularHours: createNotSpecifiedWeeklySchedule(),
        scheduleSources: [],
        lastVerifiedDate: null,
        notes: 'Surrounding Aduana compound grounds access outside gallery hours is not inferred from museum hours.',
      },
      exteriorStreetVisibility: {
        status: 'Unknown / Unverified',
        isVerified: false,
        sources: [],
        lastVerifiedDate: null,
      },
      regularHours: cloneWeeklySchedule(nationalMuseumHours),
      specialSchedules: [],
      temporaryClosures: [],
      subFacilities: [],
      verification: {
        scheduleVerified: true,
        visitorAccessStatusVerified: true,
        visitorAccessStatusSources: [NMP_CEBU_RESERVATION_SOURCE, NMP_CEBU_OFFICIAL_PAGE_SOURCE],
        verifiedDays: [...ALL_DAYS_OF_WEEK],
        weeklyCoverage: 'all_7_days',
        interiorAccessPolicyVerified: true,
        interiorScheduleVerified: true,
        exteriorGroundsPolicyVerified: false,
        exteriorGroundsScheduleVerified: false,
        exteriorStreetVisibilityVerified: false,
        verificationStatusLabel: 'Verified',
        lastVerifiedDate: '2026-11-23',
        sources: [NMP_CEBU_RESERVATION_SOURCE, NMP_CEBU_OFFICIAL_PAGE_SOURCE],
        verificationNotes: 'Verified Monday–Sunday 9:00 AM–6:00 PM via the NMP Regional Museum Reservation Portal.',
      },
      displaySummary: 'Mon–Sun: 9:00 AM – 6:00 PM',
      publicNotes: 'Open daily 9:00 AM–6:00 PM with free public admission.',
    },

    'cebu-usc-museum': {
      timezone: 'Asia/Manila',
      physicalPreservationStatus: 'Standing',
      visitorAccessStatus: 'Unknown / Unverified',
      primaryVisitorScope: 'interior',
      interiorAccess: {
        policyStatus: 'Unknown / Unverified',
        policyVerified: false,
        policySources: [],
        scheduleVerified: true,
        verifiedDays: [...WEEKDAYS_MONDAY_TO_SATURDAY],
        weeklyCoverage: 'partial_days_only',
        regularHours: cloneWeeklySchedule(uscMuseumHours),
        scheduleSources: [USC_MUSEUM_OFFICIAL_SOURCE],
        lastVerifiedDate: '2026-11-23',
        notes: 'Official Visit USC page verifies Mon–Fri 8:30 AM–5:30 PM and Sat 8:00 AM–12:00 PM (except holidays), but does not specify campus gate security or non-USC walk-in entry rules.',
      },
      exteriorGroundsAccess: {
        policyStatus: 'Unknown / Unverified',
        policyVerified: false,
        policySources: [],
        scheduleVerified: false,
        verifiedDays: [],
        weeklyCoverage: 'none',
        regularHours: createNotSpecifiedWeeklySchedule(),
        scheduleSources: [],
        lastVerifiedDate: null,
      },
      exteriorStreetVisibility: {
        status: 'Unknown / Unverified',
        isVerified: false,
        sources: [],
        lastVerifiedDate: null,
      },
      regularHours: cloneWeeklySchedule(uscMuseumHours),
      specialSchedules: [],
      temporaryClosures: [],
      subFacilities: [],
      verification: {
        scheduleVerified: true,
        visitorAccessStatusVerified: false,
        visitorAccessStatusSources: [],
        verifiedDays: [...WEEKDAYS_MONDAY_TO_SATURDAY],
        weeklyCoverage: 'partial_days_only',
        interiorAccessPolicyVerified: false,
        interiorScheduleVerified: true,
        exteriorGroundsPolicyVerified: false,
        exteriorGroundsScheduleVerified: false,
        exteriorStreetVisibilityVerified: false,
        verificationStatusLabel: 'Verified Schedule (Access Policy Unverified)',
        lastVerifiedDate: '2026-11-23',
        sources: [USC_MUSEUM_OFFICIAL_SOURCE],
        verificationNotes:
          'Mon–Fri 8:30 AM–5:30 PM & Sat 8:00 AM–12:00 PM (except holidays) schedule is verified; campus visitor entry policy and Sunday status require confirmation.',
      },
      displaySummary: 'Mon–Fri: 8:30 AM – 5:30 PM; Sat: 8:00 AM – 12:00 PM (Except holidays; entry policy unverified)',
      publicNotes:
        'Published museum hours are Mon–Fri 8:30 AM–5:30 PM and Sat 8:00 AM–12:00 PM (except holidays); confirm campus gate entry rules before visiting.',
    },

    'cebu-basilica': {
      timezone: 'Asia/Manila',
      physicalPreservationStatus: 'Restored',
      visitorAccessStatus: 'Unknown / Unverified',
      primaryVisitorScope: 'interior',
      interiorAccess: {
        policyStatus: 'Unknown / Unverified',
        policyVerified: false,
        policySources: [],
        scheduleVerified: false,
        verifiedDays: [],
        weeklyCoverage: 'none',
        regularHours: createNotSpecifiedWeeklySchedule(
          'Main Basilica sanctuary interior tourist access hours outside liturgical mass schedules are not separately specified.'
        ),
        scheduleSources: [],
        lastVerifiedDate: null,
        notes: 'Complex gate hours (4:00 AM–9:00 PM) do not automatically apply to church sanctuary interior or Pilgrim Center visitor access.',
      },
      exteriorGroundsAccess: {
        policyStatus: 'Unknown / Unverified',
        policyVerified: false,
        policySources: [],
        scheduleVerified: false,
        verifiedDays: [],
        weeklyCoverage: 'none',
        regularHours: createNotSpecifiedWeeklySchedule(
          'See the Basilica Complex Gates sub-facility for verified daily gate opening and closing hours (4:00 AM–9:00 PM).'
        ),
        scheduleSources: [],
        lastVerifiedDate: null,
        notes: 'Basilica Complex Gates (4:00 AM–9:00 PM daily) are tracked as a verified sub-facility distinct from Pilgrim Center visitor access.',
      },
      exteriorStreetVisibility: {
        status: 'Unknown / Unverified',
        isVerified: false,
        sources: [],
        lastVerifiedDate: null,
      },
      regularHours: createNotSpecifiedWeeklySchedule(),
      specialSchedules: [],
      temporaryClosures: [],
      subFacilities: [
        {
          id: 'basilica-complex-gates',
          name: 'Basilica Complex Gates',
          targetScope: 'exterior_grounds',
          visitorAccessStatus: 'Publicly Accessible',
          visitorAccessStatusVerified: true,
          policySources: [BASILICA_GATES_OFFICIAL_SOURCE],
          isVerified: true,
          verifiedDays: [...ALL_DAYS_OF_WEEK],
          weeklyCoverage: 'all_7_days',
          regularHours: cloneWeeklySchedule(basilicaGateHours),
          scheduleSources: [BASILICA_GATES_OFFICIAL_SOURCE],
          temporaryClosures: [],
          specialSchedules: [],
          lastVerifiedDate: '2026-11-23',
          notes:
            'Verified under the separate "Gate Opening & Closing" section (4:00 AM–9:00 PM daily). Does not automatically apply to church interior or Pilgrim Center access.',
        },
        {
          id: 'basilica-basement-museum',
          name: 'Basilica Museum (Pilgrim Center Basement)',
          targetScope: 'interior',
          visitorAccessStatus: 'Guided / Ticketed Entry',
          visitorAccessStatusVerified: true,
          policySources: [BASILICA_MUSEUM_OFFICIAL_SOURCE],
          isVerified: true,
          verifiedDays: [...ALL_DAYS_OF_WEEK],
          weeklyCoverage: 'all_7_days',
          regularHours: cloneWeeklySchedule(basilicaMuseumHours),
          scheduleSources: [BASILICA_MUSEUM_OFFICIAL_SOURCE],
          temporaryClosures: [],
          specialSchedules: [],
          lastVerifiedDate: '2026-11-23',
          notes: 'Located at the basement of the Santo Niño Pilgrim Center (8:00 AM–11:45 AM & 1:00 PM–4:45 PM daily).',
        },
      ],
      verification: {
        scheduleVerified: false,
        visitorAccessStatusVerified: false,
        visitorAccessStatusSources: [],
        verifiedDays: [],
        weeklyCoverage: 'none',
        interiorAccessPolicyVerified: false,
        interiorScheduleVerified: false,
        exteriorGroundsPolicyVerified: false,
        exteriorGroundsScheduleVerified: false,
        exteriorStreetVisibilityVerified: false,
        verificationStatusLabel: 'Partially Verified (Sub-Facility Only)',
        lastVerifiedDate: '2026-11-23',
        sources: [BASILICA_GATES_OFFICIAL_SOURCE, BASILICA_MUSEUM_OFFICIAL_SOURCE],
        verificationNotes:
          'Basilica Complex Gates (4:00 AM–9:00 PM daily) and Basement Museum (8:00 AM–11:45 AM & 1:00 PM–4:45 PM daily) are verified as separate sub-facilities; church interior and Pilgrim Center visitor access hours remain unverified.',
      },
      displaySummary:
        'Complex Gates: 4:00 AM – 9:00 PM Daily; Basement Museum: 8:00 AM – 11:45 AM & 1:00 PM – 4:45 PM Daily (Church Interior & Pilgrim Center unverified)',
      publicNotes:
        'Complex gates open 4:00 AM–9:00 PM daily; Basement Museum opens 8:00 AM–11:45 AM and 1:00 PM–4:45 PM daily. Main church interior and Pilgrim Center tourist access hours are unverified.',
    },

    'cebu-rizal-memorial-library': {
      timezone: 'Asia/Manila',
      physicalPreservationStatus: 'Standing',
      visitorAccessStatus: 'Unknown / Unverified',
      primaryVisitorScope: 'interior',
      interiorAccess: {
        policyStatus: 'Unknown / Unverified',
        policyVerified: false,
        policySources: [],
        scheduleVerified: false,
        verifiedDays: [],
        weeklyCoverage: 'none',
        regularHours: createNotSpecifiedWeeklySchedule(
          'Upper-floor Rizal Memorial Museum and cultural office operating hours are unverified.'
        ),
        scheduleSources: [],
        lastVerifiedDate: null,
        notes: 'Do not automatically apply the ground-floor Cebu City Public Library schedule to the upper-floor museum galleries.',
      },
      exteriorGroundsAccess: {
        policyStatus: 'Unknown / Unverified',
        policyVerified: false,
        policySources: [],
        scheduleVerified: false,
        verifiedDays: [],
        weeklyCoverage: 'none',
        regularHours: createNotSpecifiedWeeklySchedule(),
        scheduleSources: [],
        lastVerifiedDate: null,
      },
      exteriorStreetVisibility: {
        status: 'Unknown / Unverified',
        isVerified: false,
        sources: [],
        lastVerifiedDate: null,
      },
      regularHours: createNotSpecifiedWeeklySchedule(),
      specialSchedules: [],
      temporaryClosures: [],
      subFacilities: [
        {
          id: 'ccpl-ground-floor-library',
          name: 'Cebu City Public Library (Ground Floor)',
          targetScope: 'interior',
          visitorAccessStatus: 'Unknown / Unverified',
          visitorAccessStatusVerified: false,
          policySources: [],
          isVerified: false,
          verifiedDays: [],
          weeklyCoverage: 'none',
          regularHours: createNotSpecifiedWeeklySchedule(
            'Reported as resuming 24/7 operation beginning June 30, 2025; requires current 2026 confirmation.'
          ),
          scheduleSources: [CCPL_GMA_2025_SOURCE, CCPL_SUNSTAR_2025_SOURCE],
          temporaryClosures: [],
          specialSchedules: [],
          lastVerifiedDate: '2026-11-23',
          notes:
            'June 2025 news reports document the June 30, 2025 resumption of 24/7 operations for the ground-floor public library only and do not independently verify current 2026 live status.',
        },
      ],
      verification: {
        scheduleVerified: false,
        visitorAccessStatusVerified: false,
        visitorAccessStatusSources: [],
        verifiedDays: [],
        weeklyCoverage: 'none',
        interiorAccessPolicyVerified: false,
        interiorScheduleVerified: false,
        exteriorGroundsPolicyVerified: false,
        exteriorGroundsScheduleVerified: false,
        exteriorStreetVisibilityVerified: false,
        verificationStatusLabel: 'Partially Verified (Sub-Facility Only)',
        lastVerifiedDate: '2026-11-23',
        sources: [CCPL_GMA_2025_SOURCE, CCPL_SUNSTAR_2025_SOURCE],
        verificationNotes:
          'Upper-floor museum hours are unverified. Ground-floor Cebu City Public Library was reported as resuming 24/7 operations on June 30, 2025, requiring current 2026 confirmation.',
      },
      displaySummary:
        'Upper-Floor Museum: Hours Unverified; Ground-Floor Library: Reported 24/7 resumption (June 30, 2025 — requires current confirmation)',
      publicNotes:
        'The ground-floor Cebu City Public Library was reported as resuming 24/7 operation on June 30, 2025; upper-floor museum gallery hours and current 2026 library hours require confirmation.',
    },

    'cebu-sugbu-chinese-museum': {
      timezone: 'Asia/Manila',
      physicalPreservationStatus: 'Restored',
      visitorAccessStatus: 'Unknown / Unverified',
      primaryVisitorScope: 'interior',
      interiorAccess: {
        policyStatus: 'Unknown / Unverified',
        policyVerified: false,
        policySources: [],
        scheduleVerified: false,
        verifiedDays: [],
        weeklyCoverage: 'none',
        regularHours: createNotSpecifiedWeeklySchedule(
          'Official website (sugbuchinese.com) conflicts between Fri–Sun 8:00 AM–5:00 PM and Fri–Sun 10:00 AM–5:00 PM; Mon–Thu not specified.'
        ),
        scheduleSources: [SUGBU_CHINESE_DISCREPANCY_SOURCE],
        lastVerifiedDate: '2026-11-23',
        notes: 'Requires direct confirmation from Sugbu Chinese Heritage Museum Foundation, Inc.',
      },
      exteriorGroundsAccess: {
        policyStatus: 'Unknown / Unverified',
        policyVerified: false,
        policySources: [],
        scheduleVerified: false,
        verifiedDays: [],
        weeklyCoverage: 'none',
        regularHours: createNotSpecifiedWeeklySchedule(),
        scheduleSources: [],
        lastVerifiedDate: null,
      },
      exteriorStreetVisibility: {
        status: 'Unknown / Unverified',
        isVerified: false,
        sources: [],
        lastVerifiedDate: null,
      },
      regularHours: createNotSpecifiedWeeklySchedule(),
      specialSchedules: [],
      temporaryClosures: [],
      subFacilities: [],
      verification: {
        scheduleVerified: false,
        visitorAccessStatusVerified: false,
        visitorAccessStatusSources: [],
        verifiedDays: [],
        weeklyCoverage: 'none',
        interiorAccessPolicyVerified: false,
        interiorScheduleVerified: false,
        exteriorGroundsPolicyVerified: false,
        exteriorGroundsScheduleVerified: false,
        exteriorStreetVisibilityVerified: false,
        verificationStatusLabel: 'Requires Clarification (Official Source Discrepancy)',
        lastVerifiedDate: '2026-11-23',
        sources: [SUGBU_CHINESE_DISCREPANCY_SOURCE],
        verificationNotes:
          'Official website (sugbuchinese.com) displays conflicting Friday–Sunday schedules (8:00 AM–5:00 PM vs. 10:00 AM–5:00 PM) and does not specify Monday–Thursday status.',
      },
      displaySummary:
        'Requires Confirmation (Official website lists conflicting Fri–Sun 8:00 AM–5:00 PM vs. 10:00 AM–5:00 PM; Mon–Thu not specified)',
      publicNotes:
        'Official website lists conflicting Friday–Sunday hours (8:00 AM–5:00 PM vs. 10:00 AM–5:00 PM); Monday–Thursday is not specified. Please confirm before visiting.',
    },
  };
}

const AUDITED_OPERATING_SCHEDULES = buildAuditedOperatingSchedules();

export function normalizeOperatingSchedule(
  rawSchedule: Partial<OperatingSchedule> | null | undefined,
  fallbackSite?: Partial<HeritageSite> | null
): OperatingSchedule {
  const staticBaseline =
    (fallbackSite?.id && AUDITED_OPERATING_SCHEDULES[fallbackSite.id]) ||
    fallbackSite?.operatingSchedule ||
    buildDefaultUnverifiedOperatingSchedule(fallbackSite || {});

  if (!rawSchedule || typeof rawSchedule !== 'object') {
    const clonedBaseline: OperatingSchedule = {
      ...staticBaseline,
      interiorAccess: {
        ...staticBaseline.interiorAccess,
        policySources: [...(staticBaseline.interiorAccess.policySources || [])],
        verifiedDays: [...(staticBaseline.interiorAccess.verifiedDays || [])],
        regularHours: cloneWeeklySchedule(staticBaseline.interiorAccess.regularHours),
        scheduleSources: [...(staticBaseline.interiorAccess.scheduleSources || [])],
      },
      exteriorGroundsAccess: {
        ...staticBaseline.exteriorGroundsAccess,
        policySources: [...(staticBaseline.exteriorGroundsAccess.policySources || [])],
        verifiedDays: [...(staticBaseline.exteriorGroundsAccess.verifiedDays || [])],
        regularHours: cloneWeeklySchedule(staticBaseline.exteriorGroundsAccess.regularHours),
        scheduleSources: [...(staticBaseline.exteriorGroundsAccess.scheduleSources || [])],
      },
      exteriorStreetVisibility: {
        ...staticBaseline.exteriorStreetVisibility,
        sources: [...(staticBaseline.exteriorStreetVisibility.sources || [])],
      },
      regularHours: cloneWeeklySchedule(staticBaseline.regularHours),
      specialSchedules: Array.isArray(staticBaseline.specialSchedules)
        ? staticBaseline.specialSchedules.map(s => ({ ...s, periods: [...(s.periods || [])], sources: [...(s.sources || [])] }))
        : [],
      temporaryClosures: Array.isArray(staticBaseline.temporaryClosures)
        ? staticBaseline.temporaryClosures.map(c => ({ ...c, sources: [...(c.sources || [])] }))
        : [],
      subFacilities: Array.isArray(staticBaseline.subFacilities)
        ? staticBaseline.subFacilities.map(sub => ({
            ...sub,
            policySources: [...(sub.policySources || [])],
            verifiedDays: [...(sub.verifiedDays || [])],
            regularHours: cloneWeeklySchedule(sub.regularHours),
            scheduleSources: [...(sub.scheduleSources || [])],
            temporaryClosures: [...(sub.temporaryClosures || [])],
            specialSchedules: [...(sub.specialSchedules || [])],
          }))
        : [],
      verification: {
        ...staticBaseline.verification,
        visitorAccessStatusSources: [...(staticBaseline.verification.visitorAccessStatusSources || [])],
        verifiedDays: [...(staticBaseline.verification.verifiedDays || [])],
        sources: [...(staticBaseline.verification.sources || [])],
      },
    };
    if (fallbackSite?.demolitionStatus === 'Demolished') {
      clonedBaseline.physicalPreservationStatus = 'Demolished / Lost';
      clonedBaseline.visitorAccessStatus = 'Demolished / Lost';
      clonedBaseline.verification.visitorAccessStatusVerified = true;
    }
    return clonedBaseline;
  }

  const primaryVisitorScope: EvaluatorTargetScope =
    rawSchedule.primaryVisitorScope || staticBaseline.primaryVisitorScope || inferPrimaryVisitorScopeForSite(fallbackSite);

  const interiorRegularHours = cloneWeeklySchedule(
    rawSchedule.interiorAccess?.regularHours ||
      (primaryVisitorScope === 'interior' ? rawSchedule.regularHours : undefined) ||
      staticBaseline.interiorAccess.regularHours
  );

  const exteriorRegularHours = cloneWeeklySchedule(
    rawSchedule.exteriorGroundsAccess?.regularHours ||
      (primaryVisitorScope === 'exterior_grounds' ? rawSchedule.regularHours : undefined) ||
      staticBaseline.exteriorGroundsAccess.regularHours
  );

  const interiorAccess: InteriorAccessInfo = {
    policyStatus:
      rawSchedule.interiorAccess?.policyStatus ?? staticBaseline.interiorAccess.policyStatus,
    policyVerified: Boolean(
      rawSchedule.interiorAccess?.policyVerified ?? staticBaseline.interiorAccess.policyVerified
    ),
    policySources: Array.isArray(rawSchedule.interiorAccess?.policySources)
      ? rawSchedule.interiorAccess!.policySources
      : [...(staticBaseline.interiorAccess.policySources || [])],
    scheduleVerified: Boolean(
      rawSchedule.interiorAccess?.scheduleVerified ??
        (primaryVisitorScope === 'interior' ? rawSchedule.verification?.scheduleVerified : undefined) ??
        staticBaseline.interiorAccess.scheduleVerified
    ),
    verifiedDays: Array.isArray(rawSchedule.interiorAccess?.verifiedDays)
      ? [...rawSchedule.interiorAccess!.verifiedDays]
      : primaryVisitorScope === 'interior' && Array.isArray(rawSchedule.verification?.verifiedDays)
        ? [...rawSchedule.verification!.verifiedDays]
        : [...(staticBaseline.interiorAccess.verifiedDays || [])],
    weeklyCoverage:
      rawSchedule.interiorAccess?.weeklyCoverage ??
      (primaryVisitorScope === 'interior' ? rawSchedule.verification?.weeklyCoverage : undefined) ??
      staticBaseline.interiorAccess.weeklyCoverage,
    regularHours: interiorRegularHours,
    scheduleSources: Array.isArray(rawSchedule.interiorAccess?.scheduleSources)
      ? rawSchedule.interiorAccess!.scheduleSources
      : [...(staticBaseline.interiorAccess.scheduleSources || [])],
    lastVerifiedDate:
      rawSchedule.interiorAccess?.lastVerifiedDate !== undefined
        ? rawSchedule.interiorAccess.lastVerifiedDate
        : staticBaseline.interiorAccess.lastVerifiedDate,
    ...(rawSchedule.interiorAccess?.notes ?? staticBaseline.interiorAccess.notes
      ? { notes: rawSchedule.interiorAccess?.notes ?? staticBaseline.interiorAccess.notes }
      : {}),
  };

  const exteriorGroundsAccess: ExteriorGroundsAccessInfo = {
    policyStatus:
      rawSchedule.exteriorGroundsAccess?.policyStatus ??
      staticBaseline.exteriorGroundsAccess.policyStatus,
    policyVerified: Boolean(
      rawSchedule.exteriorGroundsAccess?.policyVerified ??
        staticBaseline.exteriorGroundsAccess.policyVerified
    ),
    policySources: Array.isArray(rawSchedule.exteriorGroundsAccess?.policySources)
      ? rawSchedule.exteriorGroundsAccess!.policySources
      : [...(staticBaseline.exteriorGroundsAccess.policySources || [])],
    scheduleVerified: Boolean(
      rawSchedule.exteriorGroundsAccess?.scheduleVerified ??
        (primaryVisitorScope === 'exterior_grounds' ? rawSchedule.verification?.scheduleVerified : undefined) ??
        staticBaseline.exteriorGroundsAccess.scheduleVerified
    ),
    verifiedDays: Array.isArray(rawSchedule.exteriorGroundsAccess?.verifiedDays)
      ? [...rawSchedule.exteriorGroundsAccess!.verifiedDays]
      : primaryVisitorScope === 'exterior_grounds' && Array.isArray(rawSchedule.verification?.verifiedDays)
        ? [...rawSchedule.verification!.verifiedDays]
        : [...(staticBaseline.exteriorGroundsAccess.verifiedDays || [])],
    weeklyCoverage:
      rawSchedule.exteriorGroundsAccess?.weeklyCoverage ??
      (primaryVisitorScope === 'exterior_grounds' ? rawSchedule.verification?.weeklyCoverage : undefined) ??
      staticBaseline.exteriorGroundsAccess.weeklyCoverage,
    regularHours: exteriorRegularHours,
    scheduleSources: Array.isArray(rawSchedule.exteriorGroundsAccess?.scheduleSources)
      ? rawSchedule.exteriorGroundsAccess!.scheduleSources
      : [...(staticBaseline.exteriorGroundsAccess.scheduleSources || [])],
    lastVerifiedDate:
      rawSchedule.exteriorGroundsAccess?.lastVerifiedDate !== undefined
        ? rawSchedule.exteriorGroundsAccess.lastVerifiedDate
        : staticBaseline.exteriorGroundsAccess.lastVerifiedDate,
    ...(rawSchedule.exteriorGroundsAccess?.notes ?? staticBaseline.exteriorGroundsAccess.notes
      ? { notes: rawSchedule.exteriorGroundsAccess?.notes ?? staticBaseline.exteriorGroundsAccess.notes }
      : {}),
  };

  const exteriorStreetVisibility: ExteriorStreetVisibilityInfo = {
    status:
      rawSchedule.exteriorStreetVisibility?.status ??
      staticBaseline.exteriorStreetVisibility.status,
    isVerified: Boolean(
      rawSchedule.exteriorStreetVisibility?.isVerified ??
        staticBaseline.exteriorStreetVisibility.isVerified
    ),
    sources: Array.isArray(rawSchedule.exteriorStreetVisibility?.sources)
      ? rawSchedule.exteriorStreetVisibility!.sources
      : [...(staticBaseline.exteriorStreetVisibility.sources || [])],
    lastVerifiedDate:
      rawSchedule.exteriorStreetVisibility?.lastVerifiedDate !== undefined
        ? rawSchedule.exteriorStreetVisibility.lastVerifiedDate
        : staticBaseline.exteriorStreetVisibility.lastVerifiedDate,
    ...(rawSchedule.exteriorStreetVisibility?.notes ?? staticBaseline.exteriorStreetVisibility.notes
      ? { notes: rawSchedule.exteriorStreetVisibility?.notes ?? staticBaseline.exteriorStreetVisibility.notes }
      : {}),
  };

  const primaryScopeInfo = primaryVisitorScope === 'interior' ? interiorAccess : exteriorGroundsAccess;
  const isDemolished =
    fallbackSite?.demolitionStatus === 'Demolished' ||
    rawSchedule.physicalPreservationStatus === 'Demolished / Lost' ||
    rawSchedule.visitorAccessStatus === 'Demolished / Lost';

  return {
    timezone: 'Asia/Manila',
    physicalPreservationStatus: isDemolished
      ? 'Demolished / Lost'
      : rawSchedule.physicalPreservationStatus ?? staticBaseline.physicalPreservationStatus,
    visitorAccessStatus: isDemolished
      ? 'Demolished / Lost'
      : rawSchedule.visitorAccessStatus ?? staticBaseline.visitorAccessStatus,
    primaryVisitorScope,
    interiorAccess,
    exteriorGroundsAccess,
    exteriorStreetVisibility,
    regularHours: cloneWeeklySchedule(
      rawSchedule.regularHours || primaryScopeInfo.regularHours
    ),
    specialSchedules: Array.isArray(rawSchedule.specialSchedules)
      ? rawSchedule.specialSchedules.map(s => ({
          ...s,
          periods: Array.isArray(s.periods) ? [...s.periods] : [],
          sources: Array.isArray(s.sources) ? [...s.sources] : [],
        }))
      : [...(staticBaseline.specialSchedules || [])],
    temporaryClosures: Array.isArray(rawSchedule.temporaryClosures)
      ? rawSchedule.temporaryClosures.map(c => ({
          ...c,
          sources: Array.isArray(c.sources) ? [...c.sources] : [],
        }))
      : [...(staticBaseline.temporaryClosures || [])],
    subFacilities: Array.isArray(rawSchedule.subFacilities)
      ? rawSchedule.subFacilities.map(sub => ({
          ...sub,
          policySources: Array.isArray(sub.policySources) ? [...sub.policySources] : [],
          verifiedDays: Array.isArray(sub.verifiedDays) ? [...sub.verifiedDays] : [],
          regularHours: cloneWeeklySchedule(sub.regularHours),
          scheduleSources: Array.isArray(sub.scheduleSources) ? [...sub.scheduleSources] : [],
          temporaryClosures: Array.isArray(sub.temporaryClosures) ? [...sub.temporaryClosures] : [],
          specialSchedules: Array.isArray(sub.specialSchedules) ? [...sub.specialSchedules] : [],
        }))
      : [...(staticBaseline.subFacilities || [])],
    verification: {
      scheduleVerified: Boolean(
        rawSchedule.verification?.scheduleVerified ?? primaryScopeInfo.scheduleVerified
      ),
      visitorAccessStatusVerified: isDemolished
        ? true
        : Boolean(
            rawSchedule.verification?.visitorAccessStatusVerified ??
              staticBaseline.verification.visitorAccessStatusVerified
          ),
      visitorAccessStatusSources: Array.isArray(rawSchedule.verification?.visitorAccessStatusSources)
        ? [...rawSchedule.verification!.visitorAccessStatusSources]
        : [...(staticBaseline.verification.visitorAccessStatusSources || [])],
      verifiedDays: Array.isArray(rawSchedule.verification?.verifiedDays)
        ? [...rawSchedule.verification!.verifiedDays]
        : [...primaryScopeInfo.verifiedDays],
      weeklyCoverage:
        rawSchedule.verification?.weeklyCoverage ?? primaryScopeInfo.weeklyCoverage,
      interiorAccessPolicyVerified: interiorAccess.policyVerified,
      interiorScheduleVerified: interiorAccess.scheduleVerified,
      exteriorGroundsPolicyVerified: exteriorGroundsAccess.policyVerified,
      exteriorGroundsScheduleVerified: exteriorGroundsAccess.scheduleVerified,
      exteriorStreetVisibilityVerified: exteriorStreetVisibility.isVerified,
      verificationStatusLabel:
        rawSchedule.verification?.verificationStatusLabel ??
        staticBaseline.verification.verificationStatusLabel,
      lastVerifiedDate:
        rawSchedule.verification?.lastVerifiedDate !== undefined
          ? rawSchedule.verification.lastVerifiedDate
          : staticBaseline.verification.lastVerifiedDate,
      sources: Array.isArray(rawSchedule.verification?.sources)
        ? [...rawSchedule.verification!.sources]
        : [...(staticBaseline.verification.sources || [])],
      ...(rawSchedule.verification?.verificationNotes ?? staticBaseline.verification.verificationNotes
        ? {
            verificationNotes:
              rawSchedule.verification?.verificationNotes ??
              staticBaseline.verification.verificationNotes,
          }
        : {}),
    },
    displaySummary:
      rawSchedule.displaySummary ||
      staticBaseline.displaySummary ||
      fallbackSite?.visitingHours ||
      'Hours Unverified',
    ...(rawSchedule.publicNotes ?? staticBaseline.publicNotes
      ? { publicNotes: rawSchedule.publicNotes ?? staticBaseline.publicNotes }
      : {}),
  };
}

const AUDITED_ADMISSION_INFO: Record<string, AdmissionInfo> = {
  'cebu-national-museum': {
    status: 'free',
    isVerified: true,
    policyKind: 'formal_policy',
    scope: 'Entire Museum',
    displayLabel: 'Free Admission',
    rates: [{ category: 'General Public', amount: 'Free (₱0)', notes: 'Mandated by R.A. 11333; prior coordination required for groups of 20+.' }],
    sources: [
      {
        title: 'National Museum of the Philippines – Cebu Visitor Information',
        publisher: 'National Museum of the Philippines',
        url: 'https://www.nationalmuseum.gov.ph/our-museums/regional-area-and-site-museums/cebu/',
        checkedDate: '2026-11-23',
      },
    ],
    notes: 'General admission is free for all visitors under Republic Act No. 11333.',
  },
  'cebu-sugbu-chinese-museum': {
    status: 'paid',
    isVerified: true,
    policyKind: 'formal_policy',
    scope: 'Entire Museum',
    displayLabel: '₱75 (Local) / ₱120 (Foreign) / ₱60 (Students, Seniors, PWD)',
    rates: [
      { category: 'Local Visitors', amount: '₱75' },
      { category: 'Foreign Visitors', amount: '₱120' },
      { category: 'Students, Senior Citizens & PWD', amount: '₱60', notes: 'Valid ID required' },
    ],
    sources: [
      {
        title: 'Sugbu Chinese Heritage Museum Official Website',
        publisher: 'Sugbu Chinese Heritage Museum Foundation, Inc.',
        url: 'https://sugbuchinese.com/',
        checkedDate: '2026-11-23',
      },
    ],
  },
  'cebu-museo-sugbo': {
    status: 'paid',
    isVerified: true,
    policyKind: 'formal_policy',
    scope: 'Entire Museum',
    displayLabel: '₱50 (General) / ₱25 (Students, Children, Seniors, PWD)',
    rates: [
      { category: 'General Admission / Adults', amount: '₱50' },
      { category: 'Students, Children, Senior Citizens & PWD', amount: '₱25', notes: 'Valid ID required' },
    ],
    sources: [
      {
        title: 'Museo Sugbo Reopens',
        publisher: 'SunStar Cebu',
        url: 'https://www.sunstar.com.ph/cebu/museo-sugbo-reopens',
        checkedDate: '2026-11-23',
      },
      {
        title: 'Museo Sugbo Reopens with Unveiling of Cultural Property and Provincial Marker',
        publisher: 'Cebu Provincial Government',
        url: 'https://www.cebu.gov.ph/2383/museo-sugbo-reopens-with-unveiling-of-cultural-property-and-provincial-marker/',
        checkedDate: '2026-11-23',
      },
    ],
    notes: 'Reopening fee schedule confirmed via SunStar Cebu coverage; provincial reopening announcement documented on Cebu Provincial Government portal.',
  },
  'cebu-basilica': {
    status: 'free',
    isVerified: true,
    policyKind: 'mixed_subfacilities',
    scope: 'Basilica Church & Sanctuary Complex only (excludes Pilgrim Center Basement Museum)',
    displayLabel: 'Free Church & Sanctuary Access (Basement Museum unverified)',
    rates: [{ category: 'Basilica Church & Sanctuary Complex', amount: 'Free (₱0)' }],
    subFacilities: [
      {
        name: 'Basilica Church & Sanctuary Complex',
        status: 'free',
        isVerified: true,
        label: 'Free (₱0)',
      },
      {
        name: 'Pilgrim Center Basement Museum',
        status: 'unverified',
        isVerified: false,
        label: 'Unverified (confirm fee on-site)',
      },
    ],
    sources: [
      {
        title: 'Santo Niño Pilgrim Center & Basilica Complex',
        publisher: 'Basilica Minore del Santo Niño de Cebu',
        url: 'https://santoninodecebubasilica.org/basilica-minore-del-santo-nino/santo-nino-pilgrim-center/',
        checkedDate: '2026-11-23',
      },
      {
        title: 'Basilica Minore del Santo Niño Museum',
        publisher: 'Basilica Minore del Santo Niño de Cebu',
        url: 'https://santoninodecebubasilica.org/basilica-minore-del-santo-nino/museum/',
        checkedDate: '2026-11-23',
      },
    ],
    notes: 'Church and Sanctuary entry is free; the separate Pilgrim Center Basement Museum does not publish a confirmed fee table online.',
  },
  'cebu-rizal-memorial-library': {
    status: 'unverified',
    isVerified: false,
    policyKind: 'mixed_subfacilities',
    scope: 'Ground-Floor Public Library (free) vs. Upper-Floor Museum (unverified)',
    displayLabel: 'Ground-Floor Library: Free | Upper-Floor Museum: Unverified',
    rates: [{ category: 'Ground-Floor Cebu City Public Library', amount: 'Free (₱0)' }],
    subFacilities: [
      {
        name: 'Cebu City Public Library (Ground Floor)',
        status: 'free',
        isVerified: true,
        label: 'Free (₱0)',
      },
      {
        name: 'Rizal Memorial Museum (Upper Floor)',
        status: 'unverified',
        isVerified: false,
        label: 'Unverified (confirm on-site)',
      },
    ],
    sources: [
      {
        title: 'Cebu City Public Library Relaunch Report',
        publisher: 'GMA Regional TV',
        url: 'https://www.gmanetwork.com/regionaltv/features/108864/cebu-city-public-library-reopens-247-beginning-june-30-2025/story/',
        checkedDate: '2026-11-23',
      },
    ],
    notes: 'Ground-floor public library access is free; the upper-floor Rizal Memorial Museum admission policy is not published online.',
  },
  'cebu-cross': {
    status: 'free',
    isVerified: false,
    policyKind: 'open_public_access',
    scope: 'Open Public Kiosk in Plaza Sugbo',
    displayLabel: 'Free Public Access (No ticket booth; formal fee policy not published)',
    sources: [
      {
        title: 'Cebu Heritage History & Landmarks',
        publisher: 'Cebu Provincial Tourism Office',
        url: 'https://tourism.cebu.gov.ph/history/',
        checkedDate: '2026-11-23',
      },
    ],
    notes: 'Open public square monument with no ticketed entry; no formal LGU fee-schedule document published.',
  },
  'cebu-plaza-independencia': {
    status: 'free',
    isVerified: false,
    policyKind: 'open_public_access',
    scope: 'Public Plaza Grounds only (excludes adjacent Fort San Pedro)',
    displayLabel: 'Free Public Access (No ticket booth; formal fee policy not published)',
    sources: [
      {
        title: 'Cebu Heritage History & Landmarks',
        publisher: 'Cebu Provincial Tourism Office',
        url: 'https://tourism.cebu.gov.ph/history/',
        checkedDate: '2026-11-23',
      },
    ],
    notes: 'Open public plaza grounds with no ticketed entry; adjacent Fort San Pedro is separately ticketed.',
  },
  'cebu-plaza-sugbo': {
    status: 'free',
    isVerified: false,
    policyKind: 'open_public_access',
    scope: 'Public City Plaza',
    displayLabel: 'Free Public Access (No ticket booth; formal fee policy not published)',
    sources: [
      {
        title: 'Cebu Heritage History & Landmarks',
        publisher: 'Cebu Provincial Tourism Office',
        url: 'https://tourism.cebu.gov.ph/history/',
        checkedDate: '2026-11-23',
      },
    ],
    notes: 'Open public plaza in front of Cebu City Hall with no ticketed entry.',
  },
  'cebu-plaza-hamabar': {
    status: 'unverified',
    isVerified: false,
    policyKind: 'unverified',
    scope: 'Public City Plaza',
    displayLabel: 'Unverified (Open public plaza; no official admission policy URL confirmed)',
    notes: 'Open civic square; no official LGU admission policy page confirmed.',
  },
  'cebu-fuente-osmena': {
    status: 'unverified',
    isVerified: false,
    policyKind: 'unverified',
    scope: 'Public Park / Rotunda',
    displayLabel: 'Unverified (Open public park; no official admission policy URL confirmed)',
    notes: 'Open public rotunda park; no official LGU admission policy page confirmed.',
  },
  'cebu-colon-street': {
    status: 'free',
    isVerified: false,
    policyKind: 'open_public_access',
    scope: 'Public City Street',
    displayLabel: 'Free Public Access (Public thoroughfare; no ticketed entry)',
    sources: [
      {
        title: 'Cebu Heritage History & Landmarks',
        publisher: 'Cebu Provincial Tourism Office',
        url: 'https://tourism.cebu.gov.ph/history/',
        checkedDate: '2026-11-23',
      },
    ],
    notes: 'Public city thoroughfare with open street access.',
  },
  'cebu-heritage-monument': {
    status: 'free',
    isVerified: false,
    policyKind: 'open_public_access',
    scope: 'Open-Air Public Monument',
    displayLabel: 'Free Public Access (No ticket booth; formal fee policy not published)',
    sources: [
      {
        title: 'Cebu Heritage History & Landmarks',
        publisher: 'Cebu Provincial Tourism Office',
        url: 'https://tourism.cebu.gov.ph/history/',
        checkedDate: '2026-11-23',
      },
    ],
    notes: 'Open-air public monument in Parian Plaza; no formal LGU fee-schedule document published.',
  },
  'cebu-tres-de-abril-marker': {
    status: 'unverified',
    isVerified: false,
    policyKind: 'unverified',
    scope: 'Public Street-Side Marker',
    displayLabel: 'Unverified (Public street-side marker; no official admission policy URL confirmed)',
  },
  'llc-mactan-shrine': {
    status: 'free',
    isVerified: false,
    policyKind: 'open_public_access',
    scope: 'Public Heritage Park Grounds',
    displayLabel: 'Free Public Access (No ticket booth; formal fee policy not published)',
    sources: [
      {
        title: 'Mactan Shrine Destination Guide',
        publisher: 'Lapu-Lapu City Tourism Office',
        url: 'https://tourism.lapulapucitygov.ph/destinations/mactan-shrine-1784102158063',
        checkedDate: '2026-11-23',
      },
    ],
    notes: 'Official Lapu-Lapu City Tourism listing for the open shoreline memorial park; no formal ticket fee table published.',
  },
  'llc-magellan-marker': {
    status: 'free',
    isVerified: false,
    policyKind: 'open_public_access',
    scope: 'Public Monument within Mactan Shrine',
    displayLabel: 'Free Public Access (No ticket booth; formal fee policy not published)',
    sources: [
      {
        title: 'Mactan Shrine Destination Guide',
        publisher: 'Lapu-Lapu City Tourism Office',
        url: 'https://tourism.lapulapucitygov.ph/destinations/mactan-shrine-1784102158063',
        checkedDate: '2026-11-23',
      },
    ],
    notes: 'Located inside Mactan Shrine public grounds; no formal ticket fee table published.',
  },
  'llc-plaza-rizal': {
    status: 'free',
    isVerified: false,
    policyKind: 'open_public_access',
    scope: 'Public City Plaza',
    displayLabel: 'Free Public Access (No ticket booth; formal fee policy not published)',
    sources: [
      {
        title: 'Plaza Rizal Destination Guide',
        publisher: 'Lapu-Lapu City Tourism Office',
        url: 'https://tourism.lapulapucitygov.ph/destinations/plaza-rizal-1784105124248',
        checkedDate: '2026-11-23',
      },
    ],
    notes: 'Official Lapu-Lapu City Tourism listing for the open public plaza; no formal ticket fee table published.',
  },
  'llc-millennium-park': {
    status: 'unverified',
    isVerified: false,
    policyKind: 'unverified',
    scope: 'Public Park',
    displayLabel: 'Unverified (Open public park; no official admission policy URL confirmed)',
  },
  'llc-bridge-park': {
    status: 'free',
    isVerified: false,
    policyKind: 'open_public_access',
    scope: 'Public Waterfront Park',
    displayLabel: 'Free Public Access (No ticket booth; formal fee policy not published)',
    sources: [
      {
        title: 'Bridge Park Destination Guide',
        publisher: 'Lapu-Lapu City Tourism Office',
        url: 'https://tourism.lapulapucitygov.ph/destinations/bridge-park-1784100450064',
        checkedDate: '2026-11-23',
      },
    ],
    notes: 'Official Lapu-Lapu City Tourism listing for the waterfront public park; no formal ticket fee table published.',
  },
  'talisay-landing': {
    status: 'free',
    isVerified: false,
    policyKind: 'open_public_access',
    scope: 'Public Coastal Memorial Park',
    displayLabel: 'Free Public Access (No ticket booth; formal fee policy not published)',
    sources: [
      {
        title: 'Explore Talisay City',
        publisher: 'Cebu Provincial Tourism Office',
        url: 'https://tourism.cebu.gov.ph/explore/talisay-city/',
        checkedDate: '2026-11-23',
      },
    ],
    notes: 'Official provincial tourism listing for Talisay Landing coastal memorial; no formal ticket fee table published.',
  },
  'talisay-plaza': {
    status: 'unverified',
    isVerified: false,
    policyKind: 'unverified',
    scope: 'Public City Plaza',
    displayLabel: 'Unverified (Open public plaza; no official admission policy URL confirmed)',
  },
  'mandaue-plaza': {
    status: 'free',
    isVerified: false,
    policyKind: 'open_public_access',
    scope: 'Public Heritage Plaza',
    displayLabel: 'Free Public Access (No ticket booth; formal fee policy not published)',
    sources: [
      {
        title: 'Explore Mandaue City',
        publisher: 'Cebu Provincial Tourism Office',
        url: 'https://tourism.cebu.gov.ph/explore/mandaue-city/',
        checkedDate: '2026-11-23',
      },
    ],
    notes: 'Official provincial tourism listing for Mandaue City Heritage Plaza; no formal ticket fee table published.',
  },
  'mandaue-bridge': {
    status: 'unverified',
    isVerified: false,
    policyKind: 'unverified',
    scope: 'Public Bridge Crossing',
    displayLabel: 'Unverified (Public bridge; no official admission policy URL confirmed)',
  },
  'marcelo-fernan-bridge': {
    status: 'unverified',
    isVerified: false,
    policyKind: 'unverified',
    scope: 'Public Bridge Crossing',
    displayLabel: 'Unverified (Public bridge; no official admission policy URL confirmed)',
  },

  // Paid sites whose exact current fee tables are NOT confirmed on official institutional pages
  'cebu-casa-gorordo': {
    status: 'unverified',
    isVerified: false,
    displayLabel: 'Unverified (Paid admission; confirm current rates with RAFI / Casa Gorordo)',
    sources: [
      {
        title: 'Casa Gorordo Museum Official Website',
        publisher: 'Ramon Aboitiz Foundation Inc. (RAFI)',
        url: 'https://casagorordomuseum.org/',
        checkedDate: '2026-11-23',
      },
    ],
    notes: 'Official website states guided visits are ticketed, but does not publish a current fixed fee schedule.',
  },
  'cebu-fort-san-pedro': {
    status: 'unverified',
    isVerified: false,
    displayLabel: 'Unverified (Paid admission; confirm current rates at Fort San Pedro)',
    notes: 'Managed by Cebu City Government; third-party guides vary on current regular/student/senior rates and no official LGU fee page was confirmed.',
  },
  'cebu-usc-museum': {
    status: 'unverified',
    isVerified: false,
    displayLabel: 'Unverified (Official USC page does not publish fixed admission rates)',
    sources: [
      {
        title: 'Visit USC – University of San Carlos Museum',
        publisher: 'University of San Carlos',
        url: 'https://usc.edu.ph/catholic-educational-institution-visit-usc',
        checkedDate: '2026-11-23',
      },
    ],
    notes: 'USC website publishes museum hours but does not publish a fixed admission price table.',
  },
  'cebu-archdiocesan-museum': {
    status: 'unverified',
    isVerified: false,
    displayLabel: 'Unverified (Paid admission; confirm current rates on-site)',
    notes: 'No official online fee schedule confirmed.',
  },
  'cebu-yap-sandiego': {
    status: 'unverified',
    isVerified: false,
    displayLabel: 'Unverified (Paid admission; confirm current rates on-site)',
    notes: 'Private ancestral house museum; no official online fee schedule confirmed.',
  },
  'cebu-jesuit-house': {
    status: 'unverified',
    isVerified: false,
    displayLabel: 'Unverified (Paid admission; confirm current rates on-site)',
    notes: 'No official online fee schedule confirmed.',
  },
  'cebu-taoist': {
    status: 'unverified',
    isVerified: false,
    displayLabel: 'Unverified (Active place of worship; confirm visitor guidelines on-site)',
    notes: 'Active Taoist temple; no official published admission policy confirmed.',
  },
  'cebu-cathedral': {
    status: 'unverified',
    isVerified: false,
    displayLabel: 'Unverified (Active Catholic cathedral; confirm visitor access on-site)',
    notes: 'No official published tourist admission policy confirmed.',
  },
  'talisay-church': {
    status: 'unverified',
    isVerified: false,
    displayLabel: 'Unverified (Active Catholic parish; confirm visitor access on-site)',
  },
  'mandaue-church': {
    status: 'unverified',
    isVerified: false,
    displayLabel: 'Unverified (Active Catholic shrine; confirm visitor access on-site)',
  },
  'llc-shrine': {
    status: 'unverified',
    isVerified: false,
    displayLabel: 'Unverified (Active Catholic shrine; confirm visitor access on-site)',
  },
  'mandaue-library': {
    status: 'unverified',
    isVerified: false,
    displayLabel: 'Unverified (Confirm public library entry requirements on-site)',
  },

  // Sites with no published/obtainable admission information
  'cebu-uspf-jose-rizal-museum': {
    status: 'not_available',
    isVerified: false,
    displayLabel: 'Admission information not available (confirm with USPF)',
    notes: 'University campus museum; no published public admission policy.',
  },
  'cebu-patria': {
    status: 'not_available',
    isVerified: false,
    displayLabel: 'Admission information not available (confirm on-site)',
    notes: 'Ongoing redevelopment; no published public admission information.',
  },
  'cebu-city-hall': {
    status: 'not_available',
    isVerified: false,
    displayLabel: 'Admission information not available (active government building)',
  },
  'cebu-capitol': {
    status: 'not_available',
    isVerified: false,
    displayLabel: 'Admission information not available (active provincial government building)',
  },
  'talisay-city-hall': {
    status: 'not_available',
    isVerified: false,
    displayLabel: 'Admission information not available (active government building)',
  },
  'mandaue-presidencia': {
    status: 'not_available',
    isVerified: false,
    displayLabel: 'Admission information not available (active government building)',
  },
  'mandaue-watchtower': {
    status: 'not_available',
    isVerified: false,
    displayLabel: 'Admission information not available (confirm local access on-site)',
  },
};

export function getAdmissionDisplay(
  site: Partial<HeritageSite> | null | undefined
): AdmissionInfo {
  if (site?.admissionInfo) {
    return site.admissionInfo;
  }

  const rawFee = String(site?.entranceFee || '').trim();
  if (!rawFee) {
    return {
      status: 'not_available',
      isVerified: false,
      displayLabel: 'Admission information not available',
    };
  }
  if (/^free\b/i.test(rawFee)) {
    return {
      status: 'free',
      isVerified: false,
      displayLabel: rawFee,
    };
  }
  if (/unverified|requires confirmation/i.test(rawFee)) {
    return {
      status: 'unverified',
      isVerified: false,
      displayLabel: rawFee,
    };
  }
  if (/not available/i.test(rawFee)) {
    return {
      status: 'not_available',
      isVerified: false,
      displayLabel: rawFee,
    };
  }
  return {
    status: 'paid',
    isVerified: false,
    displayLabel: rawFee,
  };
}

export const HERITAGE_SITES: HeritageSite[] = BASE_HERITAGE_SITES.map(site => {
  const operatingSchedule = normalizeOperatingSchedule(
    AUDITED_OPERATING_SCHEDULES[site.id],
    site
  );
  const admissionInfo = AUDITED_ADMISSION_INFO[site.id] || {
    status: 'not_available' as const,
    isVerified: false,
    displayLabel: 'Admission information not available',
  };
  return {
    ...site,
    ...(ENRICHED_SITE_CONTENT[site.id] || {}),
    operatingSchedule,
    admissionInfo,
    entranceFee: admissionInfo.displayLabel,
    visitingHours: operatingSchedule.displaySummary || site.visitingHours,
    // Built-in directory scores are not visitor ratings; those come from reviews.
    rating: undefined,
  };
});

export function normalizeVerificationStatus(rawStatus: unknown): VerificationStatus {
  const trimmed = typeof rawStatus === 'string' ? rawStatus.trim() : '';
  const lower = trimmed.toLowerCase();
  if (trimmed === 'LGU Verified' || lower === 'lgu verified' || lower === 'verified') {
    return 'LGU Verified';
  }
  if (trimmed === 'Needs Revision' || lower === 'needs revision') {
    return 'Needs Revision';
  }
  if (trimmed === 'Rejected' || lower === 'rejected') {
    return 'Rejected';
  }
  return 'Pending Verification';
}

export function normalizeHeritageSite(
  site: Partial<HeritageSite> & Record<string, any>,
  staticFallback?: HeritageSite | null
): HeritageSite {
  const baseSite =
    staticFallback ||
    (site?.id ? HERITAGE_SITES.find(s => s.id === site.id) : undefined);

  const merged = { ...(baseSite || {}), ...(site || {}) } as any;
  const rawCoords = merged.coordinates || { lat: merged.latitude, lng: merged.longitude };
  const latitude = Number(rawCoords?.lat);
  const longitude = Number(rawCoords?.lng);
  const coordinates =
    Number.isFinite(latitude) && Number.isFinite(longitude)
      ? { lat: latitude, lng: longitude }
      : baseSite?.coordinates || { lat: 0, lng: 0 };

  const operatingSchedule = normalizeOperatingSchedule(
    site?.operatingSchedule,
    { ...baseSite, ...merged }
  );

  // Keep legacy visitingHours strictly as a display/compatibility field synced with operatingSchedule
  const visitingHours =
    (typeof site?.visitingHours === 'string' && site.visitingHours.trim() && !site?.operatingSchedule
      ? site.visitingHours.trim()
      : operatingSchedule.displaySummary) ||
    baseSite?.visitingHours ||
    'Hours Unverified';

  return {
    ...merged,
    id: String(merged.id || baseSite?.id || ''),
    name: String(merged.name || baseSite?.name || 'Untitled Heritage Site'),
    description: String(merged.description || baseSite?.description || ''),
    overview: String(merged.overview || merged.description || baseSite?.overview || ''),
    significance: String(merged.significance || baseSite?.significance || ''),
    category: merged.category || baseSite?.category || 'Historical Landmarks & Monuments',
    location: String(merged.location || baseSite?.location || ''),
    city: merged.city || baseSite?.city || 'Cebu City',
    visitingHours,
    operatingSchedule,
    imageUrl: String(merged.imageUrl || baseSite?.imageUrl || ''),
    galleryImages: Array.from(
      new Set(
        [
          ...(Array.isArray(baseSite?.galleryImages) ? baseSite!.galleryImages! : []),
          ...(Array.isArray(site?.galleryImages) ? site.galleryImages : []),
        ].filter(u => typeof u === 'string' && u.trim().length > 0)
      )
    ),
    rating: Number.isFinite(Number(site?.rating)) ? Number(site?.rating) : undefined,
    tags: Array.isArray(merged.tags)
      ? merged.tags
      : Array.isArray(baseSite?.tags)
        ? baseSite!.tags
        : [],
    coordinates,
    isMustVisit: Boolean(merged.isMustVisit),
    needsVerification: Boolean(merged.needsVerification),
    verificationStatus: normalizeVerificationStatus(merged.verificationStatus),
    verifiedBy: merged.verifiedBy || undefined,
    verifiedByUid: merged.verifiedByUid || undefined,
    verifiedAt: merged.verifiedAt || undefined,
    verificationNotes: merged.verificationNotes || undefined,
    isActive: merged.isActive !== false && merged.status !== 'Inactive',
    status: merged.status === 'Inactive' || merged.isActive === false ? 'Inactive' : 'Active',
    demolitionStatus:
      merged.demolitionStatus === 'Demolished' || merged.demolitionStatus === 'Partially Demolished'
        ? merged.demolitionStatus
        : 'Non-Demolished',
    accessibilityStatus: String(merged.accessibilityStatus || baseSite?.accessibilityStatus || 'Accessible'),
    admissionInfo:
      site?.admissionInfo ||
      baseSite?.admissionInfo ||
      (site?.entranceFee ? getAdmissionDisplay({ entranceFee: site.entranceFee }) : undefined),
    entranceFee:
      site?.admissionInfo?.displayLabel ||
      baseSite?.admissionInfo?.displayLabel ||
      merged.entranceFee ||
      baseSite?.entranceFee ||
      undefined,
  };
}

export function mergeAdminSitesWithStatic(
  remoteSites?: Array<Record<string, any>> | null,
  userRole?: string | null
): HeritageSite[] {
  const deprecatedIds = new Set(DEPRECATED_HERITAGE_SITE_IDS);
  const sitesById = new Map<string, HeritageSite>(
    HERITAGE_SITES.map(site => [site.id, normalizeHeritageSite(site, site)])
  );

  (remoteSites || []).forEach(dbSite => {
    if (!dbSite?.id || deprecatedIds.has(dbSite.id)) return;
    const existingStatic = sitesById.get(dbSite.id) || null;
    sitesById.set(dbSite.id, normalizeHeritageSite(dbSite, existingStatic));
  });

  return Array.from(sitesById.values()).filter(
    site =>
      !deprecatedIds.has(site.id) &&
      site.isActive !== false &&
      site.status !== 'Inactive' &&
      isSiteVisibleToUser(site, userRole)
  );
}

export const SITE_IMAGE_ATTRIBUTIONS = {
  'cebu-cross': [{ url: "https://upload.wikimedia.org/wikipedia/commons/0/05/Magellan's_Cross_Cebu.jpg", creator: 'Kingphoto23', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/' }],
  'mandaue-plaza': [{ url: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Mandaue_City_Plaza_(2024-10-27).jpg', creator: 'Wide Awake! (PaulGorduiz106)', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/' }],
  'cebu-basilica': [{ url: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Basilica_Minore_del_Santo_Nino.jpg', creator: 'Magalhaes', license: 'Public domain', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' }],
  'cebu-archdiocesan-museum': [{ url: 'https://upload.wikimedia.org/wikipedia/commons/e/e6/The_Archdiocesan_Museum_of_Cebu_3.jpg', creator: 'Bim24', license: 'CC0 1.0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' }],
  'cebu-jesuit-house': [{ url: 'https://upload.wikimedia.org/wikipedia/commons/5/5f/1730_Jesuit_House_Museum.jpg', creator: 'Filipinayzd', license: 'CC0 1.0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' }],
  'talisay-church': [{ url: 'https://upload.wikimedia.org/wikipedia/commons/f/f2/Santa._Teresa_de_Avila_Church,_Talisay_City,_Cebu.jpg', creator: 'Francinehihao', license: 'CC0 1.0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' }],
  'cebu-cathedral': [
    { url: 'https://upload.wikimedia.org/wikipedia/commons/4/4a/Cebu_Metropolitan_Cathedral.jpg', creator: 'Researcher1982 / Arnold Carl F. Sancover', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/5/59/Inside_the_Cebu_Metropolitan_Cathedral..jpg', creator: 'GinaD', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/' },
  ],
  'talisay-landing': [
    { url: 'https://upload.wikimedia.org/wikipedia/commons/7/74/Talisay_Landing_Historical_Marker.jpg', creator: 'Pavl Anthony / Spacejazz2013', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  ],
  'cebu-casa-gorordo': [{ url: 'https://upload.wikimedia.org/wikipedia/commons/9/9e/Casa_Gorordo_Museum_(E._Aboitiz,_Cebu_City;_09-05-2022).jpg', creator: 'Patrickroque01', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' }],
  'cebu-yap-sandiego': [{ url: 'https://upload.wikimedia.org/wikipedia/commons/f/fe/Yap-Sandiego_Ancestral_House,_Cebu_City.jpg', creator: 'Subhashish Panigrahi', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' }],
  'cebu-national-museum': [
    { url: 'https://upload.wikimedia.org/wikipedia/commons/5/59/National_Museum_of_the_Philippines-Cebu.jpg', creator: 'Playdarica', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Exploring_Cebu_Plaza_Independencia_and_National_Museum_of_the_Philippines_in_Cebu_City,_Cebu,_Philippines_2.jpg', creator: 'RizaCPH', license: 'CC0 1.0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  ],
  'cebu-sugbu-chinese-museum': [{ url: 'https://upload.wikimedia.org/wikipedia/commons/1/14/Sugbu_Chinese_Heritage_Museum,_Cebu_City,_Jan_2024.jpg', creator: 'Ralff Nestor Nacor', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' }],
  'cebu-museo-sugbo': [{ url: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Facade_of_Museo_Sugbo.jpg', creator: 'Carlo Joseph Moskito', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' }],
  'cebu-fort-san-pedro': [
    { url: 'https://upload.wikimedia.org/wikipedia/commons/5/52/Fort_San_Pedro_-_main_entrance.jpg', creator: 'Eugene Alvin Villar', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/2/24/Fort_San_Pedro_scenery.jpg', creator: 'Kozak005', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/' },
  ],
  'cebu-heritage-monument': [{ url: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/Heritage_of_Cebu_Monument_in_Cebu_city.jpg', creator: 'Ms anez', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' }],
  'cebu-colon-street': [{ url: 'https://upload.wikimedia.org/wikipedia/commons/1/1c/Colon_Street_1961_NHCP_Historical_Marker.jpg', creator: 'Ryomaandres', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' }],
  'cebu-tres-de-abril-marker': [{ url: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Tres_de_Abril_Street,_Cebu_City,_historical_marker.jpg', creator: 'Carlo Joseph Moskito', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' }],
  'cebu-plaza-independencia': [
    { url: 'https://upload.wikimedia.org/wikipedia/commons/6/62/Plaza_Independencia,_Cebu_City_-_Welcome_1.jpg', creator: 'Defenestrated Juan', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/6/6e/Exploring_Cebu_Plaza_Independencia_and_National_Museum_of_the_Philippines_in_Cebu_City,_Cebu,_Philippines_1.jpg', creator: 'RizaCPH', license: 'CC0 1.0', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' },
  ],
  'cebu-plaza-sugbo': [
    { url: 'https://upload.wikimedia.org/wikipedia/commons/d/dc/Cebu_City_Hall,_Plaza_Sugbo_night_view_(P._Burgos,_Cebu_City;_01-23-2024).jpg', creator: 'Patrickroque01', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Plaza_Sugbu,_Cebu_City,_Jan_2024.jpg', creator: 'Ralff Nestor Nacor', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  ],
  'cebu-fuente-osmena': [{ url: 'https://upload.wikimedia.org/wikipedia/commons/4/4e/Cebu_Fuente_Osmeña_Circle_top_view_(Cebu_City;_09-09-2022).jpg', creator: 'Patrickroque01', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' }],
  'cebu-city-hall': [{ url: 'https://upload.wikimedia.org/wikipedia/commons/8/86/Cebu_City_Hall.jpg', creator: 'Elmer B. Domingo', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' }],
  'cebu-capitol': [{ url: 'https://upload.wikimedia.org/wikipedia/commons/1/13/Cebu_Provincial_Capitol_Building.jpg', creator: 'Carlo Joseph Moskito', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' }],
  'cebu-patria': [{ url: 'https://upload.wikimedia.org/wikipedia/commons/3/3f/Patria_de_Cebu,_Aug_2026.jpg', creator: 'A.C.T. Alejandre', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' }],
  'cebu-rizal-memorial-library': [{ url: 'https://upload.wikimedia.org/wikipedia/commons/8/87/Rizal_Memorial_Library_and_Museum_in_Cebu_City,_Cebu,_Philippines.jpg', creator: 'Verbosmithie', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' }],
  'mandaue-church': [{ url: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Mandaue_Saint_Joseph_National_Shrine_2026-07-11.jpg', creator: 'LMP 2001', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' }],
  'mandaue-library': [{ url: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Mandaue_City_Public_Library,_Cebu,_Jan_2024.jpg', creator: 'Ralff Nestor Nacor', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' }],
  'mandaue-watchtower': [
    { url: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Petron_Mandaue_Depot_and_Bantayan_sa_Hari_(Looc,_Mandaue,_Cebu;_01-19-2024).jpg', creator: 'Patrickroque01', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Petron_Mandaue_Depot_and_Bantayan_sa_Hari_(Looc,_Mandaue,_Cebu;_09-04-2022).jpg', creator: 'Patrickroque01', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' },
  ],
  'mandaue-presidencia': [{ url: 'https://upload.wikimedia.org/wikipedia/commons/6/65/Mandaue_Presidencia_Marker,_Cebu.jpg', creator: 'Ralffralff', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' }],
  'mandaue-bridge': [{ url: 'https://upload.wikimedia.org/wikipedia/commons/3/36/Mandaue-Mactan_Bridge_I.jpg', creator: 'Rabosajr', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/' }],
  'llc-mactan-shrine': [
    { url: 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Mactan_Shrine_in_Lapu-Lapu_City.JPG', creator: 'Badz Patanag', license: 'CC BY-SA 3.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/3.0/' },
    { url: 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Mactan_Shrine,_Cebu_city.jpg', creator: 'QuianCagandahan', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/' },
  ],
  'llc-magellan-marker': [{ url: 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Magellan\'s_marker_(9237742220).jpg', creator: 'shankar s.', license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/' }],
  'marcelo-fernan-bridge': [{ url: 'https://upload.wikimedia.org/wikipedia/commons/e/e9/MARCELO_FERNAN_BRIDGE_(6259265564).jpg', creator: 'whologwhy', license: 'CC BY 2.0', licenseUrl: 'https://creativecommons.org/licenses/by/2.0/' }],
  'llc-shrine': [{ url: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Virgen_de_la_Regla_church.JPG', creator: 'Tribu akru', license: 'Public domain', licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/' }],
  'llc-millennium-park': [{ url: 'https://upload.wikimedia.org/wikipedia/commons/d/d3/Millennium_Park_%2810-30-2022%29.jpg', creator: 'PaulGorduiz106', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' }],
  'llc-bridge-park': [{ url: 'https://upload.wikimedia.org/wikipedia/commons/e/e7/Lapu-Lapu_2026-04-27_001.jpg', creator: 'Martin Michlmayr', license: 'CC BY-SA 4.0', licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/' }],




};

export function getSiteById(id: string) {
  if (DEPRECATED_HERITAGE_SITE_IDS.includes(id)) return undefined;
  return HERITAGE_SITES.find(site => site.id === id);
}

export function isSiteVisibleToUser(
  site: Partial<HeritageSite> | null | undefined,
  _userRole?: string | null
): boolean {
  if (!site) return false;
  if (site.id && DEPRECATED_HERITAGE_SITE_IDS.includes(String(site.id))) {
    return false;
  }
  if (site.isActive === false || site.status === 'Inactive') {
    return false;
  }
  const status = normalizeVerificationStatus(site.verificationStatus);
  return status === 'Pending Verification' || status === 'LGU Verified';
}

export interface ExploreVerificationBadge {
  status: 'LGU Verified';
  label: 'LGU Verified';
  tone: 'green';
}

export function getExploreVerificationBadge(
  site: Partial<HeritageSite> | null | undefined,
  userRole?: string | null
): ExploreVerificationBadge | null {
  if (!isSiteVisibleToUser(site, userRole)) {
    return null;
  }
  const status = normalizeVerificationStatus(site?.verificationStatus);
  if (status === 'LGU Verified') {
    return {
      status: 'LGU Verified',
      label: 'LGU Verified',
      tone: 'green',
    };
  }
  return null;
}

export function searchSites(
  query: string,
  city?: string,
  category?: string,
  userRole?: string | null,
  customSites?: HeritageSite[]
) {
  const sitesToSearch = customSites || HERITAGE_SITES;
  const q = (query || '').trim().toLowerCase();

  return sitesToSearch.filter(site => {
    if (!isSiteVisibleToUser(site, userRole)) return false;

    const name = (site?.name || '').toLowerCase();
    const cityText = (site?.city || '').toLowerCase();
    const locationText = (site?.location || '').toLowerCase();
    const categoryText = (site?.category || '').toLowerCase();
    const description = (site?.description || '').toLowerCase();
    const overview = (site?.overview || '').toLowerCase();
    const significance = (site?.significance || '').toLowerCase();
    const tags = Array.isArray(site?.tags) ? site.tags : [];

    const matchesQuery = !q || (
      name.includes(q) ||
      cityText.includes(q) ||
      locationText.includes(q) ||
      categoryText.includes(q) ||
      description.includes(q) ||
      overview.includes(q) ||
      significance.includes(q) ||
      tags.some(tag => String(tag || '').toLowerCase().includes(q))
    );

    const matchesCity = city && city !== 'All' ? site?.city === city : true;
    const matchesCategory = category && category !== 'All' ? site?.category === category : true;

    return matchesQuery && matchesCity && matchesCategory;
  });
}

export function hasExplicitHeritageIntent(text: string): boolean {
  const normalized = text.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!normalized) return false;

  // Heritage & site-related terms
  const hasHeritageTerm = /\b(heritage|site|sites|shrine|shrines|monument|monuments|landmark|landmarks|historical|history|museum|museums|church|churches|cathedral|basilica|ancestral|plaza|plazas|visiting hours|entrance fee|admission|itinerary|tour|tours)\b/.test(normalized);

  // Specific question patterns paired with heritage/place context
  const hasSpecificQuestion =
    /\b(visiting hours|opening hours|entrance fee|admission fee)\b/.test(normalized) ||
    (/\b(how much|where is|tell me about|what is|how do i get to|take me to)\b/.test(normalized) &&
      /\b(cebu|mandaue|talisay|lapu-lapu|lapu lapu|mactan|parian|colon|heritage|site|museum|church|shrine|monument|landmark|plaza|fort|house|bridge|library|temple|capitol)\b/.test(normalized));

  // Direct reference to specific known sites
  const specificSiteNames = [
    'mactan shrine', 'liberty shrine', 'magellan cross', 'magellans cross', 'magellan s cross',
    'magellan marker', 'magellans marker', 'magellan s marker',
    'basilica minore', 'santo nino', 'sto nino', 'cebu cathedral', 'metropolitan cebu cathedral',
    'archdiocesan museum', 'casa gorordo', 'yap sandiego', 'yap-sandiego', 'jesuit house', '1730 jesuit',
    'fort san pedro', 'museo sugbo', 'carcel de cebu', 'national museum', 'sugbu chinese', 'gotiaoco',
    'jose rizal museum', 'uspf', 'usc museum', 'san carlos museum', 'heritage of cebu monument',
    'taoist temple', 'fuente osmena', 'talisay landing', 'larawan beach',
    'sta teresa de avila', 'santa teresa de avila', 'talisay city plaza', 'talisay city hall',
    'mandaue presidencia', 'bantayan sa hari', 'rizal memorial library', 'cebu city public library',
    'patria de cebu', 'tres de abril', 'leon kilat', 'colon street', 'cebu city hall', 'provincial capitol',
    'saint joseph', 'mandaue library', 'mandaue city public library', 'mandaue city heritage plaza',
    'old bridge park', 'millennium park', 'plaza rizal', 'virgen de la regla',
    'plaza independencia', 'plaza sugbo', 'plaza hamabar', 'rajah humabon',
    'mandaue-mactan bridge', 'mandaue mactan bridge', 'marcelo fernan', 'marcelo fernan bridge'
  ];
  const hasDirectSiteReference = specificSiteNames.some(name => normalized.includes(name));

  if (hasDirectSiteReference || hasSpecificQuestion || hasHeritageTerm) return true;

  return false;
}
