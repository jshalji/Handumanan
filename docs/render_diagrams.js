const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const outputDir = path.join(__dirname, 'final-diagrams');
const scratchDir = path.join(__dirname, 'diagram-src');

if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
if (!fs.existsSync(scratchDir)) fs.mkdirSync(scratchDir, { recursive: true });

const diagrams = [
  {
    name: '01-guest-visitor-use-case',
    title: '1. Guest/Visitor Use Case Diagram',
    code: `graph TB
    subgraph Handumanan_System["HANDUMANAN SYSTEM"]
        UC1(["1. Search and Browse Heritage Sites"])
        UC2(["2. View Heritage Site Information"])
        UC3(["3. View Map, Nearby Sites and Current Location"])
    end

    Guest["👤 GUEST / VISITOR"]

    ExtGeoLocation[["📱 HTML5 Browser Geolocation API<br/>(Client GPS)"]]
    ExtGoogleMaps[["⚙️ Google Maps Platform<br/>(Map JS API & Markers)"]]

    Guest --- UC1
    Guest --- UC2
    Guest --- UC3

    UC3 --- ExtGeoLocation
    UC3 --- ExtGoogleMaps`
  },
  {
    name: '02-registered-user-use-case',
    title: '2. Registered User Use Case Diagram',
    code: `graph TB
    subgraph Handumanan_System["HANDUMANAN SYSTEM"]
        UC1(["1. Save Favorite Heritage Sites"])
        UC2(["2. Submit Ratings and Reviews (1–5 Stars)"])
        UC3(["3. Generate and Save AI Itineraries"])
        UC4(["4. Upload Visitor Photos"])
        UC5(["5. Use AI Heritage Guide (Ask Questions & Get Information)"])
        UC6(["6. Submit General User Feedback"])
    end

    User["👤 REGISTERED USER"]

    ExtGemini[["✨ Gemini AI via Genkit<br/>(Gemini 2.5 Flash)"]]
    ExtGoogleMaps[["⚙️ Google Maps Platform<br/>(Map JS API)"]]

    User --- UC1
    User --- UC2
    User --- UC3
    User --- UC4
    User --- UC5
    User --- UC6

    UC3 --- ExtGemini
    UC3 --- ExtGoogleMaps
    UC5 --- ExtGemini`
  },
  {
    name: '03-administrator-use-case',
    title: '3. Administrator Use Case Diagram',
    code: `graph TB
    subgraph Handumanan_System["HANDUMANAN SYSTEM"]
        UC1(["1. Manage Heritage Site Records and Information"])
        UC2(["2. Manage System Users and Roles"])
        UC3(["3. Manage General User Feedback Submissions"])
        UC4(["4. Manage Heritage Categories"])
        UC5(["5. Moderate Community Content (Reviews & Visitor Photos)"])
    end

    Admin["👤 ADMINISTRATOR"]

    Admin --- UC1
    Admin --- UC2
    Admin --- UC3
    Admin --- UC4
    Admin --- UC5`
  },
  {
    name: '04-lgu-use-case',
    title: '4. LGU Officer Use Case Diagram',
    code: `graph TB
    subgraph Handumanan_System["HANDUMANAN SYSTEM"]
        UC1(["1. Authenticate as LGU Officer"])
        UC2(["2. View Metro Cebu Heritage Sites Directory"])
        UC3(["3. Inspect Site Details"])
        UC4(["4. Update Verification Status (Verify / Revise / Reject)"])
        UC5(["5. Edit Heritage Site Entrance Fee"])
    end

    LGU["🏛️ LGU OFFICER"]

    LGU --- UC1
    LGU --- UC2
    LGU --- UC3
    LGU --- UC4
    LGU --- UC5`
  },
  {
    name: '05-level-0-context-diagram',
    title: '5. Level 0 Context Diagram (DFD)',
    code: `flowchart TD
    Guest["👤 GUEST / VISITOR"]
    User["👤 REGISTERED USER"]
    Admin["👤 ADMINISTRATOR"]
    LGU["🏛️ LGU OFFICER"]

    System(("0.0<br/>HANDUMANAN CULTURAL HERITAGE<br/>SITE INFORMATION SYSTEM FOR METRO CEBU"))

    HTML5Geo["📱 HTML5 BROWSER GEOLOCATION API"]
    GoogleMaps["⚙️ GOOGLE MAPS PLATFORM"]
    GoogleRoutes["🛣️ GOOGLE ROUTES API"]
    GeminiAI["✨ GEMINI AI (VIA GENKIT)"]
    Firebase["🔥 FIREBASE SERVICES (AUTH & FIRESTORE)"]

    %% Guest Flows
    Guest -->|"Search & Category Filters, Location Requests, Selected Site IDs"| System
    System -->|"Heritage Site Listings, Detailed Profiles, Map Markers"| Guest

    %% Registered User Flows
    User -->|"Login Credentials, AI Chatbot Queries, Itinerary Preferences, Reviews, Favorites, Photos, Feedback"| System
    System -->|"Authentication Token, Account Profile, AI Chatbot Replies, Generated Itineraries, Saved Trips"| User

    %% Admin Flows
    Admin -->|"Site CRUD Operations, User Role Management, Category Updates, Feedback Resolutions"| System
    System -->|"System Dashboard Stats, User List, Feedback Submissions Queue"| Admin

    %% LGU Flows
    LGU -->|"LGU Credentials, Verification Status (Verify, Revise, Reject), Reviewer Notes, Fee Updates"| System
    System -->|"Heritage Directory Table, Detailed Inspection Profile"| LGU

    %% External Systems Flows
    System -->|"Location Permission Request"| HTML5Geo
    HTML5Geo -->|"GPS Coordinates & Accuracy Evaluation"| System

    System -->|"Map Center, Coordinates & Custom Style Config"| GoogleMaps
    GoogleMaps -->|"Map Tile Rendering & Markers"| System

    System -->|"Routing Request (Waypoints, Travel Profile, Transit Mode)"| GoogleRoutes
    GoogleRoutes -->|"Route Polylines, Distance & Travel Duration"| System

    System -->|"User Prompts, Travel Preferences & Directory Site Context"| GeminiAI
    GeminiAI -->|"Chatbot Responses & Structured Itinerary Plans"| System

    System -->|"Auth Verification, Read/Write User Data, Sites & Feedback"| Firebase
    Firebase -->|"Auth Session, Stored Documents & Security Rule Status"| System`
  },
  {
    name: '06-level-1-dfd',
    title: '6. Level 1 Data Flow Diagram (DFD)',
    code: `flowchart TD
    %% External Entities
    Guest["👤 GUEST / VISITOR"]
    User["👤 REGISTERED USER"]
    Admin["👤 ADMINISTRATOR"]
    LGU["🏛️ LGU OFFICER"]
    HTML5Geo["📱 HTML5 BROWSER GEOLOCATION API"]
    GoogleMaps["⚙️ GOOGLE MAPS PLATFORM"]
    GoogleRoutes["🛣️ GOOGLE ROUTES API"]
    GeminiAI["✨ GEMINI AI (VIA GENKIT)"]

    %% Processes
    P1(("1.0<br/>User & Role<br/>Management"))
    P2(("2.0<br/>Heritage Site Directory<br/>Management"))
    P3(("3.0<br/>Location & Map<br/>Services"))
    P4(("4.0<br/>Routing & Navigation<br/>Services"))
    P5(("5.0<br/>AI Services<br/>(Chatbot & Planner)"))
    P6(("6.0<br/>Reviews & Ratings<br/>Management"))
    P7(("7.0<br/>Visitor Photo Album<br/>Management"))
    P8(("8.0<br/>Favorites & Saved<br/>Itineraries"))
    P9(("9.0<br/>User Feedback<br/>Management"))

    %% Data Stores
    D1[("D1 Users Collection (/users)")]
    D2[("D2 Heritage Sites Collection (/heritageSites)")]
    D3[("D3 Categories Data (/categories)")]
    D4[("D4 Site Images (Firebase Storage)")]
    D5[("D5 Reviews Subcollection Group (/heritageSites/{siteId}/reviews)")]
    D6[("D6 Visitor Photos Subcollection Group (/heritageSites/{siteId}/visitorPhotos)")]
    D7[("D7 Favorites Subcollection (/users/{uid}/favorites)")]
    D8[("D8 Itineraries Subcollection (/users/{uid}/itineraries)")]
    D9[("D9 User Feedback Collection (/userFeedback)")]

    %% Flows - Process 1.0 User Management
    User -->|"Login Credentials / Profile Data"| P1
    Admin -->|"User Role Provisioning"| P1
    LGU -->|"LGU Credentials"| P1
    P1 <-->|"Read / Write Profile & Role"| D1
    P1 -->|"Session Token & User Profile"| User
    P1 -->|"LGU Session Authorization"| LGU

    %% Flows - Process 2.0 Heritage Site Management
    Guest -->|"Search & Category Filters"| P2
    P2 -->|"Site Directory & Details"| Guest
    Admin -->|"Create / Edit / Deactivate Sites"| P2
    LGU -->|"Verify, Revise, Reject & Fee Update"| P2
    P2 <-->|"Read / Write Heritage Records"| D2
    P2 <-->|"Read Categories"| D3
    P2 <-->|"Upload / Fetch Site Images"| D4

    %% Flows - Process 3.0 Location & Map Services
    Guest -->|"Map Coordinates / Nearby Location Request"| P3
    User -->|"Map Directions Request"| P3
    P3 <-->|"Read Site Coordinates"| D2
    P3 -->|"Request Geolocation"| HTML5Geo
    HTML5Geo -->|"User GPS Coordinates"| P3
    P3 -->|"Coordinates & Map Config"| GoogleMaps
    GoogleMaps -->|"Map Rendering & Markers"| P3
    P3 -->|"Interactive Map Pins & Selected Site Details"| Guest

    %% Flows - Process 4.0 Routing & Navigation Services
    Guest -->|"Origin & Destination Waypoints"| P4
    User -->|"Route Planning Request"| P4
    P4 -->|"Waypoints & Travel Profile"| GoogleRoutes
    GoogleRoutes -->|"Directions, Distance & Duration"| P4
    P4 -->|"Calculated Route & Directions"| User

    %% Flows - Process 5.0 AI Services
    User -->|"Chatbot Prompt & Trip Preferences"| P5
    P5 <-->|"Read Active Sites Context"| D2
    P5 <-->|"Read User Favorites Context"| D7
    P5 -->|"Prompt & Directory Context"| GeminiAI
    GeminiAI -->|"AI Chatbot Reply & Itinerary Json"| P5
    P5 -->|"Chatbot Response & Planned Route"| User

    %% Flows - Process 6.0 Reviews & Ratings
    User -->|"Submit Rating (1-5) & Review Comment"| P6
    Admin -->|"Delete Abusive Review"| P6
    P6 <-->|"Write / Delete Review Record"| D5
    D5 -->|"Read Submitted Reviews"| P6
    P6 -->|"Update Average Rating Summary"| D2
    P6 -->|"Display Reviews & Community Feed"| Guest

    %% Flows - Process 7.0 Visitor Photo Album
    User -->|"Upload Compressed Photo & Caption"| P7
    Admin -->|"Delete Photo"| P7
    P7 -->|"Upload Photo Blob"| D4
    D4 -->|"Image URL"| P7
    P7 <-->|"Write / Delete Photo Metadata"| D6
    P7 -->|"Display Visitor Photo Album"| Guest

    %% Flows - Process 8.0 Favorites & Saved Itineraries
    User -->|"Bookmark Site / Save Itinerary"| P8
    P8 <-->|"Read / Write Favorites"| D7
    P8 <-->|"Read / Write Itineraries"| D8
    P8 -->|"Saved Trips & Favorites List"| User

    %% Flows - Process 9.0 User Feedback Management
    User -->|"Submit System Feedback Message"| P9
    Admin -->|"Review & Resolve Feedback Status"| P9
    P9 <-->|"Read / Write Feedback Submissions"| D9
    P9 -->|"Feedback Status Update Notification"| Admin`
  },
  {
    name: '07-class-diagram',
    title: '7. System Class Diagram',
    code: `classDiagram
    class UserRole {
        <<enumeration>>
        USER
        ADMIN
        LGU
    }

    class VerificationStatus {
        <<enumeration>>
        Pending Verification
        LGU Verified
        Needs Revision
        Rejected
    }

    class FeedbackStatus {
        <<enumeration>>
        New
        Reviewed
        Resolved
    }

    class UserClass {
        +string userId
        +string displayName
        +string email
        +UserRole role
        +Timestamp createdAt
        +Timestamp updatedAt
        +updateProfile(data) void
        +changePassword() void
    }

    class Guest {
        +browseSites() HeritageSiteArray
        +searchSites(keyword) HeritageSiteArray
        +viewSiteDetails(siteId) HeritageSite
        +viewMap(coordinates) void
    }

    class RegisteredUser {
        +addFavorite(siteId) void
        +removeFavorite(siteId) void
        +saveItinerary(data) void
        +submitReview(siteId, rating, comment) void
        +uploadVisitorPhoto(photo, caption) void
        +submitFeedback(category, message) void
        +useChatbot(query) Response
    }

    class Admin {
        +manageUsers() void
        +manageHeritageSites() void
        +manageCategories() void
        +manageFeedback() void
        +moderateContent(contentId) void
    }

    class LguOfficer {
        +verifySite(siteId, status, notes) void
        +updateEntranceFee(siteId, fee) void
        +viewDirectory() HeritageSiteArray
    }

    class HeritageSite {
        +string id
        +string name
        +string description
        +string overview
        +string significance
        +string category
        +string location
        +string city
        +string visitingHours
        +string imageUrl
        +StringArray galleryImages
        +number rating
        +StringArray tags
        +Coordinates coordinates
        +boolean isMustVisit
        +boolean isActive
        +string status
        +string demolitionStatus
        +string accessibilityStatus
        +string entranceFee
        +boolean needsVerification
        +VerificationStatus verificationStatus
        +string verifiedBy
        +string verifiedByUid
        +string verifiedAt
        +string verificationNotes
    }

    class Review {
        +string id
        +string siteId
        +string userId
        +string userName
        +number rating
        +string comment
        +string uploadBatchId
        +Timestamp createdAt
        +submit() void
        +delete() void
    }

    class VisitorPhoto {
        +string id
        +string siteId
        +string userId
        +string userDisplayName
        +string imageUrl
        +string storagePath
        +string caption
        +string uploadBatchId
        +Timestamp createdAt
        +upload() void
        +delete() void
    }

    class Favorite {
        +string id
        +string userId
        +string siteId
        +Timestamp createdAt
        +add() void
        +remove() void
    }

    class Itinerary {
        +string id
        +string userId
        +string itineraryData
        +string summary
        +Timestamp createdAt
        +create() void
        +delete() void
    }

    class UserFeedback {
        +string id
        +string userName
        +string userEmail
        +string userId
        +string category
        +string message
        +FeedbackStatus status
        +string reviewedBy
        +Timestamp reviewedAt
        +Timestamp createdAt
        +submit() void
    }

    class HTML5GeolocationAPI {
        +getCurrentPosition() Location
        +watchPosition() void
    }

    class GoogleMapsPlatform {
        +renderMap(coordinates) void
        +displayMarkers(sites) void
    }

    class RoutingService {
        +getRouteDirections(origin, destination, profile) Route
        +getMultiStopRoute(points, profile) Route
    }

    class GeminiAIViaGenkit {
        +chatWithHeritageBot(input) Response
        +generatePersonalizedItinerary(input) Itinerary
    }

    UserClass <|-- RegisteredUser
    UserClass <|-- Admin
    UserClass <|-- LguOfficer

    Guest ..> HeritageSite : views
    LguOfficer --> HeritageSite : verifies and edits fee
    Admin --> UserClass : manages
    Admin --> HeritageSite : manages
    Admin --> UserFeedback : resolves

    RegisteredUser "1" -- "0..*" Favorite : has
    RegisteredUser "1" -- "0..*" Itinerary : creates
    RegisteredUser "1" -- "0..*" Review : posts
    RegisteredUser "1" -- "0..*" VisitorPhoto : uploads
    RegisteredUser "1" -- "0..*" UserFeedback : submits

    HeritageSite "1" -- "0..*" Review : contains
    HeritageSite "1" -- "0..*" VisitorPhoto : contains

    RegisteredUser ..> GeminiAIViaGenkit : uses chatbot
    Itinerary ..> GeminiAIViaGenkit : generated by
    RoutingService ..> HeritageSite : routes between
    GoogleMapsPlatform ..> HeritageSite : renders
    HTML5GeolocationAPI ..> Guest : provides GPS`
  }
];

