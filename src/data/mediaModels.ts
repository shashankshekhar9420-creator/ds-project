export interface MediaImageModel {
  id: string;
  name: string;
  architecture: string;
  parameters: string;
  baseEnergyWh: number; // Wh at baseline resolution, steps, CFG, fp16
  baselineResolution: [number, number]; // [H, W]
  baselineSteps: number;
  resolutionExponent: number; // b in E ~ pixels^b (from Bertazzini et al. 2025)
  supportsFp32: boolean;
  provenance: 'measured' | 'modeled' | 'proxy';
  uncertainty: string;
  hardware: string;
  boundary: string;
  note: string;
}

export interface MediaVideoModel {
  id: string;
  name: string;
  architecture: string;
  parameters: string;
  baseEnergyWh: number; // Total Wh (GPU + CPU + RAM) for baseline clip
  gpuEnergyWh: number; // GPU-only Wh
  baselineResolution: [number, number]; // [H, W]
  baselineFrames: number;
  baselineFps: number;
  baselineSteps: number;
  provenance: 'measured' | 'modeled' | 'proxy';
  uncertainty: string;
  hardware: string;
  boundary: string;
  note: string;
}

export const IMAGE_MODELS: MediaImageModel[] = [
  {
    id: 'sdxl',
    name: 'Stable Diffusion XL (SDXL 1.0)',
    architecture: 'Latent Diffusion (U-Net)',
    parameters: '3.5B Parameters',
    baseEnergyWh: 2.10, // ~2.1 Wh at 1024x1024, 30 steps, CFG on
    baselineResolution: [1024, 1024],
    baselineSteps: 30,
    resolutionExponent: 0.76, // derived from ratio 2.88 (1024² vs 512²) in Bertazzini et al.
    supportsFp32: true,
    provenance: 'measured',
    uncertainty: '±15% (cross-source spread: 1.64 - 11.41 kWh / 1k img)',
    hardware: 'Nvidia RTX 4090 / A100',
    boundary: 'GPU + CPU + RAM (CodeCarbon)',
    note: 'Standard enterprise workhorse. Sub-linear resolution exponent (b=0.76) due to spatial downsampling in latent space.',
  },
  {
    id: 'sd-3-5',
    name: 'Stable Diffusion 3.5 Large',
    architecture: 'Multimodal Diffusion Transformer (MMDiT)',
    parameters: '8B Parameters',
    baseEnergyWh: 1.92,
    baselineResolution: [1024, 1024],
    baselineSteps: 28,
    resolutionExponent: 0.47,
    supportsFp32: true,
    provenance: 'measured',
    uncertainty: '±10%',
    hardware: 'Nvidia A100 (40GB/80GB)',
    boundary: 'GPU compute + host memory transfer',
    note: 'Transformer-based architecture. Iyengar et al. (2025) measured alpha=0.969 and fp32 penalty of e^1.90 ≈ 6.7x.',
  },
  {
    id: 'flux-1-dev',
    name: 'Flux.1 [dev]',
    architecture: 'Rectified Flow DiT',
    parameters: '12B Parameters',
    baseEnergyWh: 2.85,
    baselineResolution: [1024, 1024],
    baselineSteps: 28,
    resolutionExponent: 0.29,
    supportsFp32: true,
    provenance: 'measured',
    uncertainty: '±12%',
    hardware: 'Nvidia A100 / H100',
    boundary: 'Dedicated GPU + CPU system',
    note: 'High-parameter flow-matching transformer. Alpha=0.989 with fp32 penalty of e^2.04 ≈ 7.7x (Iyengar et al. 2025).',
  },
  {
    id: 'flux-1-schnell',
    name: 'Flux.1 [schnell] (Fast 4-Step)',
    architecture: 'Distilled Rectified Flow DiT',
    parameters: '12B Parameters',
    baseEnergyWh: 0.48,
    baselineResolution: [1024, 1024],
    baselineSteps: 4,
    resolutionExponent: 0.29,
    supportsFp32: false,
    provenance: 'measured',
    uncertainty: '±10%',
    hardware: 'Nvidia RTX 4090 / A100',
    boundary: 'GPU + CPU + RAM',
    note: 'Distilled 4-step sampling cuts energy by ~83% compared to standard 28-step [dev] variant.',
  },
  {
    id: 'qwen-image',
    name: 'Qwen-Image',
    architecture: 'Visual DiT',
    parameters: '7B Parameters',
    baseEnergyWh: 3.58, // 1024x1024, 50 steps, CFG on, fp16 on A100
    baselineResolution: [1024, 1024],
    baselineSteps: 50,
    resolutionExponent: 0.70,
    supportsFp32: false,
    provenance: 'measured',
    uncertainty: '±8% (GPU-only lower bound)',
    hardware: 'Nvidia A100',
    boundary: 'GPU-only (excludes host CPU/RAM and serving idle)',
    note: 'Exact anchor from Iyengar et al. (2025): 3.58 Wh at 50 steps 1024² down to 0.051 Wh at 10 steps 256² without CFG.',
  },
  {
    id: 'pixart-sigma',
    name: 'PixArt-Σ (High-Efficiency DiT)',
    architecture: 'Efficient DiT',
    parameters: '0.6B Parameters',
    baseEnergyWh: 0.95,
    baselineResolution: [1024, 1024],
    baselineSteps: 20,
    resolutionExponent: 0.00, // exponent b=0 in Bertazzini et al.
    supportsFp32: true,
    provenance: 'measured',
    uncertainty: '±12%',
    hardware: 'Nvidia RTX 4090',
    boundary: 'GPU + CPU + RAM',
    note: 'Extremely efficient DiT architecture where energy does not scale steeply with square resolution (b ≈ 0.00).',
  },
  {
    id: 'midjourney-proxy',
    name: 'Midjourney v6.1 (Commercial Cloud Proxy)',
    architecture: 'Proprietary Latent Diffusion + Upscaler',
    parameters: 'Closed Service (~10B+ Ensemble)',
    baseEnergyWh: 4.50,
    baselineResolution: [1024, 1024],
    baselineSteps: 35,
    resolutionExponent: 0.75,
    supportsFp32: false,
    provenance: 'proxy',
    uncertainty: 'Estimated proxy (closed API, ±35%)',
    hardware: 'Hyperscale Cloud GPU Cluster',
    boundary: 'Full multi-stage pipeline estimate',
    note: 'Proxy estimate. Closed service with no published energy telemetry. Modeled on heavy multi-pass diffusion with upscaler.',
  },
  {
    id: 'dalle-3-proxy',
    name: 'DALL·E 3 (OpenAI Proxy)',
    architecture: 'Proprietary Diffusion Transformer',
    parameters: 'Closed Service (~8B-12B)',
    baseEnergyWh: 3.90,
    baselineResolution: [1024, 1024],
    baselineSteps: 30,
    resolutionExponent: 0.70,
    supportsFp32: false,
    provenance: 'proxy',
    uncertainty: 'Estimated proxy (closed API, ±35%)',
    hardware: 'Microsoft Azure A100/H100',
    boundary: 'Full serving stack estimate',
    note: 'Proxy estimate. Closed service with no public hardware meters. Modeled from comparable open DiT architectures.',
  },
];

