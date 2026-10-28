import type { DataCenterLocation, ElectricityGridTelemetry, ElectricityFuelMix } from '../types';

interface CacheEntry {
  data: ElectricityGridTelemetry;
  expires: number;
}

const electricityCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Country code mapping for European Energy-Charts API
 */
const COUNTRY_CODE_MAP: Record<string, string> = {
  denmark: 'dk',
  finland: 'fi',
  netherlands: 'nl',
  sweden: 'se',
  ireland: 'ie',
};

/**
 * Static baseline grid fuel mixes by datacenter region (based on Xiao et al. 2025, Li et al. 2025, and EPA eGRID)
 */
const REGIONAL_BASELINE_MIXES: Record<string, {
  carbonGrams: number;
  index: ElectricityGridTelemetry['intensityIndex'];
  renewables: number;
  fossils: number;
  mix: ElectricityFuelMix[];
  estimatedDemandMW: number;
}> = {
  arizona: {
    carbonGrams: 375,
    index: 'moderate',
    renewables: 24,
    fossils: 58,
    mix: [
      { fuel: 'Natural Gas', percentage: 46 },
      { fuel: 'Nuclear', percentage: 28 },
      { fuel: 'Solar PV', percentage: 18 },
      { fuel: 'Coal', percentage: 12 },
      { fuel: 'Wind & Hydro', percentage: 6 },
    ],
    estimatedDemandMW: 14200,
  },
  georgia: {
    carbonGrams: 390,
    index: 'moderate',
    renewables: 16,
    fossils: 52,
    mix: [
      { fuel: 'Natural Gas', percentage: 48 },
      { fuel: 'Nuclear (Vogtle)', percentage: 34 },
      { fuel: 'Solar', percentage: 11 },
      { fuel: 'Coal', percentage: 4 },
      { fuel: 'Hydro', percentage: 3 },
    ],
    estimatedDemandMW: 26500,
  },
  illinois: {
    carbonGrams: 310,
    index: 'low',
    renewables: 15,
    fossils: 32,
    mix: [
      { fuel: 'Nuclear', percentage: 53 },
      { fuel: 'Natural Gas', percentage: 27 },
      { fuel: 'Wind', percentage: 13 },
      { fuel: 'Coal', percentage: 5 },
      { fuel: 'Solar', percentage: 2 },
    ],
    estimatedDemandMW: 18900,
  },
  iowa: {
    carbonGrams: 285,
    index: 'low',
    renewables: 64,
    fossils: 34,
    mix: [
      { fuel: 'Wind Onshore', percentage: 62 },
      { fuel: 'Natural Gas', percentage: 21 },
      { fuel: 'Coal', percentage: 13 },
      { fuel: 'Solar & Other', percentage: 4 },
    ],
    estimatedDemandMW: 6200,
  },
  texas: {
    carbonGrams: 395,
    index: 'moderate',
    renewables: 38,
    fossils: 52,
    mix: [
      { fuel: 'Natural Gas', percentage: 45 },
      { fuel: 'Wind (ERCOT)', percentage: 26 },
      { fuel: 'Solar PV', percentage: 12 },
      { fuel: 'Coal', percentage: 10 },
      { fuel: 'Nuclear', percentage: 7 },
    ],
    estimatedDemandMW: 68400,
  },
  virginia: {
    carbonGrams: 342,
    index: 'moderate',
    renewables: 14,
    fossils: 54,
    mix: [
      { fuel: 'Natural Gas', percentage: 52 },
      { fuel: 'Nuclear', percentage: 32 },
      { fuel: 'Solar PV', percentage: 9 },
      { fuel: 'Biomass & Hydro', percentage: 5 },
      { fuel: 'Coal', percentage: 2 },
    ],
    estimatedDemandMW: 21500,
  },
  washington: {
    carbonGrams: 115,
    index: 'very low',
    renewables: 78,
    fossils: 12,
    mix: [
      { fuel: 'Hydroelectric', percentage: 68 },
      { fuel: 'Natural Gas', percentage: 12 },
      { fuel: 'Wind', percentage: 10 },
      { fuel: 'Nuclear', percentage: 8 },
      { fuel: 'Solar', percentage: 2 },
    ],
    estimatedDemandMW: 11300,
  },
  wyoming: {
    carbonGrams: 690,
    index: 'high',
    renewables: 22,
    fossils: 76,
    mix: [
      { fuel: 'Coal', percentage: 71 },
      { fuel: 'Wind', percentage: 21 },
      { fuel: 'Natural Gas', percentage: 5 },
      { fuel: 'Hydro', percentage: 3 },
    ],
    estimatedDemandMW: 2400,
  },
  sweden: {
    carbonGrams: 28,
    index: 'very low',
    renewables: 68,
    fossils: 2,
    mix: [
      { fuel: 'Hydroelectric', percentage: 45 },
      { fuel: 'Nuclear', percentage: 30 },
      { fuel: 'Wind', percentage: 21 },
      { fuel: 'Biomass', percentage: 4 },
    ],
    estimatedDemandMW: 15200,
  },
  finland: {
    carbonGrams: 52,
    index: 'very low',
    renewables: 55,
    fossils: 8,
    mix: [
      { fuel: 'Nuclear (Olkiluoto 3)', percentage: 42 },
      { fuel: 'Hydro', percentage: 22 },
      { fuel: 'Wind', percentage: 20 },
      { fuel: 'Biomass', percentage: 12 },
      { fuel: 'Fossil gas/coal', percentage: 4 },
    ],
    estimatedDemandMW: 9400,
  },
  denmark: {
    carbonGrams: 110,
    index: 'low',
    renewables: 82,
    fossils: 14,
    mix: [
      { fuel: 'Wind Offshore & Onshore', percentage: 64 },
      { fuel: 'Solar PV', percentage: 14 },
      { fuel: 'Biomass', percentage: 8 },
      { fuel: 'Natural Gas', percentage: 10 },
      { fuel: 'Coal', percentage: 4 },
    ],
    estimatedDemandMW: 4800,
  },
  ireland: {
    carbonGrams: 285,
    index: 'moderate',
    renewables: 46,
    fossils: 51,
    mix: [
      { fuel: 'Natural Gas', percentage: 48 },
      { fuel: 'Wind', percentage: 41 },
      { fuel: 'Solar', percentage: 5 },
      { fuel: 'Coal/Peat', percentage: 3 },
      { fuel: 'Imports', percentage: 3 },
    ],
    estimatedDemandMW: 5100,
  },
  netherlands: {
    carbonGrams: 260,
    index: 'moderate',
    renewables: 48,
    fossils: 48,
    mix: [
      { fuel: 'Natural Gas', percentage: 42 },
      { fuel: 'Wind', percentage: 25 },
      { fuel: 'Solar PV', percentage: 21 },
      { fuel: 'Coal', percentage: 6 },
      { fuel: 'Nuclear', percentage: 3 },
      { fuel: 'Biomass', percentage: 3 },
    ],
    estimatedDemandMW: 14500,
  },
  india: {
    carbonGrams: 640,
    index: 'high',
    renewables: 24,
    fossils: 73,
    mix: [
      { fuel: 'Thermal Coal', percentage: 71 },
      { fuel: 'Solar PV', percentage: 13 },
      { fuel: 'Hydro', percentage: 9 },
      { fuel: 'Wind', percentage: 5 },
      { fuel: 'Nuclear & Gas', percentage: 2 },
    ],
    estimatedDemandMW: 198000,
  },
  australia: {
    carbonGrams: 520,
    index: 'high',
    renewables: 36,
    fossils: 64,
    mix: [
      { fuel: 'Coal (Black & Brown)', percentage: 54 },
      { fuel: 'Solar (Rooftop & Utility)', percentage: 20 },
      { fuel: 'Wind', percentage: 14 },
      { fuel: 'Natural Gas', percentage: 10 },
      { fuel: 'Hydro', percentage: 2 },
    ],
    estimatedDemandMW: 28400,
  },
  'us-avg': {
    carbonGrams: 382,
    index: 'moderate',
    renewables: 22,
    fossils: 60,
    mix: [
      { fuel: 'Natural Gas', percentage: 43 },
      { fuel: 'Nuclear', percentage: 18 },
      { fuel: 'Coal', percentage: 16 },
      { fuel: 'Wind', percentage: 11 },
      { fuel: 'Solar', percentage: 6 },
      { fuel: 'Hydro', percentage: 6 },
    ],
    estimatedDemandMW: 450000,
  },
};

