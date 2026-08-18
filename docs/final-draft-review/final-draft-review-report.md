# FINAL DRAFT Review Report

Files reviewed:

- `FINAL DRAFT.docx`
- `FINAL DRAFT.pdf`

Review basis:

- Panelists' comments
- Current Handumanan system features in the codebase
- DOCX content extraction
- Embedded figure/image extraction from the DOCX

## Overall Readiness Assessment

**Status: ⚠ Almost ready, but not yet final-final.**

The documentation has improved a lot. The major system changes are now mostly reflected: AI chatbot, AI-powered itinerary planner, Google Maps, Google Routes API, Firebase, route planning, location-based features, and admin-managed heritage records are already included.

However, the draft still has several issues that panelists may notice:

1. Some tense inconsistency remains in Chapter 3.
2. The test plan still does not fully cover the latest features.
3. Figure/source notes are missing.
4. The use case diagram images have internal figure numbers that do not match the paper captions.
5. Appendix B and Appendix D headings are present, but the extracted text does not show actual required documents.
6. References are still incomplete because web references lack URLs and access dates.

If these are fixed, the paper should be much safer for final submission and re-defense.

## Panel Comment Classification

| Panel Comment | Status | Evidence Found | What Still Needs Work |
|---|---|---|---|
| Alignment must be justified | ⚠ Partially Addressed | Objectives are clearer and match system features better. | Add an Objective-Feature-Test-Metric alignment table. |
| List of Tables | ✓ Fully Addressed | List of Tables exists. | Only check visual spacing in final Word/PDF. |
| List of Figures | ✓ Fully Addressed | List of Figures exists. | Only check visual spacing in final Word/PDF. |
| Figure 3 Use Case Diagram: provide detailed description | ⚠ Partially Addressed | Descriptions exist for guest, registered user, and admin. | Image labels inside diagrams say Figure 1, Figure 2, Figure 3, while paper captions say Figure 3, 3.1, 3.2. This mismatch should be fixed. |
| Figure 4 DFD: revise symbols, add Level 0 and Level 1, add detailed description | ⚠ Partially Addressed | Level 0 and Level 1 DFDs exist with descriptions. Level 1 uses process/data-store symbols better. | Add source note and improve Level 0 labeling. Firebase/Google/Gemini are shown as rectangles; acceptable if treated as external services, but clarify in text. |
| Figure 5 Class Diagram: detailed description | ✓ Fully Addressed | Figure 5 has detailed class discussion. | Minor update: RoutingService should mention Google Maps and backup route estimate. |
| 3.7.1 Interface Design: insert screenshots and discussion after every figure | ⚠ Partially Addressed | Screenshots and short discussions exist. | Add source notes and fix heading/typo. |
| Appendix B to D: insert required documents | ⚠ Partially Addressed | Appendix headings exist; Appendix C has UI screenshots. | Appendix B and D look blank/incomplete in extracted text. Insert actual requirements and ethics documents. |
| Proposal tense vs completed-study tense | ⚠ Partially Addressed | Many parts are past tense now. | Chapter 3 still has “will” and mixed tense in ethics, participants, and setting. |
| Test table grammar/structure breakage and split rows | ⚠ Partially Addressed | Test cases now have remarks. | Test Plan still uses broken plain rows and only 10 test items; missing new features. |
| Standardize chapter architecture | ⚠ Partially Addressed | The paper uses Chapter 1 to 3, then References and Appendices. | Confirm with adviser if three-chapter format is accepted. If school requires Chapter 4/5, this is not enough. |
| Many references incomplete | ⚠ Partially Addressed | References increased to 53 and newer tech refs were added. | Web references still lack URLs and access dates. Some journal references still lack volume/issue/pages/DOI. |
| Roman numerals for preliminary pages | ✓ Fully Addressed | TOC/List pages show roman numerals. | Visually confirm final PDF page numbers. |
| TOC, List of Figures, List of Tables on separate clean pages | ✓ Fully Addressed | They exist as separate sections. | Visual spacing check only. |
| Chapter pages start on new pages | ✓ Mostly Addressed | Chapter headings appear separated. | Visual page break check only. |
| Heading hierarchy | ⚠ Partially Addressed | Major headings exist. | Fix `Interface Design(Main Modules)` and inconsistent title punctuation/spacing. |
| Paragraph and spacing consistency | ⚠ Partially Addressed | Most paragraphs are readable. | Some sections still have missing spaces after participant labels and extra spacing. |
| Figures/tables need number, caption, source note, in-text callout, interpretation | ⚠ Partially Addressed | Numbers/captions/discussions exist. | Source notes are missing. Add source notes under every figure/table where needed. |
| Objective-problem-method alignment | ⚠ Partially Addressed | Objectives are clearer. | Add alignment table after Test Plan. |
| Language polishing | ⚠ Partially Addressed | Many sections improved. | Some awkward wording remains in Chapter 1, Chapter 3, participants, and setting. |
| Reference quality control | ⚠ Partially Addressed | Newer Google/Firebase/Gemini/Genkit references were added. | Add URLs/access dates and remove uncited sources if any. |
| Use Google Map | ✓ Fully Addressed | Google Maps and Google Routes API appear in definitions, Chapter 2, DFD, architecture, and tech stack. | Keep. |
| Also use the provided Google Map AI | ⚠ Partially Addressed | Paper uses Google Maps services and Gemini/Genkit AI. | Add one sentence explaining that Google Maps handles map/routing intelligence while Gemini/Genkit handles chatbot/itinerary AI. |
| How does AI use Firebase effectively? | ✓ Mostly Addressed | System Architecture says AI chatbot and itinerary planner use heritage data as context. | Strengthen slightly in Database Design or Architecture. |

