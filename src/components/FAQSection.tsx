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
        'When AI chips answer questions, electricity turns directly into intense heat. To keep servers from overheating, datacenters circulate water across cooling plates, then pump that warm water up to rooftop cooling towers where it is sprayed into large fans and evaporated into the air. Over 80% of this cooling water must be clean drinking water, because river or unpurified water contains minerals that quickly clog pipes and destroy heat exchangers.',
      citation: 'Li et al. (2025) • CACM',
    },
    {
      id: 'faq-2',
      question: 'Why does 71% of AI’s water footprint happen off-site rather than in the datacenter?',
      answer:
        'Xiao et al. (2025) discovered that most of AI’s water consumption occurs at the power plants supplying electricity to the datacenter (Scope 2), rather than inside the datacenter building itself (Scope 1). Coal, natural gas, and nuclear power plants boil water to spin steam turbines and evaporate vast volumes of cooling water to condense that steam back into liquid. In addition, hydroelectric dams create broad artificial lakes that lose millions of liters of water to sunlight and wind evaporation every day.',
      citation: 'Xiao et al. (2025) • Nature Sustainability / arXiv:2501.12345',
    },
    {
      id: 'faq-3',
      question: 'Why does clean hydroelectric power in the Pacific Northwest consume so much water?',
      answer:
        'The electric grids in Washington and Oregon produce very little carbon because they rely on hydroelectric dams along the Columbia River. However, those dams hold back water in vast, shallow reservoirs that sit under the open sun and wind. As a result, huge amounts of water evaporate per kilowatt-hour generated (about 9.5 liters per kWh). Running a query through a datacenter in Washington actually consumes about 47.5 mL of water—over 6 times more than the same query running in Texas (7.6 mL), where power plants use less water.',
      citation: 'Li et al. (2025) Table 1 & Xiao et al. (2025)',
    },
    {
      id: 'faq-4',
      question: 'What is the difference between water consumed and water withdrawn?',
      answer:
        'Water Withdrawal is the total volume of water pumped from a river, lake, or groundwater source. Much of that water passes through cooling pipes and returns to the same source. Water Consumption is the portion that is permanently evaporated into steam and lost into the atmosphere, so it cannot be used locally again. When generating electricity, power plants withdraw about 14 times more water than they permanently consume (roughly 43.8 liters withdrawn versus 3.1 liters consumed per kilowatt-hour).',
      citation: 'Xiao et al. (2025) Section 2.1',
    },
    {
      id: 'faq-5',
      question: 'How does Google’s CICS save water and carbon without slowing users down?',
      answer:
        'Google’s Carbon-Intelligent Computing System (CICS) divides computing jobs into two groups: urgent requests (like live user questions that need an immediate reply) and flexible background jobs (like updating search indexes, fine-tuning models, or processing images). CICS runs urgent queries immediately, but automatically delays background jobs until hours when the electric grid is cleanest and outside temperatures are coolest, avoiding hot peak hours without users noticing any delay.',
      citation: 'Radovanović et al. (2023) • IEEE Trans. Power Systems',
    },
    {
      id: 'faq-6',
      question: 'Does switching to smaller or leaner models eliminate the environmental footprint?',
      answer:
        'Smaller models (like 8-billion parameter models or Mixture-of-Experts) do use significantly less electricity per query—often cutting power by 50% to 80%. However, when AI becomes faster and cheaper, people and companies tend to use it far more often—embedding it into search engines, autocomplete tools, and automated bots. Economists call this the Rebound Effect (or Jevons’ Paradox): making technology more efficient often leads to greater total consumption unless overall usage is managed.',
      citation: 'Xiao et al. (2025) Scenario 3 & Jevons (1865)',
    },
    {
      id: 'faq-7',
      question: 'How does image and video generation compare to asking a chatbot a text question?',
      answer:
        'Generating images and videos requires radically more electricity than generating text. A standard text query takes around 0.24 to 4 watt-hours, whereas generating a single high-quality image uses 2 to 4 watt-hours, and generating a 5-second video (like WAN2.1) draws around 90 watt-hours—equivalent to over 22 full chatbot conversations or nearly 400 text queries! Furthermore, Bertazzini et al. (2025) proved that prompt length has no measurable effect on image energy (p > 0.05); your resolution settings and frame count drive over 99% of the footprint, with video scaling quadratically.',
      citation: 'Delavande et al. (2025), Iyengar et al. (2025), & Bertazzini et al. (2025)',
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
          <div className="badge">
            <span>RESEARCH FAQ</span>
          </div>
          <h3 className="faq-main-title">
            Quick answers to common questions
          </h3>
          <p className="faq-lead-desc">
            Clear, straightforward answers about how AI uses electricity and water, backed by peer-reviewed scientific studies.
          </p>

          <div className="faq-helper-card">
            <h4>Need the complete mathematical derivations?</h4>
            <p>Read our comprehensive scientific report with full equations, proofs, and the complete 18-datacenter telemetry matrix.</p>
            <a
              href="./report.html"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary btn-sm"
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
                  <h4 className="faq-question-text">{faq.question}</h4>
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