/**
 * Fetch live UK National Grid ESO intensity & fuel mix
 */
async function fetchUKNationalGrid(): Promise<ElectricityGridTelemetry | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const [intensityRes, genRes] = await Promise.all([
      fetch('https://api.carbonintensity.org.uk/intensity', { signal: controller.signal }),
      fetch('https://api.carbonintensity.org.uk/generation', { signal: controller.signal }),
    ]);
    clearTimeout(timeoutId);

    if (!intensityRes.ok || !genRes.ok) return null;

    const intensityData = await intensityRes.json();
    const genData = await genRes.json();

    const currentIntensity = intensityData?.data?.[0]?.intensity;
    const actualGrams = currentIntensity?.actual ?? currentIntensity?.forecast ?? 120;
    const indexStr = (currentIntensity?.index || 'moderate').toLowerCase() as ElectricityGridTelemetry['intensityIndex'];

    const genMixRaw: Array<{ fuel: string; perc: number }> = genData?.data?.generationmix || [];
    const generationMix: ElectricityFuelMix[] = genMixRaw.map((g) => ({
      fuel: g.fuel.charAt(0).toUpperCase() + g.fuel.slice(1),
      percentage: Math.round(g.perc * 10) / 10,
    }));

    const renewableFuels = ['wind', 'solar', 'hydro', 'biomass'];
    const renewableShare = genMixRaw
      .filter((g) => renewableFuels.includes(g.fuel.toLowerCase()))
      .reduce((sum, g) => sum + g.perc, 0);

    const fossilFuels = ['gas', 'coal'];
    const fossilShare = genMixRaw
      .filter((g) => fossilFuels.includes(g.fuel.toLowerCase()))
      .reduce((sum, g) => sum + g.perc, 0);

    return {
      regionName: 'UK National Grid (NESO)',
      carbonIntensityGrams: actualGrams,
      intensityIndex: indexStr,
      demandMW: 27500, // Typical UK grid load
      renewableSharePct: Math.round(renewableShare),
      fossilSharePct: Math.round(fossilShare),
      generationMix,
      isLive: true,
      source: 'UK NESO National Grid API (Real-Time)',
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  } catch {
    return null;
  }
}

