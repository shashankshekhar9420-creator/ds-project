export interface MitigationItem {
  id: keyof import('../types').InfrastructureUpgrades;
  name: string;
  tagline: string;
  mechanism: string;
  energyReductionPct: number;
  scope1WaterReductionPct: number;
  totalWaterReductionPct: number;
  carbonReductionPct: number;
  citation: string;
}

export const MITIGATIONS: MitigationItem[] = [
  {
    id: 'pueOptimization',
    name: 'Best-Practice PUE Optimization',
    tagline: 'Extending free air-cooling via relaxed set-points (ASHRAE A1)',
    mechanism: 'Adjusting server inlet air envelope from 20°C to 27°C drastically reduces mechanical chiller compressor hours, cutting infrastructure energy by 67.9%.',
    energyReductionPct: 7.4,
    scope1WaterReductionPct: 9.3,
    totalWaterReductionPct: 7.5,
    carbonReductionPct: 7.4,
    citation: 'Xiao et al. (2025) Fig. 2 & Fig. 5',
  },
  {
    id: 'wueOptimization',
    name: 'Best-Practice WUE Optimization',
    tagline: 'High-cycle cooling tower water chemistry & air-side economizers',
    mechanism: 'Increasing cycles of concentration in cooling towers and deploying direct evaporative pads reduces windage loss and slashes direct potable water use by 85.7%.',
    energyReductionPct: 0.0,
    scope1WaterReductionPct: 85.7,
    totalWaterReductionPct: 29.6,
    carbonReductionPct: 6.7,
    citation: 'Xiao et al. (2025) Section 4.2',
  },
  {
    id: 'liquidCooling',
    name: 'Advanced Liquid Cooling (ALC / Direct-to-Chip)',
    tagline: 'Direct cold plate liquid loops & two-phase dielectric immersion',
    mechanism: 'Circulating liquid directly across GPU thermal lids eliminates thermal resistance of air heatsinks and minimizes facility fan parasitics.',
    energyReductionPct: 1.7,
    scope1WaterReductionPct: 3.5,
    totalWaterReductionPct: 2.4,
    carbonReductionPct: 1.6,
    citation: 'Xiao et al. (2025) Table 3',
  },
  {
    id: 'serverUtilization',
    name: 'Server Utilization Optimization (SUO)',
    tagline: 'Active GPU ratio scheduling to defeat the idle-power trap',
    mechanism: 'Consolidating inference requests onto dense active nodes allows underutilized servers to sleep, avoiding the 23% idle power floor.',
    energyReductionPct: 5.5,
    scope1WaterReductionPct: 5.5,
    totalWaterReductionPct: 5.5,
    carbonReductionPct: 5.5,
    citation: 'Xiao et al. (2025) Fig. 5',
  },
  {
    id: 'combinedBestPractices',
    name: 'Full Industry Combined Best Practices',
    tagline: 'ALC + SUO + Optimal Spatial Siting + High-Renewable Low-LRC Grid',
    mechanism: 'The synthesis of hardware efficiency, localized grid coordination, and low-water regional deployment yields maximum sustainability.',
    energyReductionPct: 65.0,
    scope1WaterReductionPct: 88.0,
    totalWaterReductionPct: 86.0,
    carbonReductionPct: 73.0,
    citation: 'Xiao et al. (2025) Executive Findings',
  },
];
