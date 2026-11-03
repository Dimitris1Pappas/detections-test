For Task 1:
Multiple overlapping search requests could resolve out of order, allowing stale responses to overwrite newer results. Fixed by cancelling previous requests using AbortController and preventing aborted requests from updating component state.

For Task 2:
The sorting function was changing the original detections array, so React didn't always detect the update. Also, the selected sort was lost when new search results loaded.
I fixed this by storing the sort option in state and using useMemo to sort a copy of the detections. This keeps sorting consistent across searches and filter changes.

For Task 3:
I added turbine and unacknowledged-only filters alongside the existing search. Turbine options come from fetchTurbines(), and all filters work together through fetchDetections().The parent manages the filter state, while the filter component stays reusable. AbortController prevents outdated responses, and sorting works separately from filtering.I left URL persistence out for now to focus on the main functionality within the time limit.All three filters work together. The search matches detections by keyword, the turbine filter limits results to a specific turbine, and the unacknowledged-only filter shows only detections that haven't been acknowledged. When multiple filters are active, results must match all of them. Sorting is applied separately to the filtered results.

For Task 4:
Implemented optimistic acknowledgement so operators receive immediate feedback without waiting for the API response.Used a separate optimistic state layer to prevent background fetches and filter changes from overwriting pending acknowledgement updates.Added a synchronous ref-based guard to prevent duplicate requests for the same detection.On failure, the optimistic change is rolled back and an accessible error message is displayed using role="alert".The displayed unacknowledged count updates immediately and is restored if the request fails.Trade-off: The header count currently reflects the filtered detection list, rather than a global unacknowledged total. A production implementation would ideally use a dedicated server-provided aggregate for the overall count.

Extra Comments from my side:

Within the three-hour time frame, I was able to complete Tasks 1 through 5. Unfortunately, I did not have enough time to implement Task 6, which focuses on optional automated tests.

Given additional time, my next priority would be to add automated tests to validate the implemented functionality and prevent regressions. Beyond that, I would focus on refining the UI/UX to make the application more intuitive, visually organized, and easier for operators to identify potential issues at a glance.

Some of the improvements I would consider include:

Layout and navigation: Centering the "Detections" heading, increasing the width of the search bar, and positioning the Turbine and Unacknowledged only filters directly beneath it to create a clearer visual hierarchy.

Visual organization: Giving the turbine information section a distinct background color to separate it from the rest of the interface and improve readability.

Turbine identification: Assigning a consistent, distinct color to each turbine ID, making it easier for operators to recognize and track detections associated with the same turbine.

Confidence indicators: Introducing color-coded confidence values to help operators quickly interpret detection confidence. For example, red for values below 25%, orange for 25–49%, green for 50–75%, and blue for values above 75%. These colors would represent detection confidence rather than operational severity.

Key metrics visibility: Increasing the font size and visual prominence of the "Awaiting Review" and "Curtailments" counters so operators can identify important operational metrics more quickly.

Wind farm location: Displaying the wind farm's location in a more prominent position, using bold typography to make this contextual information immediately visible.

Overall, my goal with these improvements would be to create a clearer visual hierarchy, reduce the time required to interpret detection data, and help operators identify situations that may require further attention.

Given the limited time available, I prioritized implementing the core functionality and addressing the reported bugs before introducing additional UI refinements.