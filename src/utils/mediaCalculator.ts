import type {
  DataCenterLocation,
  InfrastructureUpgrades,
  WeatherCondition,
} from '../types';
import type { MediaImageModel, MediaVideoModel } from '../data/mediaModels';

export interface MediaCalculationResult {
  // Input summary
  mediaType: 'image' | 'video';
  modelName: string;
  provenance: 'measured' | 'modeled' | 'proxy';
  uncertainty: string;
  boundary: string;
  batchCount: number;
  retries: number;
  totalGenerations: number;

  // Energy metrics
  singleUnitEnergyWh: number;
  totalEnergyWh: number;
  serverEnergyKWh: number;
  totalFacilityEnergyKWh: number;
  whPerSecond?: number; // for video

  // Water metrics (Liters & mL)
  scope1WaterConsumptionL: number;
  scope2WaterConsumptionL: number;
  totalWaterConsumptionL: number;
  displayedScope1WaterMl: number;
  displayedScope2WaterMl: number;
  displayedTotalWaterMl: number;
  scope1Percent: number;
  scope2Percent: number;

  // Carbon metrics
  carbonGrams: number;
  carbonKg: number;

  // Tangible equivalents
  bottleFraction: number;
  waterDrops: number;
  ledSeconds: number;
  smartphoneBatteryPercent: number;
  drivingMeters: number;

  // Cross-modality text comparisons (Delavande et al. 2025; Luccioni et al. 2024; Elsworth et al. 2025)
  equalsGpt3Queries: number; // 4.0 Wh benchmark
  equalsGeminiQueries: number; // 0.24 Wh production benchmark

  // Dynamic multipliers and environmental state
  effectiveWUE: number;
  effectiveEWIF: number;
  effectivePUE: number;

  // Sensitivity analysis & tips
  sensitivityHints: string[];
}

/**
 * Calculates environmental footprint for text-to-image generation.
 * Based on Iyengar et al. (2025) and Bertazzini et al. (2025).
 */
