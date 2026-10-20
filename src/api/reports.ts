import type { Detection, DetectionReport, IucnStatus } from "../types";
import { mulberry32 } from "./seed";

/** Shutdown rule configured for this wind farm. */
const SHUTDOWN_RULE = { distanceMeters: 180, confidenceAbove: 0.7 };

/** Hub at 95 m with a 116 m rotor. */
const ROTOR_HEIGHT = { min: 37, max: 153 };

/** Species named in the wind farm's environmental permit. */
const PERMIT_SPECIES = new Set([
  "Griffon Vulture",
  "Egyptian Vulture",
  "Golden Eagle",
  "White-tailed Eagle",
  "Lesser Kestrel",
]);

/** IUCN Red List categories. Species not listed are Least Concern. */
const IUCN: Record<string, IucnStatus> = { "Egyptian Vulture": "EN" };

/** Species the model most often confuses with each other. */
const LOOKALIKES: Record<string, [string, string]> = {
  "Griffon Vulture": ["Golden Eagle", "White-tailed Eagle"],
  "Egyptian Vulture": ["Booted Eagle", "Short-toed Snake Eagle"],
  "Golden Eagle": ["White-tailed Eagle", "Griffon Vulture"],
  "Booted Eagle": ["Common Buzzard", "Black Kite"],
  "Short-toed Snake Eagle": ["Common Buzzard", "Booted Eagle"],
  "White-tailed Eagle": ["Golden Eagle", "Griffon Vulture"],
  "Red Kite": ["Black Kite", "Common Buzzard"],
  "Black Kite": ["Red Kite", "Common Buzzard"],
  "Common Buzzard": ["Booted Eagle", "Black Kite"],
  "Common Kestrel": ["Lesser Kestrel", "Eurasian Hobby"],
  "Lesser Kestrel": ["Common Kestrel", "Eurasian Hobby"],
  "Eurasian Hobby": ["Common Kestrel", "Lesser Kestrel"],
};

const WINGSPAN_CM: Record<string, number> = {
  "Griffon Vulture": 260,
  "Egyptian Vulture": 160,
  "Golden Eagle": 205,
  "Booted Eagle": 120,
  "Short-toed Snake Eagle": 180,
  "White-tailed Eagle": 225,
  "Red Kite": 165,
  "Black Kite": 150,
  "Common Buzzard": 120,
  "Common Kestrel": 75,
  "Lesser Kestrel": 68,
  "Eurasian Hobby": 80,
};

const REVIEWERS = ["e.papadaki", "g.nikolaou", "m.karras"];

/** Problems recorded in the site log on 9 October 2026. */
const SITE_LOG = {
  weatherStationOffline: { from: "2026-10-09T09:35:00Z", to: "2026-10-09T10:20:00Z" },
  scadaLinkDown: { turbineId: "T03", from: "2026-10-09T12:10:00Z", to: "2026-10-09T12:20:00Z" },
  cameraDegraded: {
    cameraId: "T01-CAM1",
    from: "2026-10-09T06:00:00Z",
    to: "2026-10-09T07:45:00Z",
    detail: "Lens condensation",
  },
};

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;

export type Review = { by: string; at: string };

/**
 * Builds the full report for a detection. Deterministic per detection id,
 * so every candidate sees the same data.
 */
