import { useState,useMemo } from "react";
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
  const [sortKey,setSortKey] = useState<SortKey>("time");
  const { detections, loading, error, lastUpdated } = useDetections(search);

  const sortedDetections = useMemo(() => {
    return [...detections].sort(comparators[sortKey]);

  },[detections, sortKey]);
  
  function handleSort(key: SortKey) {
    setSortKey(key);
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

        <DetectionsTable detections={sortedDetections} loading={loading} onSort={handleSort} />
      </main>
    </div>
  );
}
