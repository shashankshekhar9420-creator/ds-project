import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Activity,
  Layers,
  Compass,
  ArrowUpRight,
  FileText,
  Radio,
} from 'lucide-react';
import { MACRO_FACTS } from '../data/presets';
import type { WeatherRecommendation, AppTab } from '../types';

interface HeaderProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  weatherRecommendation?: WeatherRecommendation;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, weatherRecommendation }) => {
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % MACRO_FACTS.length);
    }, 9000);
    return () => clearInterval(timer);
  }, []);

  const currentFact = MACRO_FACTS[factIndex];

  return (
    <>
      <header className="app-header">
        <div className="container header-inner">
          {/* Brand Identity */}
          <div
            className="brand-wrapper"
            onClick={() => setActiveTab('sandbox')}
            style={{ cursor: 'pointer' }}
          >
            <div className="brand-logo-icon">
              <Sparkles size={15} />
            </div>
            <div className="brand-text-block">
              <div className="brand-title">AETHERIA</div>
              <div className="brand-badge-pill">AI HYDROLOGY & CARBON LAB</div>
            </div>
          </div>

          {/* Clean 3-Tab Main Navigation */}
          <nav className="nav-tabs" aria-label="Main Navigation">
            <button
              className={`nav-tab-btn ${activeTab === 'sandbox' ? 'active' : ''}`}
              id="tab-btn-sandbox"
              onClick={() => setActiveTab('sandbox')}
            >
              <Activity size={14} />
              <span>Sandbox & Receipt</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'explainer' ? 'active' : ''}`}
              id="tab-btn-explainer"
              onClick={() => setActiveTab('explainer')}
            >
              <Layers size={14} />
              <span>Education & Methodology</span>
            </button>

            <button
              className={`nav-tab-btn ${activeTab === 'optimizer' ? 'active' : ''}`}
              id="tab-btn-optimizer"
              onClick={() => setActiveTab('optimizer')}
            >
              <Compass size={14} />
              <span>Spatiotemporal Dispatch</span>
            </button>
          </nav>

          {/* Right Action & API Telemetry Status */}
          <div className="header-actions-right">
            {/* Live Weather & Electricity Grid Status Capsule */}
            <div
              className="live-grid-capsule"
              title={
                weatherRecommendation
                  ? `APIs Live: Open-Meteo Weather + European / UK Electrical Grid Telemetry. Optimal Hub: ${weatherRecommendation.bestOverall.location.name} (${weatherRecommendation.bestOverall.weather.temperatureC}°C).`
                  : 'Live Telemetry: Open-Meteo Weather & Grid APIs Connected'
              }
            >
              <span className="live-dot-green" />
              <Radio size={12} style={{ color: 'var(--eco-emerald-light)' }} />
              <span>APIs SYNCED</span>
            </div>

            {/* Standalone Report Link */}
            <a
              href="./report.html"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pill-white btn-sm"
              id="nav-report-link"
              title="Open full interactive scientific report in a new tab"
            >
              <FileText size={13} />
              <span>Scientific Report</span>
              <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
      </header>

      {/* Subtle, Minimal Macro Context Ticker */}
      <div className="macro-ticker" id="macro-facts-ticker">
        <div className="container ticker-container">
          <div className="ticker-content" style={{ opacity: 0.88 }}>
            <span className="ticker-badge" style={{ fontSize: '0.6875rem', padding: '1px 7px' }}>
              {currentFact.highlight}
            </span>
            <span className="ticker-text" style={{ fontSize: '0.75rem' }}>
              {currentFact.text}
            </span>
            <span className="ticker-cite" style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              ({currentFact.citation})
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
