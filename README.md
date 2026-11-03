# Detections console: React exercise

This is a small operator console for a wind farm's bird-detection system.
Cameras on each turbine detect birds; when a bird gets too close, the system
curtails (stops) the turbine. Operators use this screen to review detections
and to check that the system did its job.

The app works, but it has bugs and some features are missing. Please work on it
as you would on a real codebase that is already in production.

**Time:** aim for about 2 hours. You don't have to finish everything. If you
run out of time, stop and write down what you would do next. We care more about
how you work than about how much you finish.

## Setup

Requires Node.js 20 or newer.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # Vitest + Testing Library
npm run typecheck
```

## Ground rules

- `src/api/` is the backend. Read it to understand the contract, but don't
  change how it behaves. Its latency and failures are intentional.
- You may add libraries if you can explain why you chose them.
- You may use the tools you normally use, including AI assistants. Be ready to
  explain and defend every line you hand in.
- Please keep these names, so we can check behaviour automatically:
  the "Search" field, the "Details for …" row toggles, a select labelled
  "Turbine", a checkbox labelled "Unacknowledged only", buttons named
  "Acknowledge", the `unacknowledged-count` test id, the `?detection=<id>`
  link and the `detection-page` test id (Task 5), and `role="alert"` for error
  messages and for anything the operator must act on.
- Commit as you go. We read the history.

## Tasks

### 1. Bug: search shows the wrong results

Report from an operator:

> When I type "kite" quickly, the table sometimes ends up showing kestrels and
> other birds, not just kites. If I type slowly it's fine.
**
Multiple overlapping search requests could resolve out of order, allowing stale responses to overwrite newer results. Fixed by cancelling previous requests using AbortController and preventing aborted requests from updating component state.
**
### 2. Bug: sorting does nothing

Report from an operator:

> Clicking "Confidence" does nothing. Sometimes the table suddenly re-orders
> later, when I start typing.

Expected: "Confidence" sorts highest first, "Time" sorts newest first, and the
chosen sort stays applied when the search or filters change.
**
The sorting function was changing the original detections array, so React didn't always detect the update. Also, the selected sort was lost when new search results loaded.
I fixed this by storing the sort option in state and using useMemo to sort a copy of the detections. This keeps sorting consistent across searches and filter changes.
**
### 3. Feature: filters

Add two filters next to the search:

- A **Turbine** select. Options come from `fetchTurbines()`, with "All turbines"
  as the default.
- An **Unacknowledged only** checkbox.

Filters combine with the search and are applied by the backend
(`fetchDetections` already accepts `turbineId` and `unacknowledgedOnly`).

Bonus: keep the search and filters in the URL, so a refresh or a shared link
shows the same view.

**
I added turbine and unacknowledged-only filters alongside the existing search. Turbine options come from fetchTurbines(), and all filters work together through fetchDetections().The parent manages the filter state, while the filter component stays reusable. AbortController prevents outdated responses, and sorting works separately from filtering.I left URL persistence out for now to focus on the main functionality within the time limit.All three filters work together. The search matches detections by keyword, the turbine filter limits results to a specific turbine, and the unacknowledged-only filter shows only detections that haven't been acknowledged. When multiple filters are active, results must match all of them. Sorting is applied separately to the filtered results.
**
### 4. Feature: acknowledge a detection

In the Review column, unacknowledged detections should have an
**Acknowledge** button that calls `acknowledgeDetection(id)`.

- The row should update straight away; operators shouldn't wait for the
  request (it takes around a second).
- The same detection must not be submitted twice.
- The request fails about a quarter of the time. When it fails, the row goes
  back to unacknowledged and the operator sees a clear message.
- The "Awaiting review" number in the header stays correct.

**
Implemented optimistic acknowledgement so operators receive immediate feedback without waiting for the API response.Used a separate optimistic state layer to prevent background fetches and filter changes from overwriting pending acknowledgement updates.Added a synchronous ref-based guard to prevent duplicate requests for the same detection.On failure, the optimistic change is rolled back and an accessible error message is displayed using role="alert".The displayed unacknowledged count updates immediately and is restored if the request fails.Trade-off: The header count currently reflects the filtered detection list, rather than a global unacknowledged total. A production implementation would ideally use a dedicated server-provided aggregate for the overall count.

**
### 5. Feature: detection page

From the operations lead:

> When I click a detection, I'd like to see everything we know about it on its
> own page. Most of the time I only need two answers, and fast: did the turbine
> stop in time, and is there anything I need to do? Now and then the
> environmental officer asks me about one detection, and then I need the
> details. I often paste a link to a detection into our team chat.

- `fetchDetectionReport(id)` returns everything the system recorded about a
  detection (see `DetectionReport` in `src/types.ts`). It is more than the
  page needs. Deciding what to show first, what to put one click away and what
  to leave out is part of the task.
- The page opens from `/?detection=<id>`, so a link to it can be shared.
- Operators can go back to the list without losing their search and filters.
- How the operator gets to the page (a router, a query parameter, a panel) and
  how the page looks are up to you.

Plan for about 40 minutes. A small page with clear decisions beats a page that
shows everything. Explain your decisions in `PRODUCT.md` (see below).

### 6. Optional: tests

Add at least one test for something you changed. `mockServer` in
`src/api/detections.ts` lets tests remove latency and control failures.

### If you notice anything else

If you find other problems, fix them or write them down. Both count.

## What to hand in

A git repository (link or zip) with:

- a `NOTES.md` that covers:
  - for each bug, what caused it, in a sentence or two;
  - any decisions or trade-offs you made;
  - what you would do next with more time.
- a `PRODUCT.md` for Task 5. Half a page is enough:
  - who you designed the page for, and which questions it answers first;
  - what you left out or put out of the way, and why;
  - one thing you would want to ask a real operator before going further.
