# Review of `final paper 3.pdf`

Reviewed against the panel comments and the latest Handumanan system features.

## Overall Status

The latest paper is much better than the earlier version. Chapter 2 now includes Google Maps, AI chatbot, itinerary planning, recommender systems, and data privacy. Chapter 3 now includes Level 0 and Level 1 DFD descriptions, interface screenshots, and updated technology stack. However, the paper still needs final revisions before re-defense because several panel comments are only partially addressed.

## Checklist by Panel Comment

| Panel Comment | Status | What I Found | Required Action |
|---|---|---|---|
| Alignment must be justified | ⚠ Needs revision | Objectives were updated, but the paper still lacks a clear objective-feature-test-metric alignment table. | Add an alignment table after the Test Plan. |
| List of tables | ✓ Addressed | List of Tables exists. | Check formatting only. |
| List of figures | ✓ Addressed | List of Figures exists. | Check formatting only. |
| Figure 3 Use Case Diagram: provide detailed description | ⚠ Needs revision | Descriptions were added, but the figure references are mismatched. Example: after Figure 3, the text says Figure 3.1. | Correct figure number references in the descriptions. |
| Figure 4 DFD: revise symbols, add Level 0 and Level 1, add descriptions | ⚠ Needs revision | Level 0 and Level 1 descriptions are present. However, the actual diagram symbols cannot be verified from extracted text. | Confirm the actual diagram uses proper DFD symbols. Add note if needed. |
| Figure 5 Class Diagram: detailed description | ⚠ Needs revision | Description exists, but it says “Figure 4.2” even though the caption is Figure 5. | Replace “Figure 4.2” with “Figure 5.” |
| 3.7.1 Interface Design: insert screenshots and discussion | ✓ Mostly addressed | UI figure captions and brief discussions are present. | Clean figure numbering and remove “Admin UI: .” typo. |
| Appendix B to D required documents | ⚠ Needs revision | Appendix C contains screenshots. Appendix B and D appear mostly blank in extracted text. | Insert actual requirements documents and ethics documents. |
| Proposal tense vs completed-study tense | ✗ Still not fully fixed | Chapter 1 and Chapter 3 still say “propose,” “will adhere,” “will be used,” etc. | Replace future/proposal tense with completed-study tense. |
| Test table grammar/structure breakage and split rows | ✗ Still needs revision | Test Plan table is still broken in extracted text and only has 10 tests. | Replace with a clean test table that includes latest features. |
| Standardize chapter architecture | ⚠ Needs confirmation | Paper has Chapter 1 to 3 only, then References and Appendices. If school requires Chapter 4 and 5, this is still incomplete. | Ask adviser if 3-chapter capstone format is accepted. |
| References incomplete | ⚠ Needs revision | Several references lack URLs, access dates, volume/issue/pages, or DOI. Old Leaflet/OpenRouteService references remain. | Remove unused old map references and complete web references. |
| Front matter Roman numerals | ✓ Mostly addressed | TOC/List pages show roman numerals. | Visually check Word/PDF formatting. |
| TOC, List of Figures, List of Tables on separate pages | ✓ Mostly addressed | They appear as separate sections. | Visually check page breaks. |
| Chapter pages start on new pages | ✓ Likely addressed | Chapter headings appear separated. | Visually check page breaks. |
| Heading hierarchy consistency | ⚠ Needs revision | Some headings include colons, mixed capitalization, and `Interface Design(Main Modules)` has missing space. | Standardize headings. |
| Paragraph and spacing consistency | ⚠ Needs visual check | Extracted text shows inconsistent spacing and indentation in some parts. | Check in Word using one paragraph style. |
| Figures/tables need number, caption, source note, callout, interpretation | ⚠ Needs revision | Captions and interpretations exist, but source notes are missing. | Add “Source: Researchers’ system output” for screenshots and “Source: Researchers’ own diagram” for diagrams. |
| Objective-problem-method alignment | ✗ Missing | No clear alignment table found. | Add objective-feature-test-metric alignment table. |
| Language polishing | ⚠ Needs revision | Some informal/awkward lines remain, especially Chapter 1, IPO explanation, ethics, participants. | Replace selected paragraphs below. |
| Reference quality control | ⚠ Needs revision | References [37] and [38] are outdated and likely unused. Some references are incomplete. | Remove/replace and add access dates for web sources. |
| Panel: Use Google Map | ✓ Addressed | Google Maps is mentioned in Chapter 1, 2, 3, definitions, and tech stack. | Keep. |
| Panel: Also use provided Google Map AI | ⚠ Needs explanation | Paper uses Google Maps and Gemini, but does not clearly explain this comment. | Add short explanation in system/tech stack or defense notes. |
| Firebase AI use | ⚠ Needs revision | Firebase is mentioned, but not clearly tied to AI context use. | Add explanation in Technology Stack or System Architecture. |