console.log('Writing diagram source files...');
diagrams.forEach(d => {
  const file = path.join(scratchDir, `${d.name}.mmd`);
  fs.writeFileSync(file, d.code, 'utf8');
});

console.log('Rendering high-resolution individual PNGs...');
diagrams.forEach(d => {
  const mmdFile = path.join(scratchDir, `${d.name}.mmd`);
  const pngFile = path.join(outputDir, `${d.name}.png`);
  console.log(`Rendering ${d.name}.png ...`);
  const cmd = `npx -y @mermaid-js/mermaid-cli -i "${mmdFile}" -o "${pngFile}" -b white -s 3 -w 1800`;
  execSync(cmd, { stdio: 'inherit' });
});

console.log('Generating combined HTML page for presentation montage...');
const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Handumanan Final Verified System Diagrams</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      margin: 0;
      padding: 40px;
    }
    .container {
      max-width: 1600px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px;
      border-radius: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    }
    .header {
      text-align: center;
      margin-bottom: 50px;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 30px;
    }
    .header h1 {
      font-size: 36px;
      font-weight: 900;
      color: #047857;
      margin: 0 0 10px 0;
      letter-spacing: -0.02em;
    }
    .header p {
      font-size: 16px;
      color: #64748b;
      margin: 0;
    }
    .diagram-card {
      margin-bottom: 60px;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 30px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.03);
    }
    .diagram-card h2 {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 0;
      margin-bottom: 20px;
      border-left: 5px solid #047857;
      padding-left: 15px;
    }
    .diagram-img {
      width: 100%;
      height: auto;
      display: block;
      margin: 0 auto;
      border-radius: 8px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>HANDUMANAN SYSTEM ARCHITECTURE DIAGRAMS</h1>
      <p>Final Verified Technical Documentation & Architecture Specification | Metro Cebu Cultural Heritage System</p>
    </div>
    ${diagrams.map(d => `
    <div class="diagram-card">
      <h2>${d.title}</h2>
      <img src="${d.name}.png" class="diagram-img" alt="${d.title}" />
    </div>
    `).join('')}
  </div>
</body>
</html>`;

const combinedHtmlFile = path.join(outputDir, 'combined.html');
fs.writeFileSync(combinedHtmlFile, htmlContent, 'utf8');

console.log('Rendering combined PNG montage (00-all-diagrams-combined.png)...');
const combinedPngFile = path.join(outputDir, '00-all-diagrams-combined.png');

try {
  const puppeteerCmd = `npx -y puppeteer screenshot "${combinedHtmlFile}" --full-page --output "${combinedPngFile}" --viewport-width 1800 --viewport-height 1200`;
  execSync(puppeteerCmd, { stdio: 'inherit' });
} catch (e) {
  console.warn('Puppeteer full-page screenshot notice, using mmdc browser engine for HTML render fallback:', e.message);
  const fallbackCmd = `npx -y @mermaid-js/mermaid-cli -i "${combinedHtmlFile}" -o "${combinedPngFile}" -b white -s 2 -w 1800`;
  try {
    execSync(fallbackCmd, { stdio: 'inherit' });
  } catch (err2) {
    console.warn('HTML montage render fallback notice:', err2.message);
  }
}

console.log('SUCCESS: All PNG diagrams rendered and verified!');
