import { useMemo, useState, useRef } from "react";
import { DetectionsTable, type SortKey } from "./components/DetectionsTable";
import { DetectionFilters } from "./components/DetectionFilters";
import { Header } from "./components/Header";
import { SearchBox } from "./components/SearchBox";
import { useDetections } from "./hooks/useDetections";
import { useTurbines } from "./hooks/useTurbines";
import type { Detection } from "./types";
import { acknowledgeDetection } from "./api/detections";
import { DetectionPage } from "./components/DetectionPage";
import { useDetectionNavigation } from "./hooks/useDetectionNavigation";

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
  const {
  detectionId,
  openDetection,
  closeDetection,
} = useDetectionNavigation();

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

const [optimisticIds, setOptimisticIds] =
  useState<Set<string>>(() => new Set());

const displayedDetections = useMemo(() => {
  return detections
    .map((detection) => ({
      ...detection,
      acknowledged:
        detection.acknowledged ||
        optimisticIds.has(detection.id),
    }))
    .filter(
      (detection) =>
        !unacknowledgedOnly || !detection.acknowledged
    );
}, [detections, optimisticIds, unacknowledgedOnly]);

const sortedDetections = useMemo(() => {
  return [...displayedDetections].sort(comparators[sortKey]);
}, [displayedDetections, sortKey]);


  // const [optimisticIds, setOptimisticIds] =
  // useState<Set<string>>(() => new Set());

const [pendingIds, setPendingIds] =
  useState<Set<string>>(() => new Set());

const pendingRef = useRef(new Set<string>());

const [acknowledgeError, setAcknowledgeError] =
  useState<string | null>(null);

  function handleSort(key: SortKey) {
    setSortKey(key);
  }
async function handleAcknowledge(id: string) {
  
  if (pendingRef.current.has(id) || optimisticIds.has(id)) {
    return;
  }

  pendingRef.current.add(id);

  setPendingIds((prev) => new Set(prev).add(id));
  setOptimisticIds((prev) => new Set(prev).add(id));
  setAcknowledgeError(null);

  try {
    await acknowledgeDetection(id);
  } catch (error) {
    
    setOptimisticIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    setAcknowledgeError(
      error instanceof Error
        ? error.message
        : "Could not acknowledge the detection."
    );
  } finally {
    pendingRef.current.delete(id);

    setPendingIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }
}

  if (detectionId !== null) {
    return (
      <div className="shell">
        <DetectionPage
          detectionId={detectionId}
          onBack={closeDetection}
        />
      </div>
    );
  }

  return (
    <div className="shell">
      <Header
        detections={displayedDetections}
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


        {acknowledgeError && (
        <p role="alert" className="alert">
        {acknowledgeError}
        </p>
        )}


        <DetectionsTable
        detections={sortedDetections}
        loading={loading}
        onSort={handleSort}
        onAcknowledge={handleAcknowledge}
        pendingIds={pendingIds}
        onOpenDetection={openDetection}
/>
      </main>
    </div>
  );
}