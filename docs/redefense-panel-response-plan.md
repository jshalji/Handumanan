# Re-defense Panel Response Plan

Target re-defense date: June 2, 2026

This document maps the panel comments to concrete system changes, objective metrics, and concise defense answers.

## 1. Objective Metrics for Itinerary Planner

Panel question:

> What objective metrics prove that your itinerary planner outperforms a non-AI baseline routing?

### Baselines to Compare

- Baseline A: Manual/original selected order.
- Baseline B: Nearest-neighbor route ordering from the user's starting location.
- Baseline C: Google Routes API optimized waypoint order.
- Proposed AI Planner: AI-selected route that considers category diversity, available time, must-visit priority, and route distance.

### Metrics

- Total route distance in kilometers.
- Estimated travel time in minutes.
- Number of valid stops fitted within available time.
- Duplicate stop count.
- Category diversity count.
- Must-visit coverage count.
- User satisfaction score from evaluation questionnaire.
- Generation latency in milliseconds.

### Defense Answer

The itinerary planner will be evaluated against non-AI baselines using measurable criteria such as total route distance, estimated travel time, number of stops fitted within the user's available time, duplicate-stop count, category diversity, and user satisfaction. We do not claim that AI is always shorter than optimized routing. Instead, our claim is that the AI planner improves the user-facing itinerary by balancing route efficiency with cultural relevance, visit duration, and preference matching. Google Routes API optimized waypoint order can serve as the routing baseline, while the AI planner adds preference-aware selection and explanation.

## 2. Chatbot Hallucination Detection and Mitigation

Panel question:

> How do you detect and mitigate hallucinated chatbot answers on heritage facts?

### Controls

- The chatbot should answer from the Handumanan heritage-site corpus first.
- Each site record should include source fields such as `sources`, `sourceType`, `lastVerifiedAt`, and `verificationStatus`.
- The prompt should instruct the model not to invent facts outside the directory.
- For facts not found in the source corpus, the chatbot should say that the information is not verified or not available.
- Complex AI answers should include source references or site IDs used.
- Fallback local responses should be used when Gemini/API calls fail.

### Defense Answer

We mitigate hallucination by grounding chatbot responses on the Handumanan directory and validated Firestore records. The chatbot is instructed not to invent heritage facts outside the available corpus. If the requested information is missing or uncertain, the chatbot should respond that the information is not verified rather than guessing. For future improvement, each heritage record will include source URLs, verification status, last verified date, and admin approval history so chatbot answers can be traced back to source records.

## 3. Heritage Data Source-of-Truth Pipeline

Panel question:

> What is your authoritative source-of-truth pipeline for heritage data validation and updates?

### Proposed Pipeline

1. Candidate record is collected from official or reliable references.
2. Record is entered into Firestore as `Draft` or `Needs Verification`.
3. Admin checks required fields: name, city, category, coordinates, overview, significance, visiting hours, image/source attribution.
4. Admin attaches source references and verification date.
5. Verified records are marked `Published`.
6. Public directory, map, chatbot, and itinerary planner read only active/published records.
7. Updates create a new timestamp and preserve source notes for audit.

### Recommended Record Fields

- `officialName`
- `displayName`
- `city`
- `category`
- `coordinates`
- `overview`
- `significance`
- `visitingHours`
- `sources`
- `sourcePriority`
- `verificationStatus`
- `lastVerifiedAt`
- `verifiedBy`
- `conflictNotes`
- `updatedAt`

### Defense Answer

The authoritative source of truth is the curated heritage-site database managed through the admin dashboard and Firestore. Built-in site data provides the initial directory, while admin-managed Firestore records can update, verify, hide, or extend site records. The proposed validation pipeline uses source references, verification status, last verified date, and admin approval before a record becomes public.

## 4. Conflicting Historical Accounts

Panel question:

> How do you handle conflicting historical accounts across sources?

### Policy

- Prioritize official sources first: LGU/tourism office, NCCA/NHCP, museum or site official pages.
- Use academic/publication sources next.
- Use trusted blogs or travel pages only as supplementary context.
- Do not merge conflicting claims into one unsupported statement.
- Present neutral wording when accounts differ.
- Add `conflictNotes` for admin review.

### Defense Answer

When sources conflict, the system should not simply choose the most convenient version. We prioritize official and institutional sources, then academic references, and use blogs only as supplementary context. If accounts differ, the record can use neutral wording such as "some sources state..." or mark the item for verification. The admin dashboard can store conflict notes so the record can be reviewed before publication.

## 5. Latency Budgets

Panel question:

> What are your latency budgets for search, route generation, and chatbot response?

### Target Budgets

| Feature | Target | Fallback Threshold |
| --- | ---: | ---: |
| Local search/filter | under 300 ms | 1 s |
| Firestore search/record fetch | under 1 s | 3 s |
| Map marker rendering | under 1.5 s | 3 s |
| Route generation | under 3 s | 8 s |
| AI itinerary generation | under 8 s | 15 s |
| Chatbot local response | under 500 ms | 1 s |
| Chatbot AI response | under 8 s | 15 s |