export const VIDEO_MODELS: MediaVideoModel[] = [
  {
    id: 'wan2-1-1-3b',
    name: 'WAN2.1-T2V (1.3B DiT)',
    architecture: 'Latent 3D Video DiT',
    parameters: '1.3B Parameters',
    baseEnergyWh: 90.5, // Total GPU+CPU+RAM
    gpuEnergyWh: 78.8,
    baselineResolution: [720, 1280],
    baselineFrames: 81,
    baselineFps: 15, // 5.4 seconds clip
    baselineSteps: 50,
    provenance: 'measured',
    uncertainty: '2–12% analytical error vs H100 meter',
    hardware: 'Nvidia H100 SXM5 (700W TDP)',
    boundary: 'GPU + CPU + RAM (410s execution on dedicated H100)',
    note: 'Empirical anchor from Delavande et al. (2025). Produces a 5.4s HD clip at 90.5 Wh, evaporating 382 mL of water at U.S. average.',
  },
  {
    id: 'wan2-1-14b',
    name: 'WAN2.1-T2V (14B DiT)',
    architecture: 'High-Capacity Video DiT',
    parameters: '14B Parameters',
    baseEnergyWh: 415.1,
    gpuEnergyWh: 359.7,
    baselineResolution: [720, 1280],
    baselineFrames: 81,
    baselineFps: 15,
    baselineSteps: 50,
    provenance: 'measured',
    uncertainty: '2–12% analytical error vs H100 meter',
    hardware: 'Nvidia H100 SXM5',
    boundary: 'GPU + CPU + RAM (1,875s execution on dedicated H100)',
    note: 'Heavyweight state-of-the-art open model. Requires 415.1 Wh per 5.4s clip—equivalent to over 100 GPT-3 text queries.',
  },
  {
    id: 'cogvideox-2b',
    name: 'CogVideoX-2B',
    architecture: 'Expert Transformer Video DiT',
    parameters: '2B Parameters',
    baseEnergyWh: 9.67,
    gpuEnergyWh: 8.30,
    baselineResolution: [480, 720],
    baselineFrames: 49,
    baselineFps: 8, // 6.1 seconds clip
    baselineSteps: 50,
    provenance: 'measured',
    uncertainty: '±8%',
    hardware: 'Nvidia H100 SXM5',
    boundary: 'GPU + CPU + RAM (50.6s execution on H100)',
    note: 'Efficient 3D VAE and expert attention blocks keep baseline energy under 10 Wh for 480p clips (Delavande et al. 2025).',
  },
  {
    id: 'cogvideox-5b',
    name: 'CogVideoX-5B',
    architecture: 'Expert Transformer Video DiT',
    parameters: '5B Parameters',
    baseEnergyWh: 25.3,
    gpuEnergyWh: 21.6,
    baselineResolution: [480, 720],
    baselineFrames: 49,
    baselineFps: 8,
    baselineSteps: 50,
    provenance: 'measured',
    uncertainty: '±8%',
    hardware: 'Nvidia H100 SXM5',
    boundary: 'GPU + CPU + RAM (124s execution on H100)',
    note: 'Scaled 5B variant delivering enhanced temporal consistency at 2.6x the energy footprint of CogVideoX-2B.',
  },
  {
    id: 'ltx-video',
    name: 'LTX-Video (0.9B Real-Time)',
    architecture: 'Spatiotemporal DiT',
    parameters: '0.9B Parameters',
    baseEnergyWh: 3.67,
    gpuEnergyWh: 3.16,
    baselineResolution: [512, 704],
    baselineFrames: 121,
    baselineFps: 24, // 5.0 seconds clip
    baselineSteps: 40,
    provenance: 'measured',
    uncertainty: '±6%',
    hardware: 'Nvidia H100 SXM5',
    boundary: 'GPU + CPU + RAM (9.7s execution on H100)',
    note: 'Ultra-fast inference (9.7s latency). Lowest energy per clip-second (0.73 Wh/s) among competitive open video models.',
  },
  {
    id: 'mochi-1',
    name: 'Mochi-1 (10B Asymmetric)',
    architecture: 'Asymmetric Diffusion Transformer',
    parameters: '10B Parameters',
    baseEnergyWh: 52.1,
    gpuEnergyWh: 44.7,
    baselineResolution: [480, 848],
    baselineFrames: 84,
    baselineFps: 30, // 2.8 seconds clip
    baselineSteps: 64,
    provenance: 'measured',
    uncertainty: '±9%',
    hardware: 'Nvidia H100 SXM5',
    boundary: 'GPU + CPU + RAM (263s execution on H100)',
    note: 'High frame-rate 30fps architecture. Draws 18.6 Wh per clip-second due to dense 64-step sampling (Delavande et al. 2025).',
  },
  {
    id: 'animatediff',
    name: 'AnimateDiff (SD 1.5 Motion)',
    architecture: 'Motion Module Adapter',
    parameters: '1B Parameters',
    baseEnergyWh: 0.139,
    gpuEnergyWh: 0.115,
    baselineResolution: [512, 512],
    baselineFrames: 16,
    baselineFps: 10, // 1.6 seconds clip
    baselineSteps: 4,
    provenance: 'measured',
    uncertainty: '±10%',
    hardware: 'Nvidia H100 SXM5',
    boundary: 'GPU + CPU + RAM (0.68s execution on H100)',
    note: 'Lightweight GIF/animation generator using distilled 4-step motion priors (Delavande et al. 2025).',
  },
  {
    id: 'sora-proxy',
    name: 'OpenAI Sora (Commercial Proxy)',
    architecture: 'Spatiotemporal Patch DiT',
    parameters: 'Closed Service (~20B+ Parameters)',
    baseEnergyWh: 240.0,
    gpuEnergyWh: 210.0,
    baselineResolution: [720, 1280],
    baselineFrames: 150,
    baselineFps: 30, // 5.0 seconds clip
    baselineSteps: 50,
    provenance: 'proxy',
    uncertainty: 'Estimated proxy (closed API, ±40%)',
    hardware: 'Hyperscale H100 Cluster',
    boundary: 'Full production serving stack estimate',
    note: 'Proxy estimate. Closed service with no published energy meters. Modeled from heavy WAN2.1-14B DiT scaling curves.',
  },
  {
    id: 'veo-proxy',
    name: 'Google Veo 2 (Commercial Proxy)',
    architecture: 'Spatiotemporal Video Transformer',
    parameters: 'Closed Service (TPU v5p)',
    baseEnergyWh: 190.0,
    gpuEnergyWh: 165.0,
    baselineResolution: [720, 1280],
    baselineFrames: 120,
    baselineFps: 24, // 5.0 seconds clip
    baselineSteps: 50,
    provenance: 'proxy',
    uncertainty: 'Estimated proxy (closed API, ±40%)',
    hardware: 'Google TPU v5e/v5p Pods',
    boundary: 'Datacenter stack estimate',
    note: 'Proxy estimate. Closed service with proprietary TPU acceleration. Scaled against open high-resolution DiT benchmarks.',
  },
];

