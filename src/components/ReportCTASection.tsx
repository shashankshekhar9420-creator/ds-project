import React from 'react';
import { ArrowUpRight, BookOpen, CheckCircle2 } from 'lucide-react';

interface ReportCTASectionProps {
  onOpenReportInApp: () => void;
}

export const ReportCTASection: React.FC<ReportCTASectionProps> = ({ onOpenReportInApp }) => {
  return (
    <section className="report-cta-editorial-wrap" id="report-cta-section">
      <div className="report-cta-card">
        <div className="report-cta-left">
          <div className="pill-badge-luxury">
            <span className="live-indicator-dot" />
            <span>STANDALONE SCIENTIFIC PUBLICATION</span>
          </div>
          <h2 className="report-cta-title">
            The Scientific Concepts & Features Architecture Report
          </h2>
          <p className="report-cta-desc">
            We compiled a comprehensive, easy-to-navigate scientific report explaining all key platform features, how computing models consume electricity and water, the full mathematical proofs, and a detailed audit of 18 global datacenter locations.
          </p>

          <div className="report-highlights-row">
            <div className="highlight-pill">
              <CheckCircle2 size={13} className="text-emerald" />
              <span>Full Mathematical Proofs</span>
            </div>
            <div className="highlight-pill">
              <CheckCircle2 size={13} className="text-cyan" />
              <span>18 Global Datacenter Audits</span>
            </div>
            <div className="highlight-pill">
              <CheckCircle2 size={13} className="text-amber" />
              <span>Peer-Reviewed Citations</span>
            </div>
          </div>

          <div className="report-cta-actions">
            <a
              href="./report.html"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pill-white"
              id="cta-open-report-tab"
            >
              <span>Open Full Report in New Tab</span>
              <div className="circle-arrow-mini">
                <ArrowUpRight size={12} />
              </div>
            </a>

            <button
              className="btn-pill-ghost"
              onClick={onOpenReportInApp}
              id="cta-open-report-inapp"
            >
              <BookOpen size={15} />
              <span>Read Full Report Here</span>
            </button>
          </div>
        </div>

        <div className="report-cta-right">
          <div className="report-cover-preview">
            <div className="preview-top-bar">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
              <span className="preview-url">report.html // aetheria-scientific-monograph</span>
            </div>
            <div className="preview-doc-content">
              <div className="preview-badge">SPECIAL MONOGRAPH 2026</div>
              <h4>The Hidden Physical Weight of Intelligence</h4>
              <p>Features Architecture, Thermodynamic Principles, and Grid Hydrology.</p>
              <div className="preview-mini-stats">
                <div>
                  <strong>7</strong> Features Documented
                </div>
                <div>
                  <strong>7</strong> Core Principles
                </div>
                <div>
                  <strong>18</strong> Hubs Audited
                </div>
              </div>
              <div className="preview-formula-snippet">
                Water_Operational(t) = e_t × [ ρ_s1,t + θ_t × ρ_s2,t ]
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
