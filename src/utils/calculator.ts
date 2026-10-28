import type {
  AIModel,
  CalculationResult,
  DataCenterLocation,
  FlexibleQueueResult,
  HourlyGridPoint,
  InfrastructureUpgrades,
  WeatherCondition,
  LocationWeatherRanking,
  WeatherRecommendation,
} from '../types';
import { getFallbackWeather } from '../services/weather';

export const BASELINE_WORDS_IN = 800;
export const BASELINE_WORDS_OUT = 225;
export const TOKENS_PER_WORD = 1.33;

/**
 * Calculates environmental footprint for a query based on Li et al. (2025),
 * Stojkovic et al. (2025), and Xiao et al. (2025).
 */
export function calculateFootprint(params: {
  model: AIModel;
  location: DataCenterLocation;
  wordsIn: number;
  wordsOut: number;
  weather?: WeatherCondition | null;
  includeIdlePenalty: boolean;
  waterMode: 'consumption' | 'withdrawal';
  upgrades: InfrastructureUpgrades;
}): CalculationResult {
  const {
    model,
    location,
    wordsIn,
    wordsOut,
    weather,
    includeIdlePenalty,
    waterMode,
    upgrades,
  } = params;

  // Safe lower bounds
  const safeWordsIn = Math.max(1, wordsIn);
  const safeWordsOut = Math.max(1, wordsOut);
  const tokensIn = Math.round(safeWordsIn * TOKENS_PER_WORD);
  const tokensOut = Math.round(safeWordsOut * TOKENS_PER_WORD);

  // 1. Token-to-Energy Scaling (kWh)
  // e_t = E_base * (0.30 * (W_in / 800) + 0.70 * (W_out / 225))
  const promptPart = 0.3 * (safeWordsIn / BASELINE_WORDS_IN);
  const tokenPart = 0.7 * (safeWordsOut / BASELINE_WORDS_OUT);
  const energyScalingFactor = promptPart + tokenPart;

  const promptEnergyFraction = promptPart / energyScalingFactor;
  const tokenEnergyFraction = tokenPart / energyScalingFactor;

  let serverEnergyKWh = model.baseEnergyKWh * energyScalingFactor;

  // Idle Server Power Penalty (Xiao et al. 2025)
  // P_server = (P_max - P_idle)*u + P_idle
  // With P_idle = 0.23, P_max = 0.88, u = 0.25 => P = 0.3925
  // Active pure work load = 0.1625 => Ratio = 0.3925 / 0.1625 ~ 2.415
  if (includeIdlePenalty) {
    serverEnergyKWh *= 2.415;
  }

  // 2. Weather modulation on on-site WUE (rho_s1,t)
  // Temperature & wet-bulb effects on cooling tower evaporation
  let effectiveWUE = location.onSiteWUE;
  if (location.onSiteWUE > 0 && weather) {
    const tempDelta = Math.max(0, weather.temperatureC - 20);
    let weatherFactor = 1.0 + tempDelta * 0.035;

    // Severe heat spike above 29.4°C (85°F)
    if (weather.temperatureC > 29.4) {
      weatherFactor += (weather.temperatureC - 29.4) * 0.045;
    }

    // Relative humidity adjustment (dry air accelerates evaporation)
    const humidityDelta = (50 - weather.relativeHumidity) / 100;
    weatherFactor += humidityDelta * 0.15;

    effectiveWUE = location.onSiteWUE * Math.max(0.65, Math.min(2.8, weatherFactor));
  }

  // 3. PUE and EWIF
  let effectivePUE = location.pue;
  let effectiveEWIF = location.offSiteEWIF;
  const effectiveCarbonIntensity = location.carbonIntensity;

  // Apply Engineering Upgrades from Xiao et al. (2025)
  let energyMultiplier = 1.0;
  let directWaterMultiplier = 1.0;
  let totalWaterMultiplier = 1.0;
  let carbonMultiplier = 1.0;

  if (upgrades.combinedBestPractices) {
    // Xiao et al. Combined Best Practices: -73% carbon, -86% total water, -65% energy
    energyMultiplier *= 0.35;
    directWaterMultiplier *= 0.12;
    totalWaterMultiplier *= 0.14;
    carbonMultiplier *= 0.27;
  } else {
    if (upgrades.pueOptimization) {
      // Best-Practice PUE: -67.9% infra energy, -7.4% total energy & carbon, -9.3% direct water
      energyMultiplier *= 0.926;
      directWaterMultiplier *= 0.907;
      totalWaterMultiplier *= 0.925;
      carbonMultiplier *= 0.926;
      effectivePUE = 1.0 + (effectivePUE - 1.0) * 0.321; // -67.9% of facility overhead
    }

    if (upgrades.wueOptimization) {
      // Best-Practice WUE: -85.7% direct water, -29.6% total water, -6.7% carbon
      directWaterMultiplier *= 0.143;
      totalWaterMultiplier *= 0.704;
      carbonMultiplier *= 0.933;
      effectiveWUE *= 0.143;
    }

    if (upgrades.liquidCooling) {
      // Advanced Liquid Cooling: -1.7% energy, -2.4% total water, -1.6% carbon
      energyMultiplier *= 0.983;
      directWaterMultiplier *= 0.965;
      totalWaterMultiplier *= 0.976;
      carbonMultiplier *= 0.984;
    }

    if (upgrades.serverUtilization) {
      // Server Utilization Optimization (SUO): -5.5% across all
      energyMultiplier *= 0.945;
      directWaterMultiplier *= 0.945;
      totalWaterMultiplier *= 0.945;
      carbonMultiplier *= 0.945;
    }
  }

  serverEnergyKWh *= energyMultiplier;
  const totalFacilityEnergyKWh = serverEnergyKWh * effectivePUE;
  const energyWh = serverEnergyKWh * 1000;

  // 4. Water Footprint Calculations (Liters)
  // Scope 1: On-Site Cooling Water = e_t * rho_s1,t
  // Scope 2: Off-Site Grid Electricity Water = e_t * theta_t * rho_s2,t
  const scope1WaterConsumptionL = serverEnergyKWh * effectiveWUE * directWaterMultiplier;
  const scope2WaterConsumptionL = totalFacilityEnergyKWh * effectiveEWIF * totalWaterMultiplier;
  const totalWaterConsumptionL = scope1WaterConsumptionL + scope2WaterConsumptionL;

  // Water Withdrawal:
  // Scope 1: ~1.25x consumption in cooling towers (80% evaporated, 20% blowdown cycled)
  // Scope 2: national average 43.83 L/kWh withdrawal vs 3.14 L/kWh consumption (~13.95x)
  const scope1WaterWithdrawalL = scope1WaterConsumptionL * 1.25;
  const scope2WaterWithdrawalL = scope2WaterConsumptionL * 13.95;
  const totalWaterWithdrawalL = scope1WaterWithdrawalL + scope2WaterWithdrawalL;

  // Displayed water depending on mode
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
  const scope2Percent =
    displayedTotalWaterL > 0 ? 100 - scope1Percent : 0;

  // 5. Operational Carbon (kg and grams)
  // Carbon = e_t * theta_t * eta^(c)
  const carbonKg = totalFacilityEnergyKWh * effectiveCarbonIntensity * carbonMultiplier;
  const carbonGrams = carbonKg * 1000;

  // 6. Tangible Everyday Equivalents
  const bottleFraction = displayedTotalWaterMl / 500; // Fraction of standard 500mL bottle
  const waterDrops = Math.round(displayedTotalWaterMl / 0.05); // ~0.05 mL per drop
  const ledSeconds = Math.round((energyWh / 10) * 3600); // 10W standard LED bulb
  const smartphoneBatteryPercent = (energyWh / 15) * 100; // 15 Wh typical phone battery
  const drivingMeters = Math.round((carbonGrams / 0.12) * 10) / 10; // ~120 g CO2/km => 0.12 g/m

  return {
    wordsIn: safeWordsIn,
    wordsOut: safeWordsOut,
    tokensIn,
    tokensOut,
    promptEnergyFraction,
    tokenEnergyFraction,
    serverEnergyKWh,
    totalFacilityEnergyKWh,
    energyWh,
    scope1WaterConsumptionL,
    scope2WaterConsumptionL,
    totalWaterConsumptionL,
    scope1WaterWithdrawalL,
    scope2WaterWithdrawalL,
    totalWaterWithdrawalL,
    displayedScope1WaterMl,
    displayedScope2WaterMl,
    displayedTotalWaterMl,
    scope1Percent,
    scope2Percent,
    carbonKg,
    carbonGrams,
    effectiveWUE,
    effectiveEWIF,
    effectivePUE,
    bottleFraction,
    waterDrops,
    ledSeconds,
    smartphoneBatteryPercent,
    drivingMeters,
  };
}