## Chapter 1 Review

### Already Good

- The problem statement now includes map-based features, itinerary planner, and chatbot.
- Objectives now reflect the latest system better.
- Scope includes search, filtering, route generation, location-based suggestions, AI itinerary planning, chatbot, reviews, and admin management.
- Definitions now include Google Maps, Google Routes API, Backup Route Estimate, Live Location Tracking, and Travel Mode.

### Needs Revision

#### 1.1 Background of the Study

Problem: It still uses proposal wording:

> “To address these concerns, the researchers propose Handumanan...”

Replace that sentence with:

> To address these concerns, the researchers developed Handumanan: A Web-Based Cultural Heritage Site Information System for Metro Cebu. The system provides an organized platform where users can access cultural heritage site information, view site locations, generate route guidance, create suggested itineraries, and ask heritage-related questions through an AI-assisted chatbot.

Also replace the first paragraph because it still has awkward wording:

> Metro Cebu is rich in historical events that have shaped the city's identity. From its religious roots, from the first Spaniards...

Suggested replacement:

> Metro Cebu is rich in historical and cultural heritage that reflects the identity, faith, and development of Cebuano communities. Its churches, museums, monuments, ancestral houses, plazas, and historical markers preserve important events and stories that continue to shape local culture and tourism. These heritage sites are valuable not only as tourist attractions but also as educational and cultural resources that help residents and visitors understand the history of Metro Cebu.

#### 1.3.2 Specific Objectives

Objective 5 says:

> Implement an AI chatbot that answers questions related to Metro Cebu Heritage sites and the Handumanan system.

Replace with:

> Implement an AI chatbot that answers questions related to Metro Cebu heritage sites, tourism guidance, routes, itineraries, and Handumanan system features while rejecting unrelated or unsupported questions.

Reason: This reflects the latest chatbot scope restriction.

#### 1.5 Scope and Limitations

This section is mostly good, but it says:

> Lastly, it does not provide real-time traffic monitoring...

This may confuse the panel because Google Routes can provide traffic-aware estimates when available. Replace the last sentence with:

> The system can use traffic-aware route estimates when supported by Google Maps services; however, it does not independently monitor live traffic, road closures, crowd density, or visitor analytics.

## Chapter 2 Review

### Already Good

The following needed sections are already present:

- Web-Based Cultural Heritage Information System
- Location-Based Services and Google Maps Integration
- AI Chatbots in Tourism and Information Systems
- Itinerary Planning and Recommender Systems
- Data Privacy in Location-Based Applications
- Updated synthesis
- Updated research gap

### Needs Revision

#### 2.1 Related Literature: AI Chatbots

Current text is acceptable but can be stronger because the system now rejects unrelated questions.

Add this sentence at the end of the AI Chatbots paragraph:

> This scope limitation is important because it prevents the chatbot from giving random answers or unsupported recommendations when a user asks questions outside Metro Cebu heritage tourism.

#### 2.1 Related Literature: Itinerary Planning

Current text does not mention open/closed site detection.

Add this sentence at the end of the Itinerary Planning paragraph:

> The itinerary planner also considers site availability so that closed or unavailable sites can be avoided when there are nearby open alternatives.

#### 2.4 Research Gap

Current gap is good, but it does not mention open/closed availability.

Replace the last sentence with:

> Handumanan addresses this gap by providing a web-based cultural heritage site information system for selected sites in Cebu City, Lapu-Lapu City, Mandaue City, and Talisay City. The system combines a heritage site directory, Google Maps-based route guidance, location-based suggestions, AI-assisted itinerary planning, chatbot assistance, open/closed site awareness, and admin-managed heritage records.

## Chapter 3 Review

### Already Good

- Data Gathering Procedures are present.
- Agile/Scrum methodology is improved.
- Use case diagrams have descriptions.
- DFD Level 0 and Level 1 are present.
- Class diagram has a detailed discussion.
- Interface design section includes screenshots and descriptions.
- Technology stack now includes Google Maps Platform, Google Routes API, Genkit, Gemini, Firebase, and Next.js.

### Needs Revision

#### 3.1.2 IPO Explanation

Current text uses informal wording:

> Users put in their search queries...

Replace the Input paragraph with:

> Input: This stage refers to the data entered into the system by users and administrators. Users provide search keywords, location permission, itinerary preferences, chatbot questions, ratings, and comments. Administrators provide heritage site records such as site names, descriptions, categories, images, coordinates, visiting hours, availability status, and other visitor information.

Replace the Process paragraph with:

> Process: This stage explains how the system handles the input data. The system organizes heritage site records, applies search and filtering, processes user location when permission is granted, generates route guidance through Google Maps services, creates itinerary suggestions, and uses AI assistance to respond to heritage-related questions. User feedback, favorites, and saved itineraries are stored through Firebase services.

Replace the Output paragraph with:

> Output: This stage refers to the information and services displayed to users and administrators. Users can view heritage site details, filtered search results, route guidance, estimated distance and travel time, suggested itineraries, chatbot responses, and submitted reviews. Administrators can view and manage heritage site records through the admin module.

#### 3.2 Research Design

Current text says:

> A Developmental Research Design is used...

Replace with:

> A developmental research design was used in this study because the main objective was to design, develop, and evaluate a working web-based system. The study did not only identify problems in accessing cultural heritage information; it also developed Handumanan as a proposed solution for organizing heritage site information and supporting users through search, maps, route planning, itinerary generation, and chatbot assistance.

#### 3.3.1 Ethical Considerations

Problem: This section still uses future tense:

> researchers will adhere  
> researchers will make sure  
> participants will be told

Replace the opening paragraph with:

> In compliance with the Data Privacy Act of 2012 (Republic Act No. 10173), the researchers observed ethical practices during the development and testing of the Handumanan system. Since the system involves user accounts, location-based features, feedback, and cultural heritage information, the researchers considered user privacy, informed consent, responsible data handling, and accuracy of presented information.

Replace the Informed Consent paragraph with:

> Before participants used the system or answered the questionnaire, the researchers explained the purpose of the study, the type of feedback requested, and the voluntary nature of participation. Participants were informed that their responses would be used only for academic and research purposes.

Replace the Accuracy paragraph with:

> The researchers verified heritage site information using available government sources, tourism-related references, credible online sources, and site validation when possible. When details differed across sources, official or institutional references were prioritized to reduce the risk of presenting inaccurate information.

#### 3.4 Phase 7 Maintenance

Current text switches future tense:

> researchers will update...

Replace with:

> The maintenance phase covers the continuous updating and monitoring of the system after development and testing. In this phase, heritage site records may be updated when new information, corrections, or availability changes are identified. User feedback may also be reviewed to identify possible improvements. Bugs, incorrect records, broken images, and routing or chatbot issues may be corrected to keep the system usable and reliable.

#### 3.6.3 Use Case Diagram

Fix mismatched figure references:

- After `Figure 3: Guest/Visitor Use Case Diagram`, change “Figure 3.1 shows...” to “Figure 3 shows...”
- After `Figure 3.1: Registered User Use Case Diagram`, change “Figure 3.2 shows...” to “Figure 3.1 shows...”
- After `Figure 3.2: Administrator Use Case Diagram`, change “Figure 3.3 shows...” to “Figure 3.2 shows...”

#### 3.6.4 Data Flow Diagram

The descriptions are mostly good. Add this short paragraph after the Level 1 DFD description:

