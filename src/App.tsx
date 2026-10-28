import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { ShowcaseSection } from './components/ShowcaseSection';
import { ReportCTASection } from './components/ReportCTASection';
import { FAQSection } from './components/FAQSection';
import { CitationsSection } from './components/CitationsSection';
import { ReportView } from './components/ReportView';
import { ModuleASandbox } from './components/ModuleA_Sandbox';
import { ModuleB3B1BExplainer } from './components/ModuleB_3B1BExplainer';
import { ModuleCSpatiotemporal } from './components/ModuleC_Spatiotemporal';
import { AI_MODELS } from './data/models';
import { LOCATIONS } from './data/locations';
import { PROMPT_PRESETS } from './data/presets';
import type { AIModel, DataCenterLocation, InfrastructureUpgrades, WeatherCondition, AppTab } from './types';
import { calculateFootprint, calculateWeatherRecommendations } from './utils/calculator';
import { fetchAllLocationsWeather, getFallbackWeather } from './services/weather';
import { Sparkles } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

const INITIAL_WEATHER_MAP: Record<string, WeatherCondition> = Object.fromEntries(
  LOCATIONS.map((loc) => [loc.id, getFallbackWeather(loc.id)])
);

export const App: React.FC = () => {
  // Navigation
  const [activeTab, setActiveTab] = useState<AppTab>('sandbox');

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

  // If user selected in-app report tab, render the full publication report
  if (activeTab === 'report') {
    return (
      <ReportView
        onBackToSimulator={() => {
          setActiveTab('sandbox');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    );
  }

  return (
    <div className="app-root">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        weatherRecommendation={weatherRecommendation}
      />

      {/* Hero section is displayed on the main Sandbox/Landing tab */}
      {activeTab === 'sandbox' && (
        <HeroSection
          onExploreSandbox={() => {
            document.getElementById('sandbox-simulation-anchor')?.scrollIntoView({ behavior: 'smooth' });
          }}
          onOpenReport={() => {
            setActiveTab('report');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}

      <div id="sandbox-simulation-anchor" />

      <main className="container" style={{ paddingTop: '2.5rem', paddingBottom: '3.5rem' }}>
        {activeTab === 'sandbox' && (
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
        )}

        {activeTab === 'explainer' && <ModuleB3B1BExplainer />}

        {activeTab === 'optimizer' && (
          <ModuleCSpatiotemporal
            location={location}
            setLocation={setLocation}
            weather={weather}
            onRefreshWeather={refreshWeather}
            isWeatherLoading={isWeatherLoading}
            weatherRecommendation={weatherRecommendation}
            weatherMap={weatherMap}
          />
        )}
      </main>

      {/* Additional Editorial Showcases & Publications on Sandbox page */}
      {activeTab === 'sandbox' && (
        <div className="container">
          <ShowcaseSection
            onSelectTab={(tab) => {
              setActiveTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
          <ReportCTASection
            onOpenReportInApp={() => {
              setActiveTab('report');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
          <FAQSection />
          <CitationsSection />
        </div>
      )}

      {/* Non-sandbox tabs still show the publication CTA at bottom for context */}
      {activeTab !== 'sandbox' && (
        <div className="container" style={{ paddingBottom: '3rem' }}>
          <ReportCTASection
            onOpenReportInApp={() => {
              setActiveTab('report');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        </div>
      )}

      {/* Global Luxury Footer */}
      <footer className="luxury-footer">
        <div className="container">
          <div className="footer-top-grid">
            <div>
              <div className="brand-wrapper" style={{ marginBottom: '1.25rem' }}>
                <div className="brand-logo-icon">
                  <Sparkles size={16} />
                </div>
                <div className="brand-text-block">
                  <div className="brand-title">AETHERIA</div>
                  <div className="brand-badge-pill">AI HYDROLOGY & CARBON LAB</div>
                </div>
              </div>
              <p className="footer-brand-desc">
                Publication-grade interactive hydrology & carbon footprint tracker for generative AI inference, built on peer-reviewed empirical models from Li et al. (2025), Xiao et al. (2025), and Radovanović et al. (Google CICS).
              </p>
            </div>

            <div className="footer-col">
              <div className="footer-col-title">Interactive Modules</div>
              <ul className="footer-links-list">
                <li>
                  <button
                    className="footer-link-btn"
                    onClick={() => {
                      setActiveTab('sandbox');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Query Sandbox & Receipt
                  </button>
                </li>
                <li>
                  <button
                    className="footer-link-btn"
                    onClick={() => {
                      setActiveTab('explainer');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Education & Methodology
                  </button>
                </li>
                <li>
                  <button
                    className="footer-link-btn"
                    onClick={() => {
                      setActiveTab('optimizer');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Spatiotemporal Dispatch
                  </button>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <div className="footer-col-title">Scientific Report</div>
              <ul className="footer-links-list">
                <li>
                  <a href="./report.html" target="_blank" rel="noopener noreferrer">
                    Standalone Monograph ↗
                  </a>
                </li>
                <li>
                  <button
                    className="footer-link-btn"
                    onClick={() => {
                      setActiveTab('report');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                  >
                    Interactive Report View
                  </button>
                </li>
                <li>
                  <a href="./report.html#math-formulations" target="_blank" rel="noopener noreferrer">
                    Mathematical Formulations ↗
                  </a>
                </li>
                <li>
                  <a href="./report.html#hyperscale-table" target="_blank" rel="noopener noreferrer">
                    18 Data Center Audit ↗
                  </a>
                </li>
              </ul>
            </div>

            <div className="footer-col">
              <div className="footer-col-title">Peer-Reviewed Foundations</div>
              <ul className="footer-links-list">
                <li>
                  <span style={{ color: 'var(--text-muted)' }}>Li et al. (CACM 2025)</span>
                </li>
                <li>
                  <span style={{ color: 'var(--text-muted)' }}>Xiao et al. (Nature Sust. 2025)</span>
                </li>
                <li>
                  <span style={{ color: 'var(--text-muted)' }}>Radovanović et al. (Google CICS)</span>
                </li>
                <li>
                  <span style={{ color: 'var(--text-muted)' }}>Stojkovic et al. (ASPLOS 2025)</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <div>© {CURRENT_YEAR} AETHERIA Open Science Initiative. MIT License.</div>
            <div>Designed for thermodynamic clarity, environmental rigor, and executive transparency.</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
