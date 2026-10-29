import React, { useState, useMemo } from 'react';
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Info,
  Copy,
  Check,
  Zap,
  Droplets,
  Flame,
  Scale,
  Lightbulb,
  Smartphone,
  Car,
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
  const [activeMediaTab, setActiveMediaTab] = useState<'image' | 'video'>('video');

  // Image Controls State
  const [imageModel, setImageModel] = useState<MediaImageModel>(IMAGE_MODELS[0]); // SDXL
  const [imageResolutionPreset, setImageResolutionPreset] = useState<string>('1024x1024');
  const [imageSteps, setImageSteps] = useState<number>(30);
  const [imageCfg, setImageCfg] = useState<boolean>(true);
  const [imagePrecision, setImagePrecision] = useState<'fp16' | 'fp32'>('fp16');
  const [imageCount, setImageCount] = useState<number>(1);
  const [imageRetries, setImageRetries] = useState<number>(2); // 2 attempts per keeper
  const [imagePrompt, setImagePrompt] = useState<string>('A cinematic photograph of an ancient data center engulfed in lush moss and flowing river water, 8k resolution, photorealistic');

  // Video Controls State
  const [videoModel, setVideoModel] = useState<MediaVideoModel>(VIDEO_MODELS[0]); // WAN2.1 1.3B
  const [videoResolutionPreset, setVideoResolutionPreset] = useState<string>('720x1280');
  const [videoFrames, setVideoFrames] = useState<number>(81);
  const [videoFps, setVideoFps] = useState<number>(15);
  const [videoSteps, setVideoSteps] = useState<number>(50);
  const [videoClipCount, setVideoClipCount] = useState<number>(1);
  const [videoRetries, setVideoRetries] = useState<number>(1);
  const [videoPrompt, setVideoPrompt] = useState<string>('Time-lapse of steam plumes evaporating above cooling towers into sunset clouds, photorealistic, 4k');

  const [copiedReceipt, setCopiedReceipt] = useState<boolean>(false);
  const [showMathDrawer, setShowMathDrawer] = useState<boolean>(false);

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
    const textReceipt = `--- GENERATIVE MEDIA ENVIRONMENTAL RECEIPT ---
Modality: ${activeMediaTab === 'image' ? 'Text-to-Image Diffusion' : 'Text-to-Video Diffusion'}
Model: ${currentResult.modelName} (${currentResult.provenance.toUpperCase()})
Location: ${location.name} (${location.country})
Settings: ${
      activeMediaTab === 'image'
        ? `${parsedImageResolution[0]}x${parsedImageResolution[1]}, ${imageSteps} steps, ${imagePrecision}, CFG: ${imageCfg ? 'On' : 'Off'}`
        : `${parsedVideoResolution[0]}x${parsedVideoResolution[1]}, ${videoFrames} frames @ ${videoFps}fps (${Math.round((videoFrames / videoFps) * 10) / 10}s), ${videoSteps} steps`
    }
Total Generations: ${currentResult.totalGenerations} (${currentResult.batchCount} outputs × ${currentResult.retries} keeper retries)
Server Energy: ${currentResult.totalEnergyWh} Wh (${currentResult.whPerSecond ? `${currentResult.whPerSecond} Wh/sec` : ''})
Total Water (${waterMode}): ${currentResult.displayedTotalWaterMl} mL (Scope 1 On-Site: ${currentResult.scope1Percent}%, Scope 2 Off-Site: ${currentResult.scope2Percent}%)
Carbon Footprint: ${currentResult.carbonGrams} gCO2e
Text Comparison: Equals ${currentResult.equalsGpt3Queries} full GPT-3 chatbot conversations (4 Wh)
Uncertainty: ${currentResult.uncertainty}
Boundary: ${currentResult.boundary}
Scientific References: Delavande et al. (2025), Iyengar et al. (2025), Bertazzini et al. (2025)
Generated by AI Water & Energy Footprint Simulator
------------------------------------------------`;

    navigator.clipboard.writeText(textReceipt);
    setCopiedReceipt(true);
    setTimeout(() => setCopiedReceipt(false), 2000);
  };

  return (
    <div className="sandbox-container" style={{ marginTop: '0' }}>
      {/* Left Column: Interactive Media Controls */}
      <div className="prompt-console">
        {/* Modality Selector Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--surface)',
            padding: '6px',
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              className={`preset-chip ${activeMediaTab === 'video' ? 'active' : ''}`}
              onClick={() => setActiveMediaTab('video')}
              style={{
                background: activeMediaTab === 'video' ? 'var(--accent)' : 'transparent',
                color: activeMediaTab === 'video' ? '#FFFFFF' : 'var(--text)',
                fontWeight: 600,
                border: 'none',
              }}
            >
              <VideoIcon size={14} />
              <span>Text-to-Video (WAN2.1, CogVideoX, LTX)</span>
            </button>
            <button
              className={`preset-chip ${activeMediaTab === 'image' ? 'active' : ''}`}
              onClick={() => setActiveMediaTab('image')}
              style={{
                background: activeMediaTab === 'image' ? 'var(--accent)' : 'transparent',
                color: activeMediaTab === 'image' ? '#FFFFFF' : 'var(--text)',
                fontWeight: 600,
                border: 'none',
              }}
            >
              <ImageIcon size={14} />
              <span>Text-to-Image (SDXL, SD 3.5, Flux, Qwen)</span>
            </button>
          </div>

          <button
            className="btn-secondary btn-sm"
            onClick={() => setShowMathDrawer(!showMathDrawer)}
            title="Toggle Mathematical Scaling Reasoning"
            style={{ fontSize: '0.75rem', padding: '4px 8px' }}
          >
            <Scale size={13} />
            <span>{showMathDrawer ? 'Hide Math' : 'Show Math'}</span>
          </button>
        </div>

        {/* Optional Prompt Input Box */}
        <div className="prompt-textarea-wrapper">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Creative Prompt (Optional)
            </label>
            <span
              style={{
                fontSize: '0.75rem',
                color: 'var(--accent)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                background: 'rgba(37, 99, 235, 0.08)',
                padding: '2px 8px',
                borderRadius: '4px',
              }}
            >
              <Info size={12} />
              <span>Prompt text length does not change energy (Bertazzini et al. 2025)</span>
            </span>
          </div>

          <textarea
            className="prompt-textarea"
            rows={2}
            value={activeMediaTab === 'image' ? imagePrompt : videoPrompt}
            onChange={(e) => {
              if (activeMediaTab === 'image') setImagePrompt(e.target.value);
              else setVideoPrompt(e.target.value);
            }}
            placeholder="Type your generation prompt..."
            style={{ minHeight: '60px' }}
          />

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            <em>Scientific Note:</em> Research proves diffusion energy is strictly compute-bound by resolution, steps, and frames. The words typed above affect the image subject, not the kilowatt-hours!
          </div>
        </div>

        {/* =====================================================================
            VIDEO GENERATION CONTROLS
            ===================================================================== */}
        {activeMediaTab === 'video' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Model Selector */}
            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="input-label">Select Video Diffusion Model</label>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background:
                      videoModel.provenance === 'measured'
                        ? 'rgba(16, 185, 129, 0.1)'
                        : 'rgba(245, 158, 11, 0.1)',
                    color:
                      videoModel.provenance === 'measured' ? '#059669' : '#D97706',
                    fontWeight: 600,
                  }}
                >
                  {videoModel.provenance === 'measured'
                    ? 'Measured on H100 Meter'
                    : 'Proxy Estimate (Closed Service)'}
                </span>
              </div>

              <select
                className="select-input"
                value={videoModel.id}
                onChange={(e) => {
                  const found = VIDEO_MODELS.find((m) => m.id === e.target.value);
                  if (found) handleSelectVideoModel(found);
                }}
              >
                <optgroup label="Open-Source Models (Physical H100 Telemetry, Delavande et al. 2025)">
                  {VIDEO_MODELS.filter((m) => m.provenance === 'measured').map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.parameters}) — Baseline: {m.baseEnergyWh} Wh
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Commercial Closed Models (Estimated Proxy Mode)">
                  {VIDEO_MODELS.filter((m) => m.provenance === 'proxy').map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} [Proxy Mode]
                    </option>
                  ))}
                </optgroup>
              </select>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {videoModel.note}
              </div>
            </div>

            {/* Video Resolution & Frames Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">
                  Resolution Preset <span style={{ color: 'var(--accent)' }}>(Quadratic Scaling)</span>
                </label>
                <select
                  className="select-input"
                  value={videoResolutionPreset}
                  onChange={(e) => setVideoResolutionPreset(e.target.value)}
                >
                  <option value="480x720">480×720 (Standard Mobile 16:9)</option>
                  <option value="512x704">512×704 (LTX-Video Native)</option>
                  <option value="720x1280">720×1280 (HD Standard 16:9)</option>
                  <option value="1080x1920">1080×1920 (FHD — High Energy!)</option>
                </select>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Doubling dimensions costs ~16× compute in DiT self-attention.
                </span>
              </div>

              <div className="input-group">
                <label className="input-label">Frame Rate (FPS)</label>
                <select
                  className="select-input"
                  value={videoFps}
                  onChange={(e) => setVideoFps(Number(e.target.value))}
                >
                  <option value={8}>8 fps (CogVideoX native)</option>
                  <option value={15}>15 fps (WAN2.1 default)</option>
                  <option value={24}>24 fps (Cinematic standard)</option>
                  <option value={30}>30 fps (Mochi-1 high-framerate)</option>
                </select>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Clip length: ~{Math.round((videoFrames / videoFps) * 10) / 10} seconds
                </span>
              </div>
            </div>

            {/* Frames & Steps Sliders */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>Total Video Frames: {videoFrames} frames</span>
                  <span style={{ color: 'var(--text-muted)' }}>
                    Duration: {(videoFrames / videoFps).toFixed(1)}s
                  </span>
                </div>
                <input
                  type="range"
                  className="range-slider"
                  min={16}
                  max={160}
                  step={4}
                  value={videoFrames}
                  onChange={(e) => setVideoFrames(Number(e.target.value))}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  <span>16 frames (1s)</span>
                  <span>81 frames (5.4s standard)</span>
                  <span>160 frames (10s+)</span>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600 }}>Denoising Steps: {videoSteps} steps</span>
                  <span style={{ color: 'var(--accent)' }}>Linear Scaling</span>
                </div>
                <input
                  type="range"
                  className="range-slider"
                  min={10}
                  max={70}
                  step={5}
                  value={videoSteps}
                  onChange={(e) => setVideoSteps(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Retries and Batches */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Clips in Parallel</label>
                <select
                  className="select-input"
                  value={videoClipCount}
                  onChange={(e) => setVideoClipCount(Number(e.target.value))}
                >
                  <option value={1}>1 Clip</option>
                  <option value={2}>2 Clips (Parallel variation)</option>
                  <option value={4}>4 Clips (Batch)</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Generations per Keeper (Retries)</label>
                <select
                  className="select-input"
                  value={videoRetries}
                  onChange={(e) => setVideoRetries(Number(e.target.value))}
                >
                  <option value={1}>1× (Keeps first try)</option>
                  <option value={2}>2× (1 retry for motion defects)</option>
                  <option value={3}>3× (Typical prompt iteration)</option>
                  <option value={5}>5× (High quality curation)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            IMAGE GENERATION CONTROLS
            ===================================================================== */}
        {activeMediaTab === 'image' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Model Selector */}
            <div className="input-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="input-label">Select Image Diffusion Model</label>
                <span
                  style={{
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background:
                      imageModel.provenance === 'measured'
                        ? 'rgba(16, 185, 129, 0.1)'
                        : 'rgba(245, 158, 11, 0.1)',
                    color:
                      imageModel.provenance === 'measured' ? '#059669' : '#D97706',
                    fontWeight: 600,
                  }}
                >
                  {imageModel.provenance === 'measured'
                    ? 'Measured Telemetry'
                    : 'Proxy Mode'}
                </span>
              </div>

              <select
                className="select-input"
                value={imageModel.id}
                onChange={(e) => {
                  const found = IMAGE_MODELS.find((m) => m.id === e.target.value);
                  if (found) handleSelectImageModel(found);
                }}
              >
                <optgroup label="Open-Source Models (Physical Meters, Bertazzini et al. / Iyengar et al.)">
                  {IMAGE_MODELS.filter((m) => m.provenance === 'measured').map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.parameters}) — Baseline: {m.baseEnergyWh} Wh
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Commercial Cloud Models (Estimated Proxy Mode)">
                  {IMAGE_MODELS.filter((m) => m.provenance === 'proxy').map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} [Proxy Mode]
                    </option>
                  ))}
                </optgroup>
              </select>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                {imageModel.note}
              </div>
            </div>

            {/* Resolution and Precision */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Output Resolution</label>
                <select
                  className="select-input"
                  value={imageResolutionPreset}
                  onChange={(e) => setImageResolutionPreset(e.target.value)}
                >
                  <option value="512x512">512×512 (Standard SD 1.5)</option>
                  <option value="768x768">768×768 (Medium)</option>
                  <option value="1024x1024">1024×1024 (1:1 Standard SDXL/Flux)</option>
                  <option value="832x1216">832×1216 (Portrait 2:3)</option>
                  <option value="1216x832">1216×832 (Landscape 3:2)</option>
                </select>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Model exponent b = {imageModel.resolutionExponent} (Bertazzini et al. 2025)
                </span>
              </div>

              <div className="input-group">
                <label className="input-label">Computation Precision</label>
                <select
                  className="select-input"
                  value={imagePrecision}
                  onChange={(e) => setImagePrecision(e.target.value as 'fp16' | 'fp32')}
                  disabled={!imageModel.supportsFp32}
                >
                  <option value="fp16">fp16 / BF16 (Standard Half-Precision)</option>
                  <option value="fp32">fp32 (Full Precision — ~7× Energy!)</option>
                </select>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {imagePrecision === 'fp32'
                    ? 'e^2.04 ≈ 7.7× energy penalty due to memory bandwidth!'
                    : 'Standard optimized inference format'}
                </span>
              </div>
            </div>

            {/* Denoising Steps Slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '4px' }}>
                <span style={{ fontWeight: 600 }}>Denoising Steps: {imageSteps} steps</span>
                <span style={{ color: 'var(--accent)' }}>Linear Scaling</span>
              </div>
              <input
                type="range"
                className="range-slider"
                min={4}
                max={60}
                step={2}
                value={imageSteps}
                onChange={(e) => setImageSteps(Number(e.target.value))}
              />
            </div>

            {/* CFG, Batch Count & Retries */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
              <div className="input-group">
                <label className="input-label">Guidance (CFG)</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                  <input
                    type="checkbox"
                    id="cfg-toggle"
                    checked={imageCfg}
                    onChange={(e) => setImageCfg(e.target.checked)}
                    style={{ cursor: 'pointer' }}
                  />
                  <label htmlFor="cfg-toggle" style={{ fontSize: '0.8125rem', cursor: 'pointer' }}>
                    {imageCfg ? 'CFG On (2 passes)' : 'CFG Off (1 pass)'}
                  </label>
                </div>
              </div>

              <div className="input-group">
                <label className="input-label">Batch Count</label>
                <select
                  className="select-input"
                  value={imageCount}
                  onChange={(e) => setImageCount(Number(e.target.value))}
                >
                  <option value={1}>1 Image</option>
                  <option value={2}>2 Images</option>
                  <option value={4}>4 Images</option>
                </select>
              </div>

              <div className="input-group">
                <label className="input-label">Keeper Retries</label>
                <select
                  className="select-input"
                  value={imageRetries}
                  onChange={(e) => setImageRetries(Number(e.target.value))}
                >
                  <option value={1}>1× (Keeps first)</option>
                  <option value={2}>2× (1 retry)</option>
                  <option value={4}>4× (Grid of 4)</option>
                  <option value={8}>8× (Extensive)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Mathematical Scaling Breakdown Drawer */}
        {showMathDrawer && (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
              padding: '16px',
              marginTop: '10px',
            }}
          >
            <h4 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
              Mathematical Scaling Formulations (Addendum Research)
            </h4>

            {activeMediaTab === 'video' ? (
              <div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  From <strong>Delavande et al. (2025)</strong>, latent video diffusion FLOPs and energy follow a strictly quadratic spatial and temporal scaling law:
                </p>
                <div style={{ margin: '8px 0', background: 'var(--bg)', padding: '10px', borderRadius: 'var(--radius)' }}>
                  <MathFormula
                    formula={`E_{\\text{video}} \\propto \\underbrace{(H \\times W)^2}_{\\text{Quadratic Spatial}} \\times \\underbrace{T^2}_{\\text{Quadratic Temporal}} \\times \\underbrace{S}_{\\text{Linear Steps}}`}
                    displayMode={true}
                  />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  DiT token length is <MathFormula formula={'\\ell = (1 + T/4) \\cdot \\frac{H}{16} \\cdot \\frac{W}{16}'} />. Because full self-attention scales quadratically with token count, doubling spatial resolution costs 16×, while doubling frames costs 4×.
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  From <strong>Iyengar et al. (2025)</strong> and <strong>Bertazzini et al. (2025)</strong>, diffusion image energy is compute-bound across denoising iterations:
                </p>
                <div style={{ margin: '8px 0', background: 'var(--bg)', padding: '10px', borderRadius: 'var(--radius)' }}>
                  <MathFormula
                    formula={`\\ln E = \\ln A + \\alpha \\ln(\\text{FLOPs} \\cdot 2^{\\mathbb{I}_{cfg}}) + \\beta_{dtype} \\mathbb{I}_{fp32} + \\beta_{res} \\ln\\left(\\frac{H \\times W}{256}\\right)`}
                    displayMode={true}
                  />
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  An exponent $\alpha \approx 1$ confirms the compute-bound regime. Precision penalty for fp32 is $e^{2.04} \approx 7.7\times$ on Flux and $e^{1.90} \approx 6.7\times$ on SD 3.5.
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Column: Environmental Receipt */}
      <div className="receipt-column">
        <div className="receipt-card">
          <div className="receipt-header">
            <div>
              <span className="receipt-badge">
                {activeMediaTab === 'image' ? 'IMAGE DIFFUSION RECEIPT' : 'VIDEO DIFFUSION RECEIPT'}
              </span>
              <h3 className="receipt-title">Physical Resource Consumption</h3>
            </div>

            <button
              className="btn-secondary btn-sm"
              onClick={handleCopyReceipt}
              title="Copy receipt to clipboard"
            >
              {copiedReceipt ? <Check size={13} style={{ color: '#10B981' }} /> : <Copy size={13} />}
              <span>{copiedReceipt ? 'Copied!' : 'Copy'}</span>
            </button>
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
              <strong>{currentResult.modelName}</strong>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {location.name} • {currentResult.totalGenerations} total runs ({currentResult.retries}x keeper retries)
              </div>
            </div>
            <span
              style={{
                fontSize: '0.6875rem',
                padding: '3px 6px',
                borderRadius: '4px',
                fontWeight: 600,
                textTransform: 'uppercase',
                background: currentResult.provenance === 'measured' ? '#ECFDF5' : '#FFFBEB',
                color: currentResult.provenance === 'measured' ? '#065F46' : '#92400E',
              }}
            >
              {currentResult.provenance}
            </span>
          </div>

          {/* The Big 3 Metrics */}
          <div className="receipt-metrics-grid">
            {/* Electricity */}
            <div className="metric-box amber">
              <div className="metric-header">
                <Zap size={16} />
                <span>SERVER ELECTRICITY</span>
              </div>
              <div className="metric-value">
                {currentResult.totalEnergyWh} <span className="metric-unit">Wh</span>
              </div>
              <div className="metric-subtext">
                {currentResult.whPerSecond ? (
                  <span>{currentResult.whPerSecond} Wh per second of video</span>
                ) : (
                  <span>{currentResult.singleUnitEnergyWh} Wh per image</span>
                )}
              </div>
            </div>

            {/* Water */}
            <div className="metric-box cyan">
              <div className="metric-header">
                <Droplets size={16} />
                <span>WATER ({waterMode.toUpperCase()})</span>
              </div>
              <div className="metric-value">
                {currentResult.displayedTotalWaterMl} <span className="metric-unit">mL</span>
              </div>
              <div className="metric-subtext">
                Scope 1 (On-site): {currentResult.scope1Percent}% • Scope 2 (Grid): {currentResult.scope2Percent}%
              </div>
            </div>

            {/* Carbon */}
            <div className="metric-box coral">
              <div className="metric-header">
                <Flame size={16} />
                <span>OPERATIONAL CARBON</span>
              </div>
              <div className="metric-value">
                {currentResult.carbonGrams} <span className="metric-unit">gCO₂e</span>
              </div>
              <div className="metric-subtext">
                Grid: {location.carbonIntensity} kgCO₂e/kWh
              </div>
            </div>
          </div>

          {/* Cross-Modality Benchmark Card ("Equals N Text Queries") */}
          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(37, 99, 235, 0.05)',
              border: '1px solid rgba(37, 99, 235, 0.2)',
              borderRadius: 'var(--radius)',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <div
              style={{
                background: 'var(--accent)',
                color: '#FFFFFF',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                fontWeight: 700,
                fontSize: '0.875rem',
              }}
            >
              ⇄
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
                Cross-Modality Equivalence
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text)', marginTop: '2px', lineHeight: 1.5 }}>
                This single media generation uses as much electricity as{' '}
                <strong>{currentResult.equalsGpt3Queries} full chatbot queries</strong> (GPT-3, 4 Wh) or{' '}
                <strong>{currentResult.equalsGeminiQueries} lightweight text prompts</strong> (0.24 Wh).
              </div>
            </div>
          </div>

          {/* Tangible Everyday Equivalents */}
          <div className="equivalents-section">
            <div className="equivalents-title">EVERYDAY TANGIBLE EQUIVALENTS</div>
            <div className="equivalents-list">
              <div className="equivalent-item">
                <Droplets size={14} style={{ color: '#06B6D4' }} />
                <span>
                  <strong>{(currentResult.bottleFraction * 100).toFixed(1)}%</strong> of a 500 mL water bottle ({currentResult.waterDrops.toLocaleString()} water drops)
                </span>
              </div>

              <div className="equivalent-item">
                <Lightbulb size={14} style={{ color: '#F59E0B' }} />
                <span>
                  Powers a 10W standard LED bulb for <strong>{Math.round(currentResult.ledSeconds / 60)} minutes</strong>
                </span>
              </div>

              <div className="equivalent-item">
                <Smartphone size={14} style={{ color: '#10B981' }} />
                <span>
                  Charges <strong>{currentResult.smartphoneBatteryPercent.toFixed(1)}%</strong> of a typical smartphone battery
                </span>
              </div>

              <div className="equivalent-item">
                <Car size={14} style={{ color: '#EF4444' }} />
                <span>
                  Equivalent to driving an average car for <strong>{currentResult.drivingMeters} meters</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Uncertainty Band & Boundary Note */}
          <div
            style={{
              padding: '10px 12px',
              background: 'var(--bg)',
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
              <strong>Uncertainty Band:</strong> {currentResult.uncertainty}
            </div>
            <div>
              <strong>Measurement Boundary:</strong> {currentResult.boundary}
            </div>
          </div>

          {/* Dynamic Sensitivity Hints */}
          {currentResult.sensitivityHints.length > 0 && (
            <div
              style={{
                padding: '10px 12px',
                background: 'var(--surface)',
                borderRadius: 'var(--radius)',
                border: '1px solid var(--border)',
                fontSize: '0.8125rem',
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lightbulb size={13} style={{ color: 'var(--accent)' }} />
                <span>Sensitivity & Reduction Tips:</span>
              </div>
              <ul style={{ margin: 0, paddingLeft: '1.2rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {currentResult.sensitivityHints.map((hint, idx) => (
                  <li key={idx}>{hint}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