> The DFD uses standard data flow symbols to show external entities, system processes, data stores, and data flows. External entities represent users, administrators, and third-party services. Processes represent system functions such as search, routing, chatbot processing, and itinerary generation. Data stores represent Firebase and heritage site records, while arrows show how data moves between these components.

#### 3.6.5 Class Diagram

Current text says:

> Figure 4.2 shows...

Replace with:

> Figure 5 shows the main classes and relationships used in the Handumanan system.

Also update the RoutingService sentence:

> The RoutingService supports route and direction features by using an external map or routing API.

Replace with:

> The RoutingService supports route and direction features through Google Maps services and provides a backup route estimate when Google route data is unavailable.

#### 3.7.1 Interface Design

Fix heading:

> 3.7.1 Interface Design(Main Modules)

Replace with:

> 3.7.1 Interface Design

Fix typo:

> Admin UI: .

Replace with:

> Admin UI:

Add source notes under screenshots:

> Source: Researchers’ system output.

For diagrams, use:

> Source: Researchers’ own diagram.

#### 3.9.1 Technology Stack

Fix capitalization and typo:

- `Ai-assisted` → `AI-assisted`
- `Typescript` → `TypeScript`
- `Css` → `CSS`
- `Google Routes A` → `Google Routes API`
- `Ai Features` → `AI Features`

#### 3.10.1 Test Plan

This is one of the biggest remaining issues. The table is still broken and missing tests for new features.

Replace the current Test Plan with this clean version:

| Test No. | Feature Tested | Objective | Expected Result |
|---|---|---|---|
| 1 | User registration and login | To verify that users can create an account and log in using valid credentials. | The user can successfully register, log in, and access account-based features. |
| 2 | Password visibility toggle | To verify that the create account password field supports show/hide password. | The user can toggle password visibility without affecting the entered password. |
| 3 | Heritage site search | To verify that users can search for heritage sites using keywords. | The system displays relevant heritage sites based on the search query. |
| 4 | City and category filtering | To verify that users can filter heritage sites by city and category. | The system displays only the sites that match the selected city or category. |
| 5 | Site details | To verify that complete site information is displayed. | The system shows description, history, images, address, visiting hours, accessibility, and availability status. |
| 6 | Open/closed site status | To verify that site availability is displayed based on listed status and visiting hours. | The system shows whether a site is open or closed and avoids closed sites in itinerary recommendations when alternatives are available. |
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

Caption:

> Table 5. Test Plan for Handumanan System Features

#### Add Objective-Feature-Test-Metric Alignment Table

Insert after the Test Plan:

| Specific Objective | Matching System Feature | Matching Test Item | Evaluation Metric |
|---|---|---|---|
| Design and develop a web-based system that provides organized information about selected heritage sites in Metro Cebu. | Heritage site directory, site details, built-in records, Firebase records, admin management | Tests 3, 4, 5, 16 | Completeness of site records, successful display of site details, successful admin update |
| Provide search and filtering features based on city, category, and heritage site details. | Search bar, city filter, category filter, directory browsing | Tests 3, 4 | Search relevance, filter accuracy, user task completion |
| Integrate map-based features that allow users to view heritage site location, generate routes, and access estimated distance and travel time. | Google Maps display, route generation, travel modes, live location tracking | Tests 7, 8, 9, 10 | Route generation success, displayed distance/time, successful location update |
| Develop an AI-powered itinerary planning feature that recommends suggested heritage routes based on user preferences and available site information. | AI Planner, open/closed status checking, generated stops, clear all stops | Tests 6, 11, 12 | Relevant site recommendation, avoidance of unavailable sites, route/stops cleared successfully |
| Implement an AI chatbot that answers questions related to Metro Cebu heritage sites and the Handumanan system. | Heritage Guide chatbot, scope filter, heritage data context | Tests 13, 14 | Correct heritage answer, successful rejection of unrelated questions |
| Provide an administrative module for managing heritage site records and maintaining site information. | Admin dashboard, heritage site management, image URL management, status updates | Test 16 | Successful add/edit/hide/delete operation and reflected public update |

Caption:

> Table 6. Objective, Feature, Test Item, and Evaluation Metric Alignment

#### Participants and Sampling

Current section still uses future tense.

Replace opening paragraph with:

> Purposive sampling was used to select the study participants. This approach was appropriate because the researchers needed respondents who were familiar with tourism, cultural heritage, digital systems, or potential use of the Handumanan platform. The participants evaluated the system’s usability, functionality, and usefulness.

Replace:

> A total of sixty (60) will be involved...

with:

> A total of sixty (60) participants were involved in the study. These participants were grouped into tourism office personnel, students, local residents, and tourists or travelers.

#### Setting of the Study

Replace:

> The study will be conducted...

with:

> The study was conducted in Metro Cebu, particularly in Cebu City, Lapu-Lapu City, Mandaue City, and Talisay City. These areas were selected because they contain recognized cultural heritage places such as museums, monuments, churches, plazas, and ancestral houses.

## References Review

### Needs Revision

Remove these if they are no longer cited:

- [37] OpenRouteService
- [38] Leaflet

Reason: The system now uses Google Maps Platform and Google Routes API, not Leaflet/OpenRouteService.

Add access dates for web sources such as:

- Department of Tourism Philippines
- UNESCO
- NCCA
- UNWTO
- Google Developers
- Firebase
- MDN

Suggested replacement references:

> [28] Google Developers, “Google Maps Platform Documentation,” 2026. [Online]. Available: https://developers.google.com/maps. Accessed: May 30, 2026.

> [29] Firebase, “Firebase Documentation,” 2026. [Online]. Available: https://firebase.google.com/docs. Accessed: May 30, 2026.

> [37] Google Developers, “Routes API Documentation,” 2026. [Online]. Available: https://developers.google.com/maps/documentation/routes. Accessed: May 30, 2026.

> [38] Google Developers, “Maps JavaScript API Documentation,” 2026. [Online]. Available: https://developers.google.com/maps/documentation/javascript. Accessed: May 30, 2026.

## Appendices Review

### Appendix B

Status: ⚠ Needs revision

The heading exists, but extracted text does not show actual requirements gathering documents. Insert:

- survey questionnaire
- interview guide
- data gathering form
- sample consent form if used
- summary of respondent profile if available

### Appendix C

Status: ✓ Mostly addressed

It contains UI screenshots/pages. Make sure each image has a label or caption.

### Appendix D

Status: ⚠ Needs revision

The heading exists, but extracted text does not show actual ethics documents. Insert:

- REC form or ethics checklist
- informed consent form
- participant consent template
- data privacy statement

## System Consistency Review

| Current System Feature | Reflected in Paper? | Status |
|---|---|---|
| AI Chatbot | Yes | ✓ Needs small strengthening about scope rejection |
| Heritage Site Directory | Yes | ✓ |
| Google Maps Integration | Yes | ✓ |
| Google Routes API | Yes | ✓, but fix typo in table |
| Route Planning | Yes | ✓ |
| Travel Modes | Partly | ⚠ Add to test plan and possibly Functional Requirements |
| Backup Route Estimate | Yes | ✓ |
| Live Location Tracking | Yes in terms | ⚠ Add to test plan and route/map module discussion |
| Open/Closed Site Detection | Partly | ⚠ Add to Chapter 2, test plan, and functional requirements |
| Recommendation Features | Yes | ✓ |
| Firebase | Yes | ✓ |
| Admin Management | Yes | ✓ |
| Chatbot unrelated-question rejection | Partly | ⚠ Add to objectives, Chapter 2, and test plan |

## Final Priority Fixes Before Submission

1. Fix all future/proposal tense in Chapter 1 and Chapter 3.
2. Fix figure reference mismatches in Use Case and Class Diagram descriptions.
3. Replace the broken Test Plan with a clean table.
4. Add the Objective-Feature-Test-Metric alignment table.
5. Add source notes under figures and screenshots.
6. Remove old Leaflet/OpenRouteService references or replace them with Google Maps/Routes references.
7. Complete Appendix B and Appendix D with actual required documents.
8. Fix Technology Stack typos: `Google Routes A`, `Ai`, `Typescript`, `Css`.
9. Add open/closed site detection and chatbot scope rejection to tests.
10. Confirm with adviser whether a three-chapter capstone format is accepted or if Chapter 4 and Chapter 5 are required.

