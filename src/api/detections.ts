/**
 * Mock API for the detections console.
 *
 * Treat this file as the backend: you may read it to understand the
 * contract, but do not change its behaviour to make your task easier.
 * Latency and failures are intentional.
 */
import type { Detection, DetectionQuery, DetectionReport, Turbine } from "../types";
import { createReport, type Review } from "./reports";
import { TURBINES, createSeedDetections } from "./seed";

let store: Detection[] = createSeedDetections();
/** Who acknowledged what during this session */
let reviews = new Map<string, Review>();

/** The operator signed in to the console */
const CURRENT_OPERATOR = "you";

/** Test hooks. Not part of the "real" API. */
export const mockServer = {
  /** Probability (0..1) that acknowledgeDetection fails. */
  acknowledgeFailureRate: 0.25,
  /** Multiplier for all latencies. Tests can set this to 0. */
  latencyFactor: 1,
  reset() {
    store = createSeedDetections();
    reviews = new Map();
    this.acknowledgeFailureRate = 0.25;
    this.latencyFactor = 1;
  },
};

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason);
    const timer = setTimeout(resolve, ms * mockServer.latencyFactor);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(signal.reason);
      },
      { once: true },
    );
  });
}

const clone = <T>(value: T): T => structuredClone(value);

/**
 * GET /detections
 *
 * Supports free-text search (species or turbine id, case-insensitive),
 * a turbine filter and an "unacknowledged only" filter.
 * Results are ordered newest first.
 *
 * Broad queries are slower than narrow ones, as on the real backend.
 */
export async function fetchDetections(
  query: DetectionQuery = {},
  options: { signal?: AbortSignal } = {},
): Promise<Detection[]> {
  const search = (query.search ?? "").trim().toLowerCase();
  const latency = 250 + (8 - Math.min(search.length, 8)) * 220 + Math.random() * 40;
  await wait(latency, options.signal);

  return clone(
    store.filter((d) => {
      if (search && !`${d.species} ${d.turbineId}`.toLowerCase().includes(search)) return false;
      if (query.turbineId && d.turbineId !== query.turbineId) return false;
      if (query.unacknowledgedOnly && d.acknowledged) return false;
      return true;
    }),
  );
}

/** GET /turbines */
export async function fetchTurbines(options: { signal?: AbortSignal } = {}): Promise<Turbine[]> {
  await wait(300, options.signal);
  return clone(TURBINES);
}

/**
 * POST /detections/:id/acknowledge
 *
 * Slow, and fails some of the time (see mockServer.acknowledgeFailureRate).
 * Returns the updated detection.
 */
export async function acknowledgeDetection(id: string): Promise<Detection> {
  await wait(700 + Math.random() * 500);

  if (Math.random() < mockServer.acknowledgeFailureRate) {
    throw new Error("Could not acknowledge the detection. The server did not respond in time.");
  }

  const detection = store.find((d) => d.id === id);
  if (!detection) throw new Error(`Detection ${id} not found.`);
  if (detection.acknowledged) throw new Error(`Detection ${id} is already acknowledged.`);

  detection.acknowledged = true;
  reviews.set(id, { by: CURRENT_OPERATOR, at: new Date().toISOString() });
  return clone(detection);
}

/**
 * GET /detections/:id/report
 *
 * Everything the system recorded about one detection: identification, flight
 * path, the shutdown sequence, weather, turbine and camera state, and the
 * audit log. Fails if the detection does not exist.
 */
export async function fetchDetectionReport(
  id: string,
  options: { signal?: AbortSignal } = {},
): Promise<DetectionReport> {
  await wait(450 + Math.random() * 300, options.signal);

  const detection = store.find((d) => d.id === id);
  if (!detection) throw new Error(`Detection ${id} not found.`);

  return clone(createReport(detection, reviews.get(id)));
}