/**
 * Simulates Google CICS Carbon-Water 24-hour Trade-Off & Virtual Capacity Curve (VCC)
 * Radovanović et al. (2023) and Li et al. (2025)
 */
export function simulate24HourCICS(
  location: DataCenterLocation,
  carbonWeight: number, // 0 to 1
  currentHour = 14 // default 2 PM peak
): FlexibleQueueResult {
  const waterWeight = 1.0 - carbonWeight;
  const hourlyPoints: HourlyGridPoint[] = [];

  for (let h = 0; h < 24; h++) {
    // 1. Diurnal Temperature Curve (°C)
    // Trough at 05:00 AM, Peak at 15:00 PM
    const tempVariation = Math.sin(((h - 9) / 24) * 2 * Math.PI) * 7;
    const baseTemp = 22;
    const ambientTempC = Math.round((baseTemp + tempVariation) * 10) / 10;

    // 2. Solar generation curve (peaks midday 11:00 - 15:00)
    let solarGen = 0;
    if (h >= 6 && h <= 18) {
      solarGen = Math.sin(((h - 6) / 12) * Math.PI) * 100;
    }

    // 3. Carbon intensity (drops when solar is peak; rises at night with fossil baseload)
    const baseCarbon = location.carbonIntensity;
    const carbonDelta = (solarGen / 100) * -0.45 + (1 - solarGen / 100) * 0.15;
    const carbonIntensity = Math.max(0.02, baseCarbon * (1 + carbonDelta));

    // 4. On-site WUE (rises in afternoon heat; drops during cool night)
    const heatDelta = Math.max(0, ambientTempC - 20) * 0.04;
    const effectiveWUE = location.onSiteWUE * (1.0 + heatDelta);

    hourlyPoints.push({
      hour: h,
      label: `${h.toString().padStart(2, '0')}:00`,
      carbonIntensity: Math.round(carbonIntensity * 1000) / 1000,
      ambientTempC,
      effectiveWUE: Math.round(effectiveWUE * 1000) / 1000,
      cost: 0,
      isOptimal: false,
      solarGenerationPercent: Math.round(solarGen),
    });
  }

  // Calculate Averages for Normalization
  const avgCarbon =
    hourlyPoints.reduce((acc, p) => acc + p.carbonIntensity, 0) / 24;
  const avgWUE =
    hourlyPoints.reduce((acc, p) => acc + p.effectiveWUE, 0) / 24;

  // Cost function from Section 3 Eq 4:
  // Cost(h) = w_carbon * (Carbon(h) / Carbon_avg) + w_water * (Water(h) / Water_avg)
  let lowestCost = Infinity;
  let optimalHour = currentHour;

  hourlyPoints.forEach((p) => {
    const carbonNorm = p.carbonIntensity / (avgCarbon || 1);
    const waterNorm = p.effectiveWUE / (avgWUE || 1);
    p.cost = carbonWeight * carbonNorm + waterWeight * waterNorm;

    if (p.cost < lowestCost) {
      lowestCost = p.cost;
      optimalHour = p.hour;
    }
  });

  hourlyPoints[optimalHour].isOptimal = true;

  const currentPoint = hourlyPoints[currentHour];
  const optimalPoint = hourlyPoints[optimalHour];

  const carbonSavingsPercent = Math.max(
    0,
    Math.round(
      ((currentPoint.carbonIntensity - optimalPoint.carbonIntensity) /
        currentPoint.carbonIntensity) *
        100
    )
  );

  const waterSavingsPercent = Math.max(
    0,
    Math.round(
      ((currentPoint.effectiveWUE - optimalPoint.effectiveWUE) /
        (currentPoint.effectiveWUE || 1)) *
        100
    )
  );

  const delayHours =
    optimalHour >= currentHour
      ? optimalHour - currentHour
      : 24 - currentHour + optimalHour;

  return {
    currentHour,
    optimalHour,
    delayHours,
    carbonSavingsPercent,
    waterSavingsPercent,
    hourlyPoints,
  };
}

