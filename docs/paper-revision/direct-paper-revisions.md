# Handumanan Paper Revision Guide

Use this file as the direct replacement guide for `revision.docx`. The original Word file was copied safely to `docs/paper-revision/revision-working.docx`; the original file in Downloads was not changed.

## 1. Replace Section 1.1 Background of the Study

Replace the existing Section 1.1 with this revised version:

### 1.1 Background of the Study

Metro Cebu is rich in historical and cultural heritage that reflects the identity, faith, and development of Cebuano communities. Its churches, museums, monuments, ancestral houses, plazas, and historical markers preserve important events and stories that continue to shape local culture and tourism. These heritage sites are valuable not only as tourist attractions but also as educational and cultural resources that help residents and visitors understand the history of Metro Cebu.

Although information about heritage sites can be found through websites, blogs, social media posts, and other online sources, the available information is often scattered, incomplete, outdated, or inconsistent. Some users need to check several sources before finding basic details such as the site location, visiting hours, historical background, and available routes. This can make heritage exploration difficult, especially for tourists, students, and local residents who want quick and reliable access to cultural heritage information.

Another challenge is the lack of integrated digital tools that support actual travel planning. Some existing sources provide descriptions of heritage sites, but they do not always include location-based recommendations, route assistance, itinerary planning, or conversational support. As a result, users may know that a heritage site exists but still have difficulty deciding where to go next, how far it is, whether it is currently open, or how to organize multiple stops within a limited time.

To address these concerns, the researchers developed Handumanan: A Web-Based Cultural Heritage Site Information System for Metro Cebu. The system provides an organized digital directory of heritage sites in Cebu City, Lapu-Lapu City, Mandaue City, and Talisay City. It includes search and filtering features, detailed site information, visiting hours and availability status, Google Maps-based location and routing support, an AI-assisted itinerary planner, and a heritage chatbot that answers questions within the scope of Metro Cebu heritage tourism. Through these features, Handumanan aims to make cultural heritage information more accessible, reliable, and useful for planning actual visits.

## 2. Replace Section 1.5 Scope and Limitations

Replace the existing Section 1.5 with this revised version:

### 1.5 Scope and Limitations

This study focused on the development of a web-based cultural heritage site information system for Metro Cebu. The system covers selected heritage sites located in Cebu City, Lapu-Lapu City, Mandaue City, and Talisay City. These cities were selected because they contain many recognized cultural, historical, religious, and tourism-related sites and are within the practical coverage of the researchers during development and validation.

The system provides users with heritage site information such as site name, category, description, historical background, images, location, visiting days, visiting hours, accessibility status, and current availability. Its main features include site browsing, search and filtering by city or category, site details, favorites, feedback, Google Maps-based map display, route generation, travel mode selection, distance and travel time estimates, live location tracking, an AI-assisted itinerary planner, and a chatbot for Metro Cebu heritage-related questions. The system is accessible through web browsers on desktop and mobile devices.

The system also includes an administrator module that allows authorized administrators to manage heritage site records, site visibility, image URLs, coordinates, categories, and status information. Firebase Authentication and Firebase Firestore are used to support user accounts, reviews, favorites, saved itineraries, and admin-managed records.

However, the system has several limitations. It requires an internet connection to access maps, routes, Firebase services, and AI features. Route distance, travel time, and traffic-aware estimates depend on the availability and response of Google Maps and Google Routes services. When these services are unavailable, the system uses a backup route estimate to prevent complete feature failure, but the backup estimate is less accurate than Google-provided routing. The chatbot is limited to questions related to Handumanan, Metro Cebu heritage sites, tourism guidance, routes, itineraries, and system features. It does not answer unrelated topics such as politics, coding, entertainment, sports, or heritage sites outside the supported area. The system is also limited to a web-based platform and does not include a separate native mobile application.

## 3. Replace Outdated Definitions in Section 1.6

Remove the definitions for `Leaflet Map Integration` and `OpenStreetMap`. Add or replace these terms instead:

**Google Maps Integration.** The use of Google Maps services to display heritage site locations, show the user’s current location, and support map-based interaction within the system.

