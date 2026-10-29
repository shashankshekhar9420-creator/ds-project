import React, { useState, useMemo } from 'react';
import {
  Film,
  Zap,
  Smartphone,
  Lightbulb,
  Car,
  Copy,
  Check,
  Server,
  RotateCcw,
  Info,
} from 'lucide-react';
import type {
  DataCenterLocation,
  InfrastructureUpgrades,
  WeatherCondition,
} from '../types';
import {
  IMAGE_MODELS,
  VIDEO_MODELS,
  type MediaImageModel,
  type MediaVideoModel,
} from '../data/mediaModels';
import {
  calculateImageFootprint,
  calculateVideoFootprint,
} from '../utils/mediaCalculator';
import { MathFormula } from './MathFormula';
import '../styles/sandbox.css';

interface ModuleMediaSandboxProps {
  location: DataCenterLocation;
  weather: WeatherCondition | null;
  waterMode: 'consumption' | 'withdrawal';
  includeIdlePenalty: boolean;
  upgrades?: InfrastructureUpgrades;
}

const FORMATTED_DATE = new Date().toLocaleDateString();

export const ModuleMediaSandbox: React.FC<ModuleMediaSandboxProps> = ({
  location,
  weather,
  waterMode,
  includeIdlePenalty,
  upgrades = {
    pueOptimization: false,
    wueOptimization: false,
    liquidCooling: false,
    serverUtilization: false,
    combinedBestPractices: false,
  },
}) => {
  const [activeMediaTab, setActiveMediaTab] = useState<'video' | 'image'>('video');

  // Image Controls State
  const [imageModel, setImageModel] = useState<MediaImageModel>(IMAGE_MODELS[0]); // SDXL
  const [imageResolutionPreset, setImageResolutionPreset] = useState<string>('1024x1024');
  const [imageSteps, setImageSteps] = useState<number>(30);
  const [imageCfg, setImageCfg] = useState<boolean>(true);
  const [imagePrecision, setImagePrecision] = useState<'fp16' | 'fp32'>('fp16');
  const [imageCount, setImageCount] = useState<number>(1);
  const [imageRetries, setImageRetries] = useState<number>(2); // 2 attempts per keeper
  const [imagePrompt, setImagePrompt] = useState<string>(
    'A cinematic photograph of an ancient data center engulfed in lush moss and flowing river water, 8k resolution, photorealistic'
  );

  // Video Controls State
  const [videoModel, setVideoModel] = useState<MediaVideoModel>(VIDEO_MODELS[0]); // WAN2.1 1.3B
  const [videoResolutionPreset, setVideoResolutionPreset] = useState<string>('720x1280');
  const [videoFrames, setVideoFrames] = useState<number>(81);
  const [videoFps, setVideoFps] = useState<number>(15);
  const [videoSteps, setVideoSteps] = useState<number>(50);
  const [videoClipCount, setVideoClipCount] = useState<number>(1);
  const [videoRetries, setVideoRetries] = useState<number>(1);
  const [videoPrompt, setVideoPrompt] = useState<string>(
    'Time-lapse of steam plumes evaporating above cooling towers into sunset clouds, photorealistic, 4k'
  );

  const [copiedReceipt, setCopiedReceipt] = useState<boolean>(false);

  // Parse Resolution Helpers
  const parsedImageResolution = useMemo<[number, number]>(() => {
    const parts = imageResolutionPreset.split('x').map(Number);
    return [parts[0] || 1024, parts[1] || 1024];
  }, [imageResolutionPreset]);

  const parsedVideoResolution = useMemo<[number, number]>(() => {
    const parts = videoResolutionPreset.split('x').map(Number);
    return [parts[0] || 720, parts[1] || 1280];
  }, [videoResolutionPreset]);

  // Synchronize defaults when model changes
  const handleSelectImageModel = (m: MediaImageModel) => {
    setImageModel(m);
    setImageSteps(m.baselineSteps);
    setImageResolutionPreset(`${m.baselineResolution[0]}x${m.baselineResolution[1]}`);
  };

  const handleSelectVideoModel = (m: MediaVideoModel) => {
    setVideoModel(m);
    setVideoSteps(m.baselineSteps);
    setVideoFrames(m.baselineFrames);
    setVideoFps(m.baselineFps);
    setVideoResolutionPreset(`${m.baselineResolution[0]}x${m.baselineResolution[1]}`);
  };

  // Perform calculations
  const imageCalculation = useMemo(() => {
    return calculateImageFootprint({
      model: imageModel,
      resolution: parsedImageResolution,
      steps: imageSteps,
      cfg: imageCfg,
      precision: imagePrecision,
      imageCount,
      retries: imageRetries,
      location,
      weather,
      includeIdlePenalty,
      waterMode,
      upgrades,
    });
  }, [
    imageModel,
    parsedImageResolution,
    imageSteps,
    imageCfg,
    imagePrecision,
    imageCount,
    imageRetries,
    location,
    weather,
    includeIdlePenalty,
    waterMode,
    upgrades,
  ]);

  const videoCalculation = useMemo(() => {
    return calculateVideoFootprint({
      model: videoModel,
      resolution: parsedVideoResolution,
      frames: videoFrames,
      fps: videoFps,
      steps: videoSteps,
      clipCount: videoClipCount,
      retries: videoRetries,
      location,
      weather,
      includeIdlePenalty,
      waterMode,
      upgrades,
    });
  }, [
    videoModel,
    parsedVideoResolution,
    videoFrames,
    videoFps,
    videoSteps,
    videoClipCount,
    videoRetries,
    location,
    weather,
    includeIdlePenalty,
    waterMode,
    upgrades,
  ]);

  const currentResult = activeMediaTab === 'image' ? imageCalculation : videoCalculation;

  const handleCopyReceipt = () => {
    const textReceipt = `🎬 Generative Media Environmental Receipt
Modality: ${activeMediaTab === 'image' ? 'Text-to-Image Diffusion' : 'Text-to-Video Diffusion'}
Model: ${currentResult.modelName} (${currentResult.provenance.toUpperCase()})
Location: ${location.name} (${location.country})
Settings: ${
      activeMediaTab === 'image'
        ? `${parsedImageResolution[0]}×${parsedImageResolution[1]}, ${imageSteps} steps, ${imagePrecision}, CFG: ${imageCfg ? 'On' : 'Off'}`
        : `${parsedVideoResolution[0]}×${parsedVideoResolution[1]}, ${videoFrames} frames @ ${videoFps}fps (${(videoFrames / videoFps).toFixed(1)}s), ${videoSteps} steps`
    }
Total Generations: ${currentResult.totalGenerations} (${currentResult.batchCount} outputs × ${currentResult.retries} keeper retries)

⚡ Server Electricity: ${currentResult.totalEnergyWh.toFixed(2)} Wh ${currentResult.whPerSecond ? `(${currentResult.whPerSecond.toFixed(1)} Wh/sec video)` : ''}
💧 Water Footprint (${waterMode === 'consumption' ? 'Permanent Evaporation' : 'Total Withdrawn'}): ${currentResult.displayedTotalWaterMl.toFixed(1)} mL
   - Scope 1 On-Site: ${currentResult.displayedScope1WaterMl.toFixed(1)} mL (${currentResult.scope1Percent}%) evaporated in cooling towers
   - Scope 2 Off-Site: ${currentResult.displayedScope2WaterMl.toFixed(1)} mL (${currentResult.scope2Percent}%) consumed by electricity power plants
☁️ Carbon Emissions: ${currentResult.carbonGrams.toFixed(2)} gCO2e

Everyday Equivalents:
- ${(currentResult.bottleFraction * 100).toFixed(1)}% of a standard 500 mL water bottle (~${currentResult.waterDrops.toLocaleString()} drops)
- ${Math.round(currentResult.ledSeconds / 60)} minutes powering a 10W LED bulb
- ${currentResult.smartphoneBatteryPercent.toFixed(1)}% of a smartphone recharge
- Equivalent to ${currentResult.equalsGpt3Queries} full chatbot queries (GPT-3, 4 Wh) or ${currentResult.equalsGeminiQueries} text prompts (0.24 Wh)

Scientific Formulations: Delavande et al. (2025), Iyengar et al. (2025), Bertazzini et al. (2025)`;

    navigator.clipboard.writeText(textReceipt);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <div className="sandbox-container" id="media-sandbox-module">
      {/* LEFT COLUMN: Interactive Controls & Model Configuration */}
      <div className="prompt-console">
        <div className="card">
          <div className="console-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: 'var(--radius)',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--accent)',
                }}
              >
                <Film size={16} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text)' }}>
                Generative Media Calculator
              </h3>
            </div>
            <span className="badge">Instant • Measured &amp; Modeled</span>
          </div>

          {/* Modality Segmented Selector */}
          <div style={{ marginTop: '14px', marginBottom: '14px' }}>
            <div className="length-buttons">
              <button
                type="button"
                className={`length-btn ${activeMediaTab === 'video' ? 'active' : ''}`}
                id="media-mode-video-btn"
                onClick={() => setActiveMediaTab('video')}
              >
                🎬 Text-to-Video (WAN2.1, CogVideoX, LTX, Veo, Sora)
              </button>
              <button
                type="button"
                className={`length-btn ${activeMediaTab === 'image' ? 'active' : ''}`}
                id="media-mode-image-btn"
                onClick={() => setActiveMediaTab('image')}
              >
                🖼️ Text-to-Image (SDXL, SD 3.5, Flux, Qwen, Midjourney)
              </button>
            </div>
          </div>

          {/* Optional Prompt Textarea */}
          <div className="prompt-textarea-wrapper">
            <textarea
              className="prompt-textarea"
              id="media-prompt-input"
              value={activeMediaTab === 'image' ? imagePrompt : videoPrompt}
              onChange={(e) => {
                if (activeMediaTab === 'image') setImagePrompt(e.target.value);
                else setVideoPrompt(e.target.value);
              }}
              placeholder={
                activeMediaTab === 'image'
                  ? 'Type an image description (e.g. A photorealistic aerial landscape of misty mountains and server arrays at golden hour...)'
                  : 'Type a video description (e.g. Time-lapse of steam plumes evaporating above cooling towers into sunset clouds...)'
              }
              rows={2}
              style={{ minHeight: '64px' }}
            />
            <div className="prompt-meta-bar">
              <div className="meta-counters">
                <div className="meta-count-item">
                  <span>Modality:</span>
                  <span className="meta-count-num">
                    {activeMediaTab === 'image' ? 'Text-to-Image' : 'Text-to-Video'}
                  </span>
                </div>
                <div
                  className="meta-count-item"
                  title="Bertazzini et al. (2025) proved prompt text length has no statistically significant effect on diffusion energy (p > 0.05). Compute is strictly bound by resolution, steps, and frames."
                >
                  <Info size={12} style={{ color: 'var(--accent)' }} />
                  <span style={{ color: 'var(--text-muted)' }}>
                    Prompt length does not change energy (Bertazzini 2025)
                  </span>
                </div>
              </div>
              {(activeMediaTab === 'image' ? imagePrompt : videoPrompt).length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (activeMediaTab === 'image') setImagePrompt('');
                    else setVideoPrompt('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.8125rem',
                  }}
                >
                  <RotateCcw size={12} /> Clear
                </button>
              )}
            </div>
          </div>

          {/* Video Controls */}
          {activeMediaTab === 'video' && (
            <>
              {/* Full-Width Video Model Selection */}
              <div className="control-group" style={{ marginTop: '20px' }}>
                <label className="control-label" htmlFor="video-model-select">
                  <span style={{ fontWeight: 600 }}>Select Video Diffusion Model</span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: videoModel.provenance === 'measured' ? 'var(--accent)' : 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {videoModel.parameters} • {videoModel.provenance === 'measured' ? 'Telemetry Measured' : 'Proxy Mode'}
                  </span>
                </label>
                <select
                  id="video-model-select"
                  className="select-custom"
                  value={videoModel.id}
                  onChange={(e) => {
                    const found = VIDEO_MODELS.find((m) => m.id === e.target.value);
                    if (found) handleSelectVideoModel(found);
                  }}
                >
                  <optgroup label="Open-Source Models (Physical H100 Telemetry, Delavande et al. 2025)">
                    {VIDEO_MODELS.filter((m) => m.provenance === 'measured').map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.parameters.replace(' Parameters', '')}) · {m.baseEnergyWh} Wh baseline
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Commercial Closed Models (Estimated Proxy Mode)">
                    {VIDEO_MODELS.filter((m) => m.provenance === 'proxy').map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} · Estimated Proxy ({m.baseEnergyWh} Wh)
                      </option>
                    ))}
                  </optgroup>
                </select>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {videoModel.note}
                </div>
              </div>

              {/* 2-Column Controls Grid for Video Parameters */}
              <div className="controls-grid" style={{ marginTop: '16px' }}>
                <div className="control-group">
                  <label className="control-label" htmlFor="video-res-select">
                    <span>Resolution Preset</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent)' }}>
                      Quadratic Scaling (16×)
                    </span>
                  </label>
                  <select
                    id="video-res-select"
                    className="select-custom"
                    value={videoResolutionPreset}
                    onChange={(e) => setVideoResolutionPreset(e.target.value)}
                  >
                    <option value="480x720">480×720 (Mobile 16:9)</option>
                    <option value="512x704">512×704 (LTX-Video Native)</option>
                    <option value="720x1280">720×1280 (HD Standard 16:9)</option>
                    <option value="1080x1920">1080×1920 (FHD — High Energy!)</option>
                  </select>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Doubling dimensions costs ~16× compute in DiT attention.
                  </div>
                </div>

                <div className="control-group">
                  <label className="control-label" htmlFor="video-fps-select">
                    <span>Frame Rate (FPS)</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      ~{(videoFrames / videoFps).toFixed(1)}s duration
                    </span>
                  </label>
                  <select
                    id="video-fps-select"
                    className="select-custom"
                    value={videoFps}
                    onChange={(e) => setVideoFps(Number(e.target.value))}
                  >
                    <option value={8}>8 fps (CogVideoX native)</option>
                    <option value={15}>15 fps (WAN2.1 default)</option>
                    <option value={24}>24 fps (Cinematic standard)</option>
                    <option value={30}>30 fps (Mochi-1 high-framerate)</option>
                  </select>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Frame rate sets temporal density of generated video.
                  </div>
                </div>

                <div className="control-group">
                  <label className="control-label" htmlFor="video-retries-select">
                    <span>Generations per Keeper</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {videoRetries}× attempts
                    </span>
                  </label>
                  <select
                    id="video-retries-select"
                    className="select-custom"
                    value={videoRetries}
                    onChange={(e) => setVideoRetries(Number(e.target.value))}
                  >
                    <option value={1}>1× (Keeps first try)</option>
                    <option value={2}>2× (1 retry for motion defects)</option>
                    <option value={3}>3× (Typical prompt iteration)</option>
                    <option value={5}>5× (High quality curation)</option>
                  </select>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Rerunning generations to eliminate motion artifacts.
                  </div>
                </div>

                <div className="control-group">
                  <label className="control-label" htmlFor="video-clips-select">
                    <span>Clips in Parallel</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Batch Size
                    </span>
                  </label>
                  <select
                    id="video-clips-select"
                    className="select-custom"
                    value={videoClipCount}
                    onChange={(e) => setVideoClipCount(Number(e.target.value))}
                  >
                    <option value={1}>1 Clip</option>
                    <option value={2}>2 Clips (Parallel variation)</option>
                    <option value={4}>4 Clips (Batch)</option>
                  </select>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Number of video clips rendered in parallel.
                  </div>
                </div>
              </div>

              {/* Sliders for Video */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="control-label">
                    Total Video Frames: <strong>{videoFrames} frames</strong>
                  </label>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8125rem', color: 'var(--text)', fontWeight: 600 }}>
                    {(videoFrames / videoFps).toFixed(1)}s clip duration
                  </span>
                </div>
                <input
                  type="range"
                  id="video-frames-slider"
                  className="range-slider"
                  min={16}
                  max={160}
                  step={4}
                  value={videoFrames}
                  onChange={(e) => setVideoFrames(Number(e.target.value))}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  <span>16 frames (1s)</span>
                  <span>81 frames (5.4s standard)</span>
                  <span>160 frames (10s+)</span>
                </div>
              </div>

              <div style={{ marginTop: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="control-label">
                    Denoising Steps: <strong>{videoSteps} steps</strong>
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>
                    Linear Scaling
                  </span>
                </div>
                <input
                  type="range"
                  id="video-steps-slider"
                  className="range-slider"
                  min={10}
                  max={70}
                  step={5}
                  value={videoSteps}
                  onChange={(e) => setVideoSteps(Number(e.target.value))}
                />
              </div>
            </>
          )}

          {/* Image Controls */}
          {activeMediaTab === 'image' && (
            <>
              {/* Full-Width Image Model Selection */}
              <div className="control-group" style={{ marginTop: '20px' }}>
                <label className="control-label" htmlFor="image-model-select">
                  <span style={{ fontWeight: 600 }}>Select Image Diffusion Model</span>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: imageModel.provenance === 'measured' ? 'var(--accent)' : 'var(--text-muted)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {imageModel.parameters} • {imageModel.provenance === 'measured' ? 'Telemetry Measured' : 'Proxy Mode'}
                  </span>
                </label>
                <select
                  id="image-model-select"
                  className="select-custom"
                  value={imageModel.id}
                  onChange={(e) => {
                    const found = IMAGE_MODELS.find((m) => m.id === e.target.value);
                    if (found) handleSelectImageModel(found);
                  }}
                >
                  <optgroup label="Open-Source Models (Physical Meters, Bertazzini / Iyengar 2025)">
                    {IMAGE_MODELS.filter((m) => m.provenance === 'measured').map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.parameters.replace(' Parameters', '')}) · {m.baseEnergyWh} Wh baseline
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Commercial Cloud Models (Estimated Proxy Mode)">
                    {IMAGE_MODELS.filter((m) => m.provenance === 'proxy').map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} · Estimated Proxy ({m.baseEnergyWh} Wh)
                      </option>
                    ))}
                  </optgroup>
                </select>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  {imageModel.note}
                </div>
              </div>

              {/* 2-Column Controls Grid for Image Parameters */}
              <div className="controls-grid" style={{ marginTop: '16px' }}>
                <div className="control-group">
                  <label className="control-label" htmlFor="image-res-select">
                    <span>Output Resolution</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Exponent b = {imageModel.resolutionExponent}
                    </span>
                  </label>
                  <select
                    id="image-res-select"
                    className="select-custom"
                    value={imageResolutionPreset}
                    onChange={(e) => setImageResolutionPreset(e.target.value)}
                  >
                    <option value="512x512">512×512 (Standard SD 1.5)</option>
                    <option value="768x768">768×768 (Medium)</option>
                    <option value="1024x1024">1024×1024 (1:1 Standard SDXL/Flux)</option>
                    <option value="832x1216">832×1216 (Portrait 2:3)</option>
                    <option value="1216x832">1216×832 (Landscape 3:2)</option>
                  </select>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Empirical resolution scaling factor from Bertazzini et al. (2025).
                  </div>
                </div>

                <div className="control-group">
                  <label className="control-label" htmlFor="image-precision-select">
                    <span>Computation Precision</span>
                    <span style={{ fontSize: '0.75rem', color: imagePrecision === 'fp32' ? '#EF4444' : 'var(--text-muted)' }}>
                      {imagePrecision === 'fp32' ? '~7.7× Energy Penalty' : 'Standard'}
                    </span>
                  </label>
                  <select
                    id="image-precision-select"
                    className="select-custom"
                    value={imagePrecision}
                    onChange={(e) => setImagePrecision(e.target.value as 'fp16' | 'fp32')}
                    disabled={!imageModel.supportsFp32}
                  >
                    <option value="fp16">fp16 / BF16 (Standard Half-Precision)</option>
                    <option value="fp32">fp32 (Full Precision — ~7× Energy!)</option>
                  </select>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {imagePrecision === 'fp32'
                      ? 'Full precision causes a massive memory bandwidth bottleneck.'
                      : 'Standard half-precision optimized for modern tensor cores.'}
                  </div>
                </div>

                <div className="control-group">
                  <label className="control-label" htmlFor="cfg-toggle">
                    <span>Guidance (CFG)</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {imageCfg ? '2 Passes' : '1 Pass'}
                    </span>
                  </label>
                  <select
                    id="cfg-toggle"
                    className="select-custom"
                    value={imageCfg ? 'on' : 'off'}
                    onChange={(e) => setImageCfg(e.target.value === 'on')}
                  >
                    <option value="on">CFG Enabled (2 passes per step)</option>
                    <option value="off">CFG Disabled / Distilled (1 pass per step)</option>
                  </select>
                </div>

                <div className="control-group">
                  <label className="control-label" htmlFor="image-retries-select">
                    <span>Generations per Keeper</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {imageRetries}× attempts
                    </span>
                  </label>
                  <select
                    id="image-retries-select"
                    className="select-custom"
                    value={imageRetries}
                    onChange={(e) => setImageRetries(Number(e.target.value))}
                  >
                    <option value={1}>1× (Keeps first try)</option>
                    <option value={2}>2× (1 retry)</option>
                    <option value={4}>4× (Grid of 4)</option>
                    <option value={8}>8× (Extensive iteration)</option>
                  </select>
                </div>

                <div className="control-group">
                  <label className="control-label" htmlFor="image-count-select">
                    <span>Batch Count</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Outputs
                    </span>
                  </label>
                  <select
                    id="image-count-select"
                    className="select-custom"
                    value={imageCount}
                    onChange={(e) => setImageCount(Number(e.target.value))}
                  >
                    <option value={1}>1 Image</option>
                    <option value={2}>2 Images</option>
                    <option value={4}>4 Images</option>
                  </select>
                </div>
              </div>

              {/* Denoising Steps Slider */}
              <div style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label className="control-label">
                    Denoising Steps: <strong>{imageSteps} steps</strong>
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--accent)', fontWeight: 600 }}>
                    Linear Scaling
                  </span>
                </div>
                <input
                  type="range"
                  id="image-steps-slider"
                  className="range-slider"
                  min={4}
                  max={60}
                  step={2}
                  value={imageSteps}
                  onChange={(e) => setImageSteps(Number(e.target.value))}
                />
              </div>
            </>
          )}

          {/* Mathematical Scaling Breakdown Card */}
          <div className="phase-visualizer" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={16} style={{ color: 'var(--accent)' }} />
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'var(--text)',
                  }}
                >
                  {activeMediaTab === 'video'
                    ? 'Spatiotemporal Quadratic Attention Scaling (Delavande et al. 2025)'
                    : 'Compute-Bound Denoising Scaling Law (Bertazzini et al. 2025)'}
                </span>
              </div>
              <span className="badge">
                {activeMediaTab === 'video' ? 'Attention token cost O(N²)' : 'Linear in steps • Invariant to prompt text'}
              </span>
            </div>

            {activeMediaTab === 'video' ? (
              <>
                <MathFormula
                  formula={`E_{\\text{video}} \\approx E_{\\text{base}} \\cdot \\left(\\frac{H \\times W}{H_0 \\times W_0}\\right)^2 \\cdot \\left(\\frac{T}{T_0}\\right)^2 \\cdot \\left(\\frac{S}{S_0}\\right)`}
                />
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '4px', lineHeight: 1.5 }}>
                  Diffusion Transformers (DiTs) divide video frames into 3D spatiotemporal patches. Because each patch attends to every other patch across both space and time, doubling resolution dimensions quadruples token count and increases attention compute by <strong>~16×</strong>, while doubling frames increases compute by <strong>~4×</strong>.
                </div>
              </>
            ) : (
              <>
                <MathFormula
                  formula={`\\ln E = \\ln A + \\alpha \\ln(\\text{FLOPs} \\cdot 2^{\\mathbb{I}_{cfg}}) + \\beta_{\\text{dtype}} \\mathbb{I}_{fp32} + \\beta_{\\text{res}} \\ln\\left(\\frac{H \\times W}{256}\\right)`}
                />
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '4px', lineHeight: 1.5 }}>
                  Image generation is compute-bound across iterative denoising passes (over 90% of FLOPs). Classifier-Free Guidance (CFG) doubles passes, and unoptimized full precision (fp32) imposes an exponential memory bandwidth penalty of <strong>~7.7×</strong> over half precision (fp16).
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Tactile Environmental Receipt Card */}
      <div className="receipt-wrapper">
        <div className="receipt-card" id="media-environmental-receipt">
          <div className="receipt-header">
            <div className="receipt-badge-title">
              {activeMediaTab === 'video' ? 'Video Diffusion Impact' : 'Image Diffusion Impact'}
            </div>
            <h3 className="receipt-title">Environmental Receipt</h3>
            <div className="receipt-meta-row">
              <span>{currentResult.modelName}</span>
              <span>{FORMATTED_DATE}</span>
              <span>{location.country} {weather ? `(${weather.temperatureC}°C)` : ''}</span>
            </div>
          </div>

          {/* Model & Provenance Capsule */}
          <div
            style={{
              padding: '8px 12px',
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8125rem',
            }}
          >
            <div>
              <strong style={{ color: 'var(--text)' }}>{currentResult.modelName}</strong>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {location.name} • {currentResult.totalGenerations} total runs ({currentResult.retries}× keeper retries)
              </div>
            </div>
            <span
              style={{
                fontSize: '0.6875rem',
                padding: '3px 8px',
                borderRadius: '4px',
                fontWeight: 600,
                textTransform: 'uppercase',
                background: currentResult.provenance === 'measured' ? '#ECFDF5' : '#FFFBEB',
                color: currentResult.provenance === 'measured' ? '#065F46' : '#92400E',
                border: `1px solid ${currentResult.provenance === 'measured' ? '#A7F3D0' : '#FDE68A'}`,
              }}
            >
              {currentResult.provenance === 'measured' ? 'Measured' : 'Proxy Mode'}
            </span>
          </div>

          {/* Hero Metrics 3-Block Grid (Same as Feature 1) */}
          <div className="metrics-hero-grid">
            <div className="metric-hero-block">
              <span className="metric-hero-label">Electricity Used</span>
              <span className="metric-hero-value">
                {currentResult.totalEnergyWh < 0.1
                  ? currentResult.totalEnergyWh.toFixed(3)
                  : currentResult.totalEnergyWh.toFixed(2)}
              </span>
              <span className="metric-hero-unit">Watt-hours (Wh)</span>
            </div>

            <div className="metric-hero-block">
              <span className="metric-hero-label">
                {waterMode === 'consumption' ? 'Water Consumed' : 'Water Withdrawn'}
              </span>
              <span className="metric-hero-value">
                {currentResult.displayedTotalWaterMl.toFixed(1)}
              </span>
              <span className="metric-hero-unit">Milliliters (mL)</span>
            </div>

            <div className="metric-hero-block">
              <span className="metric-hero-label">Carbon Emissions</span>
              <span className="metric-hero-value">
                {currentResult.carbonGrams.toFixed(2)}
              </span>
              <span className="metric-hero-unit">Grams (gCO₂e)</span>
            </div>
          </div>

          {/* Scope 1 vs Scope 2 Breakdown (Same as Feature 1) */}
          <div className="scope-breakdown-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--text)',
              }}
            >
              <span>Where the Water is Used</span>
              <span style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                {currentResult.displayedTotalWaterMl.toFixed(1)} mL Total
              </span>
            </div>

            <div className="scope-bar">
              <div
                className="scope1-fill"
                style={{ width: `${currentResult.scope1Percent}%` }}
                title={`Scope 1 On-Site Cooling: ${currentResult.scope1Percent}%`}
              />
              <div
                className="scope2-fill"
                style={{ width: `${currentResult.scope2Percent}%` }}
                title={`Scope 2 Off-Site Grid: ${currentResult.scope2Percent}%`}
              />
            </div>

            <div className="scope-labels">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--text-muted)',
                  }}
                />
                <span>
                  Scope 1 On-Site: {currentResult.displayedScope1WaterMl.toFixed(1)} mL ({currentResult.scope1Percent}%) evaporated in cooling towers
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--accent)',
                  }}
                />
                <span>
                  Scope 2 Grid: {currentResult.displayedScope2WaterMl.toFixed(1)} mL ({currentResult.scope2Percent}%) consumed by power plants
                </span>
              </div>
            </div>
          </div>

          {/* Water Bottle Graphic (Same as Feature 1) */}
          <div className="water-bottle-visual">
            <div className="bottle-icon-container">
              <div className="bottle-cap" />
              <div
                className="bottle-liquid"
                style={{
                  height: `${Math.min(100, Math.max(8, currentResult.bottleFraction * 100))}%`,
                }}
              />
            </div>
            <div>
              <div
                style={{
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'var(--text)',
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {(currentResult.bottleFraction * 100).toFixed(1)}% of a 500 mL Water Bottle
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Equivalent to evaporating ~<strong>{currentResult.waterDrops.toLocaleString()}</strong> standard drops
                of clean drinking water.
              </div>
            </div>
          </div>

          {/* Cross-Modality Equivalence Card */}
          <div
            style={{
              padding: '12px 14px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius)',
                background: 'var(--bg)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
                flexShrink: 0,
              }}
            >
              <Zap size={16} />
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
                Cross-Modality Equivalence
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: 1.5 }}>
                This single media generation uses as much electricity as{' '}
                <strong style={{ color: 'var(--text)' }}>{currentResult.equalsGpt3Queries} full chatbot queries</strong> (GPT-3, 4 Wh) or{' '}
                <strong style={{ color: 'var(--text)' }}>{currentResult.equalsGeminiQueries} lightweight text prompts</strong> (0.24 Wh).
              </div>
            </div>
          </div>

          {/* Relatable Everyday Equivalents (Same as Feature 1) */}
          <div className="equivalents-section">
            <div className="equivalents-title">
              <Lightbulb size={14} />
              <span>Relatable Everyday Equivalents</span>
            </div>

            <div className="equivalents-grid">
              <div className="equiv-card">
                <div className="equiv-icon-box">
                  <Lightbulb size={16} />
                </div>
                <div>
                  <div className="equiv-value">{Math.round(currentResult.ledSeconds / 60)} min</div>
                  <div className="equiv-subtext">Powering a 10W LED bulb</div>
                </div>
              </div>

              <div className="equiv-card">
                <div className="equiv-icon-box">
                  <Smartphone size={16} />
                </div>
                <div>
                  <div className="equiv-value">
                    {currentResult.smartphoneBatteryPercent.toFixed(1)}%
                  </div>
                  <div className="equiv-subtext">Smartphone recharge</div>
                </div>
              </div>

              <div className="equiv-card">
                <div className="equiv-icon-box">
                  <Car size={16} />
                </div>
                <div>
                  <div className="equiv-value">{currentResult.drivingMeters}m</div>
                  <div className="equiv-subtext">Driving an average petrol car</div>
                </div>
              </div>

              <div className="equiv-card">
                <div className="equiv-icon-box">
                  <Server size={16} />
                </div>
                <div>
                  <div className="equiv-value">
                    {currentResult.totalEnergyWh.toFixed(1)} Wh
                  </div>
                  <div className="equiv-subtext">
                    {currentResult.whPerSecond ? `${currentResult.whPerSecond.toFixed(1)} Wh/sec video` : 'Per generation batch'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Uncertainty Band & Boundary Note */}
          <div
            style={{
              padding: '10px 12px',
              background: 'var(--surface)',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            <div>
              <strong style={{ color: 'var(--text)' }}>Uncertainty Band:</strong> {currentResult.uncertainty}
            </div>
            <div>
              <strong style={{ color: 'var(--text)' }}>Measurement Boundary:</strong> {currentResult.boundary}
            </div>
          </div>

          {/* Dynamic Sensitivity Hints */}
          {currentResult.sensitivityHints.length > 0 && (
            <div
              style={{
                padding: '10px 14px',
                background: 'var(--surface)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                fontSize: '0.8125rem',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lightbulb size={13} style={{ color: 'var(--accent)' }} />
                <span>Sensitivity &amp; Reduction Tips:</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {currentResult.sensitivityHints.map((hint, idx) => (
                  <li key={idx}>{hint}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Copy Receipt Action Button (Same as Feature 1) */}
          <div style={{ marginTop: '16px' }}>
            <button
              type="button"
              className="btn-primary"
              id="copy-media-receipt-btn"
              onClick={handleCopyReceipt}
              style={{ width: '100%' }}
            >
              {copiedReceipt ? <Check size={16} /> : <Copy size={16} />}
              <span>{copiedReceipt ? 'Copied Receipt to Clipboard!' : 'Copy Environmental Receipt'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleMediaSandbox;
