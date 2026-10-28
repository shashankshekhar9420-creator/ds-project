export interface PromptPreset {
  id: string;
  title: string;
  category: string;
  prompt: string;
  suggestedOutputLength: 'short' | 'medium' | 'long';
  suggestedOutputWords: number;
  description: string;
}

export const PROMPT_PRESETS: PromptPreset[] = [
  {
    id: 'quantum-explainer',
    title: 'Quantum Computing Intuition',
    category: 'STEM & Education',
    prompt: 'Explain the fundamental intuition behind quantum entanglement and superposition to a high school student using a visual coin flip analogy. Include why classical probability differs from quantum amplitude vectors.',
    suggestedOutputLength: 'medium',
    suggestedOutputWords: 260,
    description: 'Medium conceptual request requiring mathematical breakdown and analogies.',
  },
  {
    id: 'code-refactoring',
    title: 'React Concurrent Mode Debugging',
    category: 'Software Engineering',
    prompt: 'I have a React 19 application where useEffect is causing cascading state rerenders and memory leaks inside an intersection observer. Analyze the potential closure traps and provide an optimized custom hook with AbortController cleanup.',
    suggestedOutputLength: 'medium',
    suggestedOutputWords: 310,
    description: 'Technical coding prompt with code generation & algorithmic reasoning.',
  },
  {
    id: 'brief-query',
    title: 'Quick Factual Verification',
    category: 'Quick Query',
    prompt: 'What is the exact boiling point of liquid nitrogen at 1 atmosphere of pressure in Celsius and Kelvin?',
    suggestedOutputLength: 'short',
    suggestedOutputWords: 75,
    description: 'Short factual query with minimal token generation overhead.',
  },
  {
    id: 'creative-novel',
    title: 'Sci-Fi Worldbuilding Narrative',
    category: 'Creative Writing',
    prompt: 'Write an atmospheric cyberpunk scene set in a floating geothermal cloud city over the atmosphere of Venus. Describe the ambient acid rain protection membranes, the thermodynamic pressure valves, and the conversation between two atmospheric miners haggling over clean water canisters.',
    suggestedOutputLength: 'long',
    suggestedOutputWords: 680,
    description: 'Long creative narrative demanding heavy autoregressive decoding.',
  },
  {
    id: 'policy-analysis',
    title: 'Grid Decarbonization Policy',
    category: 'Environmental Policy',
    prompt: 'Draft an executive briefing analyzing the environmental trade-offs between locating hyperscale data centers in water-stressed arid regions with high solar availability (like Arizona) versus cool temperate regions with hydroelectric reservoirs (like the Pacific Northwest). Address both Scope 1 cooling towers and Scope 2 transmission losses.',
    suggestedOutputLength: 'long',
    suggestedOutputWords: 750,
    description: 'Deep analytical brief examining thermodynamic and ecological policy.',
  },
];

export const MACRO_FACTS = [
  {
    highlight: '700,000 Liters',
    text: 'Evaporated on-site just to train GPT-3 in U.S. data centers (5.4 million liters consumed in total).',
    citation: 'Li et al. (2025)',
  },
  {
    highlight: '4.2 to 6.6 Billion m³',
    text: 'Projected global AI water withdrawal by 2027—surpassing the annual water withdrawal of 4–6 entire Denmarks or half of the UK.',
    citation: 'Li et al. (2025)',
  },
  {
    highlight: '71% vs 29%',
    text: 'Xiao et al. (2025) proved 71% of AI\'s water footprint occurs off-site at thermoelectric & hydro power plants, while 29% is on-site cooling.',
    citation: 'Xiao et al. (2025)',
  },
  {
    highlight: '80% Potable Water',
    text: 'Nearly 80% of on-site water withdrawn by major data centers is drinking-quality municipal tap water to prevent pipe scaling and legionella.',
    citation: 'Li et al. (2025)',
  },
  {
    highlight: 'The India Dry-Cooler Trade-off',
    text: 'India\'s Microsoft data center consumes 0.000 L/kWh on-site water by using dry radiators, but its PUE jumps to 1.43, spiking power and off-site carbon!',
    citation: 'Li et al. (2025)',
  },
];