**Google Routes API.** A Google Maps Platform service used by the system to generate route paths, estimated travel time, distance, and travel mode-based route information when available.

**Backup Route Estimate.** A fallback routing method used when Google route services are unavailable. It provides an approximate distance and travel time so users can still receive basic route guidance, although it is less accurate than Google-provided routing.

**Live Location Tracking.** A system feature that updates the user’s current position on the map while navigation is active, subject to browser permission, device GPS accuracy, and internet connection.

**Travel Mode.** A routing option that allows the user to request route estimates for driving, two-wheeler, transit, or walking when supported by the routing provider.

## 4. Replace Chapter 2 Web Technologies Paragraph

Find the part that says Leaflet and OpenRouteService were used. Replace it with this:

Modern web-based tourism systems often integrate maps, geolocation, cloud databases, and AI-assisted features to improve user experience. In this study, Google Maps Platform was used to support map display, heritage site pinning, route visualization, distance estimates, travel time estimates, and travel mode options. Google Routes API was used when available to provide more accurate routing information, while a backup route estimate was implemented to maintain basic route guidance during API outage or service limitation. Firebase was used for authentication, database storage, user records, favorites, reviews, and saved itineraries. Genkit and Gemini were used to support the chatbot and AI-assisted itinerary planner, allowing the system to provide contextual responses and recommendations based on the available heritage site data.

## 5. Replace Section 3.3.1 Ethical Considerations

Replace future-tense statements such as “will adhere” and “will make sure” with completed-study tense. Use this:

### 3.3.1 Ethical Considerations

The researchers observed ethical practices during data gathering, system testing, and user evaluation. Participants were informed about the purpose of the study, the type of feedback requested, and their voluntary participation. They were also informed that they could refuse to participate or withdraw from the evaluation without penalty.

Personal information collected during testing was limited to what was necessary for system evaluation. User accounts, reviews, favorites, and saved itineraries were handled through Firebase services. Location access was requested only when users used location-based features such as nearby recommendations, route generation, or live navigation. The system did not require users to share their location if they did not want to use location-dependent functions.

The researchers also considered the accuracy of cultural heritage information. Heritage site details were gathered from government sources, tourism-related references, credible online sources, and available site validation. When historical details differed across sources, the researchers prioritized official and institutional references and avoided presenting unsupported claims as facts.

The chatbot was designed to answer only questions related to Handumanan, Metro Cebu heritage sites, tourism guidance, routes, itineraries, and system features. This limitation was added to reduce hallucinated or unrelated responses. For unsupported questions, the chatbot responds politely that it can only answer within the scope of the system.

## 6. Add After Figure 3 Use Case Diagram

Paste this after the Use Case Diagram figure and its caption:

Figure 3 presents the main user interactions in the Handumanan system. The diagram separates the functions available to visitors, registered users, and administrators. Visitors can browse heritage sites, search for information, view site details, use the map, ask the chatbot, and generate route or itinerary suggestions. Registered users can perform the same functions with additional account-based features such as saving favorites, submitting feedback, and saving itineraries. Administrators have access to the admin module, where they can add, update, hide, delete, and manage heritage site records.

The use case diagram shows that the system supports two major purposes: public heritage exploration and administrative content management. Public users interact with the system to obtain cultural heritage information and travel guidance, while administrators maintain the accuracy and availability of the site directory. This separation helps protect admin functions while still allowing general users to access the tourism-related features of the system.

## 7. Revise Figure 4 Data Flow Diagram Section

Use these figure titles and descriptions:

### Figure 4. Level 0 Data Flow Diagram of Handumanan

Figure 4 shows the Level 0 Data Flow Diagram of the Handumanan system. At this level, the system is presented as one main process that communicates with external entities. The main external entities are the tourist or user, the administrator, Firebase services, Google Maps services, and Gemini AI services. Users send search queries, filter selections, location requests, chatbot questions, and itinerary requests to the system. The system returns heritage site information, route results, availability details, itinerary suggestions, and chatbot responses. Administrators send heritage site updates to the system, and the system stores or retrieves data through Firebase.

