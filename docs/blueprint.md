# **App Name**: Handumanan

## Core Features:

- Heritage Site Profiles: Display detailed information for each cultural heritage site, including description, category, images, location data, and visiting hours, ensuring mobile and desktop accessibility.
- Advanced Site Search & Filtering: Provide a comprehensive search interface allowing users to find heritage sites by keywords, name, category, and apply various filters for refined results.
- Location-Based Discovery: Suggest nearby heritage sites to users based on their current geographic location or a specified area within Metro Cebu, integrated with mapping functionalities.
- AI Itinerary Planner Tool: Generate personalized multi-site heritage itineraries using user preferences, available time, site metadata, route distance, and a measurable non-AI baseline for comparison.
- User Comments & Ratings: Enable registered users to post comments, feedback, and ratings for individual heritage sites. This data is stored in Firebase Firestore under the related heritage site records.
- Admin Content Management: A secure, web-based administrative dashboard for authenticated administrators to create, edit, hide, delete, validate, and publish heritage site information through Firebase Authentication, Firestore, and role-based access rules.
- Interactive Map Integration: Use Google Maps Platform for map display, geolocation-supported discovery, route calculation, and route optimization. The system may use Google Maps AI capabilities, such as Places API AI-powered summaries or Grounding with Google Maps, only as supporting context and not as the sole source of verified heritage facts.

## Documentation Revisions:

- Figure 4: Data Flow Diagram revisions, including corrected DFD symbols plus Level 0 and Level 1 diagrams, are documented in [system-diagrams.md](./system-diagrams.md).
- Detailed descriptions for the use case diagrams are also inserted in [system-diagrams.md](./system-diagrams.md), covering visitor discovery, itinerary planning, user accounts, administrator management, and map-based route discovery.
- Re-defense panel comments, objective metrics, Google Maps migration notes, and AI/data-governance answers are documented in [redefense-panel-response-plan.md](./redefense-panel-response-plan.md).

## Style Guidelines:

- Primary color: A warm, earthy terracotta (#B7562D) symbolizing cultural heritage, tradition, and a welcoming feel for exploration. (HSL: 15, 60%, 45%)
- Background color: A subtle, desaturated hint of the primary hue for a clean, light base (#F1EDED), ensuring high readability for all content. (HSL: 15, 20%, 93%)
- Accent color: A soft, muted rose (#D27993) to provide contrast and highlight interactive elements or key information without overpowering the historical content. (HSL: 345, 70%, 65%)
- Headline font: 'Playfair' (serif) for an elegant and high-end feel suitable for site titles and major headings. Body text font: 'PT Sans' (humanist sans-serif) for clear readability in descriptions and general text.
- Use minimalist, line-art style icons that are easily recognizable and culturally relevant, to maintain a clean and uncluttered interface, especially for navigation and interactive elements.
- Implement a responsive, card-based grid layout for displaying heritage sites and recommendations, ensuring optimal viewing across various device sizes (mobile and desktop) with clear information hierarchy.
- Incorporate subtle and swift micro-animations for interactive elements such as button clicks, filter applications, and content loading, enhancing the user experience without distraction.
