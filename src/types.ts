export type Detection = {
  id: string;
  /** ISO-8601 timestamp of the detection */
  detectedAt: string;
  species: string;
  /** Model confidence, 0..1 */
  confidence: number;
  turbineId: string;
  cameraId: string;
  /** Distance from the turbine rotor, in metres */
  distanceMeters: number;
  /** Whether the system curtailed (stopped) the turbine for this detection */
  curtailed: boolean;
  /** Whether an operator has reviewed this detection */
  acknowledged: boolean;
};

export type Turbine = {
  id: string;
  name: string;
};

export type DetectionQuery = {
  search?: string;
  turbineId?: string;
  unacknowledgedOnly?: boolean;
};

/** IUCN Red List category */
export type IucnStatus = "LC" | "NT" | "VU" | "EN" | "CR";

/**
 * Everything the system recorded about one detection, from fetchDetectionReport().
 * All timestamps are ISO-8601, UTC.
 */
export type DetectionReport = {
  detection: Detection;
  identification: {
    model: string;
    /** The model's top guesses, best first. The first one matches `detection`. */
    candidates: { species: string; confidence: number }[];
    /** IUCN Red List category of the top guess */
    iucnStatus: IucnStatus;
    /** Whether the top guess is named in the wind farm's environmental permit */
    permitSpecies: boolean;
    /** Number of birds seen together */
    count: number;
    wingspanCm: number;
  };
  track: {
    /** Flight path samples. `t` is seconds after the detection. */
    points: { t: number; distanceMeters: number; altitudeMeters: number }[];
    closestApproachMeters: number;
    closestApproachAt: string;
    /** Whether the bird was within the rotor's height band at its closest approach */
    atRotorHeight: boolean;
    speedMps: number;
    headingDeg: number;
  };
  shutdown: {
    /** Site rule: stop when a bird is closer than `distanceMeters` with confidence above `confidenceAbove`. */
    rule: { distanceMeters: number; confidenceAbove: number };
    /** Whether the rule asked for a shutdown */
    required: boolean;
    commandSentAt: string | null;
    /** When the turbine controller confirmed the stop command. null if it never did. */
    confirmedAt: string | null;
    /** When the rotor reported standstill. null if it never did. */
    rotorStoppedAt: string | null;
    restartedAt: string | null;
    /** Estimated energy not produced because of the shutdown */
    energyLostKWh: number | null;
  };
  deterrence: {
    triggered: boolean;
    method: "acoustic" | null;
    at: string | null;
  };
  weather: {
    station: string;
    /** Weather station readings are null when the station had no data. */
    windSpeedMps: number | null;
    windDirectionDeg: number | null;
    visibilityKm: number | null;
    temperatureC: number | null;
    precipitation: "none" | "light" | "heavy" | null;
    /** From the sun's position, always present */
    light: "day" | "dusk";
  };
  /** Turbine SCADA snapshot at the time of the detection. null if the turbine did not report. */
  turbine: {
    status: "running" | "idle";
    rotorRpm: number;
    powerKw: number;
    /** Wind speed measured on the turbine itself, at hub height */
    nacelleWindSpeedMps: number;
    yawDeg: number;
  } | null;
  camera: {
    id: string;
    kind: "static" | "ptz";
    status: "online" | "degraded";
    statusDetail: string | null;
    firmware: string;
    resolution: string;
    frameRate: number;
    exposureMs: number;
  };
  media: {
    clipDurationSeconds: number;
    frameCount: number;
    /** Normalised (0..1) box around the bird in the first frame */
    boundingBox: { x: number; y: number; width: number; height: number };
  };
  review: {
    acknowledgedBy: string | null;
    acknowledgedAt: string | null;
  };
  /** Audit log, oldest first */
  history: { at: string; actor: string; event: string }[];
  system: {
    edgeNode: string;
    traceId: string;
    pipelineLatencyMs: number;
    ingestedAt: string;
    schemaVersion: number;
  };
};