The Level 0 diagram is important because it gives a high-level view of how Handumanan exchanges information with users, administrators, databases, and third-party services. It also shows that the system does not operate as an isolated website; it depends on Firebase for data management, Google Maps for map and route functions, and Gemini AI for AI-assisted responses.

### Figure 5. Level 1 Data Flow Diagram of Handumanan

Figure 5 expands the main Handumanan process into its major internal processes. These include user authentication, heritage site browsing, search and filtering, site detail viewing, route generation, itinerary planning, chatbot processing, feedback management, saved itinerary handling, and administrator content management. The system retrieves heritage site data from Firebase and built-in directory records, filters it based on city, category, availability, and user request, and displays the relevant results to the user.

For route generation, the system sends origin, destination, stop, and travel mode information to Google Maps or Google Routes services. The returned route path, distance, and estimated travel time are displayed on the map. If the routing service is unavailable, the system provides a backup route estimate. For chatbot processing, the system checks whether the user’s question is within the supported scope, retrieves relevant heritage site information, and generates a response that is limited to Metro Cebu heritage tourism and Handumanan system features. This Level 1 diagram explains the internal data movement that supports the system’s main user-facing features.

Important diagram reminder: In the actual DFD image, use proper DFD symbols:

- External entity: rectangle
- Process: circle or rounded process symbol
- Data store: open-ended rectangle or database symbol
- Data flow: labeled arrow
- Do not use class diagram boxes or flowchart decision diamonds in the DFD

## 8. Revise Figure 5 Class Diagram Section

If the DFD Level 1 becomes Figure 5, rename the class diagram as Figure 6.

### Figure 6. Class Diagram of Handumanan

Figure 6 shows the main classes and relationships used in the Handumanan system. The diagram includes user-related classes, heritage site records, reviews, favorites, itineraries, chatbot support, itinerary planning, and route services. The UserAuth class represents login and registration information, while the UserProfile class stores user profile details and role information. The AdminRole class identifies accounts with permission to manage heritage site records.

The HeritageSite class is the central class of the system because most features depend on heritage site data. It stores the site name, description, category, city, address, coordinates, image URLs, visiting days, visiting hours, status, accessibility, and date records. The Review class is connected to HeritageSite because registered users can submit ratings and comments for a selected site. The Favorite class stores the relationship between a user and a saved heritage site. The Itinerary and ItineraryItem classes represent generated or saved travel plans and the heritage stops included in them.

The ChatbotService, ItineraryPlanner, and RoutingService classes represent the main service features of the system. ChatbotService uses heritage site data as context when answering supported questions. ItineraryPlanner generates recommended stops based on user preferences, available time, location, and site availability. RoutingService communicates with Google Maps services to generate route paths, distance, travel time, travel mode results, and fallback estimates when needed. Overall, the class diagram shows how the system connects user accounts, heritage information, AI support, and route planning into one web-based heritage tourism platform.

## 9. Replace Section 3.7.1 Interface Design Text

Use this revised opening:

### 3.7.1 Interface Design

The interface of Handumanan was designed to support both desktop and mobile users. The design focused on clear navigation, readable site information, map-based exploration, and quick access to travel planning features. The main interface modules include user authentication, site directory, site details, map and route navigation, AI planner, chatbot, feedback, user profile, and admin management.

Each screenshot inserted in this section should include a figure number, title, and short discussion. The discussion should explain what the screen does and how it supports the objectives of the system.

Recommended figures to insert:

**Figure 7. Home Page of Handumanan.**  
This figure shows the landing page of the system. It introduces the Handumanan platform and provides quick access to the main user functions, including exploring heritage sites and searching the directory. The page serves as the entry point for users who want to discover Metro Cebu heritage sites.

**Figure 8. Login and Create Account Interface.**  
This figure shows the authentication screen where users can log in or create an account. The create account form includes a password visibility toggle to improve usability, especially for mobile users. This module supports account-based features such as favorites, reviews, and saved itineraries.