## Current System Alignment Check

| Current System Feature | Documented in Paper? | Status | Notes |
|---|---|---|---|
| AI Chatbot | Yes | ✓ | Mentioned in objectives, Chapter 2, functional requirements, DFD, architecture, tech stack, testing. |
| Chatbot scope restriction | Partly | ⚠ | Mentioned, but should be included in Test Plan. |
| AI-Powered Itinerary Planner | Yes | ✓ | Mentioned throughout paper. |
| Heritage Site Directory | Yes | ✓ | Clearly documented. |
| Google Maps Integration | Yes | ✓ | Clearly documented. |
| Google Routes API | Yes | ✓ | Included in definitions and tech stack. |
| Route Planning | Yes | ✓ | Documented. |
| Travel Modes | Partly | ⚠ | Defined, but not tested in Test Plan. |
| Location-Based Services | Yes | ✓ | Documented. |
| Live Location Tracking | Partly | ⚠ | Defined, but not strongly discussed/tested. |
| Open/Closed Site Detection | Partly | ⚠ | Mentioned through site availability and planner, but not enough in requirements/testing. |
| Recommendation Features | Yes | ✓ | Mentioned. |
| Firebase Data Integration | Yes | ✓ | Documented in database design, architecture, and tech stack. |
| Password eye toggle | Not documented | ⚠ | Exists in the system but not necessary unless included as usability improvement/test. |
| Clear All Stops route clearing | Not documented | ⚠ | Exists in system but not documented/tested. |
| Backup route estimate | Yes | ✓ | Defined and mentioned in tech stack. |

## Features That Exist in the System but Are Weak or Missing in the Paper

1. **Travel mode selection**
   - System has Drive, 2-Wheel, Transit, and Walk.
   - Paper defines Travel Mode, but Test Plan does not test it.

2. **Open/closed site detection**
   - System filters closed/unavailable sites and recommends open alternatives.
   - Paper mentions site availability, but this should be clearer in Functional Requirements and Test Plan.

3. **Chatbot scope restriction**
   - System rejects unrelated questions.
   - Paper mentions scope, but testing should explicitly include unrelated-question rejection.

4. **Live location tracking**
   - System has live user location tracking during navigation.
   - Paper defines it, but testing does not evaluate it.