export function calculateImageFootprint(params: {
  model: MediaImageModel;
  resolution: [number, number]; // [H, W]
  steps: number;
  cfg: boolean;
  precision: 'fp16' | 'fp32';
  imageCount: number;
  retries: number;
  location: DataCenterLocation;
  weather?: WeatherCondition | null;
  includeIdlePenalty: boolean;
  waterMode: 'consumption' | 'withdrawal';
  upgrades: InfrastructureUpgrades;
}): MediaCalculationResult {
  const {
    model,
    resolution,
    steps,
    cfg,
    precision,
    imageCount,
    retries,
    location,
    weather,
    includeIdlePenalty,
    waterMode,
    upgrades,
  } = params;

  const safeImages = Math.max(1, imageCount);
  const safeRetries = Math.max(1, retries);
  const totalGenerations = safeImages * safeRetries;

  // 1. Resolution Scaling using empirical exponent b (Bertazzini et al. 2025)
  // E_res = (pixels / pixels_base)^b
  const currentPixels = resolution[0] * resolution[1];
  const basePixels = model.baselineResolution[0] * model.baselineResolution[1];
  const pixelRatio = Math.max(0.1, currentPixels / basePixels);
  const resolutionMultiplier = Math.pow(pixelRatio, model.resolutionExponent);

  // 2. Denoising Steps (Linear scaling in compute-bound diffusion loops)
  const stepsMultiplier = Math.max(0.1, steps / model.baselineSteps);

  // 3. Classifier-Free Guidance (CFG doubles denoising passes, Iyengar et al. 2025)
  // Baseline data measured with CFG active; without CFG, only 1 forward pass per step is performed
  const cfgMultiplier = cfg ? 1.0 : 0.5;

  // 4. Precision Penalty (fp32 vs fp16 memory bus penalty, Iyengar et al. 2025: e^1.90 to e^2.04 ~ 6.7x to 7.7x)
  const precisionMultiplier = precision === 'fp32' ? 7.0 : 1.0;

  // 5. Single Image Energy (Wh)
  const singleUnitEnergyWh =
    model.baseEnergyWh *
    resolutionMultiplier *
    stepsMultiplier *
    cfgMultiplier *
    precisionMultiplier;

  let totalEnergyWh = singleUnitEnergyWh * totalGenerations;

  // 6. Idle Server Overhead (Xiao et al. 2025)
  // Note: Diffusion models saturate GPU near 100%, but provisioned cluster idle capacity still applies
  if (includeIdlePenalty) {
    totalEnergyWh *= 2.415;
  }

  // 7. Weather Modulation on On-Site WUE (Stull 2011 empirical wet-bulb & heat effect)
  let effectiveWUE = location.onSiteWUE;
  if (location.onSiteWUE > 0 && weather) {
    const tempDelta = Math.max(0, weather.temperatureC - 20);
    let weatherFactor = 1.0 + tempDelta * 0.035;

    if (weather.temperatureC > 29.4) {
      weatherFactor += (weather.temperatureC - 29.4) * 0.045;
    }

    const humidityDelta = (50 - weather.relativeHumidity) / 100;
    weatherFactor += humidityDelta * 0.15;

    effectiveWUE = location.onSiteWUE * Math.max(0.65, Math.min(2.8, weatherFactor));
  }

  // 8. Apply Engineering Upgrades (Xiao et al. 2025)
  let effectivePUE = location.pue;
  const effectiveEWIF = location.offSiteEWIF;
  const effectiveCarbonIntensity = location.carbonIntensity;

  let energyMultiplier = 1.0;
  let directWaterMultiplier = 1.0;
  let totalWaterMultiplier = 1.0;
  let carbonMultiplier = 1.0;

  if (upgrades.combinedBestPractices) {
    energyMultiplier *= 0.35;
    directWaterMultiplier *= 0.12;
    totalWaterMultiplier *= 0.14;
    carbonMultiplier *= 0.27;
  } else {
    if (upgrades.pueOptimization) {
      energyMultiplier *= 0.926;
      directWaterMultiplier *= 0.907;
      totalWaterMultiplier *= 0.925;
      carbonMultiplier *= 0.926;
      effectivePUE = 1.0 + (effectivePUE - 1.0) * 0.321;
    }
    if (upgrades.wueOptimization) {
      directWaterMultiplier *= 0.143;
      totalWaterMultiplier *= 0.704;
      carbonMultiplier *= 0.933;
      effectiveWUE *= 0.143;
    }
    if (upgrades.liquidCooling) {
      energyMultiplier *= 0.983;
      directWaterMultiplier *= 0.965;
      totalWaterMultiplier *= 0.976;
      carbonMultiplier *= 0.984;
    }
    if (upgrades.serverUtilization) {
      energyMultiplier *= 0.945;
      directWaterMultiplier *= 0.945;
      totalWaterMultiplier *= 0.945;
      carbonMultiplier *= 0.945;
    }
  }

  totalEnergyWh *= energyMultiplier;
  const serverEnergyKWh = totalEnergyWh / 1000;
  const totalFacilityEnergyKWh = serverEnergyKWh * effectivePUE;

  // 9. Water Calculations (Scope 1 On-Site vs Scope 2 Off-Site)
  const scope1WaterConsumptionL = serverEnergyKWh * effectiveWUE * directWaterMultiplier;
  const scope2WaterConsumptionL = totalFacilityEnergyKWh * effectiveEWIF * totalWaterMultiplier;
  const totalWaterConsumptionL = scope1WaterConsumptionL + scope2WaterConsumptionL;

  // Water Withdrawal multipliers (1.25x Scope 1, 13.95x Scope 2)
  const scope1WaterWithdrawalL = scope1WaterConsumptionL * 1.25;
  const scope2WaterWithdrawalL = scope2WaterConsumptionL * 13.95;
  const totalWaterWithdrawalL = scope1WaterWithdrawalL + scope2WaterWithdrawalL;

  const displayedScope1WaterL =
    waterMode === 'consumption' ? scope1WaterConsumptionL : scope1WaterWithdrawalL;
  const displayedScope2WaterL =
    waterMode === 'consumption' ? scope2WaterConsumptionL : scope2WaterWithdrawalL;
  const displayedTotalWaterL =
    waterMode === 'consumption' ? totalWaterConsumptionL : totalWaterWithdrawalL;

  const displayedScope1WaterMl = displayedScope1WaterL * 1000;
  const displayedScope2WaterMl = displayedScope2WaterL * 1000;
  const displayedTotalWaterMl = displayedTotalWaterL * 1000;

  const scope1Percent =
    displayedTotalWaterL > 0
      ? Math.round((displayedScope1WaterL / displayedTotalWaterL) * 100)
      : 0;
  const scope2Percent = displayedTotalWaterL > 0 ? 100 - scope1Percent : 0;

  // 10. Carbon Emissions
  const carbonKg = totalFacilityEnergyKWh * effectiveCarbonIntensity * carbonMultiplier;
  const carbonGrams = carbonKg * 1000;

  // 11. Everyday Equivalents & Cross-Modality Comparison
  const bottleFraction = displayedTotalWaterMl / 500;
  const waterDrops = Math.round(displayedTotalWaterMl / 0.05);
  const ledSeconds = Math.round((totalEnergyWh / 10) * 3600);
  const smartphoneBatteryPercent = (totalEnergyWh / 15) * 100;
  const drivingMeters = Math.round((carbonGrams / 0.12) * 10) / 10;

  const equalsGpt3Queries = Math.round((totalEnergyWh / 4.0) * 10) / 10;
  const equalsGeminiQueries = Math.round((totalEnergyWh / 0.24) * 10) / 10;

  // 12. Dynamic Sensitivity Hints
  const sensitivityHints: string[] = [];
  if (precision === 'fp32') {
    sensitivityHints.push(
      'Switching from fp32 to fp16 cuts electricity by ~85% with zero perceptible quality loss (Iyengar et al. 2025).'
    );
  }
  if (steps > 30) {
    const halfStepsSavedWh = Math.round((totalEnergyWh * 0.45) * 10) / 10;
    sensitivityHints.push(
      `Reducing steps to ~25 would save approximately ${halfStepsSavedWh} Wh (diffusion steps scale linearly).`
    );
  }
  if (safeRetries > 1) {
    sensitivityHints.push(
      `Retries: You are generating ${safeRetries} variations per keeper. Prompt refinement can cut attempts in half.`
    );
  }
  sensitivityHints.push(
    'Bertazzini et al. (2025) confirmed prompt text length has no statistically significant impact on diffusion energy (p > 0.05).'
  );

  return {
    mediaType: 'image',
    modelName: model.name,
    provenance: model.provenance,
    uncertainty: model.uncertainty,
    boundary: model.boundary,
    batchCount: safeImages,
    retries: safeRetries,
    totalGenerations,
    singleUnitEnergyWh: Math.round(singleUnitEnergyWh * 1000) / 1000,
    totalEnergyWh: Math.round(totalEnergyWh * 100) / 100,
    serverEnergyKWh,
    totalFacilityEnergyKWh,
    scope1WaterConsumptionL,
    scope2WaterConsumptionL,
    totalWaterConsumptionL,
    displayedScope1WaterMl: Math.round(displayedScope1WaterMl * 10) / 10,
    displayedScope2WaterMl: Math.round(displayedScope2WaterMl * 10) / 10,
    displayedTotalWaterMl: Math.round(displayedTotalWaterMl * 10) / 10,
    scope1Percent,
    scope2Percent,
    carbonGrams: Math.round(carbonGrams * 100) / 100,
    carbonKg,
    bottleFraction,
    waterDrops,
    ledSeconds,
    smartphoneBatteryPercent,
    drivingMeters,
    equalsGpt3Queries,
    equalsGeminiQueries,
    effectiveWUE,
    effectiveEWIF,
    effectivePUE,
    sensitivityHints,
  };
}