/**
 * Real-time Weather-Driven Data Center Recommendation Engine.
 * Evaluates all data center locations across the globe with their live weather (temperature and relative humidity),
 * computes weather-modulated on-site WUE (evaporation spikes in heat vs free-cooling in cold regions),
 * and recommends the #1 best data center along with quantified savings compared to the currently selected location.
 */
export function calculateWeatherRecommendations(params: {
  model: AIModel;
  currentLocation: DataCenterLocation;
  locations: DataCenterLocation[];
  wordsIn: number;
  wordsOut: number;
  weatherMap: Record<string, WeatherCondition>;
  upgrades: InfrastructureUpgrades;
  waterMode: 'consumption' | 'withdrawal';
  includeIdlePenalty: boolean;
  isLoadingWeather?: boolean;
}): WeatherRecommendation {
  const {
    model,
    currentLocation,
    locations,
    wordsIn,
    wordsOut,
    weatherMap,
    upgrades,
    waterMode,
    includeIdlePenalty,
    isLoadingWeather = false,
  } = params;

  // Calculate footprint for current location under its weather
  const currentWeather = weatherMap[currentLocation.id] || getFallbackWeather(currentLocation.id);
  const currentFootprint = calculateFootprint({
    model,
    location: currentLocation,
    wordsIn,
    wordsOut,
    weather: currentWeather,
    includeIdlePenalty,
    waterMode,
    upgrades,
  });

  // Calculate footprint and ranking for all locations
  const evaluated: LocationWeatherRanking[] = locations.map((loc) => {
    const locWeather = weatherMap[loc.id] || getFallbackWeather(loc.id);
    const footprint = calculateFootprint({
      model,
      location: loc,
      wordsIn,
      wordsOut,
      weather: locWeather,
      includeIdlePenalty,
      waterMode,
      upgrades,
    });

    // Cooling thermodynamic status
    let coolingStatus: 'free-cooling' | 'moderate' | 'high-evaporative' = 'moderate';
    if (locWeather.temperatureC < 15.0) {
      coolingStatus = 'free-cooling'; // Direct air economizers run with zero chiller evaporation
    } else if (locWeather.temperatureC > 26.0 || locWeather.wetBulbC > 21.0) {
      coolingStatus = 'high-evaporative'; // High heat/wet-bulb forces cooling towers to evaporate intense water
    }

    // Composite eco score (50% water weight, 50% carbon weight, lower is better)
    // Normalized to baseline query averages (~17 mL water, ~2.5 g carbon)
    const compositeScore =
      0.5 * (footprint.displayedTotalWaterMl / 17.0) +
      0.5 * (footprint.carbonGrams / 2.5);

    const waterSavingsVsCurrentPct = Math.round(
      ((currentFootprint.displayedTotalWaterMl - footprint.displayedTotalWaterMl) /
        (currentFootprint.displayedTotalWaterMl || 1)) *
        100
    );

    const carbonSavingsVsCurrentPct = Math.round(
      ((currentFootprint.carbonGrams - footprint.carbonGrams) /
        (currentFootprint.carbonGrams || 1)) *
        100
    );

    return {
      location: loc,
      weather: locWeather,
      effectiveWUE: footprint.effectiveWUE,
      totalWaterMl: footprint.displayedTotalWaterMl,
      carbonGrams: footprint.carbonGrams,
      compositeScore,
      rank: 1,
      isCurrentLocation: loc.id === currentLocation.id,
      waterSavingsVsCurrentPct,
      carbonSavingsVsCurrentPct,
      coolingStatus,
    };
  });

  // Sort by composite score (lowest impact first)
  evaluated.sort((a, b) => a.compositeScore - b.compositeScore);
  evaluated.forEach((item, index) => {
    item.rank = index + 1;
  });

  // Find best by specific criteria
  const bestOverall = evaluated[0];

  const byWater = [...evaluated].sort((a, b) => a.totalWaterMl - b.totalWaterMl);
  const bestWater = byWater[0];

  const byCarbon = [...evaluated].sort((a, b) => a.carbonGrams - b.carbonGrams);
  const bestCarbon = byCarbon[0];

  const isCurrentOptimal = bestOverall.location.id === currentLocation.id;

  return {
    bestOverall,
    bestWater,
    bestCarbon,
    rankings: evaluated,
    isCurrentOptimal,
    activeLocationWeather: currentWeather,
    isLoading: isLoadingWeather,
    lastSyncTime: currentWeather?.updatedAt || 'Synced',
  };
}

