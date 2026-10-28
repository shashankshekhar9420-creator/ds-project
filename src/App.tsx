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
          <span className="page-intro-badge">Interactive Science Project</span>
          <h1 className="page-title">How Much Energy and Water Does an AI Query Really Use?</h1>
          <p className="page-lead">
            Every time you ask an AI model a question, thousands of specialized computer chips process your words.
            Those chips consume electricity, generate intense heat, and require continuous cooling.
            This project lets you explore the physical footprint of any prompt—estimating the electricity drawn from the grid,
            the drinking water evaporated in cooling towers, and the carbon emissions released into the air.
          </p>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            Calculations are based on peer-reviewed measurements from researchers at UC Riverside, Purdue University, and Google
            (Li et al. CACM 2025, Xiao et al. Nature Sustainability 2025).
          </p>
        </header>

        {/* =========================================================================
            FEATURE 01 (TOP FEATURE): The Query and Its Impact
            ========================================================================= */}
        <section className="feature-section" id="feature-query">
          <div className="feature-header">
            <div className="feature-tag-row">
              <span className="feature-number-badge">Feature 01</span>
              <span className="feature-category">Interactive Calculator</span>
            </div>
            <h2 className="feature-title">Your Question and Its Real-World Impact</h2>
            <p className="feature-desc">
              Choose an example prompt or type your own question below. Select an AI model and a data center location
              to see an instant estimate of the electricity, water, and carbon needed to generate the answer.
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
              <span className="feature-category">How It Works</span>
            </div>
            <h2 className="feature-title">Where Does the Water Actually Go?</h2>
            <p className="feature-desc">
              Every time an AI answers a question, electricity turns into heat inside high-powered computing chips.
              To keep those chips from overheating, datacenters evaporate clean water in cooling towers right outside the facility
              (<strong>Scope 1: ~29% on-site evaporation</strong>). At the same time, the power plants generating that electricity
              consume even more water off-site through thermoelectric steam cooling and reservoir evaporation (<strong>Scope 2: ~71% off-site water</strong>).
              Explore the animated simulation below to see how electricity and cooling water flow together through the grid.
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
              <span className="feature-category">Smart Routing</span>
            </div>
            <h2 className="feature-title">Global Data Centers and Green Grid Routing</h2>
            <p className="feature-desc">
              Because weather changes with the seasons and electrical grids change throughout the day,
              where and when an AI query runs matters tremendously.
              Routing your query to a facility in a cooler climate with abundant wind, solar, or hydro power
              can reduce carbon emissions by up to 3.8 times without changing the answer you receive.
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
              <span className="feature-category">The Science & Equations</span>
            </div>
            <h2 className="feature-title">The Math Behind the Calculator</h2>
            <p className="feature-desc">
              How do we turn a paragraph of text into watt-hours, milliliters of water, and grams of greenhouse gas?
              Here are the core scientific formulas used in our model, explained step by step in plain English.
            </p>
          </div>

          <div className="formulations-grid">
            <div className="formula-card">
              <div className="formula-card-title">
                <span>1. Server Energy for a Query</span>
                <span className="badge">Li / Stojkovic (2025)</span>
              </div>
              <div className="formula-equation-box">
                <MathFormula
                  formula={`E_{\\text{server}} = E_{\\text{base}} \\cdot \\left( 0.30 \\cdot \\frac{W_{\\text{in}}}{800} + 0.70 \\cdot \\frac{W_{\\text{out}}}{225} \\right)`}
                  displayMode={true}
                />
              </div>
              <p className="formula-desc">
                <strong>In plain words:</strong> Answering a question has two distinct phases.
                First, the AI reads your prompt all at once (about 30% of energy use).
                Second, it generates the response word by word (about 70% of energy use).
                Writing answers takes far more energy than reading questions because the computer chips must reload billions of model weights into memory for every single word they output.
              </p>
            </div>

            <div className="formula-card">
              <div className="formula-card-title">
                <span>2. Total Facility Power Overhead (PUE)</span>
                <span className="badge">Building Efficiency</span>
              </div>
              <div className="formula-equation-box">
                <MathFormula
                  formula={`E_{\\text{total}} = E_{\\text{server}} \\cdot \\text{PUE}(T_{\\text{ambient}}, \\text{RH})`}
                  displayMode={true}
                />
              </div>
              <p className="formula-desc">
                <strong>In plain words:</strong> The computer chips are not the only things using power.
                The building also runs giant cooling fans, water pumps, lighting, and power backup units.
                The Power Usage Effectiveness (PUE) is the multiplier that accounts for this building overhead.
                A PUE of 1.20 means that for every 1.00 Watt the chips consume, the building uses another 0.20 Watts to keep them running smoothly.
              </p>
            </div>

            <div className="formula-card">
              <div className="formula-card-title">
                <span>3. On-Site Water Evaporation</span>
                <span className="badge">Li et al. (CACM 2025)</span>
              </div>
              <div className="formula-equation-box">
                <MathFormula
                  formula={`W_{\\text{scope1}} = E_{\\text{server}} \\cdot \\text{WUE}_{\\text{site}} \\cdot \\left[ 1 + 0.024 \\cdot (T_{\\text{ambient}} - 20) \\right]`}
                  displayMode={true}
                />
              </div>
              <p className="formula-desc">
                <strong>In plain words:</strong> When server chips heat up, chilled water loops carry the heat up to rooftop cooling towers.
                There, heat is rejected into the outdoor air by evaporating water into clean steam.
                On hotter summer days, the cooling towers must evaporate significantly more water to keep the chips at safe operating temperatures.
              </p>
            </div>

            <div className="formula-card">
              <div className="formula-card-title">
                <span>4. Off-Site Power Plant Water</span>
                <span className="badge">Xiao et al. (Nature Sust. 2025)</span>
              </div>
              <div className="formula-equation-box">
                <MathFormula
                  formula={`W_{\\text{scope2}} = E_{\\text{total}} \\cdot \\text{EWIF}_{\\text{regional grid}}`}
                  displayMode={true}
                />
              </div>
              <p className="formula-desc">
                <strong>In plain words:</strong> Generating electricity also consumes water.
                Coal, natural gas, and nuclear power plants boil water into steam to turn turbines, then cool that steam back down using water from rivers and lakes.
                Even hydroelectric dams lose water through surface evaporation in the sun.
                This off-site water usage (EWIF) is often several times larger than the water evaporated at the data center building itself.
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
              <span className="feature-category">Sources & Common Questions</span>
            </div>
            <h2 className="feature-title">Scientific Literature & Helpful Answers</h2>
            <p className="feature-desc">
              Explore the peer-reviewed research papers that provided the numbers for this project,
              and read clear answers to common questions about AI energy and water consumption.
            </p>
          </div>

          <CitationsSection />

          <div style={{ marginTop: '32px' }}>
            <FAQSection />
          </div>

          {/* Standalone Monograph Link Box */}
          <div className="report-cta-box">
            <div className="report-cta-info">
              <h3>Read the Complete Technical Report</h3>
              <p>
                Interested in the full academic derivations, sensitivity charts, and complete 18-datacenter telemetry table?
                Read our in-depth research monograph.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                className="btn-primary"
                onClick={() => {
                  setShowMonograph(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                Read Report Inside App
              </button>
              <a
                href="./report.html"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary"
              >
                <span>Open in Separate Tab</span>
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
            <strong>AI Water & Energy Simulator</strong> · An Educational AI Environmental Impact Project (© {CURRENT_YEAR}).
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
                Technical Report ↗
              </a>
            </li>
          </ul>
        </div>
      </footer>
    </div>
  );
};

export default App;
