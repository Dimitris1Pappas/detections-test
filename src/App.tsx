import { useMemo, useState, useRef } from "react";
import { DetectionsTable, type SortKey } from "./components/DetectionsTable";
import { DetectionFilters } from "./components/DetectionFilters";
import { Header } from "./components/Header";
import { SearchBox } from "./components/SearchBox";
import { useDetections } from "./hooks/useDetections";
import { useTurbines } from "./hooks/useTurbines";
import type { Detection } from "./types";

const comparators: Record<
  SortKey,
  (a: Detection, b: Detection) => number
> = {
  time: (a, b) => b.detectedAt.localeCompare(a.detectedAt),
  confidence: (a, b) => b.confidence - a.confidence,
};

export function App() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("time");

  const [turbineId, setTurbineId] = useState("");
  const [unacknowledgedOnly, setUnacknowledgedOnly] =
    useState(false);

  const { turbines, error: turbinesError } = useTurbines();

  const { detections, loading, error, lastUpdated } =
    useDetections({
      search,
      turbineId,
      unacknowledgedOnly,
    });

  const sortedDetections = useMemo(() => {
    return [...detections].sort(comparators[sortKey]);
  }, [detections, sortKey]);

  function handleSort(key: SortKey) {
    setSortKey(key);
  }

  return (
    <div className="shell">
      <Header
        detections={detections}
        lastUpdated={lastUpdated}
      />

      <main className="main">
        <div className="toolbar">
          <SearchBox
            value={search}
            onChange={setSearch}
          />

          <DetectionFilters
            turbines={turbines}
            turbineId={turbineId}
            onTurbineChange={setTurbineId}
            unacknowledgedOnly={unacknowledgedOnly}
            onUnacknowledgedChange={
              setUnacknowledgedOnly
            }
          />
        </div>

        {turbinesError && (
          <p role="alert" className="alert">
            {turbinesError}
          </p>
        )}

        {error && (
          <p role="alert" className="alert">
            {error}
          </p>
        )}

        <DetectionsTable
          detections={sortedDetections}
          loading={loading}
          onSort={handleSort}
        />
      </main>
    </div>
  );
}