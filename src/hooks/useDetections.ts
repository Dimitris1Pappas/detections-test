import { useEffect, useState } from "react";
import { fetchDetections } from "../api/detections";
import type { Detection } from "../types";

export function useDetections(search: string) {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetchDetections({ search })
      .then((data) => {
        setDetections(data);
        setLastUpdated(new Date());
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : "Could not load detections.");
      })
      .finally(() => setLoading(false));
  }, [search]);

  return { detections, setDetections, loading, error, lastUpdated };
}
