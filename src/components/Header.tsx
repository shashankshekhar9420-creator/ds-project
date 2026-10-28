import React, { useState, useEffect } from 'react';
import {
  FileText,
  ArrowUpRight,
} from 'lucide-react';
import { MACRO_FACTS } from '../data/presets';
import type { WeatherRecommendation } from '../types';

interface HeaderProps {
  weatherRecommendation?: WeatherRecommendation;
  onOpenReport?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ weatherRecommendation, onOpenReport }) => {
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % MACRO_FACTS.length);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const currentFact = MACRO_FACTS[factIndex];

  return (
    <>
      <header className="app-header">
        <div className="container header-inner">
          {/* Brand Identity */}
          <a href="#feature-query" className="brand-wrapper">
            <div className="brand-logo-icon">
              <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>Æ</span>
            </div>
            <div className="brand-text-block">
              <div className="brand-title">AETHERIA</div>
              <div className="brand-badge-pill">AI Water & Energy Simulator</div>
            </div>
          </a>

          {/* Clean Minimal Anchor Navigation to Feature Sections */}
          <nav className="nav-tabs" aria-label="Feature Sections Navigation">
            <a href="#feature-query" className="nav-tab-btn">
              <span>1. Query & Impact</span>
            </a>
            <a href="#feature-physics" className="nav-tab-btn">
              <span>2. Where Water Goes</span>
            </a>
            <a href="#feature-datacenters" className="nav-tab-btn">
              <span>3. Global Datacenters</span>
            </a>
            <a href="#feature-formulas" className="nav-tab-btn">
              <span>4. The Math</span>
            </a>
            <a href="#feature-citations" className="nav-tab-btn">
              <span>5. Sources & FAQ</span>
            </a>
          </nav>

          {/* Right Action & API Telemetry Status */}
          <div className="header-actions-right">
            <div
              className="live-grid-capsule"
              title={
                weatherRecommendation
                  ? `Live Telemetry: Open-Meteo Weather + Grid Intensity. Best Location Right Now: ${weatherRecommendation.bestOverall.location.name} (${weatherRecommendation.bestOverall.weather.temperatureC}°C).`
                  : 'Live Telemetry: Open-Meteo Weather and Grid APIs Connected'
              }
            >
              <span className="live-dot-green" />
              <span>Live Weather Synced</span>
            </div>

            {onOpenReport ? (
              <button
                className="btn-secondary btn-sm"
                onClick={onOpenReport}
                id="nav-report-btn"
                title="View full research report"
              >
                <FileText size={13} />
                <span>Full Report</span>
              </button>
            ) : (
              <a
                href="./report.html"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-secondary btn-sm"
                id="nav-report-link"
                title="Open full interactive scientific report in a new tab"
              >
                <FileText size={13} />
                <span>Full Report</span>
                <ArrowUpRight size={12} />
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Subtle, Minimal Macro Context Ticker */}
      <div className="macro-ticker" id="macro-facts-ticker">
        <div className="container ticker-container">
          <div className="ticker-content">
            <span className="ticker-badge">
              {currentFact.highlight}
            </span>
            <span className="ticker-text">
              {currentFact.text}
            </span>
            <span className="ticker-cite">
              — {currentFact.citation}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};
