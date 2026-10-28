export interface AIModel {
  id: string;
  name: string;
  parameters: string;
  hardware: string;
  baseEnergyKWh: number; // E_base in kWh for baseline request (800w in, 225w out)
  note: string;
  isEfficient?: boolean;
}

export interface DataCenterLocation {
  id: string;
  name: string;
  country: string;
  region: string;
  coordinates: [number, number]; // [lat, lon]
  pue: number; // theta_t
  onSiteWUE: number; // rho_s1 in L/kWh (consumption)
  offSiteEWIF: number; // rho_s2 in L/kWh (consumption)
  carbonIntensity: number; // kgCO2e/kWh (eta)
  baselineGpt3WaterMl: number; // for validation
  queriesPerBottle: number;
  profile: string;
  isWaterStressed?: boolean;
  isHydropowerParadox?: boolean;
  isOptimalCombined?: boolean;
  isDryCooler?: boolean;
}

export interface WeatherCondition {
  temperatureC: number;
  apparentTemperatureC?: number; // "Feels like" temperature
  relativeHumidity: number;
  wetBulbC: number;
  weatherCode?: number;
  weatherDescription?: string; // e.g. "Clear sky", "Partly cloudy", "Rain"
  windSpeedKmh?: number;
  isLive: boolean;
  source: string;
  updatedAt: string;
}

export interface ElectricityFuelMix {
  fuel: string;
  percentage: number;
}

export interface ElectricityGridTelemetry {
  regionName: string;
  carbonIntensityGrams: number; // gCO2e/kWh
  intensityIndex: 'very low' | 'low' | 'moderate' | 'high' | 'very high';
  demandMW?: number; // Real-time electrical grid consumption / load in MW
  renewableSharePct: number;
  fossilSharePct: number;
  generationMix: ElectricityFuelMix[];
  isLive: boolean;
  source: string;
  updatedAt: string;
}

export type AppTab = 'sandbox' | 'explainer' | 'optimizer' | 'report';

export interface InfrastructureUpgrades {
  pueOptimization: boolean;
  wueOptimization: boolean;
  liquidCooling: boolean;
  serverUtilization: boolean;
  combinedBestPractices: boolean;
}

export interface CalculationResult {
  // Input parameters
  wordsIn: number;
  wordsOut: number;
  tokensIn: number;
  tokensOut: number;
  promptEnergyFraction: number;
  tokenEnergyFraction: number;

  // Energy
  serverEnergyKWh: number;
  totalFacilityEnergyKWh: number;
  energyWh: number;

  // Water (Liters and mL)
  scope1WaterConsumptionL: number;
  scope2WaterConsumptionL: number;
  totalWaterConsumptionL: number;
  scope1WaterWithdrawalL: number;
  scope2WaterWithdrawalL: number;
  totalWaterWithdrawalL: number;

  // Display values based on active water mode
  displayedScope1WaterMl: number;
  displayedScope2WaterMl: number;
  displayedTotalWaterMl: number;
  scope1Percent: number;
  scope2Percent: number;

  // Carbon (kg and grams)
  carbonKg: number;
  carbonGrams: number;

  // Dynamic adjusted parameters
  effectiveWUE: number;
  effectiveEWIF: number;
  effectivePUE: number;

  // Real world equivalents
  bottleFraction: number; // fraction of 500mL bottle
  waterDrops: number; // ~0.05 mL per drop
  ledSeconds: number; // 10W LED bulb
  smartphoneBatteryPercent: number; // 15 Wh typical phone battery
  drivingMeters: number; // ~120 gCO2/km => 0.12 g/m
}

export interface HourlyGridPoint {
  hour: number;
  label: string;
  carbonIntensity: number; // kgCO2e/kWh
  ambientTempC: number;
  effectiveWUE: number;
  cost: number;
  isOptimal: boolean;
  solarGenerationPercent: number;
}

export interface FlexibleQueueResult {
  currentHour: number;
  optimalHour: number;
  delayHours: number;
  carbonSavingsPercent: number;
  waterSavingsPercent: number;
  hourlyPoints: HourlyGridPoint[];
}

export interface LocationWeatherRanking {
  location: DataCenterLocation;
  weather: WeatherCondition;
  effectiveWUE: number;
  totalWaterMl: number;
  carbonGrams: number;
  compositeScore: number;
  rank: number;
  isCurrentLocation: boolean;
  waterSavingsVsCurrentPct: number;
  carbonSavingsVsCurrentPct: number;
  coolingStatus: 'free-cooling' | 'moderate' | 'high-evaporative';
}

export interface WeatherRecommendation {
  bestOverall: LocationWeatherRanking;
  bestWater: LocationWeatherRanking;
  bestCarbon: LocationWeatherRanking;
  rankings: LocationWeatherRanking[];
  isCurrentOptimal: boolean;
  activeLocationWeather: WeatherCondition | null;
  isLoading: boolean;
  lastSyncTime: string;
}
