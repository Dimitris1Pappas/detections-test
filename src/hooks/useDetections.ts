import { useEffect, useState } from "react";
import { fetchDetections } from "../api/detections";
import type { Detection } from "../types";

export function useDetections(search: string) {
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

useEffect(() => {
      const controller = new AbortController();
      
      setLoading(true);
      setError(null);

      fetchDetections({ search}, { signal: controller.signal })
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
        if(!controller.signal.aborted) {
          setLoading(false);
        }
      });

    return () => controller.abort();
  },[search]); 

  return { detections, loading, error, lastUpdated };
}