import React from 'react';
import { ArrowUpRight, BookOpen, CheckCircle2 } from 'lucide-react';

interface ReportCTASectionProps {
  onOpenReportInApp: () => void;
}

export const ReportCTASection: React.FC<ReportCTASectionProps> = ({ onOpenReportInApp }) => {
  return (
    <section className="report-cta-box" id="report-cta-section">
      <div className="report-cta-info">
        <div className="badge" style={{ marginBottom: '8px' }}>
          <span>STANDALONE SCIENTIFIC PUBLICATION</span>
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
          The Scientific Concepts & Features Architecture Report
        </h3>
        <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', lineHeight: 1.6, width: '100%', marginBottom: '16px' }}>
          We compiled a comprehensive, easy-to-navigate scientific report explaining all key platform features, how computing models consume electricity and water, the full mathematical proofs, and a detailed audit of 18 global datacenter locations.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text)' }}>
            <CheckCircle2 size={15} style={{ color: 'var(--accent)' }} />
            <span>Full Mathematical Proofs</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text)' }}>
            <CheckCircle2 size={15} style={{ color: 'var(--accent)' }} />
            <span>18 Global Datacenter Audits</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--text)' }}>
            <CheckCircle2 size={15} style={{ color: 'var(--accent)' }} />
            <span>Peer-Reviewed Citations</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            className="btn-primary"
            onClick={onOpenReportInApp}
            id="cta-open-report-inapp"
          >
            <BookOpen size={16} />
            <span>Read Full Report Here</span>
          </button>
          <a
            href="./report.html"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            id="cta-open-report-tab"
          >
            <span>Open in New Tab</span>
            <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
    </section>
  );
};
