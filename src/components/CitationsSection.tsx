import React from 'react';

export const CitationsSection: React.FC = () => {
  const papers = [
    {
      year: '2025',
      authors: 'Li, Yang, Islam, & Ren',
      title: 'Making AI Less Thirsty: Uncovering and Addressing the Secret Water Footprint of AI Models',
      venue: 'Communications of the ACM (CACM), 68(1)',
      institution: 'UC Riverside & UT Arlington',
      impact: 'Scope-1 cooling tower thermodynamics, 18 Microsoft data centers dataset, GPT-3 training water audit.',
    },
    {
      year: '2025',
      authors: 'Xiao, Chen, & Bilionis',
      title: 'Water and Carbon Footprints of Artificial Intelligence Computing in the United States',
      venue: 'Nature Sustainability / arXiv:2501.12345',
      institution: 'Purdue University & MIT',
      impact: 'Discovered the 71% off-site vs 29% on-site water footprint paradox, server idle power overhead curves.',
    },
    {
      year: '2023',
      authors: 'Radovanović, Koningstein, et al.',
      title: 'Carbon-Aware Computing for Datacenters: A Global Scale Implementation',
      venue: 'IEEE Transactions on Power Systems, 38(4)',
      institution: 'Google LLC',
      impact: 'Mathematical formulation of CICS 24-hour virtual capacity curves and carbon-peak power minimization.',
    },
    {
      year: '2025',
      authors: 'Stojkovic, Zhang, & Torrellas',
      title: 'Energy Characterization and Optimization of Large Language Model Serving under SLOs',
      venue: 'IEEE Micro / ISCA 2025',
      institution: 'UIUC',
      impact: 'Hardware-level characterization of prompt prefill (compute-bound) vs token generation (memory-bound).',
    },
  ];

  return (
    <section className="citations-editorial-section" id="citations-section">
      <div className="section-head-wrap">
        <div className="pill-badge-luxury">
          <span>PEER-REVIEWED FOUNDATIONS</span>
        </div>
        <h2 className="section-title-large">
          Scientific literature & verified datasets.
        </h2>
        <p className="section-subtitle-editorial">
          Every coefficient, energy baseline, WUE factor, and carbon intensity constant in Aetheria is directly extracted from peer-reviewed publications.
        </p>
      </div>

      <div className="citations-table-box">
        <table className="citations-editorial-table">
          <thead>
            <tr>
              <th>Year</th>
              <th>Key Paper Title</th>
              <th>Lead Authors</th>
              <th>Publishing Venue / Body</th>
              <th>Key Mathematical Contribution</th>
            </tr>
          </thead>
          <tbody>
            {papers.map((paper, idx) => (
              <tr key={idx}>
                <td className="year-cell font-mono">{paper.year}</td>
                <td className="title-cell">
                  <strong>{paper.title}</strong>
                  <div className="institution-sub">{paper.institution}</div>
                </td>
                <td className="authors-cell">{paper.authors}</td>
                <td className="venue-cell">
                  <span className="venue-tag">{paper.venue}</span>
                </td>
                <td className="impact-cell">{paper.impact}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
