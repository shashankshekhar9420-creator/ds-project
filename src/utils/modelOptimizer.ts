import type { AIModel, CalculationResult, DataCenterLocation, WeatherCondition, InfrastructureUpgrades } from '../types';
import { AI_MODELS } from '../data/models';
import { calculateFootprint } from './calculator';

export interface ModelRecommendation {
  suggestedModel: AIModel;
  currentModel: AIModel;
  isCurrentOptimal: boolean;
  taskType: string;
  reason: string;
  energySavingsPct: number;
  waterSavingsMl: number;
  carbonSavingsGrams: number;
  upgradedCalculation?: CalculationResult;
}

/**
 * Analyzes the prompt content and length to recommend the most energy-efficient
 * model capable of handling the task with high fidelity.
 */
export function recommendOptimizedModel(params: {
  promptText: string;
  currentModel: AIModel;
  location: DataCenterLocation;
  wordsIn: number;
  wordsOut: number;
  weather?: WeatherCondition | null;
  includeIdlePenalty: boolean;
  waterMode: 'consumption' | 'withdrawal';
  upgrades: InfrastructureUpgrades;
  currentCalculation: CalculationResult;
}): ModelRecommendation {
  const {
    promptText,
    currentModel,
    location,
    wordsIn,
    wordsOut,
    weather,
    includeIdlePenalty,
    waterMode,
    upgrades,
    currentCalculation,
  } = params;

  const text = promptText.trim().toLowerCase();

  // Find models by ID
  const moeModel = AI_MODELS.find((m) => m.id === 'deepseek-moe') || AI_MODELS[3];
  const llama70bModel = AI_MODELS.find((m) => m.id === 'llama-3-70b') || AI_MODELS[1];

  let suggestedModel = currentModel;
  let taskType = 'Standard Query';
  let reason = '';

  // 1. Detect Task Category & Required Parameter Scale
  const isCodeOrAlgorithm =
    text.includes('function') ||
    text.includes('def ') ||
    text.includes('class ') ||
    text.includes('algorithm') ||
    text.includes('typescript') ||
    text.includes('python') ||
    text.includes('debug') ||
    text.includes('regex');

  const isComplexMathOrProof =
    text.includes('solve') ||
    text.includes('derive') ||
    text.includes('theorem') ||
    text.includes('proof') ||
    text.includes('matrix') ||
    text.includes('differential');

  const isSimpleLookupOrSummary =
    wordsIn <= 60 ||
    text.startsWith('what is') ||
    text.startsWith('who is') ||
    text.startsWith('when did') ||
    text.startsWith('summarize') ||
    text.startsWith('translate') ||
    text.startsWith('list ') ||
    text.startsWith('rephrase') ||
    text.startsWith('format ') ||
    text.startsWith('extract ');

  if (isCodeOrAlgorithm || isComplexMathOrProof) {
    taskType = isCodeOrAlgorithm ? 'Coding & Algorithms' : 'Step-by-Step Logic & Math';
    // If user is running Falcon-180B (16 Wh), suggest Llama-3-70B (10 Wh) or MoE (2 Wh)
    if (currentModel.id === 'falcon-180b') {
      suggestedModel = llama70bModel;
      reason = 'A 70-billion parameter model handles complex code and logic with high accuracy without drawing the extra power of a massive 180-billion parameter cluster.';
    } else {
      suggestedModel = currentModel;
      reason = 'Your chosen model size is well-suited for solving multi-step logic and coding tasks.';
    }
  } else if (isSimpleLookupOrSummary) {
    taskType = 'Short Question or Summary';
    // For simple tasks, High-Efficiency MoE / Distilled (2 Wh) is optimal
    suggestedModel = moeModel;
    reason = 'This short question or text request does not need a giant model. A leaner model answers it just as accurately while using only a fraction of the electricity and water.';
  } else {
    taskType = 'General Writing & Conversation';
    // For standard text generation, MoE or GPT-3 is optimal
    if (currentModel.id === 'falcon-180b' || currentModel.id === 'llama-3-70b') {
      suggestedModel = moeModel;
      reason = 'Everyday writing and conversation achieves high quality with a leaner model, avoiding the unnecessary electricity spent activating billions of extra parameters.';
    } else {
      suggestedModel = currentModel;
      reason = 'Your chosen model provides a practical balance between response quality and electricity consumption.';
    }
  }

  const isCurrentOptimal = currentModel.id === suggestedModel.id;

  // Calculate footprint of the suggested model
  const suggestedCalculation = calculateFootprint({
    model: suggestedModel,
    location,
    wordsIn,
    wordsOut,
    weather,
    includeIdlePenalty,
    waterMode,
    upgrades,
  });

  const energySavingsPct = isCurrentOptimal
    ? 0
    : Math.max(0, Math.round(((currentCalculation.energyWh - suggestedCalculation.energyWh) / currentCalculation.energyWh) * 100));

  const waterSavingsMl = isCurrentOptimal
    ? 0
    : Math.max(0, Math.round((currentCalculation.displayedTotalWaterMl - suggestedCalculation.displayedTotalWaterMl) * 100) / 100);

  const carbonSavingsGrams = isCurrentOptimal
    ? 0
    : Math.max(0, Math.round((currentCalculation.carbonGrams - suggestedCalculation.carbonGrams) * 100) / 100);

  return {
    suggestedModel,
    currentModel,
    isCurrentOptimal,
    taskType,
    reason,
    energySavingsPct,
    waterSavingsMl,
    carbonSavingsGrams,
    upgradedCalculation: suggestedCalculation,
  };
}