5. **Clear All Stops**
   - System clears stops and map route lines.
   - Paper does not document/test it.

6. **Password visibility toggle**
   - System has eye/eye-off password toggle.
   - Paper does not mention it; optional, but useful in usability testing.

## Features Documented but Potentially Overstated

1. **Traffic-aware driving estimates**
   - Paper says Google Routes API provides traffic-aware estimates.
   - This is okay if Google Routes is available, but the paper should clarify that accuracy depends on API availability, internet connection, and Google route data.

Suggested sentence:

> Traffic-aware estimates are available when supported by Google Routes API; however, the system does not independently monitor traffic conditions and uses a backup route estimate when route data is unavailable.

2. **Real-time traffic monitoring**
   - Scope says the system does not provide real-time traffic monitoring.
   - This is good, but clarify the difference between Google-provided ETA and independent traffic monitoring.

## Required Copy-Paste Revisions

### 1. Chapter 1, Section 1.1 Background of the Study

Current issue:

> proposed system

Replace the sentence with:

> Aside from providing organized heritage information, the developed system also supports users through location-based and AI-assisted features. Handumanan provides a searchable heritage directory, map-based route support, itinerary planning, visiting-hour awareness, and an AI chatbot that assists users with heritage-related questions.

Also replace:

> To address these concerns, the researchers propose Handumanan...

with:

> To address these concerns, the researchers developed Handumanan: A Web-Based Cultural Heritage Site Information System for Metro Cebu. The system provides an organized platform where users can access cultural heritage site information, view site locations, generate route guidance, create suggested itineraries, and ask heritage-related questions through an AI-assisted chatbot.

### 2. Chapter 1, Section 1.3.2 Specific Objectives

Replace Objective 5 with:

> Implement an AI chatbot that answers questions related to Metro Cebu heritage sites, tourism guidance, routes, itineraries, and Handumanan system features while rejecting unrelated or unsupported questions.

Add this as Objective 7 if allowed:

> Evaluate the system based on feature functionality, usability, route support, chatbot response relevance, and alignment with the specific objectives of the study.

### 3. Chapter 1, Section 1.5 Scope and Limitations

Replace the last sentence with:

> The system can use traffic-aware route estimates when supported by Google Maps services; however, it does not independently monitor live traffic, road closures, crowd density, or visitor analytics.

### 4. Chapter 2, AI Chatbots in Tourism and Information Systems

Add at the end of the paragraph:

> This scope limitation is important because it prevents the chatbot from giving random answers or unsupported recommendations when users ask questions outside Metro Cebu heritage tourism or the Handumanan system.

### 5. Chapter 2, Itinerary Planning and Recommender Systems

Add at the end of the paragraph:

> The itinerary planner also considers site availability so that closed or unavailable sites can be avoided when there are nearby open alternatives.

### 6. Chapter 2, Research Gap

Replace the final sentence with:

> Handumanan addresses this gap by providing a web-based cultural heritage site information system for selected sites in Cebu City, Lapu-Lapu City, Mandaue City, and Talisay City. The system combines a heritage site directory, Google Maps-based route guidance, location-based suggestions, AI-assisted itinerary planning, chatbot assistance, open/closed site awareness, and admin-managed heritage records.

### 7. Chapter 3, Section 3.1.2 IPO Explanation

Replace the Process paragraph with:

> Process: This stage explains how the system handles the input data. The system organizes heritage site records, applies search and filtering, processes user location when permission is granted, generates route guidance through Google Maps services, creates itinerary suggestions, and uses AI assistance to respond to heritage-related questions. User feedback, favorites, and saved itineraries are stored through Firebase services.

### 8. Chapter 3, Section 3.2 Research Design

Replace with:

> A developmental research design was used in this study because the main objective was to design, develop, and evaluate a working web-based system. The study did not only identify problems in accessing cultural heritage information; it also developed Handumanan as a proposed solution for organizing heritage site information and supporting users through search, maps, route planning, itinerary generation, and chatbot assistance.

