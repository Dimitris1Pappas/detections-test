import { useState } from "react";
import { DetectionsTable, type SortKey } from "./components/DetectionsTable";
import { Header } from "./components/Header";
import { SearchBox } from "./components/SearchBox";
import { useDetections } from "./hooks/useDetections";
import type { Detection } from "./types";

const comparators: Record<SortKey, (a: Detection, b: Detection) => number> = {
  time: (a, b) => b.detectedAt.localeCompare(a.detectedAt),
  confidence: (a, b) => b.confidence - a.confidence,
};

export function App() {
  const [search, setSearch] = useState("");
  const { detections, setDetections, loading, error, lastUpdated } = useDetections(search);

  function handleSort(key: SortKey) {
    detections.sort(comparators[key]);
    setDetections(detections);
  }

  return (
    <div className="shell">
      <Header detections={detections} lastUpdated={lastUpdated} />

      <main className="main">
        <div className="toolbar">
          <SearchBox value={search} onChange={setSearch} />
          {/* Task 3: turbine and review filters go here */}
        </div>

        {error && (
          <p role="alert" className="alert">
            {error}
          </p>
        )}

        <DetectionsTable detections={detections} loading={loading} onSort={handleSort} />
      </main>
    </div>
  );
}
