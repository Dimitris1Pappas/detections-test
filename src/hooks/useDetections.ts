import { useEffect, useState } from "react";
import { fetchDetections } from "../api/detections";
import type { Detection, DetectionQuery } from "../types";

export function useDetections({
  search,
  turbineId,
  unacknowledgedOnly,
}: DetectionQuery) {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    fetchDetections(
      { search, turbineId, unacknowledgedOnly },
      { signal: controller.signal }
    )
      .then((data) => {
        if (controller.signal.aborted) return;

        setDetections(data);
        setLastUpdated(new Date());
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        setError(
          error instanceof Error
            ? error.message
            : "Could not load detections."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [search, turbineId, unacknowledgedOnly]);

  return {
    detections,
    setDetections,
    loading,
    error,
    lastUpdated,
  };
}