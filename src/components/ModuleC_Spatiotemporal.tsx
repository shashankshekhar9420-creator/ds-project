import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  CloudSun,
  Droplet,
  Flame,
  Sun,
  Moon,
  Clock,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight,
  Wind,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import type { DataCenterLocation, WeatherCondition, WeatherRecommendation, ElectricityGridTelemetry } from '../types';
import { LOCATIONS } from '../data/locations';
import { simulate24HourCICS } from '../utils/calculator';
import { fetchElectricityTelemetry } from '../services/electricity';
import { MathFormula } from './MathFormula';
import '../styles/optimizer.css';

interface ModuleCSpatiotemporalProps {
  location: DataCenterLocation;
  setLocation: (loc: DataCenterLocation) => void;
  weather: WeatherCondition | null;
  onRefreshWeather: () => void;
  isWeatherLoading: boolean;
  weatherRecommendation?: WeatherRecommendation;
  weatherMap?: Record<string, WeatherCondition>;
}

export const ModuleCSpatiotemporal: React.FC<ModuleCSpatiotemporalProps> = ({
  location,
  setLocation,
  weather,
  onRefreshWeather,
  isWeatherLoading,
  weatherRecommendation,
  weatherMap: _weatherMap,
}) => {
  // Conflict weight: 0.5 = 50% Carbon / 50% Water
  const [carbonWeight, setCarbonWeight] = useState<number>(0.5);
  const [queueMode, setQueueMode] = useState<'urgent' | 'eco'>('urgent');
  const [filterRegion, setFilterRegion] = useState<'all' | 'us' | 'global'>('all');
  const [sortBy, setSortBy] = useState<'rank' | 'water' | 'carbon' | 'temp'>('rank');

  // Electricity Telemetry State
  const [electricity, setElectricity] = useState<ElectricityGridTelemetry | null>(null);
  const [isElectricityLoading, setIsElectricityLoading] = useState<boolean>(false);

  const refreshElectricity = useCallback(async () => {
    setIsElectricityLoading(true);
    try {
      const data = await fetchElectricityTelemetry(location);
      setElectricity(data);
    } catch (err) {
      console.error('Error fetching electricity telemetry:', err);
    } finally {
      setIsElectricityLoading(false);
    }
  }, [location]);

  useEffect(() => {
    refreshElectricity();
  }, [refreshElectricity]);

  // Combined Sync Handler
  const handleSyncAll = () => {
    onRefreshWeather();
    refreshElectricity();
  };

  const isAnyLoading = isWeatherLoading || isElectricityLoading;

  // Simulate 24-hour CICS curve based on current location and weight
  const cicsResult = useMemo(() => {
    return simulate24HourCICS(location, carbonWeight, 14); // current hour = 2 PM peak
  }, [location, carbonWeight]);

  const handleEcoQueueToggle = (mode: 'urgent' | 'eco') => {
    setQueueMode(mode);
    if (mode === 'eco') {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#06b6d4', '#f59e0b'],
      });
    }
  };

  const filteredLocations = useMemo(() => {
    if (filterRegion === 'us') {
      return LOCATIONS.filter((l) => l.country === 'United States');
    }
    if (filterRegion === 'global') {
      return LOCATIONS.filter((l) => l.country !== 'United States');
    }
    return LOCATIONS;
  }, [filterRegion]);

  return (
    <div className="optimizer-container" id="optimizer-module">
      {/* 1. Live Weather & Electricity Telemetry Dual-Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {/* Weather & Temperature Telemetry Card */}
        <div className="weather-banner" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(6, 182, 212, 0.15)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--water-cyan-light)',
                }}
              >
                <CloudSun size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h4 style={{ fontSize: '0.95rem', color: '#fff', margin: 0, fontWeight: 700 }}>
                    {location.name} Weather & Temp
                  </h4>
                  <span className={`badge ${weather?.isLive ? 'badge-cyan' : 'badge-amber'}`} style={{ fontSize: '0.625rem', padding: '1px 6px' }}>
                    {weather?.isLive ? 'Open-Meteo' : 'Climatology'}
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {weather?.weatherDescription || 'Clear'} • {location.coordinates[0].toFixed(1)}°, {location.coordinates[1].toFixed(1)}°
                </div>
              </div>
            </div>

            <button
              className="btn btn-ghost"
              id="refresh-weather-btn"
              onClick={handleSyncAll}
              disabled={isAnyLoading}
              style={{ padding: '4px 8px', fontSize: '0.7rem' }}
              title="Sync live weather and grid telemetry"
            >
              <RefreshCw
                size={12}
                style={{
                  animation: isAnyLoading ? 'spin 1s linear infinite' : 'none',
                }}
              />
              <span>{isAnyLoading ? 'Syncing...' : 'Sync'}</span>
            </button>
          </div>

          <div className="weather-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="weather-stat-item">
              <span className="weather-stat-val glow-cyan" style={{ fontSize: '1.2rem' }}>
                {weather ? `${weather.temperatureC}°C` : '--'}
              </span>
              <span className="weather-stat-sub">
                {weather?.apparentTemperatureC !== undefined ? `Feels ${weather.apparentTemperatureC}°C` : 'Dry-Bulb Temp'}
              </span>
            </div>

            <div className="weather-stat-item">
              <span className="weather-stat-val glow-cyan" style={{ fontSize: '1.2rem' }}>
                {weather ? `${weather.relativeHumidity}%` : '--'}
              </span>
              <span className="weather-stat-sub">Humidity</span>
            </div>

            <div className="weather-stat-item">
              <span className="weather-stat-val glow-amber" style={{ fontSize: '1.2rem' }}>
                {weather ? `${weather.wetBulbC}°C` : '--'}
              </span>
              <span className="weather-stat-sub">Wet-Bulb Limit</span>
            </div>
          </div>
        </div>

        {/* Electricity Consumption & Grid Telemetry Card */}
        <div className="weather-banner" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'rgba(234, 179, 8, 0.15)',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--energy-amber-light)',
                }}
              >
                <Zap size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h4 style={{ fontSize: '0.95rem', color: '#fff', margin: 0, fontWeight: 700 }}>
                    Electrical Grid & Demand
                  </h4>
                  <span className={`badge ${electricity?.isLive ? 'badge-emerald' : 'badge-amber'}`} style={{ fontSize: '0.625rem', padding: '1px 6px' }}>
                    {electricity?.isLive ? 'Live Grid' : 'Regional Dispatch'}
                  </span>
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                  {electricity?.source || 'Grid API'} • {electricity?.updatedAt}
                </div>
              </div>
            </div>

            {electricity?.demandMW && (
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--energy-amber-light)', fontFamily: 'var(--font-mono)' }}>
                  {(electricity.demandMW).toLocaleString()} MW
                </span>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Grid Consumption</div>
              </div>
            )}
          </div>

          <div className="weather-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
            <div className="weather-stat-item">
              <span className="weather-stat-val glow-coral" style={{ fontSize: '1.2rem' }}>
                {electricity ? `${electricity.carbonIntensityGrams}` : '--'}
              </span>
              <span className="weather-stat-sub">gCO₂e/kWh ({electricity?.intensityIndex || 'Intensity'})</span>
            </div>

            <div className="weather-stat-item">
              <span className="weather-stat-val glow-emerald" style={{ fontSize: '1.2rem' }}>
                {electricity ? `${electricity.renewableSharePct}%` : '--'}
              </span>
              <span className="weather-stat-sub">Clean Renewables</span>
            </div>

            <div className="weather-stat-item">
              <span className="weather-stat-val glow-amber" style={{ fontSize: '1.2rem' }}>
                {electricity ? `${electricity.fossilSharePct}%` : '--'}
              </span>
              <span className="weather-stat-sub">Fossil Baseload</span>
            </div>
          </div>

          {/* Micro Generation Fuel Mix Bar */}
          {electricity && electricity.generationMix.length > 0 && (
            <div style={{ marginTop: '0.65rem', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {electricity.generationMix.slice(0, 4).map((g) => (
                <span
                  key={g.fuel}
                  style={{
                    fontSize: '0.68rem',
                    background: 'rgba(255, 255, 255, 0.05)',
                    padding: '2px 7px',
                    borderRadius: '4px',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {g.fuel}: <strong style={{ color: '#fff' }}>{g.percentage}%</strong>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Hydropower Paradox Alert Banner (if applicable) */}
      {location.isHydropowerParadox && (
        <div className="hydro-paradox-alert" id="hydropower-paradox-banner">
          <AlertCircle size={24} style={{ color: '#38bdf8', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', marginBottom: '2px' }}>
              The Hydropower Paradox Active in {location.name} (Xiao et al., 2025)
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
              While {location.name} boasts near-zero carbon intensity (
              <strong>{location.carbonIntensity} kgCO₂e/kWh</strong>) thanks to hydro generation,
              its Scope 2 water footprint skyrockets to{' '}
              <strong style={{ color: '#38bdf8' }}>{location.offSiteEWIF} L/kWh</strong>. Huge
              open-water reservoir surfaces suffer immense sun-driven evaporation, demonstrating that{' '}
              <em>zero-carbon is not zero-water</em>.
            </p>
          </div>
        </div>
      )}

      {/* 3. The "Follow the Sun" vs "Unfollow the Sun" Conflict Slider */}
      <div className="conflict-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--energy-amber)',
                textTransform: 'uppercase',
              }}
            >
              Li et al. (2025) Trade-off Dynamics
            </div>
            <h3 className="font-display" style={{ fontSize: '1.25rem', color: '#fff' }}>
              The "Follow the Sun" vs. "Unfollow the Sun" Conflict
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge badge-coral">Midday: Solar Peak (Low CO₂)</span>
            <span style={{ color: 'var(--text-dim)' }}>vs</span>
            <span className="badge badge-cyan">Midnight: Cool Air (Low Water)</span>
          </div>
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Solar midday brings zero-carbon electricity but maximum ambient heat (spiking cooling
          evaporation). Midnight cools the air (minimizing water loss) but relies on fossil-fueled
          grid baseload. Adjust your priority weight to see the optimal operating hour shift:
        </p>

        {/* Priority Slider */}
        <div
          style={{
            background: 'rgba(3, 7, 18, 0.6)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.8rem',
              fontWeight: 600,
              marginBottom: '0.5rem',
            }}
          >
            <span style={{ color: 'var(--water-cyan-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Droplet size={14} /> Prioritize Water Savings ({((1 - carbonWeight) * 100).toFixed(0)}%)
            </span>
            <span style={{ color: 'var(--carbon-coral-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              Prioritize Carbon Savings ({(carbonWeight * 100).toFixed(0)}%) <Flame size={14} />
            </span>
          </div>

          <input
            type="range"
            id="conflict-priority-slider"
            className="range-slider"
            min={0}
            max={1}
            step={0.05}
            value={carbonWeight}
            onChange={(e) => setCarbonWeight(parseFloat(e.target.value))}
          />

          <div style={{ marginTop: '0.75rem', textAlign: 'center' }}>
            <MathFormula
              formula={`\\text{Cost}(h) = w_{\\text{carbon}} \\cdot \\frac{\\text{Carbon}(h)}{\\text{Carbon}_{\\text{avg}}} + w_{\\text{water}} \\cdot \\frac{\\text{Water}(h)}{\\text{Water}_{\\text{avg}}}`}
            />
          </div>
        </div>

        {/* 24-Hour Visual Timeline */}
        <div className="conflict-timeline-wrapper">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              marginBottom: '0.4rem',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Moon size={13} /> 00:00 Night
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sun size={13} /> 12:00 Solar Peak
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Moon size={13} /> 23:00 Night
            </span>
          </div>

          <div className="timeline-bars-grid">
            {cicsResult.hourlyPoints.map((pt) => {
              const maxCarbonHeight = 50;
              const maxWaterHeight = 50;
              const carbonH = Math.min(maxCarbonHeight, Math.max(6, pt.carbonIntensity * 90));
              const waterH = Math.min(maxWaterHeight, Math.max(6, pt.effectiveWUE * 35));

              return (
                <div
                  key={pt.hour}
                  className="hour-bar-col"
                  title={`${pt.label} | Carbon: ${pt.carbonIntensity} kg/kWh | WUE: ${pt.effectiveWUE} L/kWh | Cost: ${pt.cost.toFixed(2)}`}
                >
                  {pt.isOptimal && (
                    <div className="optimal-hour-indicator" title="Optimal Hour" />
                  )}
                  <div className="hour-bar-carbon" style={{ height: `${carbonH}px` }} />
                  <div className="hour-bar-water" style={{ height: `${waterH}px` }} />
                </div>
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '0.65rem',
              fontSize: '0.72rem',
            }}
          >
            <div style={{ display: 'flex', gap: '1rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', background: '#f43f5e', borderRadius: '2px' }} />
                Carbon Intensity (gCO₂/kWh)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '8px', height: '8px', background: '#0284c7', borderRadius: '2px' }} />
                Cooling Evaporation (WUE)
              </span>
            </div>

            <span style={{ color: 'var(--eco-emerald-light)', fontWeight: 600 }}>
              ★ Optimal Scheduling Window: {cicsResult.optimalHour}:00
            </span>
          </div>
        </div>
      </div>

      {/* 4. Google CICS Flexible Batch Queue Simulator */}
      <div className="cics-simulator-card" id="cics-simulator">
        <div className="cics-controls">
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--eco-emerald)',
                textTransform: 'uppercase',
              }}
            >
              Radovanović et al. (2023) CICS Implementation
            </div>
            <h3 className="font-display" style={{ fontSize: '1.25rem', color: '#fff' }}>
              Google CICS Flexible Batch Queue Simulator
            </h3>
          </div>

          {/* Urgent vs Eco-Queue Buttons */}
          <div className="cics-toggle-group">
            <button
              className={`cics-mode-btn urgent ${queueMode === 'urgent' ? 'active' : ''}`}
              id="cics-mode-urgent-btn"
              onClick={() => handleEcoQueueToggle('urgent')}
            >
              <Clock size={14} /> Urgent (Run Now)
            </button>
            <button
              className={`cics-mode-btn eco ${queueMode === 'eco' ? 'active' : ''}`}
              id="cics-mode-eco-btn"
              onClick={() => handleEcoQueueToggle('eco')}
            >
              <Sparkles size={14} /> Eco-Queue (Shift up to 24h)
            </button>
          </div>
        </div>

        {queueMode === 'urgent' ? (
          <div
            style={{
              background: 'rgba(3, 7, 18, 0.5)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(244, 63, 94, 0.2)',
            }}
          >
            <div style={{ color: 'var(--carbon-coral-light)', fontWeight: 600, fontSize: '0.9rem' }}>
              Running Inflexible Query Immediately at Peak Afternoon Hour ({cicsResult.currentHour}:00)
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              This query executes against peak ambient temperatures and high thermal stress with
              zero load shifting.
            </p>
          </div>
        ) : (
          <div
            style={{
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '1.25rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: 'rgba(16, 185, 129, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--eco-emerald-light)',
                }}
              >
                <CheckCircle2 size={24} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
                  Computation Shifted to Optimal Window: {cicsResult.optimalHour}:00
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--eco-emerald-light)' }}>
                  Delayed {cicsResult.delayHours} hours into low-carbon / cool-temperature valley.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1.25rem' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem', fontWeight: 800, color: 'var(--eco-emerald-light)' }}>
                  -{cicsResult.carbonSavingsPercent}%
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Carbon Saved</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem', fontWeight: 800, color: 'var(--water-cyan-light)' }}>
                  -{cicsResult.waterSavingsPercent}%
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Water Saved</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Real-Time Global Weather Recommendation & Siting Matrix */}
      <div className="glass-panel" id="siting-matrix">
        {/* Real-time Weather Recommendation Hero Banner */}
        {weatherRecommendation && (
          <div
            className="weather-hero-recommendation-panel"
            style={{ marginBottom: '1.75rem' }}
            id="weather-recommendation-hero-card"
          >
            <div className="recom-hero-left">
              <div className="recom-badge-live">
                <CloudSun size={14} />
                <span>OPEN-METEO LIVE RECOMMENDATION ENGINE</span>
              </div>
              <h3 className="recom-hero-title">
                {weatherRecommendation.isCurrentOptimal ? (
                  <span>★ Optimal Siting Active: {location.name}</span>
                ) : (
                  <span>
                    Recommendation: Route to {weatherRecommendation.bestOverall.location.name}
                  </span>
                )}
              </h3>
              <p className="recom-hero-desc">
                {weatherRecommendation.isCurrentOptimal ? (
                  <>
                    Your current hub ({location.name}) offers the lowest composite water & carbon footprint globally under current weather ({weather?.temperatureC}°C, {weather?.relativeHumidity}% RH).
                  </>
                ) : (
                  <>
                    Based on real-time Open-Meteo telemetry across all 18 coordinates, {weatherRecommendation.bestOverall.location.name} is currently experiencing {weatherRecommendation.bestOverall.weather.temperatureC}°C ambient temperatures ({weatherRecommendation.bestOverall.coolingStatus === 'free-cooling' ? 'free air-cooling economizer active' : 'favorable thermodynamic wet-bulb'}), reducing evaporative water stress.
                  </>
                )}
              </p>

              <div className="recom-hero-stats">
                <div className="recom-stat-capsule">
                  <span className="recom-stat-num" style={{ color: 'var(--water-cyan-light)' }}>
                    {weatherRecommendation.bestOverall.totalWaterMl.toFixed(2)} mL
                  </span>
                  <span className="recom-stat-lbl">
                    Water / Query {weatherRecommendation.bestOverall.waterSavingsVsCurrentPct > 0 ? `(-${weatherRecommendation.bestOverall.waterSavingsVsCurrentPct}%)` : '(Active Best)'}
                  </span>
                </div>

                <div className="recom-stat-capsule">
                  <span className="recom-stat-num" style={{ color: 'var(--eco-emerald-light)' }}>
                    {weatherRecommendation.bestOverall.carbonGrams.toFixed(2)} g
                  </span>
                  <span className="recom-stat-lbl">
                    Carbon / Query {weatherRecommendation.bestOverall.carbonSavingsVsCurrentPct > 0 ? `(-${weatherRecommendation.bestOverall.carbonSavingsVsCurrentPct}%)` : '(Active Best)'}
                  </span>
                </div>

                <div className="recom-stat-capsule">
                  <span className="recom-stat-num" style={{ color: '#ffffff' }}>
                    {weatherRecommendation.bestOverall.weather.temperatureC}°C
                  </span>
                  <span className="recom-stat-lbl">
                    Ambient Temp ({weatherRecommendation.bestOverall.weather.wetBulbC}°C Wet-Bulb)
                  </span>
                </div>

                <div className="recom-stat-capsule">
                  <span className="recom-stat-num" style={{ color: 'var(--energy-amber)' }}>
                    {weatherRecommendation.bestOverall.effectiveWUE.toFixed(3)} L/kWh
                  </span>
                  <span className="recom-stat-lbl">Effective On-Site WUE</span>
                </div>
              </div>
            </div>

            <div>
              {!weatherRecommendation.isCurrentOptimal ? (
                <button
                  type="button"
                  className="btn-apply-recommendation"
                  id="btn-apply-weather-recommendation-module-c"
                  onClick={() => setLocation(weatherRecommendation.bestOverall.location)}
                  style={{ padding: '10px 18px', fontSize: '0.85rem' }}
                >
                  <span>Route to {weatherRecommendation.bestOverall.location.name}</span>
                  <ArrowUpRight size={15} />
                </button>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--eco-emerald-light)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    background: 'rgba(16, 185, 129, 0.15)',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Optimal Siting Active</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}
            >
              18 Hyperscale Hubs Live Telemetry Matrix
            </div>
            <h3 className="font-display" style={{ fontSize: '1.2rem', color: '#fff' }}>
              Real-Time Weather & Siting Leaderboard
            </h3>
          </div>

          {/* Sort & Filter Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Sort Dropdown / Buttons */}
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255, 255, 255, 0.04)', padding: '2px', borderRadius: '6px' }}>
              <button
                type="button"
                className={`btn btn-ghost`}
                style={{
                  padding: '3px 8px',
                  fontSize: '0.7rem',
                  background: sortBy === 'rank' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  color: sortBy === 'rank' ? '#fff' : 'var(--text-muted)',
                }}
                onClick={() => setSortBy('rank')}
              >
                ★ Best Rank
              </button>
              <button
                type="button"
                className={`btn btn-ghost`}
                style={{
                  padding: '3px 8px',
                  fontSize: '0.7rem',
                  background: sortBy === 'water' ? 'rgba(6, 182, 212, 0.25)' : 'transparent',
                  color: sortBy === 'water' ? 'var(--water-cyan-light)' : 'var(--text-muted)',
                }}
                onClick={() => setSortBy('water')}
              >
                💧 Lowest Water
              </button>
              <button
                type="button"
                className={`btn btn-ghost`}
                style={{
                  padding: '3px 8px',
                  fontSize: '0.7rem',
                  background: sortBy === 'carbon' ? 'rgba(16, 185, 129, 0.25)' : 'transparent',
                  color: sortBy === 'carbon' ? 'var(--eco-emerald-light)' : 'var(--text-muted)',
                }}
                onClick={() => setSortBy('carbon')}
              >
                ☁️ Lowest Carbon
              </button>
              <button
                type="button"
                className={`btn btn-ghost`}
                style={{
                  padding: '3px 8px',
                  fontSize: '0.7rem',
                  background: sortBy === 'temp' ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                  color: sortBy === 'temp' ? '#fff' : 'var(--text-muted)',
                }}
                onClick={() => setSortBy('temp')}
              >
                ❄️ Coldest
              </button>
            </div>

            {/* Region Filter */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                className={`btn btn-ghost`}
                id="filter-loc-all"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  background: filterRegion === 'all' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                }}
                onClick={() => setFilterRegion('all')}
              >
                All (18)
              </button>
              <button
                className={`btn btn-ghost`}
                id="filter-loc-us"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  background: filterRegion === 'us' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                }}
                onClick={() => setFilterRegion('us')}
              >
                U.S. Only
              </button>
              <button
                className={`btn btn-ghost`}
                id="filter-loc-global"
                style={{
                  padding: '4px 10px',
                  fontSize: '0.75rem',
                  background: filterRegion === 'global' ? 'rgba(6, 182, 212, 0.2)' : 'transparent',
                }}
                onClick={() => setFilterRegion('global')}
              >
                Global
              </button>
            </div>
          </div>
        </div>

        <div className="siting-table-container">
          <table className="siting-table">
            <thead>
              <tr>
                <th>Rank & Location</th>
                <th>Region</th>
                <th>Live Weather (Open-Meteo)</th>
                <th>Thermodynamic Regime</th>
                <th>Adjusted WUE</th>
                <th>Grid Carbon</th>
                <th>Water / Query</th>
                <th>Carbon / Query</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {(weatherRecommendation?.rankings || []).length > 0
                ? (() => {
                    let list = [...weatherRecommendation!.rankings];
                    if (filterRegion === 'us') {
                      list = list.filter((r) => r.location.country === 'United States');
                    } else if (filterRegion === 'global') {
                      list = list.filter((r) => r.location.country !== 'United States');
                    }
                    if (sortBy === 'water') {
                      list.sort((a, b) => a.totalWaterMl - b.totalWaterMl);
                    } else if (sortBy === 'carbon') {
                      list.sort((a, b) => a.carbonGrams - b.carbonGrams);
                    } else if (sortBy === 'temp') {
                      list.sort((a, b) => a.weather.temperatureC - b.weather.temperatureC);
                    } else {
                      list.sort((a, b) => a.compositeScore - b.compositeScore);
                    }

                    return list.map((item, idx) => {
                      const isSelected = item.location.id === location.id;
                      return (
                        <tr key={item.location.id} className={isSelected ? 'active-location' : ''}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span
                                className={`rank-badge ${
                                  idx === 0 ? 'top-1' : idx === 1 ? 'top-2' : idx === 2 ? 'top-3' : ''
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <strong style={{ color: '#fff' }}>{item.location.name}</strong>
                                  {idx === 0 && (
                                    <span className="badge badge-emerald" title="Top Recommended Hub">
                                      ★ #1 Best
                                    </span>
                                  )}
                                  {item.location.isWaterStressed && (
                                    <span className="badge badge-coral" title="Severe Water Stress Basin">
                                      Stress
                                    </span>
                                  )}
                                  {item.location.isHydropowerParadox && (
                                    <span className="badge badge-cyan" title="Hydropower Paradox">
                                      Hydro
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                  {item.location.country}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{item.location.region}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#fff' }}>
                                {item.weather.temperatureC}°C
                              </span>
                              <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                                ({item.weather.relativeHumidity}%)
                              </span>
                              <span
                                style={{
                                  fontSize: '0.625rem',
                                  padding: '1px 4px',
                                  borderRadius: '3px',
                                  background: item.weather.isLive ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                  color: item.weather.isLive ? 'var(--water-cyan-light)' : 'var(--text-muted)',
                                }}
                              >
                                {item.weather.isLive ? 'Live' : 'Est'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                              Wet-Bulb: {item.weather.wetBulbC}°C
                            </div>
                          </td>
                          <td>
                            <span
                              className={`cooling-badge ${
                                item.coolingStatus === 'free-cooling'
                                  ? 'free'
                                  : item.coolingStatus === 'high-evaporative'
                                  ? 'hot'
                                  : 'mod'
                              }`}
                            >
                              {item.coolingStatus === 'free-cooling' && <Wind size={11} />}
                              {item.coolingStatus === 'high-evaporative' && <Flame size={11} />}
                              {item.coolingStatus === 'moderate' && <CloudSun size={11} />}
                              <span>
                                {item.coolingStatus === 'free-cooling'
                                  ? 'Free Air-Cooling'
                                  : item.coolingStatus === 'high-evaporative'
                                  ? 'Heat Evaporative'
                                  : 'Economizer Mod.'}
                              </span>
                            </span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)' }}>
                            <span style={{ color: item.effectiveWUE < 0.2 ? 'var(--eco-emerald-light)' : 'inherit' }}>
                              {item.effectiveWUE.toFixed(3)}
                            </span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: '3px' }}>
                              L/kWh
                            </span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                            {item.location.carbonIntensity.toFixed(3)} kg/kWh
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--water-cyan-light)', fontWeight: 600 }}>
                            {item.totalWaterMl.toFixed(2)} mL
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--carbon-coral-light)' }}>
                            {item.carbonGrams.toFixed(2)} g
                          </td>
                          <td>
                            <button
                              className="btn btn-ghost"
                              id={`select-loc-${item.location.id}`}
                              style={{
                                padding: '4px 10px',
                                fontSize: '0.72rem',
                                background: isSelected ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                                color: isSelected ? '#ffffff' : 'var(--text-secondary)',
                                fontWeight: isSelected ? 700 : 500,
                              }}
                              onClick={() => setLocation(item.location)}
                            >
                              {isSelected ? 'Active' : 'Route Here'}
                            </button>
                          </td>
                        </tr>
                      );
                    });
                  })()
                : filteredLocations.map((loc) => {
                    const isSelected = loc.id === location.id;
                    return (
                      <tr key={loc.id} className={isSelected ? 'active-location' : ''}>
                        <td>
                          <strong>{loc.name}</strong>
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>{loc.region}</td>
                        <td>--</td>
                        <td>--</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{loc.onSiteWUE.toFixed(3)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{loc.carbonIntensity.toFixed(3)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--water-cyan-light)' }}>
                          {loc.baselineGpt3WaterMl.toFixed(1)} mL
                        </td>
                        <td>--</td>
                        <td>
                          <button
                            className="btn btn-ghost"
                            id={`select-loc-${loc.id}`}
                            style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                            onClick={() => setLocation(loc)}
                          >
                            {isSelected ? 'Active' : 'Select'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