export function createReport(detection: Detection, sessionReview?: Review): DetectionReport {
  const rand = mulberry32(hash(detection.id));
  const between = (min: number, max: number) => min + rand() * (max - min);
  const detectedMs = Date.parse(detection.detectedAt);
  const after = (seconds: number) => new Date(detectedMs + Math.round(seconds * 1000)).toISOString();
  const during = (window: { from: string; to: string }) =>
    detectedMs >= Date.parse(window.from) && detectedMs < Date.parse(window.to);

  const weatherOffline = during(SITE_LOG.weatherStationOffline);
  const scadaDown = detection.turbineId === SITE_LOG.scadaLinkDown.turbineId && during(SITE_LOG.scadaLinkDown);
  const cameraDegraded = detection.cameraId === SITE_LOG.cameraDegraded.cameraId && during(SITE_LOG.cameraDegraded);

  // Draw every random value up front, in a fixed order, so the data for one
  // part of the report never shifts when another part changes.
  const r = {
    secondShare: between(0.55, 0.8),
    thirdShare: between(0.3, 0.6),
    count: rand(),
    closestT: between(14, 44),
    closestFactor: rand(),
    closestFloor: between(8, 45),
    altitude: between(30, 210),
    trackStretch: between(1.5, 2),
    altitudeWobble: Array.from({ length: 7 }, () => between(-12, 12)),
    speed: between(8, 18),
    heading: between(0, 360),
    commandDelay: between(1, 2.5),
    confirmDelay: between(0.3, 1.2),
    spinDown: between(10, 20),
    restartMinutes: between(5, 14),
    deterrenceDelay: between(0.6, 1.8),
    windSpeed: between(3.5, 11),
    windDirection: between(330, 390),
    visibility: between(12, 30),
    temperature: between(17, 24),
    nacelleFactor: between(1.05, 1.25),
    yawOffset: between(-8, 8),
    exposure: between(1.5, 8),
    clipExtra: between(4, 10),
    box: Array.from({ length: 4 }, () => rand()),
    reviewer: rand(),
    reviewDelayMinutes: between(15, 120),
    trace: Array.from({ length: 4 }, () => Math.floor(rand() * 0x10000)),
    latency: between(180, 900),
  };

  // Identification
  const [second, third] = LOOKALIKES[detection.species];
  const rest = 1 - detection.confidence;
  const secondConfidence = round2(rest * r.secondShare);
  const thirdConfidence = round2((rest - secondConfidence) * r.thirdShare);
  // Griffons often fly in groups; the other species mostly alone.
  const flocks = detection.species === "Griffon Vulture";
  const count = flocks ? 1 + Math.floor(r.count * 6) : r.count < 0.15 ? 2 : 1;

  // Flight path: approaches to the closest point, then moves away.
  const inZone = detection.distanceMeters < SHUTDOWN_RULE.distanceMeters;
  let closest = Math.round(detection.distanceMeters * (inZone ? 0.35 + r.closestFactor * 0.55 : 0.6 + r.closestFactor * 0.35));
  if (!inZone) closest = Math.max(closest, Math.min(detection.distanceMeters, SHUTDOWN_RULE.distanceMeters + Math.round(r.closestFloor)));
  closest = Math.max(closest, 15);
  const closestT = Math.round(r.closestT);
  const duration = Math.round(closestT * r.trackStretch);
  const altitude = Math.round(r.altitude);
  const times = [0, closestT / 3, (2 * closestT) / 3, closestT, ...[1, 2, 3].map((k) => closestT + ((duration - closestT) * k) / 3)];
  const points = times.map((t, i) => {
    const distance =
      t <= closestT
        ? detection.distanceMeters + (closest - detection.distanceMeters) * (t / closestT)
        : closest + (detection.distanceMeters - closest) * 0.8 * ((t - closestT) / (duration - closestT));
    const wobble = i === 0 ? 0 : r.altitudeWobble[i - 1];
    return { t: round1(t), distanceMeters: Math.round(distance), altitudeMeters: Math.round(altitude + wobble) };
  });
  const altitudeAtClosest = points[3].altitudeMeters;

  // Weather and turbine
  const windSpeed = round1(r.windSpeed);
  const windDirection = Math.round(r.windDirection) % 360;
  const nacelleWind = round1(windSpeed * r.nacelleFactor);
  const powerKw = Math.round(3000 * Math.min(1, Math.max(0, (nacelleWind - 3) / 9)) ** 1.6);

  // Shutdown sequence
  const required = detection.curtailed;
  const commandAt = r.commandDelay;
  const stoppedAt = commandAt + r.spinDown;
  const restartAt = stoppedAt + r.restartMinutes * 60;
  const completed = required && !scadaDown;

  const deterrenceTriggered = detection.distanceMeters < 300 && detection.confidence > 0.6;

  const review: Review | undefined = detection.acknowledged
    ? (sessionReview ?? {
        by: REVIEWERS[Math.floor(r.reviewer * REVIEWERS.length)],
        at: after(r.reviewDelayMinutes * 60),
      })
    : undefined;

  const history: DetectionReport["history"] = [
    { at: detection.detectedAt, actor: "system", event: `Detected by ${detection.cameraId}` },
  ];
  if (deterrenceTriggered) history.push({ at: after(r.deterrenceDelay), actor: "system", event: "Acoustic deterrence played" });
  if (required) {
    history.push({ at: after(commandAt), actor: "system", event: `Shutdown command sent to ${detection.turbineId}` });
    if (completed) {
      history.push({ at: after(commandAt + r.confirmDelay), actor: "scada", event: `${detection.turbineId} confirmed shutdown command` });
      history.push({ at: after(stoppedAt), actor: "scada", event: `${detection.turbineId} rotor stopped` });
      history.push({ at: after(restartAt), actor: "scada", event: `${detection.turbineId} restarted` });
    } else {
      history.push({ at: after(commandAt + 30), actor: "system", event: "No response from turbine controller after 30 s" });
    }
  }
  if (review) history.push({ at: review.at, actor: review.by, event: "Acknowledged" });
  history.sort((a, b) => a.at.localeCompare(b.at));

  const latency = Math.round(r.latency);
  const isPtz = detection.cameraId.endsWith("CAM3");

  return {
    detection,
    identification: {
      model: "avis-detect 7.3.1",
      candidates: [
        { species: detection.species, confidence: detection.confidence },
        { species: second, confidence: secondConfidence },
        { species: third, confidence: thirdConfidence },
      ],
      iucnStatus: IUCN[detection.species] ?? "LC",
      permitSpecies: PERMIT_SPECIES.has(detection.species),
      count,
      wingspanCm: WINGSPAN_CM[detection.species],
    },
    track: {
      points,
      closestApproachMeters: closest,
      closestApproachAt: after(closestT),
      atRotorHeight: altitudeAtClosest >= ROTOR_HEIGHT.min && altitudeAtClosest <= ROTOR_HEIGHT.max,
      speedMps: round1(r.speed),
      headingDeg: Math.round(r.heading),
    },
    shutdown: {
      rule: { ...SHUTDOWN_RULE },
      required,
      commandSentAt: required ? after(commandAt) : null,
      confirmedAt: completed ? after(commandAt + r.confirmDelay) : null,
      rotorStoppedAt: completed ? after(stoppedAt) : null,
      restartedAt: completed ? after(restartAt) : null,
      energyLostKWh: completed ? Math.round((powerKw * (restartAt - commandAt)) / 3600) : null,
    },
    deterrence: {
      triggered: deterrenceTriggered,
      method: deterrenceTriggered ? "acoustic" : null,
      at: deterrenceTriggered ? after(r.deterrenceDelay) : null,
    },
    weather: {
      station: "MET-01",
      windSpeedMps: weatherOffline ? null : windSpeed,
      windDirectionDeg: weatherOffline ? null : windDirection,
      visibilityKm: weatherOffline ? null : Math.round(r.visibility),
      temperatureC: weatherOffline ? null : round1(r.temperature),
      precipitation: weatherOffline ? null : "none",
      light: detection.detectedAt.slice(11, 16) >= "15:20" ? "dusk" : "day",
    },
    turbine: scadaDown
      ? null
      : {
          status: "running",
          rotorRpm: round1(Math.min(14.5, 6 + nacelleWind * 0.8)),
          powerKw,
          nacelleWindSpeedMps: nacelleWind,
          yawDeg: Math.round(windDirection + r.yawOffset + 360) % 360,
        },
    camera: {
      id: detection.cameraId,
      kind: isPtz ? "ptz" : "static",
      status: cameraDegraded ? "degraded" : "online",
      statusDetail: cameraDegraded ? SITE_LOG.cameraDegraded.detail : null,
      firmware: isPtz ? "5.2.0" : "4.18.2",
      resolution: isPtz ? "1920x1080" : "3840x2160",
      frameRate: 25,
      exposureMs: round1(r.exposure),
    },
    media: {
      clipDurationSeconds: Math.round(duration + r.clipExtra),
      frameCount: Math.round(duration + r.clipExtra) * 25,
      boundingBox: {
        x: round2(r.box[0] * 0.8),
        y: round2(r.box[1] * 0.8),
        width: round2(0.02 + r.box[2] * 0.08),
        height: round2(0.02 + r.box[3] * 0.06),
      },
    },
    review: { acknowledgedBy: review?.by ?? null, acknowledgedAt: review?.at ?? null },
    history,
    system: {
      edgeNode: `edge-${detection.turbineId.toLowerCase()}`,
      traceId: r.trace.map((n) => n.toString(16).padStart(4, "0")).join(""),
      pipelineLatencyMs: latency,
      ingestedAt: new Date(detectedMs + latency).toISOString(),
      schemaVersion: 3,
    },
  };
}