### Defense Answer

We define latency budgets per feature because not all operations have the same complexity. Local search should respond almost immediately, ideally under 300 milliseconds. Route generation depends on an external routing API, so the target is under 3 seconds with fallback after a longer timeout. AI chatbot and itinerary generation are expected to take longer, so the target is under 8 seconds, with local fallback if the AI service is unavailable or too slow.

## 6. API Outage Behavior

Panel question:

> How does your system behave under API outage of routing or geolocation providers?

### Expected Behavior

- If geolocation is denied or unavailable, browsing, search, site details, and manual itinerary generation remain usable.
- If route API fails, the system should still show selected stops and map markers.
- If Google Routes API fails, use the local distance estimate or previous fallback route logic.
- If Gemini fails, use directory-based chatbot and itinerary fallback.
- The UI should show a clear message instead of crashing.

### Defense Answer

The system is designed to degrade gracefully. If geolocation fails, users can still browse sites and generate a non-location-based balanced trip. If routing fails, the selected stops and map markers remain visible, and the system can show an estimated route or ask the user to try again. If the AI service fails, the chatbot uses local directory-based fallback responses. The goal is to avoid a total system failure when one external provider is unavailable.

## 7. Privacy Controls and Retention

Panel question:

> What privacy controls and retention periods apply to location and user behavior data?

### Current/Proposed Privacy Rules

- Browser location is permission-based.
- Live location is used in memory for map/navigation and should not be stored by default.
- Saved itineraries are stored only when the user chooses to save.
- Reviews and ratings are tied to authenticated users where required.
- User can sign out and stop location sharing by denying browser permission or closing navigation.
- Admin access is role-restricted.

### Recommended Retention Statement

- Live GPS coordinates: not stored; session memory only.
- Unsaved draft itinerary in browser local storage: until cleared by user or browser.
- Saved itineraries/favorites/reviews: retained until user deletion or admin/institutional retention review.
- Evaluation questionnaire responses: retained only for academic validation period required by the institution, then deleted or anonymized.
- Logs/API diagnostics: limited to deployment/provider defaults and not used for participant profiling.

### Defense Answer

Location access is controlled by the browser permission prompt. Live GPS coordinates are used only during active navigation and are not stored by default. User behavior such as saved favorites, saved trips, and reviews is stored only when the user performs those actions. For research data, responses should be anonymized or retained only for the academic validation period required by the institution.

## 8. Effective Use of Firebase Data by AI

Panel question:

> How does your AI use the data on Firebase effectively?

### Data Usage

- Firestore heritage records extend or override the built-in directory.
- Active Firestore records are merged into the chatbot and itinerary context.
- Inactive records are excluded from public answers and planning.
- Saved favorites and recent itinerary summaries can personalize chatbot responses for signed-in users.
- Firestore updates should automatically affect directory, map, chatbot, and itinerary planning.

### Defense Answer

The AI does not answer from a blank prompt. It receives structured heritage-site data from the system, including Firestore-managed records, site names, categories, cities, coordinates, ratings, tags, and descriptions. This allows the chatbot and itinerary planner to recommend only active records from the directory. User-specific data such as favorites or recent itineraries can also be passed as context to personalize suggestions, while still respecting privacy.

## Google Maps Migration Plan

Panel instruction:

> Use Google Maps and the provided Google Maps AI.

### Proposed Google Maps Platform Services

- Maps JavaScript API: display Google map tiles and markers.
- Routes API: calculate travel distance/time and optimize waypoint order.
- Places API: validate places by Place ID and retrieve place information where applicable.
- Places API AI-powered summaries: optional supporting summaries with proper "Summarized with Gemini" attribution where returned.
- Grounding with Google Maps / Grounding Lite: optional AI grounding for location-aware answers, while heritage facts still remain controlled by the Handumanan validated dataset.

### Important Design Rule

Google Maps AI can support place context and map grounding, but Handumanan should not treat AI summaries as the only authoritative source for historical facts. The authoritative heritage record should remain the validated Firestore/admin dataset.

### Defense Answer

For the re-defense, we will align the mapping layer with Google Maps Platform. Google Maps will provide map visualization, route calculation, and optimized waypoint order. Google Maps AI features can support place context and grounded location-aware responses, but verified historical content remains controlled by the Handumanan source-of-truth pipeline. This separation prevents AI-generated summaries from replacing validated heritage records.

## Re-defense Checklist

- Add an evaluation table comparing AI planner vs baseline routes.
- Add source/verification fields to the heritage data model or documentation.
- Add conflict-handling policy.
- Add latency-budget table.
- Add API outage behavior table.
- Add privacy retention table.
- Explain Firebase-to-AI data flow.
- Prepare Google Maps Platform migration explanation and, if possible, implementation.
