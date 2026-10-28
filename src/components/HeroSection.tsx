import React from 'react';
import { ChevronDown, Sparkles, FileText, Activity } from 'lucide-react';

interface HeroSectionProps {
  onExploreSandbox: () => void;
  onOpenReport: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onExploreSandbox,
  onOpenReport,
}) => {
  return (
    <section className="hero-editorial" id="hero-section">
      {/* Ambient background light prism aura */}
      <div className="hero-ambient-glow" />

      <div className="hero-content">
        {/* Monospace Badge Capsule */}
        <div className="hero-badge-wrap">
          <div className="pill-badge-luxury">
            <span className="live-indicator-dot" />
            <span>PEER-REVIEWED AI CLIMATE & HYDROLOGY TELEMETRY</span>
          </div>
        </div>

        {/* Dramatic Editorial Headline */}
        <h1 className="hero-title">
          Designed to reveal the physical weight of intelligence.
        </h1>

        {/* Subtitle */}
        <p className="hero-subtitle">
          Every prompt converts high-voltage grid electricity into thermal entropy, dissipates heat, and evaporates municipal drinking water across cooling towers and remote power plants.
        </p>

        {/* Primary & Secondary Action CTAs */}
        <div className="hero-actions">
          <button
            className="btn-pill-white"
            onClick={onExploreSandbox}
            id="hero-btn-sandbox"
          >
            <span>Launch Interactive Simulator</span>
            <ChevronDown size={15} />
          </button>

          <a
            href="./report.html"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-pill-ghost"
            id="hero-btn-report-link"
          >
            <FileText size={15} />
            <span>Scientific Report ↗</span>
          </a>

          <button
            type="button"
            className="btn-pill-ghost"
            onClick={onOpenReport}
            id="hero-btn-inapp-report"
          >
            <Sparkles size={14} />
            <span>Read Inside App</span>
          </button>
        </div>

        {/* Live Telemetry Bento Grid (4 Columns) */}
        <div className="hero-telemetry-grid">
          <div className="telemetry-card">
            <div className="telemetry-card-top">
              <span className="telemetry-tag amber">ON-SITE DIRECT</span>
              <Sparkles size={14} className="telemetry-icon amber" />
            </div>
            <div className="telemetry-value">5.4M Liters</div>
            <div className="telemetry-label">Water to Train GPT-3 (US Hubs)</div>
            <div className="telemetry-sub">700k L direct on-site cooling evaporation</div>
          </div>

          <div className="telemetry-card">
            <div className="telemetry-card-top">
              <span className="telemetry-tag cyan">PARADOX DISCOVERY</span>
              <Activity size={14} className="telemetry-icon cyan" />
            </div>
            <div className="telemetry-value">71% / 29%</div>
            <div className="telemetry-label">Off-Site Grid vs. On-Site Water</div>
            <div className="telemetry-sub">Power plant fuel cycle dominates cooling towers</div>
          </div>

          <div className="telemetry-card">
            <div className="telemetry-card-top">
              <span className="telemetry-tag emerald">GLOBAL SITING</span>
              <Activity size={14} className="telemetry-icon emerald" />
            </div>
            <div className="telemetry-value">18 Hubs</div>
            <div className="telemetry-label">Live Open-Meteo Weather Synced</div>
            <div className="telemetry-sub">Dynamic wet-bulb thermodynamic WUE modulation</div>
          </div>

          <div className="telemetry-card">
            <div className="telemetry-card-top">
              <span className="telemetry-tag coral">GRID INTENSITY</span>
              <Activity size={14} className="telemetry-icon coral" />
            </div>
            <div className="telemetry-value">0.38 kg</div>
            <div className="telemetry-label">US Grid Baseline CO₂e per kWh</div>
            <div className="telemetry-sub">Xiao et al. (2025) / Li et al. (2025) audited</div>
          </div>
        </div>
      </div>
    </section>
  );
};
