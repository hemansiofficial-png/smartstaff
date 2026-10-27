# Regression Test Report

## Environment and execution
- TypeScript syntax/transpile check: **PASS** for `App.tsx`, parser, matcher, partner data, test prompt data, and test file.
- Runtime smoke/regression harness against transpiled parser/matcher: **PASS** for core invariants.
- Partner seed count: **PASS**, 20 records.
- Matching: **PASS**, returns at most 5 available matches, sorted descending, with score-component explanation text.
- Jest suite: **NOT RUN**. Dependency installation timed out in this environment, so `npm test` has not been verified end-to-end. Run `npm install` then `npm test` locally.

The runtime harness used a minimal Zod shim solely to exercise parser and matching paths; it does **not** prove Zod schema validation or a full Expo build. The dedicated Jest test file contains the two assignment-required tests.

## Ten-prompt regression sweep

| # | Result | Notes |
|---|---|---|
| 1 | Pass with caveat | Chinese Chef ×2, Helper ×1; Saturday, 18:00–23:00, Connaught Place. |
| 2 | Pass with caveat | Tandoor Chef ×1; 25th October label, 11:00–16:00, Rajouri Garden. Date is still a label, not a normalized date object. |
| 3 | Pass with caveat | Deep Cleaning ×3; Sunday morning interpreted as 08:00 start; end time is not inferred. |
| 4 | Partial | Waiter ×1, date label “28 se 30 October”, 18:00 start, Karol Bagh. Hinglish range is not normalized into start/end dates. |
| 5 | Pass | No role or location invented; missing staff role and location are flagged. “Tomorrow evening” becomes 18:00. |
| 6 | Pass | Chinese Chef detected, Saturday and CP recognized; missing start time is flagged. |
| 7 | Pass | Chef and “Next week” recognized; missing time and location are flagged. |
| 8 | Pass with caveat | Cook, ₹1,500/day, Lajpat Nagar, weekend recognized; missing time is flagged. |
| 9 | Partial | Two role lines detected (Cleaner ×1 and Chef ×2) at Saket, but separate Saturday/Sunday dates are not attached to each role. Matching currently uses the first role only. |
| 10 | Partial | Pastry Chef and Friday recognized; cancel-and-book intent flagged. Existing request cancellation is not implemented; missing time/location are flagged. |

## Fixes made during regression
- Prevented a generic “Chef” duplicate when a specific chef subcategory is detected.
- Prevented “Deep Cleaning” from also producing a duplicate generic “Cleaner” role.
- Correctly extracted “crew of 3” for the deep-cleaning prompt.

## Known blockers before production
- Replace the rule-based parser with structured LLM parsing plus validation, or expand deterministic coverage substantially.
- Replace date labels with normalized date/time fields and a date picker.
- Use proper role/subcategory pickers so edited role text updates the booking model.
- Model multi-role bookings as separate line items with separate dates and match partners per line item.
- Add a real API/backend before treating a confirmation as a real booking.
