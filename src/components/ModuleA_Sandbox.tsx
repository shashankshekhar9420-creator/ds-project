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
Location: ${location.name} (PUE: ${calculation.effectivePUE.toFixed(2)})
Input: ${calculation.wordsIn} words (~${calculation.tokensIn} tokens)
Output: ${calculation.wordsOut} words (~${calculation.tokensOut} tokens)

⚡ Server Energy: ${calculation.energyWh.toFixed(2)} Wh (${(calculation.serverEnergyKWh * 1000).toFixed(2)} mWh)
💧 Water Footprint (${waterMode}): ${calculation.displayedTotalWaterMl.toFixed(2)} mL
   - Scope 1 (On-Site Cooling): ${calculation.displayedScope1WaterMl.toFixed(2)} mL (${calculation.scope1Percent}%)
   - Scope 2 (Off-Site Grid): ${calculation.displayedScope2WaterMl.toFixed(2)} mL (${calculation.scope2Percent}%)
☁️ Operational Carbon: ${calculation.carbonGrams.toFixed(2)} gCO2e

Tangible Equivalents:
- ${calculation.bottleFraction < 0.01 ? '<1%' : `${(calculation.bottleFraction * 100).toFixed(1)}%`} of a 500mL water bottle
- ~${calculation.waterDrops} water drops
- ${calculation.ledSeconds}s of 10W LED lightbulb runtime
- ${calculation.smartphoneBatteryPercent.toFixed(2)}% smartphone battery recharge

