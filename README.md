# Smart Staff Request — Owner Flow

A React Native + Expo prototype for restaurant owners requesting temporary staff. Built for the supplied take-home assignment.

## Features
- Plain-language request entry with deterministic local parsing (English + a few Hinglish terms).
- Voice input for dictating a request, with the transcript inserted into the editable request field.
- Review screen with editable date, time and location; missing fields block matching.
- 20 seeded partners across Chinese Chef, Tandoor Chef, Pastry Chef, North Indian Chef, Continental Chef, Helper, Waiter, Deep Cleaning and Cleaner.
- Deterministic matching score: skill 40%, distance 20%, availability 25%, reliability 15%.
- Score explanations are generated from the same components used by the scorer.
- Confirmation and in-session request history.
- All 10 assignment prompts available from the home screen.
- Two focused automated tests.

## Run
1. Install Node.js LTS and Expo-compatible tooling.
2. `npm install`
3. `npm test`
4. To test the in-app **Speak request** button, run `npx expo run:android` or `npx expo run:ios` to build and launch the app with its native speech-recognition module. Expo Go does not include this module, but the rest of the app can still be tested there.

In Expo Go, tap the request field and use your phone keyboard's microphone to dictate text; this tests keyboard dictation, not the in-app speech-recognition button. In a development build, the app requests microphone and speech-recognition permissions when voice input is first used. Transcripts remain editable before the request is parsed.

## Environment variables
Copy `.env.example` to `.env` if you later add an LLM provider. Do not commit secrets. The current build intentionally does not send requests to an LLM API; it works without an API key.

## Scoring formula
`total = 0.40 * skill + 0.20 * distance + 0.25 * availability + 0.15 * reliability`
- Skill: 1.0 exact subcategory; 0.58 related role; 0 mismatch.
- Distance: `max(0, 1 - distanceKm / 15)`, using Haversine distance.
- Availability: 1 when date and time fit seeded availability; otherwise 0.
- Reliability: partner rating divided by 5.
Only partners with a compatible role and availability are shown. Explanations use those exact values.

## Test-request results (current deterministic parser)
These are expected observations from the current rule-based prototype, not claimed LLM accuracy. Run each prompt from the in-app test prompt list to verify interactively.
1. Clear — extracts Chinese Chef and Helper; date/time/location recognized. Multi-role quantity association is heuristic and should be manually reviewed.
2. Clear — extracts Tandoor Chef; date parsing recognizes the date text imperfectly; manual date correction expected.
3. Clear — extracts Deep Cleaning; quantity association may need correction; morning becomes 08:00.
4. Hinglish — extracts Waiter and evening start; the Hindi date range is not fully understood and needs manual correction.
5. Ambiguous — flags missing staff role, date and location; does not invent them.
6. Ambiguous — extracts Chinese Chef, Saturday and CP; asks for missing time.
7. Ambiguous — extracts Chef and “Next week”; asks for time and location.
8. Ambiguous — extracts Cook, budget ₹1,500/day, Lajpat Nagar, weekend; asks for time.
9. Edge case — parser only supports one main role in its current simple model; split the two bookings manually. This is a known limitation.
10. Edge case — cancellation intent is detected, but the demo does not mutate or cancel prior requests; pastry chef and Friday should be reviewed.

## Known limitations / design judgment
- The parser is deterministic and local rather than LLM-backed. This makes the demo reproducible and avoids exposing API keys, but has weaker date/range/multi-role understanding. Production should use an LLM with structured output, then validate every field with `BookingSchema`; never trust raw model output.
- The role field is shown as editable text, but edits to role names do not yet update the underlying typed role object. Change role/subcategory via a proper picker in the next iteration.
- Multi-role bookings are represented, but matching currently scores the first role only. A production flow should create a distinct staffing line item per role/date and show matches for each.
- Dates are labels, not normalized timezone-aware timestamps; actual availability requires a backend and a proper date picker.
- No real backend, auth, payments, push notifications, partner-side workflow, cancellation transaction, or offline sync.
- At 10,000 partners, fetching and scoring all records on-device will become slow and data will become stale. Use server-side geospatial queries, indexed availability, pagination, caching, and observable metrics; calculate final rank on the server.
- The cancellation-and-rebook prompt is surfaced as a warning rather than silently claiming to cancel anything.
- The AI usage note for submission should be edited to reflect the tools you actually used. Suggested honest note: “AI assistance was used to scaffold UI and tests; I reviewed and adjusted the implementation. I rejected using LLM-generated match explanations because the assignment requires explanations to be traceable to deterministic score components.”

## Four-minute demo outline
- 0:00–1:15 — Request 1, review extracted fields, edit if needed, view ranked partners, confirm.
- 1:15–2:15 — Request 5, show missing fields and the blocked confirmation path.
- 2:15–3:15 — Demonstrate correcting a wrong field on the review screen.
- 3:15–4:00 — Show request history, explain scoring and known limitations.

## Design note (summary)
The request schema separates staffing line items from shared booking context. Validation should happen after parsing, not only at the model boundary. Missing role/date/start time/location should trigger clarification; confidence alone is insufficient because a high overall confidence can hide one critical missing field. Review keeps fields visible and editable before matching. Matching uses explicit weighted components and explanations derived from the same values. Rejected approach: asking an LLM to write partner explanations, because it could hallucinate reasons inconsistent with ranking. Production architecture would separate parser, validator, availability service, matching service, booking state machine, and notification adapter.