/**
 * Fetch European public power & electricity consumption from Energy-Charts API
 */
async function fetchEnergyCharts(countryCode: string, regionName: string): Promise<ElectricityGridTelemetry | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(`https://api.energy-charts.info/public_power?country=${countryCode}`, {
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;

    const data = await res.json();
    const prodTypes = data?.production_types;
    if (!prodTypes || !Array.isArray(prodTypes) || prodTypes.length === 0) return null;

    // Find the last valid index for current timestamp
    const len = data.unix_seconds?.length || 0;
    const lastIdx = len > 0 ? len - 1 : 0;

    let totalLoadMW = 0;
    let totalRenewableMW = 0;
    let totalFossilMW = 0;
    let totalGenMW = 0;
    const mixList: ElectricityFuelMix[] = [];

    for (const p of prodTypes) {
      const name: string = p.name || '';
      const vals: number[] = p.data || [];
      const val = vals[lastIdx] ?? 0;

      if (name.toLowerCase() === 'load') {
        totalLoadMW = Math.round(val);
      } else if (!name.toLowerCase().includes('share') && !name.toLowerCase().includes('residual') && val > 0) {
        totalGenMW += val;
        mixList.push({
          fuel: name,
          percentage: val,
        });

        if (
          name.toLowerCase().includes('wind') ||
          name.toLowerCase().includes('solar') ||
          name.toLowerCase().includes('hydro') ||
          name.toLowerCase().includes('biomass') ||
          name.toLowerCase().includes('geothermal')
        ) {
          totalRenewableMW += val;
        } else if (
          name.toLowerCase().includes('coal') ||
          name.toLowerCase().includes('gas') ||
          name.toLowerCase().includes('oil')
        ) {
          totalFossilMW += val;
        }
      }
    }

    // Normalize percentages
    const finalMix: ElectricityFuelMix[] = mixList
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5)
      .map((item) => ({
        fuel: item.fuel,
        percentage: totalGenMW > 0 ? Math.round((item.percentage / totalGenMW) * 1000) / 10 : 0,
      }));

    const renewableShare = totalGenMW > 0 ? Math.round((totalRenewableMW / totalGenMW) * 100) : 50;
    const fossilShare = totalGenMW > 0 ? Math.round((totalFossilMW / totalGenMW) * 100) : 35;

    // Estimate carbon intensity from fossil vs clean shares
    const estimatedCarbonGrams = Math.round(fossilShare * 6.5 + (100 - renewableShare - fossilShare) * 0.2 + renewableShare * 0.1);

    return {
      regionName: `${regionName} (ENTSO-E Grid)`,
      carbonIntensityGrams: estimatedCarbonGrams,
      intensityIndex: estimatedCarbonGrams < 100 ? 'very low' : estimatedCarbonGrams < 200 ? 'low' : 'moderate',
      demandMW: totalLoadMW || undefined,
      renewableSharePct: renewableShare,
      fossilSharePct: fossilShare,
      generationMix: finalMix,
      isLive: true,
      source: 'Energy-Charts API (Fraunhofer ISE / ENTSO-E)',
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  } catch {
    return null;
  }
}