Calculated via peer-reviewed formulations from Li et al. (2025) & Xiao et al. (2025)`;

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
        <div className="glass-panel">
          <div className="console-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  background: 'rgba(6, 182, 212, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--water-cyan-light)',
                }}
              >
                <Sparkles size={16} />
              </div>
              <h2 className="font-display" style={{ fontSize: '1.15rem', fontWeight: 700 }}>
                Live Prompt Sandbox
              </h2>
            </div>
            <span className="badge badge-cyan">No Live LLM API Required</span>
          </div>

          {/* Preset Chips */}
          <div style={{ marginTop: '0.75rem', marginBottom: '0.5rem' }}>
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
              placeholder="Type or paste any query to immediately compute its thermodynamic footprint..."
            />
            <div className="prompt-meta-bar">
              <div className="meta-counters">
                <div className="meta-count-item">
                  <span>Input Words:</span>
                  <span className="meta-count-num">{calculation.wordsIn}</span>
                </div>
                <div className="meta-count-item">
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
                    fontSize: '0.75rem',
                  }}
                >
                  <RotateCcw size={12} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Model & Output Length Controls */}
          <div className="controls-grid" style={{ marginTop: '1.25rem' }}>
            <div className="control-group">
              <label className="control-label" htmlFor="model-select">
                <span>AI Foundation Model</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--energy-amber-light)' }}>
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
                    fontSize: '0.72rem',
                    color: '#f59e0b',
                    background: 'rgba(245, 158, 11, 0.1)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    marginTop: '4px',
                  }}
                >
                  <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                  <span>
                    <strong>Rebound Effect Warning:</strong> Xiao et al. (2025) note efficient
                    models spur higher aggregate query frequency.
                  </span>
                </div>
              )}
            </div>

            <div className="control-group">
              <label className="control-label" htmlFor="location-select">
                <span>Data Center Location</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--water-cyan-light)' }}>
                  PUE: {calculation.effectivePUE.toFixed(2)}
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
                    {loc.isWaterStressed ? '⚠️ (Water Stress)' : ''}{' '}
                    {loc.isHydropowerParadox ? '💧 (Hydro Paradox)' : ''}
                  </option>
                ))}
              </select>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--text-muted)',
                  marginTop: '2px',
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
                marginTop: '1rem',
                padding: '0.85rem 1rem',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.32)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flex: '1 1 320px' }}>
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '6px',
                    background: 'rgba(245, 158, 11, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--energy-amber-light)',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  <Cpu size={16} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff' }}>
                      Query-Aware Model Sizing:
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        background: 'rgba(245, 158, 11, 0.2)',
                        color: 'var(--energy-amber-light)',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                      }}
                    >
                      {modelRecommendation.taskType}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-secondary)', marginTop: '3px', lineHeight: 1.45 }}>
                    {modelRecommendation.reason}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--energy-amber-light)' }}>
                      ⚡ -{modelRecommendation.energySavingsPct}% Energy
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--water-cyan-light)' }}>
                      💧 -{modelRecommendation.waterSavingsMl} mL Water
                    </span>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#f87171' }}>
                      ☁️ -{modelRecommendation.carbonSavingsGrams}g CO₂e
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn-apply-recommendation"
                id="btn-apply-model-recommendation"
                onClick={() => setModel(modelRecommendation.suggestedModel)}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  borderRadius: '6px',
                  background: 'var(--energy-amber)',
                  color: '#000',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  border: 'none',
                }}
              >
                <span>Switch to {modelRecommendation.suggestedModel.name}</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          )}

          {modelRecommendation && modelRecommendation.isCurrentOptimal && promptText.trim().length > 0 && (
            <div
              style={{
                marginTop: '0.75rem',
                padding: '0.55rem 0.85rem',
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.73rem',
                color: 'var(--text-secondary)',
              }}
            >
              <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0 }} />
              <span>
                <strong style={{ color: '#10b981' }}>Model Right-Sized:</strong> {model.name} is well-matched for this {modelRecommendation.taskType} query without oversized parameter overhead.
              </span>
            </div>
          )}

          {/* Weather-Driven Smart Siting Recommendation */}
          {weatherRecommendation && !weatherRecommendation.isCurrentOptimal && (
            <div
              className="weather-recommendation-card"
              id="weather-recommendation-box"
              style={{
                marginTop: '1rem',
                padding: '0.85rem 1rem',
                background: 'rgba(6, 182, 212, 0.06)',
                border: '1px solid rgba(6, 182, 212, 0.25)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CloudSun size={18} style={{ color: 'var(--water-cyan-light)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
                    Weather Optimization: {weatherRecommendation.bestOverall.location.name} is cooler ({weatherRecommendation.bestOverall.weather.temperatureC}°C vs {weather?.temperatureC}°C)
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Rerouting saves <strong>{weatherRecommendation.bestOverall.waterSavingsVsCurrentPct}% water</strong> and <strong>{weatherRecommendation.bestOverall.carbonSavingsVsCurrentPct}% carbon</strong> per query.
                  </div>
                </div>
              </div>

              <button
                type="button"
                className="btn-apply-recommendation"
                id="btn-apply-weather-recommendation"
                onClick={() => setLocation(weatherRecommendation.bestOverall.location)}
                style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '6px' }}
              >
                <span>Switch to {weatherRecommendation.bestOverall.location.name}</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          )}

          {weatherRecommendation && weatherRecommendation.isCurrentOptimal && (
            <div
              style={{
                marginTop: '1rem',
                padding: '0.65rem 0.85rem',
                background: 'rgba(16, 185, 129, 0.06)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.78rem',
                color: 'var(--eco-emerald-light)',
              }}
            >
              <CheckCircle2 size={15} style={{ flexShrink: 0 }} />
              <span>
                <strong>{location.name}</strong> currently offers the optimal global weather efficiency ({weather?.temperatureC}°C ambient).
              </span>
            </div>
          )}

          {/* Expected Output Length Buttons + Slider */}
          <div style={{ marginTop: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.4rem',
              }}
            >
              <label className="control-label">
                Expected Generation Output Length
              </label>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.8rem',
                  color: 'var(--water-cyan-light)',
                  fontWeight: 600,
                }}
              >
                {outputWords} words (~{calculation.tokensOut} tokens)
              </span>
            </div>

            <div className="length-buttons" style={{ marginBottom: '0.75rem' }}>
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
          <div className="phase-visualizer" style={{ marginTop: '1.5rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Zap size={15} style={{ color: 'var(--energy-amber)' }} />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Two-Phase Energy Scaling Breakdown (Stojkovic / Li et al. 2025)
                </span>
              </div>
              <span className="badge badge-amber">Autoregressive Decoding Bound</span>
            </div>

            {/* KaTeX formula for Phase Scaling */}
            <MathFormula
              formula={`e_t = E_{\\text{base}} \\cdot \\left( 0.30 \\cdot \\frac{W_{\\text{in}}}{800} + 0.70 \\cdot \\frac{W_{\\text{out}}}{225} \\right)`}
            />

            <div className="phase-bar-track">
              <div
                className="phase-prompt-bar"
                style={{ width: `${calculation.promptEnergyFraction * 100}%` }}
                title={`Prompt Processing Phase: ${(calculation.promptEnergyFraction * 100).toFixed(1)}%`}
              >
                {calculation.promptEnergyFraction > 0.15 &&
                  `Prompt Phase ${(calculation.promptEnergyFraction * 100).toFixed(0)}%`}
              </div>
              <div
                className="phase-token-bar"
                style={{ width: `${calculation.tokenEnergyFraction * 100}%` }}
                title={`Token Generation Phase: ${(calculation.tokenEnergyFraction * 100).toFixed(1)}%`}
              >
                {calculation.tokenEnergyFraction > 0.15 &&
                  `Decoding Phase ${(calculation.tokenEnergyFraction * 100).toFixed(0)}%`}
              </div>
            </div>

            <div className="phase-legend">
              <div className="phase-legend-item">
                <div className="phase-item-header">
                  <div className="phase-dot-prompt" />
                  <span style={{ color: 'var(--energy-amber-light)' }}>
                    1. Prompt Phase (Compute-Bound, 30% baseline)
                  </span>
                </div>
                <p className="phase-desc">
                  Parallel matrix operations (prefill) populating the KV cache across GPU tensor
                  cores.
                </p>
              </div>

              <div className="phase-legend-item">
                <div className="phase-item-header">
                  <div className="phase-dot-token" />
                  <span style={{ color: 'var(--water-cyan-light)' }}>
                    2. Token Phase (Memory-Bound, 70% baseline)
                  </span>
                </div>
                <p className="phase-desc">
                  Sequential autoregressive token decoding reading billions of weights from HBM3
                  memory for every single output word.
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
            <div className="receipt-badge-title">Official Scientific Accounting</div>
            <h3 className="receipt-title font-display">Environmental Receipt</h3>
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
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Water Mode: {waterMode === 'consumption' ? 'Consumption' : 'Withdrawal'}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  {waterMode === 'consumption'
                    ? 'Permanent evaporation into atmosphere'
                    : 'Total pumped freshwater (includes cycled back)'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  className={`btn btn-ghost`}
                  id="water-mode-consumption-btn"
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.7rem',
                    background:
                      waterMode === 'consumption' ? 'rgba(6, 182, 212, 0.25)' : 'transparent',
                    color: waterMode === 'consumption' ? 'var(--water-cyan-light)' : 'var(--text-muted)',
                    borderColor:
                      waterMode === 'consumption' ? 'var(--water-cyan)' : 'var(--border-subtle)',
                  }}
                  onClick={() => setWaterMode('consumption')}
                >
                  Consumed
                </button>
                <button
                  className={`btn btn-ghost`}
                  id="water-mode-withdrawal-btn"
                  style={{
                    padding: '3px 8px',
                    fontSize: '0.7rem',
                    background:
                      waterMode === 'withdrawal' ? 'rgba(6, 182, 212, 0.25)' : 'transparent',
                    color: waterMode === 'withdrawal' ? 'var(--water-cyan-light)' : 'var(--text-muted)',
                    borderColor:
                      waterMode === 'withdrawal' ? 'var(--water-cyan)' : 'var(--border-subtle)',
                  }}
                  onClick={() => setWaterMode('withdrawal')}
                >
                  Withdrawn (13.95×)
                </button>
              </div>
            </div>

            <div className="receipt-toggle-row">
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                  Include Idle Server Overhead
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                  Xiao et al. (2025): 23% idle power floor + 25% inference utilization (2.415× factor)
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
            <div className="metric-hero-block amber">
              <span className="metric-hero-label">Server Energy</span>
              <span className="metric-hero-value glow-amber">
                {calculation.energyWh < 0.1
                  ? calculation.energyWh.toFixed(3)
                  : calculation.energyWh.toFixed(2)}
              </span>
              <span className="metric-hero-unit">Watt-hours (Wh)</span>
            </div>

            <div className="metric-hero-block cyan">
              <span className="metric-hero-label">
                {waterMode === 'consumption' ? 'Water Consumed' : 'Water Withdrawn'}
              </span>
              <span className="metric-hero-value glow-cyan">
                {calculation.displayedTotalWaterMl.toFixed(1)}
              </span>
              <span className="metric-hero-unit">Milliliters (mL)</span>
            </div>

            <div className="metric-hero-block coral">
              <span className="metric-hero-label">Operational CO₂</span>
              <span className="metric-hero-value glow-coral">
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
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              <span>Water Scope Breakdown</span>
              <span style={{ color: 'var(--water-cyan-light)', fontFamily: 'var(--font-mono)' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#06b6d4',
                  }}
                />
                <span>
                  Scope 1 On-Site: {calculation.displayedScope1WaterMl.toFixed(1)} mL (
                  {calculation.scope1Percent}%)
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#3b82f6',
                  }}
                />
                <span>
                  Scope 2 Grid: {calculation.displayedScope2WaterMl.toFixed(1)} mL (
                  {calculation.scope2Percent}%)
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
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  color: 'var(--water-cyan-light)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {(calculation.bottleFraction * 100).toFixed(1)}% of a 500mL Water Bottle
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Equivalent to evaporating ~<strong>{calculation.waterDrops}</strong> standard drops
                of drinking-quality potable water.
              </div>
            </div>
          </div>

          {/* Tangible Everyday Equivalents */}
          <div className="equivalents-section">
            <div className="equivalents-title">
              <Lightbulb size={12} />
              <span>Relatable Everyday Equivalents</span>
            </div>

            <div className="equivalents-grid">
              <div className="equiv-card">
                <div className="equiv-icon-box" style={{ color: 'var(--energy-amber)' }}>
                  <Lightbulb size={16} />
                </div>
                <div>
                  <div className="equiv-value">{calculation.ledSeconds}s</div>
                  <div className="equiv-subtext">10W LED bulb glow</div>
                </div>
              </div>

              <div className="equiv-card">
                <div className="equiv-icon-box" style={{ color: 'var(--water-cyan)' }}>
                  <Smartphone size={16} />
                </div>
                <div>
                  <div className="equiv-value">
                    {calculation.smartphoneBatteryPercent.toFixed(2)}%
                  </div>
                  <div className="equiv-subtext">Smartphone charge</div>
                </div>
              </div>

              <div className="equiv-card">
                <div className="equiv-icon-box" style={{ color: 'var(--carbon-coral)' }}>
                  <Car size={16} />
                </div>
                <div>
                  <div className="equiv-value">{calculation.drivingMeters}m</div>
                  <div className="equiv-subtext">Petrol car driving</div>
                </div>
              </div>

              <div className="equiv-card">
                <div className="equiv-icon-box" style={{ color: 'var(--eco-emerald)' }}>
                  <Server size={16} />
                </div>
                <div>
                  <div className="equiv-value">
                    {(calculation.totalFacilityEnergyKWh * 1000).toFixed(2)} Wh
                  </div>
                  <div className="equiv-subtext">Facility energy (PUE)</div>
                </div>
              </div>
            </div>
          </div>

          {/* Copy Receipt Action button */}
          <div style={{ marginTop: '1.25rem' }}>
            <button
              className="btn btn-cyan"
              id="copy-receipt-btn"
              onClick={copyReceiptSummary}
              style={{ width: '100%', padding: '10px 16px', fontSize: '0.82rem', borderRadius: '8px' }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Copied Receipt to Clipboard!' : 'Copy Environmental Receipt'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
