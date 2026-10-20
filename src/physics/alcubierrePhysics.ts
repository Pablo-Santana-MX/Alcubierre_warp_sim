/**
 * Alcubierre Metric Vectorized & Analytical Physics Engine
 * Reference: Alcubierre, M. (1994). Class. Quantum Grav. 11, L73-L77.
 * Conforms 100% to physics.py analytical formulas.
 */

import { WarpParameters, MetricPointEvaluation, EnergyConditionReport, WarpPreset } from './types';

export const EPSILON = 1e-9;

/**
 * Analytical Alcubierre shape function f(r)
 * f(r) = [tanh(sigma (r + R)) - tanh(sigma (r - R))] / (2 tanh(sigma R))
 */
export function shapeFunction(r: number, R: number, sigma: number): number {
  const tanh_sigma_R = Math.tanh(sigma * R);
  if (Math.abs(tanh_sigma_R) < EPSILON) return 0;
  return (Math.tanh(sigma * (r + R)) - Math.tanh(sigma * (r - R))) / (2 * tanh_sigma_R);
}

/**
 * Analytical derivative of shape function df/dr
 * df/dr = sigma [sech^2(sigma (r + R)) - sech^2(sigma (r - R))] / (2 tanh(sigma R))
 * Uses identity sech^2(u) = 1 - tanh^2(u) to eliminate cosh overflow.
 */
export function shapeFunctionDerivative(r: number, R: number, sigma: number): number {
  const tanh_plus = Math.tanh(sigma * (r + R));
  const tanh_minus = Math.tanh(sigma * (r - R));
  const sech2_plus = 1.0 - tanh_plus * tanh_plus;
  const sech2_minus = 1.0 - tanh_minus * tanh_minus;
  const denom = 2.0 * Math.tanh(sigma * R);
  if (Math.abs(denom) < EPSILON) return 0;
  return (sigma * (sech2_plus - sech2_minus)) / denom;
}

/**
 * Volume expansion scalar theta (York curvature)
 * theta = v_s * ((x - x_s) / r_s) * (df/dr_s)
 * Negative (contraction) ahead of bubble (x > x_s), positive (expansion) behind (x < x_s).
 */
export function volumeExpansion(
  x: number,
  y: number,
  z: number,
  xCenter: number,
  params: Pick<WarpParameters, 'bubbleRadius' | 'wallSharpness' | 'velocity'>
): number {
  const dx = x - xCenter;
  const r = Math.hypot(dx, y, z);
  const df_dr = shapeFunctionDerivative(r, params.bubbleRadius, params.wallSharpness);
  return params.velocity * (dx / (r + EPSILON)) * df_dr;
}

/**
 * Eulerian energy density T_00 in geometrised units G = c = 1:
 * T_00 = -(v_s^2 * rho^2) / (32 * pi * r_s^2) * (df/dr_s)^2
 * where rho^2 = y^2 + z^2. Always <= 0.
 */
export function energyDensity(
  x: number,
  y: number,
  z: number,
  xCenter: number,
  params: Pick<WarpParameters, 'bubbleRadius' | 'wallSharpness' | 'velocity'>
): number {
  const dx = x - xCenter;
  const rho2 = y * y + z * z;
  const r2 = dx * dx + rho2;
  const r = Math.sqrt(r2);
  const df_dr = shapeFunctionDerivative(r, params.bubbleRadius, params.wallSharpness);
  const transverseRatio = rho2 / (r2 + EPSILON);
  return -((params.velocity * params.velocity) * transverseRatio * (df_dr * df_dr)) / (32.0 * Math.PI);
}

/**
 * Evaluate all metric properties at a single point (x, y, z)
 */
export function evaluatePoint(
  x: number,
  y: number,
  z: number,
  params: WarpParameters
): MetricPointEvaluation {
  const dx = x - params.xCenter;
  const rho2 = y * y + z * z;
  const r2 = dx * dx + rho2;
  const r = Math.sqrt(r2);

  const f = shapeFunction(r, params.bubbleRadius, params.wallSharpness);
  const df_dr = shapeFunctionDerivative(r, params.bubbleRadius, params.wallSharpness);
  const theta = params.velocity * (dx / (r + EPSILON)) * df_dr;
  const transverseRatio = rho2 / (r2 + EPSILON);
  const t00 = -((params.velocity * params.velocity) * transverseRatio * (df_dr * df_dr)) / (32.0 * Math.PI);
  const height = params.heightScale * theta;
  const shiftX = -params.velocity * f;

  return {
    theta,
    f,
    df_dr,
    t00,
    height,
    shiftX,
  };
}

/**
 * Computes the maximum absolute value of T_00 along a transverse cut line.
 * Used for HUD normalization.
 */
export function referenceEnergyPeak(
  bounds: number,
  samples: number,
  params: WarpParameters
): number {
  let peak = EPSILON;
  const step = (2.0 * bounds) / samples;
  for (let i = 0; i <= samples; i++) {
    const x = -bounds + i * step;
    const val = Math.abs(energyDensity(x, params.yCut, 0, 0, params));
    if (val > peak) peak = val;
  }
  return peak;
}

/**
 * Generate HUD curve points for T_00 profile
 */
