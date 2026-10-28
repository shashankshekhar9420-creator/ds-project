import type { WeatherCondition } from '../types';

// In-memory cache for weather results
const weatherCache = new Map<string, { data: WeatherCondition; expires: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Calculates Wet-Bulb Temperature from Dry-Bulb Temperature (°C) and Relative Humidity (%)
 * Using Stull's empirical formula (2011) with accurate thermodynamic behavior for evaporative cooling towers.
 */
export function calculateWetBulb(temperatureC: number, relativeHumidity: number): number {
  const T = temperatureC;
  const RH = Math.max(0, Math.min(100, relativeHumidity));

  const twb =
    T * Math.atan(0.151977 * Math.pow(RH + 8.313659, 0.5)) +
    Math.atan(T + RH) -
    Math.atan(RH - 1.676331) +
    0.00391838 * Math.pow(RH, 1.5) * Math.atan(0.023101 * RH) -
    4.686035;

  return Math.round(twb * 10) / 10;
}

export function getWeatherDescription(code?: number): string {
  if (code === undefined || code === null) return 'Typical Climatology';
  if (code === 0) return 'Clear Sky';
  if (code === 1) return 'Mainly Clear';
  if (code === 2) return 'Partly Cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Foggy';
  if (code >= 51 && code <= 55) return 'Drizzle';
  if (code >= 61 && code <= 65) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain Showers';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Fair Weather';
}

// Approximate typical midday temperatures and humidities by region for fallback
const CLIMATE_FALLBACKS: Record<string, { temp: number; rh: number; desc: string }> = {
  arizona: { temp: 34.5, rh: 18, desc: 'Sunny & Arid' },
  georgia: { temp: 26.2, rh: 62, desc: 'Humid Subtropical' },
  illinois: { temp: 21.0, rh: 55, desc: 'Moderate Continental' },
  iowa: { temp: 20.5, rh: 58, desc: 'Temperate Plains' },
  texas: { temp: 31.8, rh: 44, desc: 'Hot & Clear' },
  virginia: { temp: 23.4, rh: 56, desc: 'Mild Temperate' },
  washington: { temp: 18.2, rh: 68, desc: 'Cool Maritime' },
  wyoming: { temp: 16.5, rh: 38, desc: 'High-Altitude Dry' },
  australia: { temp: 22.8, rh: 52, desc: 'Dry Temperate' },
  denmark: { temp: 14.2, rh: 74, desc: 'Cool Baltic Sea' },
  finland: { temp: 11.5, rh: 78, desc: 'Nordic Chill' },
  india: { temp: 33.1, rh: 72, desc: 'Tropical Monsoon' },
  indonesia: { temp: 31.5, rh: 82, desc: 'Equatorial Humid' },
  ireland: { temp: 14.8, rh: 80, desc: 'Maritime Oceanic' },
  mexico: { temp: 27.4, rh: 35, desc: 'Warm Semi-Arid' },
  netherlands: { temp: 16.1, rh: 76, desc: 'North Sea Coastal' },
  sweden: { temp: 12.0, rh: 72, desc: 'Boreal Free-Cooling' },
  'us-avg': { temp: 22.0, rh: 50, desc: 'Continental Baseline' },
};

export function getFallbackWeather(locationId: string): WeatherCondition {
  const fallback = CLIMATE_FALLBACKS[locationId] || { temp: 22.0, rh: 50, desc: 'Mild' };
  const wetBulb = calculateWetBulb(fallback.temp, fallback.rh);

  return {
    temperatureC: fallback.temp,
    apparentTemperatureC: fallback.temp,
    relativeHumidity: fallback.rh,
    wetBulbC: wetBulb,
    weatherCode: 0,
    weatherDescription: fallback.desc,
    windSpeedKmh: 12,
    isLive: false,
    source: 'Regional Microclimate Climatology (Fallback)',
    updatedAt: 'Estimated Local',
  };
}

export async function fetchLocationWeather(
  locationId: string,
  coords: [number, number]
): Promise<WeatherCondition> {
  const cacheKey = `${locationId}_${coords[0]}_${coords[1]}`;
  const now = Date.now();

  const cached = weatherCache.get(cacheKey);
  if (cached && cached.expires > now) {
    return cached.data;
  }

  try {
    const [lat, lon] = coords;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000); // 4s timeout

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`Weather API status: ${res.status}`);

    const data = await res.json();
    const temp = data?.current?.temperature_2m ?? 22.0;
    const apparentTemp = data?.current?.apparent_temperature ?? temp;
    const rh = data?.current?.relative_humidity_2m ?? 50;
    const weatherCode = data?.current?.weather_code ?? 0;
    const windSpeed = data?.current?.wind_speed_10m ?? 10;
    const wetBulb = calculateWetBulb(temp, rh);

    const condition: WeatherCondition = {
      temperatureC: Math.round(temp * 10) / 10,
      apparentTemperatureC: Math.round(apparentTemp * 10) / 10,
      relativeHumidity: Math.round(rh),
      wetBulbC: wetBulb,
      weatherCode,
      weatherDescription: getWeatherDescription(weatherCode),
      windSpeedKmh: Math.round(windSpeed * 10) / 10,
      isLive: true,
      source: 'Open-Meteo API (Live Coordinates)',
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    weatherCache.set(cacheKey, { data: condition, expires: now + CACHE_TTL_MS });
    return condition;
  } catch {
    return getFallbackWeather(locationId);
  }
}

