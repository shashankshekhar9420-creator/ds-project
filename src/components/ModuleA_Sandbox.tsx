import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Zap,
  Smartphone,
  Lightbulb,
  Car,
  Copy,
  Check,
  Server,
  AlertTriangle,
  RotateCcw,
  CloudSun,
  ArrowUpRight,
  CheckCircle2,
  Cpu,
} from 'lucide-react';
import type {
  AIModel,
  CalculationResult,
  DataCenterLocation,
  WeatherCondition,
  WeatherRecommendation,
} from '../types';
import { AI_MODELS } from '../data/models';
import { LOCATIONS } from '../data/locations';
import { PROMPT_PRESETS } from '../data/presets';
import type { PromptPreset } from '../data/presets';
import { MathFormula } from './MathFormula';
import { recommendOptimizedModel } from '../utils/modelOptimizer';
import '../styles/sandbox.css';

interface ModuleASandboxProps {
  model: AIModel;
  setModel: (m: AIModel) => void;
  location: DataCenterLocation;
  setLocation: (loc: DataCenterLocation) => void;
  promptText: string;
  setPromptText: (text: string) => void;
  outputWords: number;
  setOutputWords: (n: number) => void;
  includeIdlePenalty: boolean;
  setIncludeIdlePenalty: (val: boolean) => void;
  waterMode: 'consumption' | 'withdrawal';
  setWaterMode: (mode: 'consumption' | 'withdrawal') => void;
  calculation: CalculationResult;
  weather: WeatherCondition | null;
  weatherRecommendation?: WeatherRecommendation;
  onRefreshWeather?: () => void;
  isWeatherLoading?: boolean;
}

const FORMATTED_DATE = new Date().toLocaleDateString();

