import { useEffect, useState } from "react";
import { fetchTurbines } from "../api/detections";
import type { Turbine } from "../types";

export function useTurbines() {
  const [turbines, setTurbines] = useState<Turbine[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchTurbines({ signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) {
          setTurbines(data);
        }
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;

        setError(
          error instanceof Error
            ? error.message
            : "Could not load turbines."
        );
      });

    return () => controller.abort();
  }, []);

  return { turbines, error };
}