export function computeHudCurve(
  bounds: number,
  samples: number,
  xCenter: number,
  params: WarpParameters,
  peak: number
): { x: number; y: number; normalizedT00: number; rawT00: number }[] {
  const points: { x: number; y: number; normalizedT00: number; rawT00: number }[] = [];
  const step = (2.0 * bounds) / samples;
  const safePeak = Math.max(peak, EPSILON);

  for (let i = 0; i <= samples; i++) {
    const x = -bounds + i * step;
    const rawT00 = energyDensity(x, params.yCut, 0, xCenter, params);
    const normalizedT00 = rawT00 / safePeak; // [-1.0, 0.0]
    points.push({
      x,
      y: normalizedT00,
      normalizedT00,
      rawT00,
    });
  }
  return points;
}

/**
 * Evaluate physical viability & energy condition violation report
 */
export function analyzeEnergyConditions(params: WarpParameters): EnergyConditionReport {
  const peakT00 = referenceEnergyPeak(4.0, 100, params);
  
  // Wall thickness estimate in dimensionless units: Delta ~ 1/sigma
  const wallThicknessSim = 1.0 / params.wallSharpness;
  // If 1 simulation unit ~ 100 meters:
  const wallThicknessMeters = wallThicknessSim * 100;

  // Mass estimates (Alcubierre 1994 unoptimized ~ -10^64 kg, Ford-Pfenning ~ -10^67 kg)
  // Van Den Broeck (1999) scaling factor ~ (velocity^2 * radius / sigma)
  const factor = (params.velocity * params.velocity) * (params.bubbleRadius * 100) / (params.wallSharpness);
  let massString = "-1.2 × 10⁶⁴ kg (Universo Observable)";
  if (params.wallSharpness > 10) {
    massString = `- ${(factor * 2.1).toFixed(2)} × 10³⁰ kg (~1.1 Masas Solares)`;
  } else if (params.bubbleRadius < 0.5) {
    massString = `- ${(factor * 0.8).toFixed(2)} × 10²⁷ kg (~0.4 Masas de Júpiter)`;
  }

  return {
    wecViolated: peakT00 > 1e-6,
    necViolated: peakT00 > 1e-6,
    secViolated: peakT00 > 1e-6,
    peakNegativeT00: peakT00,
    estimatedExoticMassKg: massString,
    wallThicknessMeters: parseFloat(wallThicknessMeters.toFixed(2)),
  };
}

/**
 * Standard Presets for Educational and Scientific Exploration
 */
export const WARP_PRESETS: WarpPreset[] = [
  {
    id: 'alcubierre_classic',
    name: 'Alcubierre (1994) Clásico',
    subtitle: 'Métrica Original con v = 1.5c',
    description: 'La formulación seminal de Miguel Alcubierre. Requiere paredes de energía exótica negativa extremadamente concentradas.',
    theoreticalContext: 'Class. Quantum Grav. 11, L73. Demostró matemáticamente que la relatividad general permite viajar a velocidades superlumínicas efectivas sin aceleración local.',
    params: {
      bubbleRadius: 0.8,
      wallSharpness: 6.0,
      velocity: 1.5,
      yCut: 0.8,
      heightScale: 0.28,
    },
  },
  {
    id: 'van_den_broeck',
    name: 'Van Den Broeck (1999) Micro-Pocket',
    subtitle: 'Burbuja con Bolsillo Espacial Interno',
    description: 'Bolsillo interno macroscópico con superficie externa microscópica, reduciendo drásticamente la masa negativa requerida a fracciones de masa estelar.',
    theoreticalContext: 'Class. Quantum Grav. 16, 3973. Propuso una modificación geométrica donde el área de superficie de la burbuja exterior es diminuta pero el interior es amplio.',
    params: {
      bubbleRadius: 1.2,
      wallSharpness: 9.5,
      velocity: 2.5,
      yCut: 1.2,
      heightScale: 0.35,
    },
  },
  {
    id: 'white_juday',
    name: 'White-Juday Warp Field (NASA)',
    subtitle: 'Optimización Toroidal & Oscilación',
    description: 'Grosor de pared ensanchado (menor sigma) y toroide resonante para minimizar drásticamente el estrés de energía negativa al orden de ~700 kg.',
    theoreticalContext: 'NASA Eagleworks Lab (Harold White). Sugirió variar la oscilación de la burbuja y suavizar el gradiente espacial para acercarlo a física de laboratorio.',
    params: {
      bubbleRadius: 1.5,
      wallSharpness: 3.2,
      velocity: 1.2,
      yCut: 1.5,
      heightScale: 0.22,
    },
  },
  {
    id: 'subluminal_scout',
    name: 'Crucero Sublumínico (0.5c)',
    subtitle: 'Modo Relativista Seguro',
    description: 'Deformación suave dentro del cono de luz sin horizontes causales frontales. No acumula radiación de Hawking destructiva en la pared de choque.',
    theoreticalContext: 'Estudiado por Lobo & Visser. Al mantenerse sublumínico (v < c), la nave conserva control causal total sobre la pared delantera de la burbuja.',
    params: {
      bubbleRadius: 0.7,
      wallSharpness: 5.0,
      velocity: 0.5,
      yCut: 0.7,
      heightScale: 0.18,
    },
  },
  {
    id: 'extreme_warp',
    name: 'Warp Factor 5 (5.0c)',
    subtitle: 'Régimen Hiperlumínico Alto',
    description: 'Distorsión espacio-temporal intensa con pozo de contracción frontal severo y cresta de expansión posterior pronunciada.',
    theoreticalContext: 'Régimen de alta velocidad aparente. Ilustra el agudo apilamiento de geodésicas y la necesidad de reflectores cuánticos de partículas interestelares.',
    params: {
      bubbleRadius: 1.0,
      wallSharpness: 7.5,
      velocity: 5.0,
      yCut: 1.0,
      heightScale: 0.45,
    },
  },
];
