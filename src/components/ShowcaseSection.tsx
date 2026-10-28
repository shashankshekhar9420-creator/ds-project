import React from 'react';
import { ArrowRight, Cpu, Layers, Compass } from 'lucide-react';
import type { AppTab } from '../types';

interface ShowcaseSectionProps {
  onSelectTab: (tab: AppTab) => void;
}

export const ShowcaseSection: React.FC<ShowcaseSectionProps> = ({ onSelectTab }) => {
  const pillars = [
    {
      number: '01',
      title: 'Dual-Phase Token Physics & Receipt',
      tag: 'COMPUTE & HYDROLOGY ACCOUNTING',
      desc: 'Decomposes LLM inference into parallel prompt prefill (compute-bound) and sequential token generation (memory-bandwidth bound). Calculates high-precision energy, water evaporation, and carbon emissions with tangible everyday equivalents.',
      tab: 'sandbox' as const,
      icon: Cpu,
      accent: 'amber',
      stats: '0.30 Prefill / 0.70 Decoding ratio',
    },
    {
      number: '02',
      title: 'Thermodynamics & Scientific Methodology',
      tag: 'EDUCATION & MATHEMATICAL FORMULATIONS',
      desc: 'Interactive 3Blue1Brown-style particle simulation of cooling tower evaporation vs. off-site power generation. Includes in-depth token calculation analysis and verified formulas from Li et al., Xiao et al., and Stojkovic et al.',
      tab: 'explainer' as const,
      icon: Layers,
      accent: 'cyan',
      stats: '71% Off-Site vs 29% On-Site water',
    },
    {
      number: '03',
      title: 'Spatiotemporal Grid & Weather Dispatch',
      tag: 'LIVE APIS & LOAD SHIFTING',
      desc: 'Simulates the fundamental diurnal solar-water conflict using Google CICS Virtual Capacity Curves. Integrates real-time Open-Meteo temperature and UK/European grid electricity consumption feeds across 18 hyperscale hubs.',
      tab: 'optimizer' as const,
      icon: Compass,
      accent: 'emerald',
      stats: 'Live Weather, Temp & Grid APIs',
    },
  ];

  return (
    <section className="showcase-section" id="showcase-section">
      <div className="section-head-wrap">
        <div className="pill-badge-luxury">
          <span>SCIENTIFIC PILLARS</span>
        </div>
        <h2 className="section-title-large">
          The physical weight of artificial intelligence.
        </h2>
        <p className="section-subtitle-editorial">
          Three interconnected research pillars translating peer-reviewed thermodynamics, empirical token mechanics, and live grid telemetry into clear, interactive models.
        </p>
      </div>

      <div className="pillars-showcase-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {pillars.map((pillar) => {
          const IconComponent = pillar.icon;
          return (
            <div
              key={pillar.number}
              className={`pillar-card ${pillar.accent}`}
              onClick={() => onSelectTab(pillar.tab)}
            >
              <div className="pillar-top">
                <span className="pillar-number">{pillar.number}</span>
                <span className={`pillar-tag ${pillar.accent}`}>{pillar.tag}</span>
              </div>

              <div className="pillar-body">
                <div className="pillar-icon-box">
                  <IconComponent size={18} />
                </div>
                <h3 className="pillar-title">{pillar.title}</h3>
                <p className="pillar-desc">{pillar.desc}</p>
              </div>

              <div className="pillar-footer">
                <span className="pillar-stats">{pillar.stats}</span>
                <button
                  className="pillar-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectTab(pillar.tab);
                  }}
                >
                  <span>Explore</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
