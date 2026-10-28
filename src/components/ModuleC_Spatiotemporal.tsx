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
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#2563EB', '#1D4ED8', '#6B7280'],
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        {/* Weather & Temperature Telemetry Card */}
        <div className="weather-banner" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)',
                }}
              >
                <CloudSun size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ fontSize: '1rem', color: 'var(--text)', margin: 0, fontWeight: 600 }}>
                    {location.name} Weather & Temp
                  </h4>
                  <span className="badge" style={{ fontSize: '0.6875rem' }}>
                    {weather?.isLive ? 'Open-Meteo' : 'Climatology'}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {weather?.weatherDescription || 'Clear'} • {location.coordinates[0].toFixed(1)}°, {location.coordinates[1].toFixed(1)}°
                </div>
              </div>
            </div>

            <button
              className="btn-secondary btn-sm"
              id="refresh-weather-btn"
              onClick={handleSyncAll}
              disabled={isAnyLoading}
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

          <div className="weather-stats">
            <div className="weather-stat-item">
              <span className="weather-stat-val">
                {weather ? `${weather.temperatureC}°C` : '--'}
              </span>
              <span className="weather-stat-sub">
                {weather?.apparentTemperatureC !== undefined ? `Feels ${weather.apparentTemperatureC}°C` : 'Dry-Bulb Temp'}
              </span>
            </div>

            <div className="weather-stat-item">
              <span className="weather-stat-val">
                {weather ? `${weather.relativeHumidity}%` : '--'}
              </span>
              <span className="weather-stat-sub">Humidity</span>
            </div>

            <div className="weather-stat-item">
              <span className="weather-stat-val">
                {weather ? `${weather.wetBulbC}°C` : '--'}
              </span>
              <span className="weather-stat-sub">Wet-Bulb Limit</span>
            </div>
          </div>
        </div>

        {/* Electricity Consumption & Grid Telemetry Card */}
        <div className="weather-banner" style={{ margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)',
                }}
              >
                <Zap size={18} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h4 style={{ fontSize: '1rem', color: 'var(--text)', margin: 0, fontWeight: 600 }}>
                    Regional Electric Grid Telemetry
                  </h4>
                  <span className="badge" style={{ fontSize: '0.6875rem' }}>
                    {electricity?.isLive ? 'Live Grid' : 'Regional Dispatch'}
                  </span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {electricity?.source || 'Grid API'} • {electricity?.updatedAt}
                </div>
              </div>
            </div>

            {electricity?.demandMW && (
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                  {(electricity.demandMW).toLocaleString()} MW
                </span>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Grid Power Demand</div>
              </div>
            )}
          </div>

          <div className="weather-stats">
            <div className="weather-stat-item">
              <span className="weather-stat-val">
                {electricity ? `${electricity.carbonIntensityGrams}` : '--'}
              </span>
              <span className="weather-stat-sub">gCO₂e/kWh ({electricity?.intensityIndex || 'Intensity'})</span>
            </div>

            <div className="weather-stat-item">
              <span className="weather-stat-val">
                {electricity ? `${electricity.renewableSharePct}%` : '--'}
              </span>
              <span className="weather-stat-sub">Clean Renewables</span>
            </div>

            <div className="weather-stat-item">
              <span className="weather-stat-val">
                {electricity ? `${electricity.fossilSharePct}%` : '--'}
              </span>
              <span className="weather-stat-sub">Fossil Fuel Power</span>
            </div>
          </div>

          {/* Micro Generation Fuel Mix Bar */}
          {electricity && electricity.generationMix.length > 0 && (
            <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap', width: '100%' }}>
              {electricity.generationMix.slice(0, 4).map((g) => (
                <span
                  key={g.fuel}
                  style={{
                    fontSize: '0.75rem',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    padding: '3px 8px',
                    borderRadius: 'var(--radius)',
                    color: 'var(--text-muted)',
                  }}
                >
                  {g.fuel}: <strong style={{ color: 'var(--text)' }}>{g.percentage}%</strong>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Hydropower Paradox Alert Banner (if applicable) */}
      {location.isHydropowerParadox && (
        <div className="hydro-paradox-alert" id="hydropower-paradox-banner">
          <AlertCircle size={22} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.95rem', color: 'var(--text)', marginBottom: '4px' }}>
              The Clean-Energy Paradox in {location.name} (Xiao et al., 2025)
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6, maxWidth: '100%' }}>
              While {location.name} produces almost zero carbon emissions (
              <strong>{location.carbonIntensity} kgCO₂e/kWh</strong>) by relying on hydroelectric dams,
              its off-site water footprint reaches an extraordinary{' '}
              <strong style={{ color: 'var(--accent)' }}>{location.offSiteEWIF} L/kWh</strong>. Enormous
              open-water reservoir surfaces lose millions of liters of water to sunlight and wind evaporation, proving that{' '}
              <em>clean electricity is not always water-free electricity</em>.
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
            gap: '12px',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Li et al. (2025) Trade-off Dynamics
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text)', fontWeight: 600 }}>
              The Midday Solar vs. Midnight Cooling Dilemma
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="badge">Midday: Solar Peak (Low CO₂, High Heat)</span>
            <span style={{ color: 'var(--text-muted)' }}>vs</span>
            <span className="badge">Midnight: Cold Air (Low Water, Fossil Grid)</span>
          </div>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: '65ch' }}>
          During sunny afternoons, solar panels generate abundant clean electricity, keeping carbon emissions low. But hot afternoon temperatures force datacenter cooling towers to evaporate large volumes of water. At midnight, cool outdoor air lets datacenters cool servers with outside air alone, but the grid often relies on fossil fuels when the sun isn't shining. Adjust the slider to choose which priority matters more to you:
        </p>

        {/* Priority Slider */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '16px',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.8125rem',
              fontWeight: 500,
              marginBottom: '8px',
              color: 'var(--text)',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Droplet size={14} style={{ color: 'var(--accent)' }} /> Prioritize Water Savings ({((1 - carbonWeight) * 100).toFixed(0)}%)
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Prioritize Carbon Savings ({(carbonWeight * 100).toFixed(0)}%) <Flame size={14} style={{ color: 'var(--accent)' }} />
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

          <div style={{ marginTop: '12px', textAlign: 'center' }}>
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
              marginBottom: '6px',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Moon size={13} /> 00:00 Cool Night
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sun size={13} /> 12:00 Solar Midday
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Moon size={13} /> 23:00 Cool Night
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
              marginTop: '10px',
              fontSize: '0.75rem',
              flexWrap: 'wrap',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', gap: '16px' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', background: 'var(--border)', borderRadius: '2px' }} />
                Carbon Emissions (gCO₂/kWh)
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', background: 'var(--accent)', borderRadius: '2px' }} />
                Cooling Water Evaporation (WUE)
              </span>
            </div>

            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>
              ★ Optimal Scheduling Window: {cicsResult.optimalHour}:00
            </span>
          </div>
        </div>
      </div>

      {/* 4. Google CICS Flexible Batch Queue Simulator */}
      <div className="conflict-card" id="cics-simulator">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Radovanović et al. (2023) CICS Implementation
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text)', fontWeight: 600 }}>
              Flexible Task Scheduling Simulator (Google CICS Framework)
            </h3>
          </div>

          {/* Urgent vs Eco-Queue Buttons */}
          <div className="cics-toggle-group">
            <button
              className={`cics-mode-btn ${queueMode === 'urgent' ? 'active' : ''}`}
              id="cics-mode-urgent-btn"
              onClick={() => handleEcoQueueToggle('urgent')}
            >
              <Clock size={14} /> Urgent (Answer Right Away)
            </button>
            <button
              className={`cics-mode-btn ${queueMode === 'eco' ? 'active' : ''}`}
              id="cics-mode-eco-btn"
              onClick={() => handleEcoQueueToggle('eco')}
            >
              <Sparkles size={14} /> Flexible Queue (Wait for Best Hour)
            </button>
          </div>
        </div>

        {queueMode === 'urgent' ? (
          <div
            style={{
              background: 'var(--surface)',
              padding: '16px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
            }}
          >
            <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.9375rem' }}>
              Running Inflexible Query Immediately at Peak Afternoon Hour ({cicsResult.currentHour}:00)
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '4px', maxWidth: '100%' }}>
              Because this query requires an immediate response, it runs during peak outdoor temperatures and peak grid demand without waiting for cleaner conditions.
            </p>
          </div>
        ) : (
          <div
            style={{
              background: 'var(--surface)',
              padding: '18px 20px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--bg)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)',
                }}
              >
                <CheckCircle2 size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text)' }}>
                  Computation Shifted to Optimal Window: {cicsResult.optimalHour}:00
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Delayed {cicsResult.delayHours} hours into a cool-temperature, clean-energy window.
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem', fontWeight: 600, color: 'var(--accent)' }}>
                  -{cicsResult.carbonSavingsPercent}%
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Carbon Saved</div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem', fontWeight: 600, color: 'var(--accent)' }}>
                  -{cicsResult.waterSavingsPercent}%
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Water Saved</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Real-Time Global Weather Recommendation & Siting Matrix */}
      <div className="card" id="siting-matrix">
        {/* Real-time Weather Recommendation Hero Banner */}
        {weatherRecommendation && (
          <div
            className="weather-hero-recommendation-panel"
            id="weather-recommendation-hero-card"
          >
            <div className="recom-hero-left">
              <div className="recom-badge-live">
                <CloudSun size={14} />
                <span>LIVE WEATHER RECOMMENDATION</span>
              </div>
              <h3 className="recom-hero-title">
                {weatherRecommendation.isCurrentOptimal ? (
                  <span>★ Optimal Location Active: {location.name}</span>
                ) : (
                  <span>
                    Recommendation: Route Query to {weatherRecommendation.bestOverall.location.name}
                  </span>
                )}
              </h3>
              <p className="recom-hero-desc">
                {weatherRecommendation.isCurrentOptimal ? (
                  <>
                    Your current datacenter ({location.name}) offers the lowest combined water and carbon footprint globally under current weather ({weather?.temperatureC}°C, {weather?.relativeHumidity}% humidity).
                  </>
                ) : (
                  <>
                    Based on real-time weather across all 18 datacenter locations, {weatherRecommendation.bestOverall.location.name} is currently experiencing cool {weatherRecommendation.bestOverall.weather.temperatureC}°C weather ({weatherRecommendation.bestOverall.coolingStatus === 'free-cooling' ? 'free outdoor air cooling active' : 'favorable cooling conditions'}), saving water and carbon compared to warmer locations.
                  </>
                )}
              </p>

              <div className="recom-hero-stats">
                <div className="recom-stat-capsule">
                  <span className="recom-stat-num">
                    {weatherRecommendation.bestOverall.totalWaterMl.toFixed(2)} mL
                  </span>
                  <span className="recom-stat-lbl">
                    Water / Query {weatherRecommendation.bestOverall.waterSavingsVsCurrentPct > 0 ? `(-${weatherRecommendation.bestOverall.waterSavingsVsCurrentPct}%)` : '(Active Best)'}
                  </span>
                </div>

                <div className="recom-stat-capsule">
                  <span className="recom-stat-num">
                    {weatherRecommendation.bestOverall.carbonGrams.toFixed(2)} g
                  </span>
                  <span className="recom-stat-lbl">
                    Carbon / Query {weatherRecommendation.bestOverall.carbonSavingsVsCurrentPct > 0 ? `(-${weatherRecommendation.bestOverall.carbonSavingsVsCurrentPct}%)` : '(Active Best)'}
                  </span>
                </div>

                <div className="recom-stat-capsule">
                  <span className="recom-stat-num">
                    {weatherRecommendation.bestOverall.weather.temperatureC}°C
                  </span>
                  <span className="recom-stat-lbl">
                    Ambient Temp ({weatherRecommendation.bestOverall.weather.wetBulbC}°C Wet-Bulb)
                  </span>
                </div>

                <div className="recom-stat-capsule">
                  <span className="recom-stat-num">
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
                  className="btn-primary"
                  id="btn-apply-weather-recommendation-module-c"
                  onClick={() => setLocation(weatherRecommendation.bestOverall.location)}
                >
                  <span>Route to {weatherRecommendation.bestOverall.location.name}</span>
                  <ArrowUpRight size={14} />
                </button>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: 'var(--accent)',
                    fontWeight: 600,
                    fontSize: '0.875rem',
                    background: 'var(--surface)',
                    padding: '8px 14px',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
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
            marginBottom: '16px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              18 Global Datacenters Monitored Live
            </div>
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text)', fontWeight: 600 }}>
              Real-Time Weather & Location Leaderboard
            </h3>
          </div>

          {/* Sort & Filter Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Sort Buttons */}
            <div style={{ display: 'flex', gap: '3px', background: 'var(--surface)', padding: '3px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <button
                type="button"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.8125rem',
                  borderRadius: 'var(--radius)',
                  border: 'none',
                  cursor: 'pointer',
                  background: sortBy === 'rank' ? 'var(--accent)' : 'transparent',
                  color: sortBy === 'rank' ? '#FFFFFF' : 'var(--text-muted)',
                  fontWeight: 500,
                  transition: 'all 150ms ease',
                }}
                onClick={() => setSortBy('rank')}
              >
                ★ Overall Best
              </button>
              <button
                type="button"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.8125rem',
                  borderRadius: 'var(--radius)',
                  border: 'none',
                  cursor: 'pointer',
                  background: sortBy === 'water' ? 'var(--accent)' : 'transparent',
                  color: sortBy === 'water' ? '#FFFFFF' : 'var(--text-muted)',
                  fontWeight: 500,
                  transition: 'all 150ms ease',
                }}
                onClick={() => setSortBy('water')}
              >
                💧 Lowest Water
              </button>
              <button
                type="button"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.8125rem',
                  borderRadius: 'var(--radius)',
                  border: 'none',
                  cursor: 'pointer',
                  background: sortBy === 'carbon' ? 'var(--accent)' : 'transparent',
                  color: sortBy === 'carbon' ? '#FFFFFF' : 'var(--text-muted)',
                  fontWeight: 500,
                  transition: 'all 150ms ease',
                }}
                onClick={() => setSortBy('carbon')}
              >
                ☁️ Lowest Carbon
              </button>
              <button
                type="button"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.8125rem',
                  borderRadius: 'var(--radius)',
                  border: 'none',
                  cursor: 'pointer',
                  background: sortBy === 'temp' ? 'var(--accent)' : 'transparent',
                  color: sortBy === 'temp' ? '#FFFFFF' : 'var(--text-muted)',
                  fontWeight: 500,
                  transition: 'all 150ms ease',
                }}
                onClick={() => setSortBy('temp')}
              >
                ❄️ Coolest
              </button>
            </div>

            {/* Region Filter */}
            <div style={{ display: 'flex', gap: '3px', background: 'var(--surface)', padding: '3px', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
              <button
                id="filter-loc-all"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.8125rem',
                  borderRadius: 'var(--radius)',
                  border: 'none',
                  cursor: 'pointer',
                  background: filterRegion === 'all' ? 'var(--accent)' : 'transparent',
                  color: filterRegion === 'all' ? '#FFFFFF' : 'var(--text-muted)',
                  fontWeight: 500,
                  transition: 'all 150ms ease',
                }}
                onClick={() => setFilterRegion('all')}
              >
                All (18)
              </button>
              <button
                id="filter-loc-us"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.8125rem',
                  borderRadius: 'var(--radius)',
                  border: 'none',
                  cursor: 'pointer',
                  background: filterRegion === 'us' ? 'var(--accent)' : 'transparent',
                  color: filterRegion === 'us' ? '#FFFFFF' : 'var(--text-muted)',
                  fontWeight: 500,
                  transition: 'all 150ms ease',
                }}
                onClick={() => setFilterRegion('us')}
              >
                U.S. Only
              </button>
              <button
                id="filter-loc-global"
                style={{
                  padding: '6px 12px',
                  fontSize: '0.8125rem',
                  borderRadius: 'var(--radius)',
                  border: 'none',
                  cursor: 'pointer',
                  background: filterRegion === 'global' ? 'var(--accent)' : 'transparent',
                  color: filterRegion === 'global' ? '#FFFFFF' : 'var(--text-muted)',
                  fontWeight: 500,
                  transition: 'all 150ms ease',
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
                <th>Current Weather</th>
                <th>Cooling Mode</th>
                <th>Cooling Water (L/kWh)</th>
                <th>Grid Carbon (kg/kWh)</th>
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
                                  idx === 0 ? 'top-1' : ''
                                }`}
                              >
                                {idx + 1}
                              </span>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <strong style={{ color: 'var(--text)' }}>{item.location.name}</strong>
                                  {idx === 0 && (
                                    <span className="badge" title="Top Recommended Hub">
                                      ★ #1 Best
                                    </span>
                                  )}
                                  {item.location.isWaterStressed && (
                                    <span className="badge" title="Severe Water Stress Basin">
                                      Stress
                                    </span>
                                  )}
                                  {item.location.isHydropowerParadox && (
                                    <span className="badge" title="Hydropower Paradox">
                                      Hydro
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {item.location.country}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>{item.location.region}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--text)' }}>
                                {item.weather.temperatureC}°C
                              </span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                ({item.weather.relativeHumidity}%)
                              </span>
                              <span
                                style={{
                                  fontSize: '0.6875rem',
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  background: 'var(--surface)',
                                  border: '1px solid var(--border)',
                                  color: 'var(--text-muted)',
                                }}
                              >
                                {item.weather.isLive ? 'Live' : 'Est'}
                              </span>
                            </div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                              Wet-Bulb: {item.weather.wetBulbC}°C
                            </div>
                          </td>
                          <td>
                            <span className="cooling-badge">
                              {item.coolingStatus === 'free-cooling' && <Wind size={12} />}
                              {item.coolingStatus === 'high-evaporative' && <Flame size={12} />}
                              {item.coolingStatus === 'moderate' && <CloudSun size={12} />}
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
                            <span style={{ color: item.effectiveWUE < 0.2 ? 'var(--accent)' : 'inherit' }}>
                              {item.effectiveWUE.toFixed(3)}
                            </span>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: '3px' }}>
                              L/kWh
                            </span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                            {item.location.carbonIntensity.toFixed(3)} kg/kWh
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)', fontWeight: 600 }}>
                            {item.totalWaterMl.toFixed(2)} mL
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                            {item.carbonGrams.toFixed(2)} g
                          </td>
                          <td>
                            <button
                              className={isSelected ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                              id={`select-loc-${item.location.id}`}
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
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>
                          {loc.baselineGpt3WaterMl.toFixed(1)} mL
                        </td>
                        <td>--</td>
                        <td>
                          <button
                            className={isSelected ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                            id={`select-loc-${loc.id}`}
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

export default ModuleCSpatiotemporal;
