import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { ModuleASandbox } from './components/ModuleA_Sandbox';
import { ModuleB3B1BExplainer } from './components/ModuleB_3B1BExplainer';
import { ModuleCSpatiotemporal } from './components/ModuleC_Spatiotemporal';
import { CitationsSection } from './components/CitationsSection';
import { FAQSection } from './components/FAQSection';
import { ReportView } from './components/ReportView';
import { MathFormula } from './components/MathFormula';
import { AI_MODELS } from './data/models';
import { LOCATIONS } from './data/locations';
import { PROMPT_PRESETS } from './data/presets';
import type { AIModel, DataCenterLocation, InfrastructureUpgrades, WeatherCondition } from './types';
import { calculateFootprint, calculateWeatherRecommendations } from './utils/calculator';
import { fetchAllLocationsWeather, getFallbackWeather } from './services/weather';
import { ArrowUpRight } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

const INITIAL_WEATHER_MAP: Record<string, WeatherCondition> = Object.fromEntries(
  LOCATIONS.map((loc) => [loc.id, getFallbackWeather(loc.id)])
);

export const App: React.FC = () => {
  // Option to switch to full in-app monograph view
  const [showMonograph, setShowMonograph] = useState<boolean>(false);

  // Core App State
  const [model, setModel] = useState<AIModel>(AI_MODELS[0]); // GPT-3 Full
  const [location, setLocation] = useState<DataCenterLocation>(LOCATIONS[0]); // U.S. Average
  const [promptText, setPromptText] = useState<string>(PROMPT_PRESETS[0].prompt);
  const [outputWords, setOutputWords] = useState<number>(PROMPT_PRESETS[0].suggestedOutputWords);
  const [includeIdlePenalty, setIncludeIdlePenalty] = useState<boolean>(false);
  const [waterMode, setWaterMode] = useState<'consumption' | 'withdrawal'>('consumption');

  const BASELINE_UPGRADES: InfrastructureUpgrades = useMemo(() => ({
    pueOptimization: false,
    wueOptimization: false,
    liquidCooling: false,
    serverUtilization: false,
    combinedBestPractices: false,
  }), []);

  // Real-time Global Weather Telemetry State (All 18 Data Centers synced via Open-Meteo)
  const [weatherMap, setWeatherMap] = useState<Record<string, WeatherCondition>>(INITIAL_WEATHER_MAP);
  const [isWeatherLoading, setIsWeatherLoading] = useState<boolean>(false);

  // Sync real-time weather from Open-Meteo across all 18 coordinates
  const refreshWeather = useCallback(async () => {
    setIsWeatherLoading(true);
    try {
      const data = await fetchAllLocationsWeather(LOCATIONS);
      setWeatherMap((prev) => ({ ...prev, ...data }));
    } catch (err) {
      console.error('Weather sync error:', err);
    } finally {
      setIsWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshWeather();
  }, [refreshWeather]);

  const weather = weatherMap[location.id] || null;

  // Count words
  const wordsIn = useMemo(() => {
    const trimmed = promptText.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }, [promptText]);

  // Standard Baseline Environmental Calculation
  const calculation = useMemo(() => {
    return calculateFootprint({
      model,
      location,
      wordsIn,
      wordsOut: outputWords,
      weather,
      includeIdlePenalty,
      waterMode,
      upgrades: BASELINE_UPGRADES,
    });
  }, [model, location, wordsIn, outputWords, weather, includeIdlePenalty, waterMode, BASELINE_UPGRADES]);

  // Real-Time Weather-Driven Best Data Center Recommendation Engine
  const weatherRecommendation = useMemo(() => {
    return calculateWeatherRecommendations({
      model,
      currentLocation: location,
      locations: LOCATIONS,
      wordsIn,
      wordsOut: outputWords,
      weatherMap,
      upgrades: BASELINE_UPGRADES,
      waterMode,
      includeIdlePenalty,
      isLoadingWeather: isWeatherLoading,
    });
  }, [
    model,
    location,
    wordsIn,
    outputWords,
    weatherMap,
    BASELINE_UPGRADES,
    waterMode,
    includeIdlePenalty,
    isWeatherLoading,
  ]);

  // If user opened full in-app report monograph
  if (showMonograph) {
    return (
      <ReportView
        onBackToSimulator={() => {
          setShowMonograph(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  return (
    <div className="app-root">
      {/* Clean Old-School Minimal Header */}
      <Header
        weatherRecommendation={weatherRecommendation}
        onOpenReport={() => {
          setShowMonograph(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      <main className="container">
        {/* Simple Minimal Page Intro */}
        <header className="page-intro">
          <span className="page-intro-badge">Peer-Reviewed Empirical Model</span>
          <h1 className="page-title">AI Query Carbon & Water Footprint Calculator</h1>
          <p className="page-lead">
            Estimate the physical electricity consumption, evaporative cooling water, and carbon emissions
            for generative AI inference queries based on empirical peer-reviewed data center literature (Li et al. CACM 2025, Xiao et al. Nature Sustainability 2025).
          </p>
        </header>

        {/* =========================================================================
            FEATURE 01 (TOP FEATURE): The Query and Its Impact
            ========================================================================= */}
        <section className="feature-section" id="feature-query">
          <div className="feature-header">
            <div className="feature-tag-row">
              <span className="feature-number-badge">Feature 01</span>
              <span className="feature-category">Core Interactive Tool</span>
            </div>
            <h2 className="feature-title">The Query & Its Environmental Impact</h2>
            <p className="feature-desc">
              Enter or select a prompt query, choose an AI foundation model and data center location,
              and inspect the real-time environmental receipt accounting for GPU energy, cooling water, and carbon.
            </p>
          </div>

          <ModuleASandbox
            model={model}
            setModel={setModel}
            location={location}
            setLocation={setLocation}
            promptText={promptText}
            setPromptText={setPromptText}
            outputWords={outputWords}
            setOutputWords={setOutputWords}
            includeIdlePenalty={includeIdlePenalty}
            setIncludeIdlePenalty={setIncludeIdlePenalty}
            waterMode={waterMode}
            setWaterMode={setWaterMode}
            calculation={calculation}
            weather={weather}
            weatherRecommendation={weatherRecommendation}
            onRefreshWeather={refreshWeather}
            isWeatherLoading={isWeatherLoading}
          />
        </section>

        {/* =========================================================================
            FEATURE 02: Physical Methodology & Thermodynamics (Scope 1 vs Scope 2)
            ========================================================================= */}
        <section className="feature-section" id="feature-physics">
          <div className="feature-header">
            <div className="feature-tag-row">
              <span className="feature-number-badge">Feature 02</span>
              <span className="feature-category">Physical Thermodynamics</span>
            </div>
            <h2 className="feature-title">Scope 1 vs Scope 2 Thermodynamic Flow</h2>
            <p className="feature-desc">
              Explore where water and electricity are physically consumed during an inference query:
              Scope 1 on-site evaporative cooling towers (~29%) versus Scope 2 off-site thermoelectric power plants (~71%).
            </p>
          </div>

          <ModuleB3B1BExplainer />
        </section>

        {/* =========================================================================
            FEATURE 03: Global Data Centers & Spatiotemporal Grid Routing
            ========================================================================= */}
        <section className="feature-section" id="feature-datacenters">
          <div className="feature-header">
            <div className="feature-tag-row">
              <span className="feature-number-badge">Feature 03</span>
              <span className="feature-category">Spatiotemporal Dispatch</span>
            </div>
            <h2 className="feature-title">Global Data Centers & Grid Routing Telemetry</h2>
            <p className="feature-desc">
              Real-time Open-Meteo ambient weather and electricity grid carbon intensity across 18 hyperscale campuses.
              Route compute dynamically to cooler climates and renewable grids to reduce emissions up to 3.8x.
            </p>
          </div>

          <ModuleCSpatiotemporal
            location={location}
            setLocation={setLocation}
            weather={weather}
            onRefreshWeather={refreshWeather}
            isWeatherLoading={isWeatherLoading}
            weatherRecommendation={weatherRecommendation}
            weatherMap={weatherMap}
          />
        </section>

        {/* =========================================================================
            FEATURE 04: Mathematical Formulations & Derivations
            ========================================================================= */}
        <section className="feature-section" id="feature-formulas">
          <div className="feature-header">
            <div className="feature-tag-row">
              <span className="feature-number-badge">Feature 04</span>
              <span className="feature-category">Mathematical Derivations</span>
            </div>
            <h2 className="feature-title">Thermodynamic & Carbon Formulations</h2>
            <p className="feature-desc">
              Core empirical equations derived from landmark peer-reviewed research papers.
            </p>
          </div>

          <div className="formulations-grid">
            <div className="formula-card">
              <div className="formula-card-title">
                <span>1. Inference Energy Scaling</span>
                <span className="badge badge-amber">Li / Stojkovic (2025)</span>
              </div>
              <div className="formula-equation-box">
                <MathFormula
                  formula={`E_{\\text{server}} = E_{\\text{base}} \\cdot \\left( 0.30 \\cdot \\frac{W_{\\text{in}}}{800} + 0.70 \\cdot \\frac{W_{\\text{out}}}{225} \\right)`}
                  displayMode={true}
                />
              </div>
              <p className="formula-desc">
                Accounts for compute-bound prompt prefill (30%) and sequential memory-bound autoregressive decoding (70%) reading billions of weights from HBM memory.
              </p>
            </div>

            <div className="formula-card">
              <div className="formula-card-title">
                <span>2. Total Facility Power (PUE)</span>
                <span className="badge badge-amber">ASHRAE TC 9.9</span>
              </div>
              <div className="formula-equation-box">
                <MathFormula
                  formula={`E_{\\text{total}} = E_{\\text{server}} \\cdot \\text{PUE}(T_{\\text{ambient}}, \\text{RH})`}
                  displayMode={true}
                />
              </div>
              <p className="formula-desc">
                PUE measures total facility electricity divided by IT equipment electricity. Overhead includes chillers, cooling tower fans, pumps, and power delivery transformers.
              </p>
            </div>

            <div className="formula-card">
              <div className="formula-card-title">
                <span>3. Scope 1 On-Site Water Evaporation</span>
                <span className="badge badge-cyan">Li et al. (CACM 2025)</span>
              </div>
              <div className="formula-equation-box">
                <MathFormula
                  formula={`W_{\\text{scope1}} = E_{\\text{server}} \\cdot \\text{WUE}_{\\text{site}} \\cdot \\left[ 1 + 0.024 \\cdot (T_{\\text{ambient}} - 20) \\right]`}
                  displayMode={true}
                />
              </div>
              <p className="formula-desc">
                Direct water consumption in data center cooling towers. Higher ambient outdoor temperatures increase thermodynamic evaporation rates per kilowatt-hour.
              </p>
            </div>

            <div className="formula-card">
              <div className="formula-card-title">
                <span>4. Scope 2 Off-Site Grid Water</span>
                <span className="badge badge-cyan">Xiao et al. (Nature Sust. 2025)</span>
              </div>
              <div className="formula-equation-box">
                <MathFormula
                  formula={`W_{\\text{scope2}} = E_{\\text{total}} \\cdot \\text{EWIF}_{\\text{regional grid}}`}
                  displayMode={true}
                />
              </div>
              <p className="formula-desc">
                Water consumed at distant thermoelectric power plants (nuclear, coal, gas) and evaporated from open hydroelectric dam reservoirs across regional electrical grids.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            FEATURE 05: Peer-Reviewed Citations & FAQ
            ========================================================================= */}
        <section className="feature-section" id="feature-citations">
          <div className="feature-header">
            <div className="feature-tag-row">
              <span className="feature-number-badge">Feature 05</span>
              <span className="feature-category">Academic Literature & Data</span>
            </div>
            <h2 className="feature-title">Peer-Reviewed Literature & Datasets</h2>
            <p className="feature-desc">
              Every constant, PUE curve, and water factor in Aetheria is sourced directly from peer-reviewed scientific literature.
            </p>
          </div>

          <CitationsSection />

          <div style={{ marginTop: '2rem' }}>
            <FAQSection />
          </div>

          {/* Standalone Monograph Link Box */}
          <div className="report-cta-box">
            <div className="report-cta-info">
              <h3>Scientific Monograph & 18-Datacenter Audit Report</h3>
              <p>
                Read our complete academic monograph with extended mathematical derivations, sensitivity analyses, and full telemetry table.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                onClick={() => {
                  setShowMonograph(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Read In-App Monograph
              </button>
              <a
                href="./report.html"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                <span>Open Standalone Report</span>
                <ArrowUpRight size={13} />
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* Clean Old-School Minimal Footer */}
      <footer className="minimal-footer">
        <div className="container footer-inner">
          <div>
            <strong>AETHERIA</strong> · Open Science AI Environmental Simulator (© {CURRENT_YEAR}).
          </div>
          <ul className="footer-links">
            <li>
              <a href="#feature-query">1. Query & Impact</a>
            </li>
            <li>
              <a href="#feature-physics">2. Physics</a>
            </li>
            <li>
              <a href="#feature-datacenters">3. Datacenters</a>
            </li>
            <li>
              <a href="#feature-formulas">4. Formulations</a>
            </li>
            <li>
              <a href="./report.html" target="_blank" rel="noopener noreferrer">
                Full Report Monograph ↗
              </a>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
};

export default App;