**Figure 9. Site Directory Interface.**  
This figure shows the directory page where users can browse, search, and filter heritage sites by city or category. The interface helps users find relevant sites without scrolling through the entire list. It supports the objective of providing organized access to heritage site information.

**Figure 10. Site Details Interface.**  
This figure shows the detailed page of a selected heritage site. It displays the site description, historical background, images, address, visiting hours, accessibility, open or closed status, and action buttons such as Initialize Route, Add to Itinerary, and Open in Maps.

**Figure 11. Map and Route Interface.**  
This figure shows the map-based exploration feature using Google Maps. Heritage site markers are displayed on the map, and users can select a site to view a styled information card. The route panel shows selected stops, estimated distance, travel time, route status, and travel mode options.

**Figure 12. AI Planner and Generated Itinerary Interface.**  
This figure shows how users can generate an itinerary based on location, available time, travel mode, and selected preferences. The itinerary planner prioritizes open and relevant heritage sites and avoids recommending closed sites when alternatives are available.

**Figure 13. Chatbot Interface.**  
This figure shows the Handumanan Heritage Guide chatbot. The chatbot answers questions related to Metro Cebu heritage sites, site history, recommendations, routes, itineraries, and system features. It also rejects unrelated questions politely to prevent unsupported or random answers.

**Figure 14. Admin Management Interface.**  
This figure shows the admin dashboard used to manage heritage site records. Administrators can add, edit, hide, delete, and update site information such as images, coordinates, categories, status, and visiting details.

## 10. Replace Section 3.9.1 Technology Stack

Replace the outdated Maps and Location Services paragraph with this:

**Maps and Location Services:** Google Maps Platform was used to display heritage site locations, map markers, user location, and route visualization. Google Routes API was used when available to generate route paths, estimated distance, estimated travel time, travel mode-based routing, and traffic-aware driving estimates. The system also includes a backup route estimate when the routing API is unavailable, so users can still receive basic guidance.

Keep the AI paragraph, but revise it to:

**AI Features:** Genkit and Gemini were used to support the chatbot and AI-assisted itinerary planner. The chatbot uses the system’s heritage site data as context and is restricted to Metro Cebu heritage tourism and Handumanan-related questions. The itinerary planner uses available site data, location, time, travel mode, and site availability to recommend relevant heritage stops.

## 11. Replace Broken Test Plan Table

Use this table content in Word. Make it a real table with four columns.

| Test No. | Feature Tested | Objective | Expected Result |
|---|---|---|---|
| 1 | User registration and login | To verify that users can create an account and log in using valid credentials. | The user can successfully register, log in, and access account-based features. |
| 2 | Password visibility toggle | To verify that the create account password field supports show/hide password. | The user can toggle password visibility without affecting the entered password. |
| 3 | Heritage site search | To verify that users can search for heritage sites using keywords. | The system displays relevant heritage sites based on the search query. |
| 4 | City and category filtering | To verify that users can filter heritage sites by city and category. | The system displays only the sites that match the selected city or category. |
| 5 | Site details | To verify that complete site information is displayed. | The system shows description, history, images, address, visiting hours, accessibility, and availability status. |
| 6 | Open/closed site status | To verify that site availability is displayed correctly based on listed visiting hours and status. | The system shows whether a site is currently open or closed and avoids closed sites in itinerary recommendations when alternatives are available. |
| 7 | Google Maps display | To verify that heritage site markers appear on the map. | The system displays heritage site markers and opens the correct information card when a marker is selected. |
| 8 | Route generation | To verify that the system can generate routes to selected heritage sites. | The system displays a route path, estimated distance, and estimated travel time when route data is available. |
| 9 | Travel mode selection | To verify that users can select driving, two-wheeler, transit, or walking when supported. | The route estimate updates based on the selected travel mode, or the system displays a fallback notice when unsupported. |
| 10 | Live location tracking | To verify that the user’s location updates during active navigation. | The user marker updates on the map when location permission is granted and the device provides location updates. |
| 11 | AI itinerary planner | To verify that the system can generate a travel plan based on location, duration, and preferences. | The system recommends relevant and available heritage sites and displays them as itinerary stops. |
| 12 | Clear all stops | To verify that users can remove all itinerary stops. | All stops and route lines are removed from the planner and map. |
| 13 | Chatbot heritage questions | To verify that the chatbot answers supported heritage-related questions. | The chatbot provides relevant answers based on Handumanan and Metro Cebu heritage site data. |
| 14 | Chatbot scope restriction | To verify that the chatbot rejects unrelated questions. | The chatbot politely states that it can only answer questions related to Metro Cebu heritage sites and the Handumanan system. |
| 15 | Feedback system | To verify that registered users can submit ratings and comments. | The submitted review appears under the selected heritage site. |
| 16 | Admin heritage management | To verify that administrators can add, edit, hide, delete, and update heritage site records. | Admin changes are saved and reflected in the public site directory when active. |