### 9. Chapter 3, Section 3.3.1 Ethical Considerations

Replace the opening paragraph with:

> In compliance with the Data Privacy Act of 2012 (Republic Act No. 10173), the researchers observed ethical practices during the development and testing of the Handumanan system. Since the system involves user accounts, location-based features, feedback, and cultural heritage information, the researchers considered user privacy, informed consent, responsible data handling, and accuracy of presented information.

Replace the Informed Consent paragraph with:

> Before participants used the system or answered the questionnaire, the researchers explained the purpose of the study, the type of feedback requested, and the voluntary nature of participation. Participants were informed that their responses would be used only for academic and research purposes. The researchers also explained the data that may be collected, such as ratings, comments, and basic account information if the participant registered in the system.

Replace User Privacy and Data Protection with:

> Information was collected only when required for system functions, such as user account details, feedback, saved itineraries, and location input when location-based features were used. The information was not shared with unauthorized persons or used for purposes outside the study. Only authorized users were allowed to access administrative functions.

Replace Accuracy of Cultural Heritage Information with:

> The researchers verified heritage site information using available government sources, tourism-related references, credible online sources, and site validation when possible. When details differed across sources, official or institutional references were prioritized to reduce the risk of presenting inaccurate information.

Replace Proper Use of Images and Content with:

> Images and content used in the system were sourced from available references or collected by the researchers when possible. Copyrighted materials were not used without permission or proper citation. Heritage information was presented respectfully because the sites represent the history and culture of Metro Cebu.

Replace Confidentiality of Feedback and Survey Responses with:

> Survey, interview, and feedback responses were kept confidential. Respondent names and personal information were not shown in the final paper unless permission was given. The responses were used only to evaluate and improve the Handumanan system.

### 10. Chapter 3, Section 3.6.4 Data Flow Diagram

Add after the Level 1 description:

> The DFD uses standard data flow symbols to show external entities, system processes, data stores, and data flows. External entities represent users, administrators, and third-party services. Processes represent system functions such as search, routing, chatbot processing, and itinerary generation. Data stores represent Firebase and heritage site records, while arrows show how data moves between these components.

### 11. Chapter 3, Section 3.6.5 Class Diagram

Replace:

> The RoutingService supports route and direction features by using an external map or routing API.

with:

> The RoutingService supports route and direction features through Google Maps services and provides a backup route estimate when Google route data is unavailable.

### 12. Chapter 3, Section 3.7.1 Interface Design

Replace heading:

> 3.7.1 Interface Design(Main Modules)

with:

> 3.7.1 Interface Design

Replace:

> Admin UI: .

with:

> Admin UI:

Add under each system screenshot:

> Source: Researchers’ system output.

Add under diagrams:

> Source: Researchers’ own diagram.

### 13. Chapter 3, Section 3.10.1 Test Plan

Replace the current Test Plan with this table:

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

### 14. Add Objective-Feature-Test-Metric Alignment Table

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

### 15. Participants and Sampling

Replace:

> A total of sixty (60) will be involved in this study.

with:

> A total of sixty (60) participants were involved in this study.

Fix spacing:

> Tourism Office Personnel – Five (5) participants These participants...

> Students – Twenty-five (25) participants Students...

> Local Residents – Twenty (20) participants Residents...

> Tourists / Travelers – Ten (10) participants People...

### 16. Setting of the Study

Replace:

> MetroCebu

with:

> Metro Cebu

Replace:

> which is the spectrum of proposed system applications

with:

> which is within the intended scope of the developed system.

## References That Need Fixing

Add URLs and access dates for web references:

> [49] Google Developers. (2025). Google Maps Platform Documentation. [Online]. Available: https://developers.google.com/maps. Accessed: June 1, 2026.

> [50] Google Developers. (2025). Google Routes API Documentation. [Online]. Available: https://developers.google.com/maps/documentation/routes. Accessed: June 1, 2026.

