import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  citation: string;
}

export const FAQSection: React.FC = () => {
  const [openId, setOpenId] = useState<string | null>('faq-1');

  const faqs: FAQItem[] = [
    {
      id: 'faq-1',
      question: 'Why does generating text consume physical drinking water?',
      answer:
        'When GPUs compute billions of matrix multiplications, electrical power is converted directly into heat. In hyperscale data centers, servers reject this heat into evaporative cooling towers where heated water is sprayed and evaporated into the atmosphere. Over 80% of on-site cooling water must be potable drinking water to prevent mineral crusts from destroying heat exchangers and to suppress bacterial colonization.',
      citation: 'Li et al. (2025) • CACM',
    },
    {
      id: 'faq-2',
      question: 'Why is 71% of AI’s water footprint off-site rather than inside the data center?',
      answer:
        'Xiao et al. (2025) proved that across U.S. data centers, 71% of total water consumption occurs at power plants generating the grid electricity (Scope 2), while only 29% occurs on-site (Scope 1). Coal, natural gas, and nuclear power plants boil water for steam turbine generators and evaporate enormous volumes of cooling water. Furthermore, hydroelectric reservoirs evaporate massive volumes from open water surfaces.',
      citation: 'Xiao et al. (2025) • Nature Sustainability / arXiv:2501.12345',
    },
    {
      id: 'faq-3',
      question: 'What is the Hydropower Inversion Paradox in Washington State and Oregon?',
      answer:
        'Washington and Oregon grids have very low carbon intensity due to Columbia River hydroelectricity. However, because open dam reservoirs have vast surface areas baking in the sun, their evaporative water loss per kilowatt-hour is astronomical (EWIF = 9.501 L/kWh). Running GPT-3 in Washington consumes 47.5 mL of water per query—more than 6 times higher than running in Texas (7.59 mL)!',
      citation: 'Li et al. (2025) Table 1 & Xiao et al. (2025)',
    },
    {
      id: 'faq-4',
      question: 'What is the physical difference between Water Consumption and Water Withdrawal?',
      answer:
        'Water Withdrawal is the gross volume of freshwater pumped from lakes, rivers, or aquifers. Water Consumption is the net volume permanently evaporated into the atmosphere or incorporated into steam. For Scope 2 power generation, U.S. national average withdrawal is 43.83 L/kWh compared to 3.14 L/kWh consumed—almost 14 times higher!',
      citation: 'Xiao et al. (2025) Section 2.1',
    },
    {
      id: 'faq-5',
      question: 'How does Google’s CICS save water and carbon without slowing users down?',
      answer:
        'Google Carbon-Intelligent Computing System (CICS) distinguishes between urgent interactive queries (which must be served in milliseconds) and flexible batch workloads (e.g. model fine-tuning, embeddings, daily document indexing). CICS computes a Virtual Capacity Curve (VCC) that caps computing load during hot, dirty peak hours and shifts batch jobs to cool, green night or renewable hours.',
      citation: 'Radovanović et al. (2023) • IEEE Trans. Power Systems',
    },
    {
      id: 'faq-6',
      question: 'Does switching to smaller or distilled models eliminate the environmental footprint?',
      answer:
        'While distilled and Mixture-of-Experts (MoE) architectures cut energy per query from ~4 Wh down to ~1–2 Wh, they trigger Jevons’ Paradox (the Rebound Effect): as inference becomes cheaper and faster, companies and users trigger orders of magnitude more queries, integrating AI into search engines, autocomplete, and autonomous loops, driving net global water and energy demand higher.',
      citation: 'Xiao et al. (2025) Scenario 3 & Jevons (1865)',
    },
  ];

  const toggleFAQ = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="faq-editorial-section" id="faq-section">
      <div className="faq-grid-layout">
        {/* Left Column: Heading & Callout */}
        <div className="faq-left-col">
          <div className="pill-badge-luxury">
            <span>RESEARCH FAQ</span>
          </div>
          <h2 className="faq-main-title">
            Quick answers to common questions.
          </h2>
          <p className="faq-lead-desc">
            Physical fundamentals, grid interactions, and thermodynamic trade-offs explained directly from peer-reviewed empirical papers.
          </p>

          <div className="faq-helper-card">
            <h4>Need the complete mathematical derivations?</h4>
            <p>Read our exhaustive publication monograph with rendered LaTeX proofs and the full 18-datacenter telemetry matrix.</p>
            <a
              href="./report.html"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-pill-white btn-sm"
              id="faq-report-link"
            >
              <span>Explore Research Report ↗</span>
            </a>
          </div>
        </div>

        {/* Right Column: Accordion list */}
        <div className="faq-accordion-list">
          {faqs.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div
                key={faq.id}
                className={`faq-accordion-item ${isOpen ? 'open' : ''}`}
                onClick={() => toggleFAQ(faq.id)}
              >
                <div className="faq-question-row">
                  <h3 className="faq-question-text">{faq.question}</h3>
                  <button className="faq-toggle-icon" aria-label="Toggle answer">
                    {isOpen ? <Minus size={18} /> : <Plus size={18} />}
                  </button>
                </div>

                {isOpen && (
                  <div className="faq-answer-container">
                    <p className="faq-answer-text">{faq.answer}</p>
                    <div className="faq-citation-tag">{faq.citation}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