Caption: **Table 1. Test Plan for Handumanan System Features**

## 12. Add Objective-Feature-Test-Metric Alignment Table

Insert this after the test plan:

| Specific Objective | Matching System Feature | Matching Test Item | Evaluation Metric |
|---|---|---|---|
| To develop a unified system to organize and store cultural heritage site information in Metro Cebu. | Heritage site directory, Firebase records, built-in heritage site data, admin management module | Test 3, Test 4, Test 5, Test 16 | Correctness of displayed site information, successful admin update, number of complete site records |
| To design a system that allows users to search, browse, and view detailed information about heritage sites. | Search, city filter, category filter, site details page, site images, visiting hours, open/closed status | Test 3, Test 4, Test 5, Test 6 | Search relevance, filter accuracy, completeness of site details, usability rating |
| To integrate location-based features, an AI-powered itinerary planner, and a chatbot for Metro Cebu heritage tourism. | Google Maps, route generation, travel mode selection, live location tracking, AI planner, chatbot | Test 7, Test 8, Test 9, Test 10, Test 11, Test 13, Test 14 | Route availability, distance/time estimate display, successful itinerary generation, chatbot relevance, chatbot scope rejection accuracy |

Caption: **Table 2. Objective, Feature, Test Item, and Metric Alignment**

## 13. Replace Participants and Sampling Tense

Use completed-study tense:

Purposive sampling was used to select the study participants. This approach was appropriate because the researchers needed respondents who were familiar with tourism, cultural heritage, digital systems, or potential use of the Handumanan platform. The participants evaluated the system’s usability, functionality, and usefulness.

A total of sixty (60) participants were involved in the study. The participants included tourism office personnel, students, local residents, and tourists or travelers. Tourism office personnel provided feedback on heritage promotion and information accuracy. Students represented academic users who may use the system for learning local history. Local residents represented community users who may use the platform for awareness and local exploration. Tourists or travelers represented users who may need site information, directions, and itinerary support while visiting Metro Cebu.

All selected participants used the system and answered evaluation questionnaires. Their responses were used to assess the acceptability, usability, and functionality of the system.

## 14. Add Panel Question Answers

### 1. What objective metrics prove that your itinerary planner outperforms non-AI baseline routing?

The system can be evaluated using measurable indicators such as total travel distance, estimated travel time, number of open heritage sites included, number of closed sites avoided, route completion rate, itinerary relevance, and user satisfaction rating. Compared with a non-AI baseline that simply routes sites in a fixed or manual order, the AI-assisted planner considers user location, selected duration, travel mode, site availability, and nearby alternatives. During evaluation, we can compare the AI-generated route against a manual or nearest-neighbor baseline using the same starting point and destination set.

### 2. How do you detect and mitigate hallucinated chatbot answers regarding heritage facts?

The chatbot is restricted to Handumanan, Metro Cebu heritage sites, tourism guidance, routes, itineraries, and system-related features. Before generating a response, the system checks whether the question is within scope. If the question is unrelated, the chatbot rejects it politely instead of forcing an answer. For heritage-related questions, the chatbot uses available site records as context and avoids unsupported claims. It also tells users to verify critical visiting information when timing is important.