> [51] Google. (2025). Gemini API Documentation. [Online]. Available: https://ai.google.dev/gemini-api/docs. Accessed: June 1, 2026.

> [52] Firebase. (2025). Firebase Documentation. [Online]. Available: https://firebase.google.com/docs. Accessed: June 1, 2026.

> [53] Google. (2025). Genkit Documentation. [Online]. Available: https://firebase.google.com/docs/genkit. Accessed: June 1, 2026.

Also complete references [3], [9], [10], [11], [17], [28], [29], [30], [31], and [37] if they are web sources. Add URL and access date.

## Appendix Review

### Appendix B – Requirements Gathering Documents

Status: ⚠ Partially Addressed

The heading exists, but the extracted text does not show the actual documents.

Insert at least:

- survey questionnaire
- interview guide
- data gathering checklist
- consent/information sheet if used for respondents

### Appendix C – Design and Development Documents

Status: ✓ Mostly Addressed

UI screenshots are present.

Still add:

- proper captions
- source notes
- clearer labels if screenshots are grouped

### Appendix D – Research Ethics

Status: ⚠ Partially Addressed

The heading exists, but the extracted text does not show actual ethics forms.

Insert:

- REC checklist/forms
- informed consent form
- privacy/data handling statement
- approval/ethics-related documents if available

## PDF/Figure Visual Review

### Use Case Diagrams

Status: ⚠ Partially Addressed

The diagrams are readable and use use-case ovals. However, the internal labels say:

- Figure 1: Guest / Visitor Use Case Diagram
- Figure 2: Registered User Use Case Diagram
- Figure 3: Administrator Use Case Diagram

But the paper captions/list say:

- Figure 3
- Figure 3.1
- Figure 3.2

This mismatch can confuse the panel.

Fix either the image labels or the paper captions so they match.

Recommended image labels:

- Figure 3: Guest / Visitor Use Case Diagram
- Figure 3.1: Registered User Use Case Diagram
- Figure 3.2: Administrator Use Case Diagram

### DFD Level 0

Status: ⚠ Partially Addressed

The diagram is understandable. The system is centered, the user/admin are external entities, and APIs are connected. However, Firebase is shown like an external rectangle. This is acceptable if treated as an external database service, but the text should clarify this.

Recommended clarification:

> In the Level 0 DFD, Firebase, Google Maps API, and Gemini AI API are treated as external services connected to the Handumanan system.

### DFD Level 1

Status: ✓ Mostly Addressed

The Level 1 DFD is much better. It shows processes, data stores, Firebase, Google Maps API, Gemini AI API, and data flows. Add source note only.

### Class Diagram

Status: ✓ Fully Addressed

The class diagram is readable and includes user, profile, admin role, heritage site, review, favorite, itinerary, chatbot, planner, and routing service classes.

Minor improvement:

Change the note under RoutingService in the diagram if possible:

> Uses Google Maps services and backup route estimation to provide routes and directions.

## Final Fix Priority

Do these before final submission:

1. Fix use case diagram figure number mismatch.
2. Add source notes under every diagram and screenshot.
3. Replace/update the Test Plan table.
4. Add Objective-Feature-Test-Metric alignment table.
5. Fix remaining future tense in Ethics, Participants, and Setting.
6. Complete Appendix B and Appendix D.
7. Add URLs and access dates to web references.
8. Fix `Admin UI: .`, `Interface Design(Main Modules)`, `MetroCebu`, and participant spacing.
9. Add tests for travel modes, live tracking, open/closed status, chatbot scope restriction, and clear all stops.
10. Confirm whether Chapter 1 to 3 format is accepted by the adviser.

## Final Verdict

The paper is **defense-ready in content direction**, but **not yet clean enough for final submission**. The biggest remaining weakness is no longer the system description; it is the testing/evaluation evidence and formatting/document completeness.

If the items above are fixed, especially the test plan, alignment table, appendices, and figure source notes, the paper will be much stronger and more aligned with the current Handumanan system.

