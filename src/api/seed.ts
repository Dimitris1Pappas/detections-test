import type { Detection, Turbine } from "../types";

export const TURBINES: Turbine[] = Array.from({ length: 8 }, (_, i) => {
  const n = String(i + 1).padStart(2, "0");
  return { id: `T${n}`, name: `Turbine ${n}` };
});

const SPECIES = [
  "Griffon Vulture",
  "Egyptian Vulture",
  "Golden Eagle",
  "Booted Eagle",
  "Short-toed Snake Eagle",
  "White-tailed Eagle",
  "Red Kite",
  "Black Kite",
  "Common Buzzard",
  "Common Kestrel",
  "Lesser Kestrel",
  "Eurasian Hobby",
];

// Small deterministic PRNG so every candidate sees the same data.
export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createSeedDetections(): Detection[] {
  const rand = mulberry32(20261009);
  const start = Date.UTC(2026, 9, 9, 6, 0, 0);
  const items: Detection[] = [];

  for (let i = 0; i < 64; i++) {
    const turbine = TURBINES[Math.floor(rand() * TURBINES.length)];
    const distance = Math.round(40 + rand() * 460);
    const confidence = Math.round((0.55 + rand() * 0.44) * 100) / 100;
    items.push({
      id: `det-${String(i + 1).padStart(3, "0")}`,
      detectedAt: new Date(start + i * 9 * 60_000 + Math.floor(rand() * 300_000)).toISOString(),
      species: SPECIES[Math.floor(rand() * SPECIES.length)],
      confidence,
      turbineId: turbine.id,
      cameraId: `${turbine.id}-CAM${1 + Math.floor(rand() * 3)}`,
      distanceMeters: distance,
      curtailed: distance < 180 && confidence > 0.7,
      acknowledged: rand() < 0.4,
    });
  }

  // Newest first
  return items.sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
}