### 3. What is your authoritative source-of-truth pipeline for heritage data validation and updates?

The source-of-truth pipeline starts with official and institutional sources such as LGU tourism materials, government pages, NCCA-related references, tourism office information, and recognized heritage references. These are compared with credible online sources and, when possible, site validation. The verified records are encoded into the system’s heritage data and can be updated through the admin module. Admin changes include name, category, city, description, coordinates, images, visiting hours, accessibility, and public status.

### 4. How do you handle conflicting historical accounts across different sources?

When sources conflict, the system prioritizes official government, tourism office, institutional, and recognized heritage references. If a detail cannot be confidently verified, the system avoids presenting it as a certain fact. The description is written using neutral wording, and the researchers document the source used. This reduces misinformation and prevents the chatbot from creating unsupported historical claims.

### 5. What are your latency budgets for search, route generation, and chatbot responses?

The target latency budget for search and filtering is under one second because these features use local and database-backed heritage records. Route generation should ideally respond within three to five seconds, depending on Google Maps or Google Routes availability and internet speed. Chatbot responses should ideally return within five to ten seconds because they depend on AI processing and network conditions. If an external provider is slow or unavailable, the system displays a fallback notice or limits the response instead of silently failing.

### 6. How does your system behave during API outages involving routing or geolocation providers?

If Google route services are unavailable, the system uses a backup route estimate so users can still see approximate distance and travel time. The interface displays a notice such as “Using backup route estimate” to make the limitation clear. If geolocation is unavailable or denied, the system informs the user that location could not be accessed and still allows browsing, searching, and itinerary generation without Near Me mode. This prevents the system from becoming unusable when one provider fails.

### 7. What privacy controls and retention periods apply to location and user behavior data?

Location access is permission-based and is requested only for location-dependent features such as nearby suggestions, route generation, and live navigation. The system does not require location access for general browsing. User account data, favorites, reviews, and saved itineraries are stored in Firebase. Location used for live navigation is handled during the active session and is not intended to be permanently stored as continuous tracking history. For the paper, state that retained user-generated records should be kept only while the account or study record is needed and may be removed upon request, subject to school and project data policies.

### 8. Use Google Map.

This means the panel recommended using Google Maps instead of relying only on open-source map tiles. The system has been updated to use Google Maps for map display, heritage site pins, user location, route visualization, and map-based interaction.

### 9. Also use the provided Google Map AI.

This likely refers to using Google Maps Platform services that provide smarter location and routing support, such as route computation, traffic-aware estimates, travel modes, geocoding, and places-related map intelligence. In the system, Google Maps and Google Routes are used for map and routing functions, while Gemini is used for the heritage chatbot and itinerary planner.

### 10. How does your AI use the data on Firebase effectively?

The AI features use heritage site data, user-selected preferences, location input, availability status, and itinerary context to generate relevant recommendations. Firebase stores user-related data such as favorites, reviews, saved itineraries, and admin-managed heritage records. The chatbot and itinerary planner use this available system data as context so responses and recommendations are connected to actual heritage site records instead of random generated content.

## 15. Final Formatting Checklist

Apply these directly in Word:

- Use Roman numerals for preliminary pages.
- Put Table of Contents, List of Figures, and List of Tables on separate pages.
- Start every chapter on a new page.
- Use consistent heading styles: `CHAPTER X` centered, bold, all caps; `1.1` headings left aligned and bold; `1.1.1` headings left aligned and consistently bold or italic.
- Make figure numbering sequential. Avoid mixed labels such as Figure 4, Figure 4.1, and Figure 4.2 if the school format requires whole numbers.
- Add a caption and short interpretation paragraph after every figure.
- Add source notes for diagrams or screenshots if externally sourced. For system screenshots, use `Source: Researchers' system output`.
- Fix reference entries by adding missing URL, access date, volume, issue, pages, or DOI when available.
- Remove references that are not cited in the body.
- Replace proposal-tense verbs with completed-study tense: use “was developed,” “was used,” “were collected,” and “was evaluated.”

