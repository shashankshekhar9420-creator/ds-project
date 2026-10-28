import type { AIModel } from '../types';

export const AI_MODELS: AIModel[] = [
  {
    id: 'gpt-3',
    name: 'GPT-3 (Full)',
    parameters: '175B Parameters',
    hardware: 'Microsoft Azure Data Centers (OpenAI estimate)',
    baseEnergyKWh: 0.004, // 4 Wh
    note: 'Conservative peer-reviewed baseline. Training consumed 1,287 MWh and 5.439 million L of water (U.S. Avg).',
  },
  {
    id: 'llama-3-70b',
    name: 'Llama-3-70B',
    parameters: '70B Parameters',
    hardware: 'Enterprise Nvidia DGX H100 cluster (with SLOs & non-GPU overhead)',
    baseEnergyKWh: 0.010, // 10 Wh
    note: 'Measured on enterprise DGX H100 clusters with full server non-GPU energy overhead under strict real-world latency SLOs.',
  },
  {
    id: 'falcon-180b',
    name: 'Falcon-180B',
    parameters: '180B Parameters',
    hardware: 'Enterprise Nvidia DGX H100 cluster (comparable to GPT-3-175B)',
    baseEnergyKWh: 0.016, // 16 Wh
    note: 'Empirically measured under full enterprise multi-tenant inference workloads on latest generation accelerator hardware.',
  },
  {
    id: 'deepseek-moe',
    name: 'High-Efficiency Architecture (MoE / Distilled)',
    parameters: 'MoE / Distilled',
    hardware: 'Xiao et al. (2025) Low-Power / High-Application Scenario',
    baseEnergyKWh: 0.002, // 2 Wh
    note: 'Hardware/algorithmic efficiency gains. Warning: Highly prone to Jevons Paradox (Rebound Effect) as cheaper query cost multiplies query frequency.',
    isEfficient: true,
  },
];
