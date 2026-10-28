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
    title: 'Explain Quantum Physics Simply',
    category: 'Learning & School',
    prompt: 'Explain the basic ideas of quantum physics to a high school student using a simple coin flip example. Describe how a spinning coin in the air is like a quantum state before it lands.',
    suggestedOutputLength: 'medium',
    suggestedOutputWords: 260,
    description: 'A typical homework or learning question that requires a clear, multi-paragraph explanation.',
  },
  {
    id: 'code-refactoring',
    title: 'Fix a Bug in Web Code',
    category: 'Programming',
    prompt: 'I have a webpage where images keep reloading unnecessarily whenever the user scrolls. Look at this problem, explain why it happens, and write a simple, clean piece of code that only loads images when they appear on the screen.',
    suggestedOutputLength: 'medium',
    suggestedOutputWords: 310,
    description: 'A practical coding task that asks for step-by-step problem solving and a short code sample.',
  },
  {
    id: 'brief-query',
    title: 'Quick Fact Check',
    category: 'Everyday Question',
    prompt: 'What is the exact boiling point of liquid nitrogen in both Celsius and Fahrenheit?',
    suggestedOutputLength: 'short',
    suggestedOutputWords: 75,
    description: 'A short, everyday search question with a brief answer of just a couple of sentences.',
  },
  {
    id: 'creative-novel',
    title: 'Write a Creative Story',
    category: 'Creative Writing',
    prompt: 'Write an atmospheric story set in a floating cloud city. Describe the view through the observation windows, the hum of the city engines, and a conversation between two weather technicians trying to fix a storm sensor.',
    suggestedOutputLength: 'long',
    suggestedOutputWords: 680,
    description: 'A long creative story where the AI writes several detailed paragraphs of prose.',
  },
  {
    id: 'policy-analysis',
    title: 'Data Center Energy Dilemma',
    category: 'Real-World Policy',
    prompt: 'Compare the environmental trade-offs between building large computer centers in hot, sunny deserts with solar power versus building them in cool, rainy regions with rivers and hydropower. Discuss both the water used for cooling and the electricity needed from the grid.',
    suggestedOutputLength: 'long',
    suggestedOutputWords: 750,
    description: 'A detailed research briefing exploring real-world trade-offs between energy and water.',
  },
];

export const MACRO_FACTS = [
  {
    highlight: '700,000 Liters of Water',
    text: 'Training GPT-3 consumed about 700,000 liters of water evaporated directly on-site, plus roughly 4.7 million liters at the power plants supplying the electricity.',
    citation: 'Li et al. (2025)',
  },
  {
    highlight: '71% vs 29% Water Split',
    text: 'Researchers found that 71% of the water tied to AI queries is actually consumed at distant power plants, while only 29% evaporates in cooling towers at the computer facility.',
    citation: 'Xiao et al. (2025)',
  },
  {
    highlight: 'Clean Drinking Water',
    text: 'Nearly 80% of the water used inside major data centers comes from local drinking water systems, because minerals in raw water would damage sensitive cooling pipes.',
    citation: 'Li et al. (2025)',
  },
  {
    highlight: 'The Cooling Trade-off',
    text: 'In dry regions like Pune, India, facilities often use giant air-cooling fans to avoid evaporating water, but those fans consume more electricity, raising power plant emissions.',
    citation: 'Li et al. (2025)',
  },
  {
    highlight: 'Global Water Scale',
    text: 'By 2027, global demand for AI could require between 4.2 and 6.6 billion cubic meters of water withdrawal each year—roughly equal to the total water withdrawn annually by the entire United Kingdom.',
    citation: 'Li et al. (2025)',
  },
];