export const ModuleASandbox: React.FC<ModuleASandboxProps> = ({
  model,
  setModel,
  location,
  setLocation,
  promptText,
  setPromptText,
  outputWords,
  setOutputWords,
  includeIdlePenalty,
  setIncludeIdlePenalty,
  waterMode,
  setWaterMode,
  calculation,
  weather,
  weatherRecommendation,
  onRefreshWeather: _onRefreshWeather,
  isWeatherLoading: _isWeatherLoading = false,
}) => {
  const [copied, setCopied] = useState(false);

  const applyPreset = (preset: PromptPreset) => {
    setPromptText(preset.prompt);
    setOutputWords(preset.suggestedOutputWords);
  };

  const copyReceiptSummary = () => {
    const text = `🌿 Environmental Receipt for AI Query
Model: ${model.name} (${model.parameters})
Location: ${location.name} (Facility overhead multiplier PUE: ${calculation.effectivePUE.toFixed(2)})
Input: ${calculation.wordsIn} words (~${calculation.tokensIn} tokens)
Output: ${calculation.wordsOut} words (~${calculation.tokensOut} tokens)

⚡ Server Electricity: ${calculation.energyWh.toFixed(2)} Wh (${(calculation.serverEnergyKWh * 1000).toFixed(2)} mWh)
💧 Water Footprint (${waterMode === 'consumption' ? 'Permanent Evaporation' : 'Total Withdrawn'}): ${calculation.displayedTotalWaterMl.toFixed(2)} mL
   - Scope 1 On-Site: ${calculation.displayedScope1WaterMl.toFixed(2)} mL (${calculation.scope1Percent}%) evaporated in cooling towers
   - Scope 2 Off-Site: ${calculation.displayedScope2WaterMl.toFixed(2)} mL (${calculation.scope2Percent}%) consumed by electricity power plants
☁️ Carbon Emissions: ${calculation.carbonGrams.toFixed(2)} gCO2e

Everyday Equivalents:
- ${calculation.bottleFraction < 0.01 ? '<1%' : `${(calculation.bottleFraction * 100).toFixed(1)}%`} of a standard 500 mL water bottle
- ~${calculation.waterDrops} water drops
- ${calculation.ledSeconds} seconds powering a 10W LED lightbulb
- ${calculation.smartphoneBatteryPercent.toFixed(2)}% of a full smartphone battery recharge

Calculated using peer-reviewed formulations from Li et al. (2025) & Xiao et al. (2025)`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLengthCategory = () => {
    if (outputWords <= 150) return 'short';
    if (outputWords <= 400) return 'medium';
    return 'long';
  };

  const modelRecommendation = useMemo(() => {
    return recommendOptimizedModel({
      promptText,
      currentModel: model,
      location,
      wordsIn: calculation.wordsIn,
      wordsOut: calculation.wordsOut,
      weather,
      includeIdlePenalty,
      waterMode,
      upgrades: {
        pueOptimization: false,
        wueOptimization: false,
        liquidCooling: false,
        serverUtilization: false,
        combinedBestPractices: false,
      },
      currentCalculation: calculation,
    });
  }, [promptText, model, location, calculation, weather, includeIdlePenalty, waterMode]);

  return (
    <div className="sandbox-container" id="sandbox-module">
      {/* LEFT COLUMN: Interactive Prompt & Architecture Sandbox */}
      <div className="prompt-console">
        <div className="card">
          <div className="console-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)',
                }}
              >
                <Sparkles size={16} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text)' }}>
                Interactive Query Calculator
              </h3>
            </div>
            <span className="badge">Instant • Runs in your browser</span>
          </div>

          {/* Preset Chips */}
          <div style={{ marginTop: '12px', marginBottom: '8px' }}>
            <div className="presets-bar">
              {PROMPT_PRESETS.map((p) => (
                <button
                  key={p.id}
                  className="preset-chip"
                  id={`preset-${p.id}`}
                  onClick={() => applyPreset(p)}
                  title={`${p.category}: ${p.prompt.slice(0, 80)}...`}
                >
                  <span>{p.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Prompt Textarea */}
          <div className="prompt-textarea-wrapper">
            <textarea
              className="prompt-textarea"
              id="prompt-input"
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              placeholder="Type or paste any question or prompt here to calculate how much electricity, water, and carbon it takes to answer..."
            />
            <div className="prompt-meta-bar">
              <div className="meta-counters">
                <div className="meta-count-item">
                  <span>Input Words:</span>
                  <span className="meta-count-num">{calculation.wordsIn}</span>
                </div>
                <div className="meta-count-item" title="Tokens are word pieces (roughly 3/4 of an English word) that AI models read one by one.">
                  <span>Est. Tokens:</span>
                  <span className="meta-count-num">~{calculation.tokensIn}</span>
                </div>
              </div>
              {promptText.length > 0 && (
                <button
                  onClick={() => setPromptText('')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.8125rem',
                  }}
                >
                  <RotateCcw size={12} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Model & Output Length Controls */}
          <div className="controls-grid" style={{ marginTop: '20px' }}>
            <div className="control-group">
              <label className="control-label" htmlFor="model-select">
                <span>AI Model Size</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {model.parameters}
                </span>
              </label>
              <select
                id="model-select"
                className="select-custom"
                value={model.id}
                onChange={(e) => {
                  const m = AI_MODELS.find((item) => item.id === e.target.value);
                  if (m) setModel(m);
                }}
              >
                {AI_MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — {m.parameters} ({m.baseEnergyKWh * 1000} Wh baseline)
                  </option>
                ))}
              </select>
              {model.isEfficient && (
                <div
                  style={{
                    fontSize: '0.8125rem',
                    color: 'var(--text)',
                    background: 'var(--surface)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '6px',
                  }}
                >
                  <AlertTriangle size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                  <span>
                    <strong>The Efficiency Paradox (Rebound Effect):</strong> When models become cheaper and faster to run, people often ask many more questions. Total electricity and water use can actually rise unless overall usage is managed (Xiao et al., 2025).
                  </span>
                </div>
              )}
            </div>

            <div className="control-group">
              <label className="control-label" htmlFor="location-select">
                <span>Data Center Location</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }} title="Facility overhead multiplier: How much total building energy is consumed per unit of server energy.">
                  Overhead Multiplier (PUE): {calculation.effectivePUE.toFixed(2)}
                </span>
              </label>
              <select
                id="location-select"
                className="select-custom"
                value={location.id}
                onChange={(e) => {
                  const loc = LOCATIONS.find((l) => l.id === e.target.value);
                  if (loc) setLocation(loc);
                }}
              >
                {LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} {loc.isOptimalCombined ? '★ (Optimal)' : ''}{' '}
                    {loc.isWaterStressed ? '⚠️ (Water Stressed)' : ''}{' '}
                    {loc.isHydropowerParadox ? '💧 (Hydro Paradox)' : ''}
                  </option>
                ))}
              </select>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginTop: '4px',
                }}
              >
                {location.profile}
              </div>
            </div>
          </div>

          {/* Query-Aware Model Sizing Recommendation */}
          {modelRecommendation && !modelRecommendation.isCurrentOptimal && (
            <div
              className="model-recommendation-card"
              id="model-optimization-box"
              style={{
                marginTop: '16px',
                padding: '16px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: '1 1 320px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius)',
                    background: 'var(--bg)',
                    border: '1px solid var(--border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent)',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <Cpu size={16} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
                      Smarter Model Sizing:
                    </span>
                    <span
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: 'var(--radius)',
                        background: 'var(--bg)',
                        color: 'var(--text)',
                        border: '1px solid var(--border)',
                      }}
                    >
                      {modelRecommendation.taskType}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.5 }}>
                    {modelRecommendation.reason}
                  </div>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)' }}>
                      ⚡ -{modelRecommendation.energySavingsPct}% Energy
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)' }}>
                      💧 -{modelRecommendation.waterSavingsMl} mL Water
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)' }}>
                      ☁️ -{modelRecommendation.carbonSavingsGrams}g CO₂e
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn-primary btn-sm"
                id="btn-apply-model-recommendation"
                onClick={() => setModel(modelRecommendation.suggestedModel)}
              >
                <span>Switch to {modelRecommendation.suggestedModel.name}</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          )}

          {modelRecommendation && modelRecommendation.isCurrentOptimal && promptText.trim().length > 0 && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 14px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.8125rem',
                color: 'var(--text)',
              }}
            >
              <CheckCircle2 size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <span>
                <strong>Well Matched:</strong> {model.name} is well-suited for this {modelRecommendation.taskType} query without wasting power on an oversized model.
              </span>
            </div>
          )}

          {/* Weather-Driven Smart Siting Recommendation */}
          {weatherRecommendation && !weatherRecommendation.isCurrentOptimal && (
            <div
              className="weather-recommendation-card"
              id="weather-recommendation-box"
              style={{
                marginTop: '16px',
                padding: '16px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CloudSun size={20} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
                    Weather Optimization: {weatherRecommendation.bestOverall.location.name} is cooler ({weatherRecommendation.bestOverall.weather.temperatureC}°C vs {weather?.temperatureC}°C)
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Cool outside air reduces the need for water chillers. Rerouting saves roughly <strong>{weatherRecommendation.bestOverall.waterSavingsVsCurrentPct}% water</strong> and <strong>{weatherRecommendation.bestOverall.carbonSavingsVsCurrentPct}% carbon</strong> per query.
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn-primary btn-sm"
                id="btn-apply-weather-recommendation"
                onClick={() => setLocation(weatherRecommendation.bestOverall.location)}
              >
                <span>Switch to {weatherRecommendation.bestOverall.location.name}</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          )}

          {weatherRecommendation && weatherRecommendation.isCurrentOptimal && (
            <div
              style={{
                marginTop: '12px',
                padding: '10px 14px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.8125rem',
                color: 'var(--text)',
              }}
            >
              <CheckCircle2 size={16} style={{ color: 'var(--accent)', flexShrink: 0 }} />
              <span>
                <strong>{location.name}</strong> currently offers optimal weather efficiency ({weather?.temperatureC}°C ambient).
              </span>
            </div>
          )}

          {/* Expected Output Length Buttons + Slider */}
          <div style={{ marginTop: '20px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
              }}
            >
              <label className="control-label">
                Expected Answer Length
              </label>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8125rem',
                  color: 'var(--text)',
                  fontWeight: 600,
                }}
              >
                {outputWords} words (~{calculation.tokensOut} tokens)
              </span>
            </div>

            <div className="length-buttons" style={{ marginBottom: '12px' }}>
              <button
                className={`length-btn ${getLengthCategory() === 'short' ? 'active' : ''}`}
                id="length-btn-short"
                onClick={() => setOutputWords(100)}
              >
                Short (~100 words)
              </button>
              <button
                className={`length-btn ${getLengthCategory() === 'medium' ? 'active' : ''}`}
                id="length-btn-medium"
                onClick={() => setOutputWords(250)}
              >
                Medium (~250 words)
              </button>
              <button
                className={`length-btn ${getLengthCategory() === 'long' ? 'active' : ''}`}
                id="length-btn-long"
                onClick={() => setOutputWords(600)}
              >
                Long (~600 words)
              </button>
            </div>

            <input
              type="range"
              id="output-words-slider"
              className="range-slider"
              min={25}
              max={1200}
              step={25}
              value={outputWords}
              onChange={(e) => setOutputWords(parseInt(e.target.value, 10))}
            />
          </div>

          {/* 3Blue1Brown Prefill vs Decoding Mathematical Phase Breakdown */}
          <div className="phase-visualizer" style={{ marginTop: '24px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={16} style={{ color: 'var(--accent)' }} />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'var(--text)',
                  }}
                >
                  Where Does the Energy Go? (Stojkovic / Li et al. 2025)
                </span>
              </div>
              <span className="badge">Generating words uses ~2.3× more energy than reading them</span>
            </div>

            {/* KaTeX formula for Phase Scaling */}
            <MathFormula
              formula={`e_t = E_{\\text{base}} \\cdot \\left( 0.30 \\cdot \\frac{W_{\\text{in}}}{800} + 0.70 \\cdot \\frac{W_{\\text{out}}}{225} \\right)`}
            />

            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '10px', lineHeight: 1.5 }}>
              Reading your prompt accounts for ~30% of baseline energy, while writing the answer takes ~70%. Because the computer must review all its mathematical weights for each new word it writes, long answers use far more electricity than long questions.
            </div>

            <div className="phase-bar-track">
              <div
                className="phase-prompt-bar"
                style={{ width: `${calculation.promptEnergyFraction * 100}%` }}
                title={`Prompt Processing Phase: ${(calculation.promptEnergyFraction * 100).toFixed(1)}%`}
              >
                {calculation.promptEnergyFraction > 0.15 &&
                  `Reading Phase ${(calculation.promptEnergyFraction * 100).toFixed(0)}%`}
              </div>
              <div
                className="phase-token-bar"
                style={{ width: `${calculation.tokenEnergyFraction * 100}%` }}
                title={`Token Generation Phase: ${(calculation.tokenEnergyFraction * 100).toFixed(1)}%`}
              >
                {calculation.tokenEnergyFraction > 0.15 &&
                  `Answering Phase ${(calculation.tokenEnergyFraction * 100).toFixed(0)}%`}
              </div>
            </div>

            <div className="phase-legend">
              <div className="phase-legend-item">
                <div className="phase-item-header">
                  <div className="phase-dot-prompt" />
                  <span style={{ color: 'var(--text)' }}>
                    1. Reading Phase (Prompt Reading, ~30% base energy)
                  </span>
                </div>
                <p className="phase-desc">
                  The model reads your entire question all at once in parallel, organizing the key ideas into memory so it is ready to answer.
                </p>
              </div>

              <div className="phase-legend-item">
                <div className="phase-item-header">
                  <div className="phase-dot-token" />
                  <span style={{ color: 'var(--text)' }}>
                    2. Answering Phase (Generating Words, ~70% base energy)
                  </span>
                </div>
                <p className="phase-desc">
                  The model generates the answer one word piece at a time. For every single piece it writes, it must reload tens of billions of numbers from high-speed memory.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: The Tactile "Environmental Receipt" Card */}
      <div className="receipt-wrapper">
        <div className="receipt-card" id="environmental-receipt">
          <div className="receipt-header">
            <div className="receipt-badge-title">Calculated Impact</div>
            <h3 className="receipt-title">Environmental Receipt</h3>
            <div className="receipt-meta-row">
              <span>{model.name}</span>
              <span>{FORMATTED_DATE}</span>
              <span>{location.country} {weather ? `(${weather.temperatureC}°C)` : ''}</span>
            </div>
          </div>

          {/* Interactive Toggles */}
          <div className="receipt-toggles">
            <div className="receipt-toggle-row">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                  Water Accounting: {waterMode === 'consumption' ? 'Permanent Evaporation' : 'Total Withdrawn'}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {waterMode === 'consumption'
                    ? 'Permanent evaporation into air (turned to steam and lost from watershed)'
                    : 'Total freshwater pumped (includes water cycled through pipes and returned)'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  className={waterMode === 'consumption' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                  id="water-mode-consumption-btn"
                  onClick={() => setWaterMode('consumption')}
                >
                  Consumed
                </button>
                <button
                  className={waterMode === 'withdrawal' ? 'btn-primary btn-sm' : 'btn-secondary btn-sm'}
                  id="water-mode-withdrawal-btn"
                  onClick={() => setWaterMode('withdrawal')}
                >
                  Withdrawn (13.95×)
                </button>
              </div>
            </div>

            <div className="receipt-toggle-row">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                  Include Idle Server Overhead
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Servers draw electricity even when waiting between user queries. Factoring in idle time (based on 25% server utilization from Xiao et al., 2025) reflects the real-world cost of keeping equipment running 24/7.
                </span>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  id="idle-overhead-toggle"
                  checked={includeIdlePenalty}
                  onChange={(e) => setIncludeIdlePenalty(e.target.checked)}
                />
                <span className="slider-round" />
              </label>
            </div>
          </div>

          {/* Hero Metrics Grid */}
          <div className="metrics-hero-grid">
            <div className="metric-hero-block">
              <span className="metric-hero-label">Electricity Used</span>
              <span className="metric-hero-value">
                {calculation.energyWh < 0.1
                  ? calculation.energyWh.toFixed(3)
                  : calculation.energyWh.toFixed(2)}
              </span>
              <span className="metric-hero-unit">Watt-hours (Wh)</span>
            </div>

            <div className="metric-hero-block">
              <span className="metric-hero-label">
                {waterMode === 'consumption' ? 'Water Consumed' : 'Water Withdrawn'}
              </span>
              <span className="metric-hero-value">
                {calculation.displayedTotalWaterMl.toFixed(1)}
              </span>
              <span className="metric-hero-unit">Milliliters (mL)</span>
            </div>

            <div className="metric-hero-block">
              <span className="metric-hero-label">Carbon Emissions</span>
              <span className="metric-hero-value">
                {calculation.carbonGrams.toFixed(2)}
              </span>
              <span className="metric-hero-unit">Grams (gCO₂e)</span>
            </div>
          </div>

          {/* Scope 1 vs Scope 2 Breakdown */}
          <div className="scope-breakdown-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--text)',
              }}
            >
              <span>Where the Water is Used</span>
              <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                {calculation.displayedTotalWaterMl.toFixed(1)} mL Total
              </span>
            </div>

            <div className="scope-bar">
              <div
                className="scope1-fill"
                style={{ width: `${calculation.scope1Percent}%` }}
                title={`Scope 1 On-Site Cooling: ${calculation.scope1Percent}%`}
              />
              <div
                className="scope2-fill"
                style={{ width: `${calculation.scope2Percent}%` }}
                title={`Scope 2 Off-Site Grid: ${calculation.scope2Percent}%`}
              />
            </div>

            <div className="scope-labels">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--text-muted)',
                  }}
                />
                <span>
                  Scope 1 On-Site: {calculation.displayedScope1WaterMl.toFixed(1)} mL ({calculation.scope1Percent}%) evaporated in cooling towers
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--accent)',
                  }}
                />
                <span>
                  Scope 2 Grid: {calculation.displayedScope2WaterMl.toFixed(1)} mL ({calculation.scope2Percent}%) consumed by power plants
                </span>
              </div>
            </div>
          </div>

          {/* Water Bottle Graphic */}
          <div className="water-bottle-visual">
            <div className="bottle-icon-container">
              <div className="bottle-cap" />
              <div
                className="bottle-liquid"
                style={{
                  height: `${Math.min(100, Math.max(8, calculation.bottleFraction * 100))}%`,
                }}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {(calculation.bottleFraction * 100).toFixed(1)}% of a 500 mL Water Bottle
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Equivalent to evaporating ~<strong>{calculation.waterDrops}</strong> standard drops
                of clean drinking water.
              </div>
            </div>
          </div>

          {/* Tangible Everyday Equivalents */}
          <div className="equivalents-section">
            <div className="equivalents-title">
              <Lightbulb size={14} />
              <span>Relatable Everyday Equivalents</span>
            </div>

            <div className="equivalents-grid">
              <div className="equiv-card">
                <div className="equiv-icon-box">
                  <Lightbulb size={16} />
                </div>
                <div>
                  <div className="equiv-value">{calculation.ledSeconds}s</div>
                  <div className="equiv-subtext">Powering a 10W LED bulb</div>
                </div>
              </div>

              <div className="equiv-card">
                <div className="equiv-icon-box">
                  <Smartphone size={16} />
                </div>
                <div>
                  <div className="equiv-value">
                    {calculation.smartphoneBatteryPercent.toFixed(2)}%
                  </div>
                  <div className="equiv-subtext">Smartphone recharge</div>
                </div>
              </div>

              <div className="equiv-card">
                <div className="equiv-icon-box">
                  <Car size={16} />
                </div>
                <div>
                  <div className="equiv-value">{calculation.drivingMeters}m</div>
                  <div className="equiv-subtext">Driving an average petrol car</div>
                </div>
              </div>

              <div className="equiv-card">
                <div className="equiv-icon-box">
                  <Server size={16} />
                </div>
                <div>
                  <div className="equiv-value">
                    {(calculation.totalFacilityEnergyKWh * 1000).toFixed(2)} Wh
                  </div>
                  <div className="equiv-subtext">Total facility energy (with cooling)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Copy Receipt Action button */}
          <div style={{ marginTop: '16px' }}>
            <button
              className="btn-primary"
              id="copy-receipt-btn"
              onClick={copyReceiptSummary}
              style={{ width: '100%' }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? 'Copied Receipt to Clipboard!' : 'Copy Environmental Receipt'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleASandbox;
