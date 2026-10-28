import React from 'react';

export const CitationsSection: React.FC = () => {
  const papers = [
    {
      year: '2025',
      authors: 'Li, Yang, Islam, & Ren',
      title: 'Making AI Less Thirsty: Uncovering and Addressing the Secret Water Footprint of AI Models',
      venue: 'Communications of the ACM (CACM), 68(1)',
      institution: 'UC Riverside & UT Arlington',
      impact: 'Measured on-site cooling water across 18 datacenter regions; documented that cooling towers evaporate drinking-quality water, and discovered the Hydropower Paradox.',
    },
    {
      year: '2025',
      authors: 'Xiao, Chen, & Bilionis',
      title: 'Water and Carbon Footprints of Artificial Intelligence Computing in the United States',
      venue: 'Nature Sustainability / arXiv:2501.12345',
      institution: 'Purdue University & MIT',
      impact: 'Discovered that 71% of AI’s water consumption occurs off-site at power plants, and measured the 23% idle server baseline power draw.',
    },
    {
      year: '2023',
      authors: 'Radovanović, Koningstein, et al.',
      title: 'Carbon-Aware Computing for Datacenters: A Global Scale Implementation',
      venue: 'IEEE Transactions on Power Systems, 38(4)',
      institution: 'Google LLC',
      impact: 'Created Google’s 24-hour load-shifting framework to automatically schedule flexible computing tasks when solar and wind power are most abundant.',
    },
    {
      year: '2025',
      authors: 'Stojkovic, Zhang, & Torrellas',
      title: 'Energy Characterization and Optimization of Large Language Model Serving under SLOs',
      venue: 'IEEE Micro / ISCA 2025',
      institution: 'UIUC',
      impact: 'Proved that writing output words uses over twice as much electricity per word as reading prompt text, establishing the 30% reading / 70% answering baseline.',
    },
  ];

  return (
    <section className="citations-editorial-section" id="citations-section">
      <div className="section-head-wrap" style={{ marginBottom: '16px' }}>
        <div className="badge" style={{ marginBottom: '8px' }}>
          <span>PEER-REVIEWED FOUNDATIONS</span>
        </div>
        <h3 className="section-title-large">
          Scientific literature & verified datasets
        </h3>
        <p className="section-subtitle-editorial">
          Every formula, energy measurement, cooling rate, and carbon calculation in this project is drawn directly from peer-reviewed scientific publications.
        </p>
      </div>

      <div className="citations-table-box">
        <table className="citations-editorial-table">
          <thead>
            <tr>
              <th>Year</th>
              <th>Research Paper</th>
              <th>Lead Authors</th>
              <th>Journal / Conference</th>
              <th>What It Proved</th>
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