/**
 * Calculates environmental footprint for text-to-video generation.
 * Based on Delavande et al. (2025) and WAN2.1 analytical DiT scaling laws.
 */
export function calculateVideoFootprint(params: {
  model: MediaVideoModel;
  resolution: [number, number]; // [H, W]
  frames: number;
  fps: number;
  steps: number;
  clipCount: number;
  retries: number;
  location: DataCenterLocation;
  weather?: WeatherCondition | null;
  includeIdlePenalty: boolean;
  waterMode: 'consumption' | 'withdrawal';
  upgrades: InfrastructureUpgrades;
}): MediaCalculationResult {
  const {
    model,
    resolution,
    frames,
    fps,
    steps,
    clipCount,
    retries,
    location,
    weather,
    includeIdlePenalty,
    waterMode,
    upgrades,
  } = params;

  const safeClips = Math.max(1, clipCount);
  const safeRetries = Math.max(1, retries);
  const totalGenerations = safeClips * safeRetries;
  const safeFps = Math.max(1, fps);
  const durationSec = Math.max(0.5, Math.round((frames / safeFps) * 10) / 10);

  // 1. Delavande et al. (2025) Analytical Video DiT Scaling:
  // - Spatial resolution: QUADRATIC scaling in pixel count (self-attention tokens ell^2)
  // - Frame count: QUADRATIC scaling in temporal length (DiT temporal token length)
  // - Denoising steps: LINEAR scaling (forward passes)
  const currentPixels = resolution[0] * resolution[1];
  const basePixels = model.baselineResolution[0] * model.baselineResolution[1];
  const pixelRatio = Math.max(0.1, currentPixels / basePixels);
  const spatialMultiplier = Math.pow(pixelRatio, 2); // Quadratic spatial scaling

  const frameRatio = Math.max(0.1, frames / model.baselineFrames);
  const temporalMultiplier = Math.pow(frameRatio, 2); // Quadratic temporal scaling

  const stepsMultiplier = Math.max(0.1, steps / model.baselineSteps); // Linear step scaling

  // Single clip energy (Wh)
  const singleUnitEnergyWh =
    model.baseEnergyWh * spatialMultiplier * temporalMultiplier * stepsMultiplier;

  const whPerSecond = singleUnitEnergyWh / durationSec;

  let totalEnergyWh = singleUnitEnergyWh * totalGenerations;

  // 2. Idle Server Overhead Toggle (Xiao et al. 2025)
  if (includeIdlePenalty) {
    totalEnergyWh *= 2.415;
  }

  // 3. Weather Modulation on On-Site WUE
  let effectiveWUE = location.onSiteWUE;
  if (location.onSiteWUE > 0 && weather) {
    const tempDelta = Math.max(0, weather.temperatureC - 20);
    let weatherFactor = 1.0 + tempDelta * 0.035;

    if (weather.temperatureC > 29.4) {
      weatherFactor += (weather.temperatureC - 29.4) * 0.045;
    }

    const humidityDelta = (50 - weather.relativeHumidity) / 100;
    weatherFactor += humidityDelta * 0.15;

    effectiveWUE = location.onSiteWUE * Math.max(0.65, Math.min(2.8, weatherFactor));
  }

  // 4. Engineering Upgrades (Xiao et al. 2025)
  let effectivePUE = location.pue;
  const effectiveEWIF = location.offSiteEWIF;
  const effectiveCarbonIntensity = location.carbonIntensity;

  let energyMultiplier = 1.0;
  let directWaterMultiplier = 1.0;
  let totalWaterMultiplier = 1.0;
  let carbonMultiplier = 1.0;

  if (upgrades.combinedBestPractices) {
    energyMultiplier *= 0.35;
    directWaterMultiplier *= 0.12;
    totalWaterMultiplier *= 0.14;
    carbonMultiplier *= 0.27;
  } else {
    if (upgrades.pueOptimization) {
      energyMultiplier *= 0.926;
      directWaterMultiplier *= 0.907;
      totalWaterMultiplier *= 0.925;
      carbonMultiplier *= 0.926;
      effectivePUE = 1.0 + (effectivePUE - 1.0) * 0.321;
    }
    if (upgrades.wueOptimization) {
      directWaterMultiplier *= 0.143;
      totalWaterMultiplier *= 0.704;
      carbonMultiplier *= 0.933;
      effectiveWUE *= 0.143;
    }
    if (upgrades.liquidCooling) {
      energyMultiplier *= 0.983;
      directWaterMultiplier *= 0.965;
      totalWaterMultiplier *= 0.976;
      carbonMultiplier *= 0.984;
    }
    if (upgrades.serverUtilization) {
      energyMultiplier *= 0.945;
      directWaterMultiplier *= 0.945;
      totalWaterMultiplier *= 0.945;
      carbonMultiplier *= 0.945;
    }
  }

  totalEnergyWh *= energyMultiplier;
  const serverEnergyKWh = totalEnergyWh / 1000;
  const totalFacilityEnergyKWh = serverEnergyKWh * effectivePUE;

  // 5. Water Calculations (Scope 1 On-Site vs Scope 2 Off-Site)
  const scope1WaterConsumptionL = serverEnergyKWh * effectiveWUE * directWaterMultiplier;
  const scope2WaterConsumptionL = totalFacilityEnergyKWh * effectiveEWIF * totalWaterMultiplier;
  const totalWaterConsumptionL = scope1WaterConsumptionL + scope2WaterConsumptionL;

  // Water Withdrawal multipliers (1.25x Scope 1, 13.95x Scope 2)
  const scope1WaterWithdrawalL = scope1WaterConsumptionL * 1.25;
  const scope2WaterWithdrawalL = scope2WaterConsumptionL * 13.95;
  const totalWaterWithdrawalL = scope1WaterWithdrawalL + scope2WaterWithdrawalL;

  const displayedScope1WaterL =
    waterMode === 'consumption' ? scope1WaterConsumptionL : scope1WaterWithdrawalL;
  const displayedScope2WaterL =
    waterMode === 'consumption' ? scope2WaterConsumptionL : scope2WaterWithdrawalL;
  const displayedTotalWaterL =
    waterMode === 'consumption' ? totalWaterConsumptionL : totalWaterWithdrawalL;

  const displayedScope1WaterMl = displayedScope1WaterL * 1000;
  const displayedScope2WaterMl = displayedScope2WaterL * 1000;
  const displayedTotalWaterMl = displayedTotalWaterL * 1000;

  const scope1Percent =
    displayedTotalWaterL > 0
      ? Math.round((displayedScope1WaterL / displayedTotalWaterL) * 100)
      : 0;
  const scope2Percent = displayedTotalWaterL > 0 ? 100 - scope1Percent : 0;

  // 6. Carbon Emissions
  const carbonKg = totalFacilityEnergyKWh * effectiveCarbonIntensity * carbonMultiplier;
  const carbonGrams = carbonKg * 1000;

  // 7. Everyday Equivalents & Cross-Modality Comparison
  const bottleFraction = displayedTotalWaterMl / 500;
  const waterDrops = Math.round(displayedTotalWaterMl / 0.05);
  const ledSeconds = Math.round((totalEnergyWh / 10) * 3600);
  const smartphoneBatteryPercent = (totalEnergyWh / 15) * 100;
  const drivingMeters = Math.round((carbonGrams / 0.12) * 10) / 10;

  const equalsGpt3Queries = Math.round((totalEnergyWh / 4.0) * 10) / 10;
  const equalsGeminiQueries = Math.round((totalEnergyWh / 0.24) * 10) / 10;

  // 8. Sensitivity Hints (Delavande et al. 2025)
  const sensitivityHints: string[] = [];
  const halfFramesSavedWh = Math.round((totalEnergyWh * 0.75) * 10) / 10;
  sensitivityHints.push(
    `Halving frame count saves ~${halfFramesSavedWh} Wh (video token length scales quadratically, saving 75% compute!).`
  );
  if (steps > 30) {
    const halfStepsSavedWh = Math.round((totalEnergyWh * 0.45) * 10) / 10;
    sensitivityHints.push(
      `Reducing denoising steps to 25 cuts energy by ~${halfStepsSavedWh} Wh (steps scale linearly).`
    );
  }
  if (currentPixels > 480 * 720) {
    sensitivityHints.push(
      'Spatial resolution scales quadratically: 1080p video consumes ~5x more electricity than 720p.'
    );
  }
  if (safeRetries > 1) {
    sensitivityHints.push(
      `You are simulating ${safeRetries} keeper attempts. Total footprint is multiplied by ${safeRetries}x.`
    );
  }

  return {
    mediaType: 'video',
    modelName: model.name,
    provenance: model.provenance,
    uncertainty: model.uncertainty,
    boundary: model.boundary,
    batchCount: safeClips,
    retries: safeRetries,
    totalGenerations,
    singleUnitEnergyWh: Math.round(singleUnitEnergyWh * 100) / 100,
    totalEnergyWh: Math.round(totalEnergyWh * 10) / 10,
    serverEnergyKWh,
    totalFacilityEnergyKWh,
    whPerSecond: Math.round(whPerSecond * 100) / 100,
    scope1WaterConsumptionL,
    scope2WaterConsumptionL,
    totalWaterConsumptionL,
    displayedScope1WaterMl: Math.round(displayedScope1WaterMl * 10) / 10,
    displayedScope2WaterMl: Math.round(displayedScope2WaterMl * 10) / 10,
    displayedTotalWaterMl: Math.round(displayedTotalWaterMl * 10) / 10,
    scope1Percent,
    scope2Percent,
    carbonGrams: Math.round(carbonGrams * 10) / 10,
    carbonKg,
    bottleFraction,
    waterDrops,
    ledSeconds,
    smartphoneBatteryPercent,
    drivingMeters,
    equalsGpt3Queries,
    equalsGeminiQueries,
    effectiveWUE,
    effectiveEWIF,
    effectivePUE,
    sensitivityHints,
  };
}