/**
 * Batch-fetches real-time weather from Open-Meteo for all data center locations across the globe in a single request.
 * Falls back safely to regional microclimate climatology if network is unavailable.
 */
export async function fetchAllLocationsWeather(
  locations: import('../types').DataCenterLocation[]
): Promise<Record<string, WeatherCondition>> {
  const now = Date.now();
  const resultMap: Record<string, WeatherCondition> = {};
  const toFetch: import('../types').DataCenterLocation[] = [];

  // Check cache first
  for (const loc of locations) {
    const cacheKey = `${loc.id}_${loc.coordinates[0]}_${loc.coordinates[1]}`;
    const cached = weatherCache.get(cacheKey);
    if (cached && cached.expires > now) {
      resultMap[loc.id] = cached.data;
    } else {
      toFetch.push(loc);
    }
  }

  if (toFetch.length === 0) {
    return resultMap;
  }

  try {
    const lats = toFetch.map((l) => l.coordinates[0]).join(',');
    const lons = toFetch.map((l) => l.coordinates[1]).join(',');
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`Weather batch status: ${res.status}`);

    const data = await res.json();
    const items = Array.isArray(data) ? data : [data];

    toFetch.forEach((loc, index) => {
      const item = items[index];
      const temp = item?.current?.temperature_2m ?? CLIMATE_FALLBACKS[loc.id]?.temp ?? 22.0;
      const apparentTemp = item?.current?.apparent_temperature ?? temp;
      const rh = item?.current?.relative_humidity_2m ?? CLIMATE_FALLBACKS[loc.id]?.rh ?? 50;
      const weatherCode = item?.current?.weather_code ?? 0;
      const windSpeed = item?.current?.wind_speed_10m ?? 12;
      const wetBulb = calculateWetBulb(temp, rh);

      const condition: WeatherCondition = {
        temperatureC: Math.round(temp * 10) / 10,
        apparentTemperatureC: Math.round(apparentTemp * 10) / 10,
        relativeHumidity: Math.round(rh),
        wetBulbC: wetBulb,
        weatherCode,
        weatherDescription: getWeatherDescription(weatherCode),
        windSpeedKmh: Math.round(windSpeed * 10) / 10,
        isLive: true,
        source: 'Open-Meteo API (Live Coordinates)',
        updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const cacheKey = `${loc.id}_${loc.coordinates[0]}_${loc.coordinates[1]}`;
      weatherCache.set(cacheKey, { data: condition, expires: now + CACHE_TTL_MS });
      resultMap[loc.id] = condition;
    });

    return resultMap;
  } catch {
    // Graceful offline fallback
    toFetch.forEach((loc) => {
      resultMap[loc.id] = getFallbackWeather(loc.id);
    });
    return resultMap;
  }
}


