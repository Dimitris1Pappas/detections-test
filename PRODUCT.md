The detection detail page is designed primarily for wind farm operators who need to quickly determine whether the detection system responded appropriately and whether further action is required.
The page prioritizes two questions:
Did the turbine stop in time? The shutdown summary compares the recorded rotor standstill timestamp against the bird's closest approach. Missing shutdown confirmation and stops recorded after closest approach are highlighted for investigation.
Does the operator need to act? The action summary highlights unacknowledged detections and potential shutdown issues.
These decisions are presented before the detailed detection information to minimize the time needed to assess an event.
Information hierarchy and trade-offs.
The first screen includes the detected species, turbine, timestamp, identification confidence, closest approach, conservation status, and permit relevance.
Technical information, including the shutdown sequence, camera status, environmental conditions, and audit history, is available in an expandable section for operators and environmental officers who need additional context.
Low level implementation details such as firmware versions, raw tracking coordinates, and pipeline metadata are omitted from the primary view because they do not directly support the operator's immediate decisions.
The shutdown timing assessment uses closest approach as a practical reference point. 
This is not a validated safety SLA; a production system would need an agreed operational definition of a timely shutdown, potentially based on the moment the bird enters the configured risk zone.
A lightweight URL-based navigation approach was chosen to avoid introducing an additional dependency for a small application.