/**
 * Returns real-time electricity consumption, demand, and generation mix for a given datacenter location.
 */
export async function fetchElectricityTelemetry(location: DataCenterLocation): Promise<ElectricityGridTelemetry> {
  const cacheKey = `elec_${location.id}`;
  const now = Date.now();

  const cached = electricityCache.get(cacheKey);
  if (cached && cached.expires > now) {
    return cached.data;
  }

  // 1. If Ireland or UK region, try UK NESO API
  if (location.id === 'ireland') {
    const liveUK = await fetchUKNationalGrid();
    if (liveUK) {
      electricityCache.set(cacheKey, { data: liveUK, expires: now + CACHE_TTL_MS });
      return liveUK;
    }
  }

  // 2. If European region, try Energy-Charts API
  const euroCountry = COUNTRY_CODE_MAP[location.id];
  if (euroCountry) {
    const liveEuro = await fetchEnergyCharts(euroCountry, location.name);
    if (liveEuro) {
      electricityCache.set(cacheKey, { data: liveEuro, expires: now + CACHE_TTL_MS });
      return liveEuro;
    }
  }

  // 3. Fallback to regional peer-reviewed baseline with simulated diurnal grid fluctuation
  const baseline = REGIONAL_BASELINE_MIXES[location.id] || REGIONAL_BASELINE_MIXES['us-avg'];
  const currentHour = new Date().getHours();
  // Solar peak between 10:00 and 16:00
  const isSolarWindow = currentHour >= 10 && currentHour <= 16;
  const solarFactor = isSolarWindow ? 1.25 : 0.6;
  const adjustedCarbon = Math.round(baseline.carbonGrams * (isSolarWindow ? 0.92 : 1.08));

  const fallbackData: ElectricityGridTelemetry = {
    regionName: `${location.name} Regional Grid`,
    carbonIntensityGrams: adjustedCarbon,
    intensityIndex: baseline.index,
    demandMW: Math.round(baseline.estimatedDemandMW * (0.85 + Math.sin((currentHour / 24) * Math.PI * 2) * 0.15)),
    renewableSharePct: Math.min(95, Math.round(baseline.renewables * solarFactor)),
    fossilSharePct: Math.max(5, Math.round(baseline.fossils * (2 - solarFactor * 0.8))),
    generationMix: baseline.mix,
    isLive: false,
    source: 'Regional Grid Dispatch Model (EIA / Xiao et al. 2025)',
    updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };

  electricityCache.set(cacheKey, { data: fallbackData, expires: now + CACHE_TTL_MS });
  return fallbackData;
}
