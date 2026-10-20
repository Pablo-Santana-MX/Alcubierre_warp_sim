/**
 * Physical and simulation parameters for the Alcubierre Warp Metric.
 * Geometrized units: G = c = 1 (with conversion multipliers for real-world units).
 */

export interface WarpParameters {
  bubbleRadius: number;     // R: radius of the bubble (in simulation units, e.g. 0.8)
  wallSharpness: number;    // sigma: inverse thickness of bubble wall (e.g. 6.0)
  velocity: number;        // v_s: apparent warp bubble velocity (in units of c, e.g. 1.5)
  yCut: number;            // y_cut: transversal cut for HUD T_00 profile (e.g. 0.8)
  heightScale: number;     // visual mesh vertical displacement scale (e.g. 0.35)
  exoticEnergyMultiplier: number; // tuning scalar for visual exotic field intensity (0.1 to 5.0)
  xCenter: number;         // current position along travel axis
  isCruising: boolean;     // whether auto-travel is active
  cruiseSpeed: number;     // speed of animation transit (units/sec)
  shipRotationX: number;   // Ship roll / X-axis rotation in degrees (-180 to 180)
  shipRotationY: number;   // Ship yaw / Y-axis rotation in degrees (-180 to 180)
  shipRotationZ: number;   // Ship pitch / Z-axis rotation in degrees (-90 to 90)
  autoRotateShip: boolean; // Continuous subtle rotation toggle
}

export interface MetricPointEvaluation {
  theta: number;           // volume expansion scalar
  f: number;               // shape function value [0, 1]
  df_dr: number;           // radial derivative of shape function
  t00: number;             // Eulerian energy density (<= 0)
  height: number;          // mesh displacement (heightScale * theta)
  shiftX: number;          // shift vector component beta^x = -v_s * f(r)
}

export interface EnergyConditionReport {
  wecViolated: boolean;    // Weak Energy Condition (T_uv u^u u^v >= 0)
  necViolated: boolean;    // Null Energy Condition
  secViolated: boolean;    // Strong Energy Condition
  peakNegativeT00: number; // max |T_00|
  estimatedExoticMassKg: string; // formatted scientific notation mass equivalent
  wallThicknessMeters: number;  // physical thickness estimate
}

export type PresetKey = 'alcubierre_classic' | 'van_den_broeck' | 'white_juday' | 'subluminal_scout' | 'extreme_warp';

export interface WarpPreset {
  id: PresetKey;
  name: string;
  subtitle: string;
  description: string;
  params: Partial<WarpParameters>;
  theoreticalContext: string;
}
