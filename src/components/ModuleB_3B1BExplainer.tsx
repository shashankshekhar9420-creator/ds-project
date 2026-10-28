import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  Thermometer,
  Cpu,
  Layers,
  Database,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Info,
  Scale,
  FileText,
} from 'lucide-react';
import { MathFormula } from './MathFormula';
import '../styles/explainer.css';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'steam' | 'heat' | 'electron' | 'water';
}

export const ModuleB3B1BExplainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [simTemp, setSimTemp] = useState(30); // Ambient outside temp in °C
  const [activeScope, setActiveScope] = useState<'all' | 'scope1' | 'scope2'>('all');
  const [activeSubTab, setActiveSubTab] = useState<'canvas' | 'token-methodology' | 'formulations' | 'papers'>('canvas');
  const [storyStage, setStoryStage] = useState<number>(0);

  // References for animation loop
  const particlesRef = useRef<Particle[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 900);
    let height = (canvas.height = 440);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = 440;
    };
    window.addEventListener('resize', handleResize);

    const particles = particlesRef.current;
    particles.length = 0;

    let tick = 0;

    const render = () => {
      tick++;

      // Clear Canvas
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, width, height);

      // Subtle Grid Lines
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.15)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Middle dividing boundary
      const midX = width * 0.48;

      ctx.save();
      ctx.setLineDash([4, 6]);
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
      ctx.beginPath();
      ctx.moveTo(midX, 36);
      ctx.lineTo(midX, height - 24);
      ctx.stroke();
      ctx.restore();

      // Section Headings on Canvas
      ctx.font = '600 12px Inter, sans-serif';

      // Scope 1 Label
      ctx.fillStyle = activeScope === 'scope2' ? 'rgba(2, 132, 199, 0.25)' : '#0284c7';
      ctx.fillText('SCOPE 1: ON-SITE EVAPORATIVE COOLING (29%)', 28, 28);

      // Scope 2 Label
      ctx.fillStyle = activeScope === 'scope1' ? 'rgba(37, 99, 235, 0.25)' : '#2563eb';
      ctx.fillText('SCOPE 2: OFF-SITE POWER GENERATION (71%)', midX + 28, 28);

      // ========================================================================
      // 1. LEFT SIDE: DATA CENTER (Server Racks -> Coolant Loop -> Cooling Tower)
      // ========================================================================
      const isScope1Dimmed = activeScope === 'scope2';
      ctx.globalAlpha = isScope1Dimmed ? 0.25 : 1.0;

      // Server Rack Box
      const rackX = 36;
      const rackY = 150;
      const rackW = 110;
      const rackH = 190;

      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(rackX, rackY, rackW, rackH, 6);
      ctx.fill();
      ctx.stroke();

      // Server blades
      for (let b = 0; b < 6; b++) {
        const bladeY = rackY + 14 + b * 28;
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(rackX + 8, bladeY, rackW - 16, 20);

        const isGpuActive = Math.sin(tick * 0.05 + b) > -0.2;
        ctx.fillStyle = isGpuActive ? '#f59e0b' : '#38bdf8';
        ctx.shadowColor = isGpuActive ? 'rgba(245, 158, 11, 0.6)' : 'rgba(56, 189, 248, 0.6)';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(rackX + 18, bladeY + 10, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // GPU Silicon Die
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(rackX + 32, bladeY + 5, 22, 10);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(rackX + 60, bladeY + 5, 22, 10);
      }

      ctx.font = '600 11px Inter, sans-serif';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('GPU Clusters (H100)', rackX + 6, rackY - 8);

      // Cooling Loop Pipes
      const towerX = midX - 100;
      const towerY = 140;
      const towerW = 80;
      const towerH = 200;

      // Hot Coolant
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(rackX + rackW, rackY + 45);
      ctx.bezierCurveTo(rackX + rackW + 30, rackY + 45, towerX - 30, towerY + 80, towerX, towerY + 80);
      ctx.stroke();

      // Chilled Coolant
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(towerX, towerY + 160);
      ctx.bezierCurveTo(towerX - 30, towerY + 160, rackX + rackW + 30, rackY + 140, rackX + rackW, rackY + 140);
      ctx.stroke();

      // Labels
      ctx.font = '500 10px JetBrains Mono, monospace';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('Heat Flux →', rackX + rackW + 8, rackY + 36);
      ctx.fillStyle = '#06b6d4';
      ctx.fillText('← Chilled Loop', rackX + rackW + 8, rackY + 132);

      // Cooling Tower Graphic
      ctx.fillStyle = '#f1f5f9';
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(towerX, towerY + towerH);
      ctx.bezierCurveTo(towerX + 18, towerY + 110, towerX + 10, towerY + 35, towerX + 14, towerY);
      ctx.lineTo(towerX + towerW - 14, towerY);
      ctx.bezierCurveTo(towerX + towerW - 10, towerY + 35, towerX + towerW - 18, towerY + 110, towerX + towerW, towerY + towerH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#0284c7';
      ctx.font = '600 11px Inter, sans-serif';
      ctx.fillText('Cooling Tower', towerX + 6, towerY - 8);

      // Spawn steam particles from cooling tower top
      const steamRate = Math.max(1, Math.round((simTemp - 15) / 5));
      if (tick % Math.max(1, 4 - Math.floor(steamRate / 2)) === 0 && !isScope1Dimmed) {
        particles.push({
          x: towerX + towerW / 2 + (Math.random() - 0.5) * 30,
          y: towerY + 5,
          vx: (Math.random() - 0.5) * 0.8,
          vy: -1.2 - Math.random() * 1.4,
          radius: 3 + Math.random() * 4,
          alpha: 0.7,
          life: 0,
          maxLife: 70 + Math.random() * 40,
          type: 'steam',
        });
      }

      // ========================================================================
      // 2. RIGHT SIDE: OFF-SITE POWER GENERATION (Scope 2: 71%)
      // ========================================================================
      const isScope2Dimmed = activeScope === 'scope1';
      ctx.globalAlpha = isScope2Dimmed ? 0.25 : 1.0;

      // Power Lines connecting right to left
      ctx.strokeStyle = 'rgba(202, 138, 4, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(midX + 20, rackY + 95);
      ctx.lineTo(rackX + rackW, rackY + 95);
      ctx.stroke();

      // Electron dots moving leftward
      const electronOffset = (tick * 2) % (rackX + rackW - (midX + 20));
      ctx.fillStyle = '#ca8a04';
      ctx.beginPath();
      ctx.arc(midX + 20 + electronOffset, rackY + 95, 3, 0, Math.PI * 2);
      ctx.fill();

      // Thermal Power Plant Stack
      const plantX = midX + 60;
      const plantY = 160;
      const plantW = 60;
      const plantH = 180;

      ctx.fillStyle = '#f1f5f9';
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(plantX, plantY + plantH);
      ctx.lineTo(plantX + 10, plantY);
      ctx.lineTo(plantX + plantW - 10, plantY);
      ctx.lineTo(plantX + plantW, plantY + plantH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#475569';
      ctx.font = '600 11px Inter, sans-serif';
      ctx.fillText('Thermal Plant', plantX, plantY - 8);

      // Steam from thermal plant
      if (tick % 3 === 0 && !isScope2Dimmed) {
        particles.push({
          x: plantX + plantW / 2 + (Math.random() - 0.5) * 15,
          y: plantY,
          vx: 0.3 + (Math.random() - 0.5) * 0.6,
          vy: -1.5 - Math.random() * 1.5,
          radius: 3 + Math.random() * 4,
          alpha: 0.65,
          life: 0,
          maxLife: 80,
          type: 'steam',
        });
      }

      // Hydro Dam Reservoir
      const damX = width - 180;
      const damY = 210;
      const damW = 140;
      const damH = 130;

      // Dam Wall
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(damX, damY, 35, damH);

      // Water Reservoir Body
      const waterGrad = ctx.createLinearGradient(damX + 35, damY, damX + damW, damY + damH);
      waterGrad.addColorStop(0, '#38bdf8');
      waterGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(damX + 35, damY + 25, damW - 35, damH - 25);

      ctx.fillStyle = '#0284c7';
      ctx.font = '600 11px Inter, sans-serif';
      ctx.fillText('Hydro Reservoir', damX + 35, damY + 14);

      // Hydro reservoir surface evaporation
      if (tick % 6 === 0 && !isScope2Dimmed) {
        particles.push({
          x: damX + 50 + Math.random() * (damW - 60),
          y: damY + 30,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.6 - Math.random() * 0.8,
          radius: 2 + Math.random() * 2,
          alpha: 0.5,
          life: 0,
          maxLife: 80,
          type: 'water',
        });
      }

      // ========================================================================
      // 3. RENDER ALL PARTICLES
      // ========================================================================
      ctx.globalAlpha = 1.0;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life++;
        p.x += p.vx;
        p.y += p.vy;
        p.radius += 0.07;

        const lifeRatio = p.life / p.maxLife;
        const currentAlpha = Math.max(0, p.alpha * (1 - lifeRatio));

        if (p.type === 'steam') {
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
          grad.addColorStop(0, `rgba(100, 116, 139, ${currentAlpha * 0.4})`);
          grad.addColorStop(0.5, `rgba(148, 163, 184, ${currentAlpha * 0.2})`);
          grad.addColorStop(1, 'rgba(148, 163, 184, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'water') {
          ctx.fillStyle = `rgba(2, 132, 199, ${currentAlpha * 0.7})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }

        if (p.life >= p.maxLife) {
          particles.splice(i, 1);
        }
      }

      if (isPlaying) {
        animFrameIdRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [isPlaying, simTemp, activeScope]);

  return (
    <div className="explainer-container" id="explainer-module">
      {/* Section Header */}
      <div style={{ marginBottom: '0.5rem' }}>
        <h2 className="font-display" style={{ fontSize: '1.35rem', color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>
          Physical Thermodynamics of AI Inference
        </h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '820px', lineHeight: 1.5 }}>
          Understand how electrical energy converts into heat across GPU silicon dies, why cooling towers evaporate municipal drinking water, and how power grids draw cooling water at off-site generation plants.
        </p>
      </div>

      {/* Segmented Sub-Navigation Pills */}
      <div className="sub-nav-segmented" style={{ display: 'flex', gap: '4px', background: 'var(--bg-subtle)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', width: 'fit-content' }}>
        <button
          className={`sub-nav-pill ${activeSubTab === 'canvas' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('canvas')}
          style={{
            padding: '5px 12px',
            fontSize: '0.78125rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            background: activeSubTab === 'canvas' ? 'var(--text-primary)' : 'transparent',
            color: activeSubTab === 'canvas' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'all 0.15s ease',
          }}
        >
          <Layers size={13} />
          <span>Thermodynamics Simulation</span>
        </button>

        <button
          className={`sub-nav-pill ${activeSubTab === 'token-methodology' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('token-methodology')}
          style={{
            padding: '5px 12px',
            fontSize: '0.78125rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            background: activeSubTab === 'token-methodology' ? 'var(--text-primary)' : 'transparent',
            color: activeSubTab === 'token-methodology' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'all 0.15s ease',
          }}
        >
          <Cpu size={13} />
          <span>Token Calculation & Reliability</span>
        </button>

        <button
          className={`sub-nav-pill ${activeSubTab === 'formulations' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('formulations')}
          style={{
            padding: '5px 12px',
            fontSize: '0.78125rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            background: activeSubTab === 'formulations' ? 'var(--text-primary)' : 'transparent',
            color: activeSubTab === 'formulations' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'all 0.15s ease',
          }}
        >
          <Scale size={13} />
          <span>Mathematical Formulations</span>
        </button>

        <button
          className={`sub-nav-pill ${activeSubTab === 'papers' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('papers')}
          style={{
            padding: '5px 12px',
            fontSize: '0.78125rem',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            cursor: 'pointer',
            background: activeSubTab === 'papers' ? 'var(--text-primary)' : 'transparent',
            color: activeSubTab === 'papers' ? '#ffffff' : 'var(--text-secondary)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'all 0.15s ease',
          }}
        >
          <FileText size={13} />
          <span>Foundational Papers</span>
        </button>
      </div>

      {/* =========================================================================
          SUB-TAB 1: THERMODYNAMICS SIMULATION
          ========================================================================= */}
      {activeSubTab === 'canvas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="canvas-viewport-card">
            <div className="explainer-header-bar">
              <div>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.72rem',
                    color: 'var(--water-cyan-light)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Interactive Thermodynamic Canvas
                </span>
                <h3 className="font-display" style={{ fontSize: '1.25rem', color: '#fff', marginTop: '2px' }}>
                  Why Does AI Drink Water? Scope 1 vs. Scope 2
                </h3>
              </div>

              <div className="explainer-controls">
                <div className="scope-selector-pills">
                  <button
                    className={`scope-pill-btn ${activeScope === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveScope('all')}
                  >
                    All Scopes (100%)
                  </button>
                  <button
                    className={`scope-pill-btn ${activeScope === 'scope1' ? 'active' : ''}`}
                    onClick={() => setActiveScope('scope1')}
                  >
                    Scope 1: On-Site (29%)
                  </button>
                  <button
                    className={`scope-pill-btn ${activeScope === 'scope2' ? 'active' : ''}`}
                    onClick={() => setActiveScope('scope2')}
                  >
                    Scope 2: Off-Site Grid (71%)
                  </button>
                </div>

                <button
                  className="btn btn-ghost"
                  onClick={() => setIsPlaying(!isPlaying)}
                  style={{ padding: '5px 10px', fontSize: '0.75rem' }}
                >
                  {isPlaying ? <Pause size={13} /> : <Play size={13} />}
                  <span>{isPlaying ? 'Pause' : 'Resume'}</span>
                </button>
              </div>
            </div>

            {/* Canvas */}
            <div className="interactive-canvas-wrapper" style={{ height: '420px' }}>
              <canvas ref={canvasRef} className="explainer-canvas" id="thermodynamic-canvas" />
            </div>

            {/* Ambient Temperature Scrubber */}
            <div
              style={{
                marginTop: '0.85rem',
                background: 'rgba(3, 7, 18, 0.6)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1.25rem',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Thermometer size={16} style={{ color: simTemp > 30 ? '#f43f5e' : '#38bdf8' }} />
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                    Ambient Outside Temperature: <span style={{ color: '#38bdf8' }}>{simTemp}°C ({Math.round(simTemp * 1.8 + 32)}°F)</span>
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    Higher ambient temperatures raise wet-bulb limits, forcing towers to evaporate more potable water.
                  </div>
                </div>
              </div>

              <div style={{ flex: 1, minWidth: '180px' }}>
                <input
                  type="range"
                  className="range-slider"
                  min={15}
                  max={45}
                  step={1}
                  value={simTemp}
                  onChange={(e) => setSimTemp(parseInt(e.target.value, 10))}
                />
              </div>
            </div>
          </div>

          {/* Scope 2 vs Scope 1 Banner */}
          <div className="counterintuitive-ribbon">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="ribbon-stat-big" style={{ color: 'var(--water-cyan-light)' }}>71%</div>
              <div className="ribbon-content">
                <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#fff', fontWeight: 700 }}>
                  The Counterintuitive Scope 2 Reality (Xiao et al., Nature Sustainability 2025)
                </h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  While public attention focuses on datacenter cooling towers (Scope 1 = 29%), over <strong>71%</strong> of AI's operational water consumption occurs miles away at thermoelectric power plant steam condensers and hydroelectric reservoir surfaces.
                </p>
              </div>
            </div>
            <div className="ribbon-stat-big" style={{ color: '#94a3b8', opacity: 0.7 }}>29%</div>
          </div>

          {/* 3 Step Scrollytelling Cards */}
          <div className="story-cards-grid">
            <div
              className={`story-card ${storyStage === 0 ? 'active' : ''}`}
              onClick={() => {
                setStoryStage(0);
                setActiveScope('all');
              }}
            >
              <div className="story-card-number">STAGE 01 // SILICON JOULE HEATING</div>
              <div className="story-card-title">1. Silicon Dissipation</div>
              <p className="story-card-desc">
                High-density GPU accelerators like the Nvidia H100 draw up to 700W each. When billions of transistors switch at gigahertz frequencies, electrical resistance transforms power directly into thermal entropy that must be removed immediately to prevent thermal throttling.
              </p>
            </div>

            <div
              className={`story-card ${storyStage === 1 ? 'active' : ''}`}
              onClick={() => {
                setStoryStage(1);
                setActiveScope('scope1');
              }}
            >
              <div className="story-card-number">STAGE 02 // SCOPE 1 ON-SITE</div>
              <div className="story-card-title">2. Evaporative Cooling Towers</div>
              <p className="story-card-desc">
                Liquid cooling loops carry heat away from server cold plates to facility cooling towers. To shed this heat into hot ambient air, potable municipal water is sprayed into draft fans. The latent heat of vaporization absorbs ~2,260 kJ per liter evaporated.
              </p>
            </div>

            <div
              className={`story-card ${storyStage === 2 ? 'active' : ''}`}
              onClick={() => {
                setStoryStage(2);
                setActiveScope('scope2');
              }}
            >
              <div className="story-card-number">STAGE 03 // SCOPE 2 GRID</div>
              <div className="story-card-title">3. Power Plant Fuel Cycle</div>
              <p className="story-card-desc">
                Every kilowatt-hour delivered over high-voltage transmission lines carries an embedded water cost. Coal, natural gas, and nuclear power plants consume enormous water volumes to condense steam, while hydroelectric dams suffer massive sun-driven surface evaporation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 2: TOKEN CALCULATION METHODOLOGY & RELIABILITY
          ========================================================================= */}
      {activeSubTab === 'token-methodology' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Overview Banner */}
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Zap size={18} style={{ color: 'var(--energy-amber)' }} />
              <h3 className="font-display" style={{ fontSize: '1.2rem', color: '#fff' }}>
                How AI Tokens Are Converted to Joules, Water, and Carbon
              </h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
              In generative artificial intelligence, energy consumption does not scale simply as a flat rate per character.
              Modern transformer architectures exhibit a profound <strong>dual-phase thermodynamic asymmetry</strong> between reading input tokens and generating output tokens, accompanied by substantial idle server overhead.
            </p>
          </div>

          {/* Grid of Key Methodological Mechanics */}
          <div className="grid-2" style={{ gap: '1rem' }}>
            {/* 1. Dual-Phase Asymmetry */}
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Cpu size={16} style={{ color: 'var(--energy-amber-light)' }} />
                <h4 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>
                  1. Dual-Phase Asymmetry: Prefill vs. Autoregressive Decoding
                </h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                Stojkovic et al. (ASPLOS 2025) and Li et al. (CACM 2025) proved that LLM energy is divided into two distinct hardware phases:
              </p>
              <ul style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>
                  <strong style={{ color: 'var(--energy-amber)' }}>Prompt Prefill Phase (W_in, 30% baseline):</strong> Highly compute-bound. All input prompt tokens are processed concurrently via parallel matrix multiplications on GPU Tensor Cores with high arithmetic intensity (&gt;100 FLOPs/byte).
                </li>
                <li>
                  <strong style={{ color: 'var(--water-cyan)' }}>Autoregressive Decoding Phase (W_out, 70% baseline):</strong> Strictly memory-bandwidth bound. To output a single token, the GPU must stream all hundreds of gigabytes of model weights from High-Bandwidth Memory (HBM3) to chip registers. This results in an arithmetic intensity of ~1 FLOP/byte, drawing near-peak TDP while doing fractionally less compute.
                </li>
              </ul>
              <div style={{ marginTop: '10px', padding: '8px 10px', background: 'rgba(245, 158, 11, 0.08)', borderRadius: '6px', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '0.72rem', color: 'var(--energy-amber-light)' }}>
                <strong>Key Takeaway:</strong> Generating one output token requires approximately <strong>7× more electrical energy</strong> than ingesting one input token.
              </div>
            </div>

            {/* 2. Idle Server Power Overhead */}
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Database size={16} style={{ color: 'var(--water-cyan-light)' }} />
                <h4 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>
                  2. Idle Server Floor & Power Allocation
                </h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                Datacenter servers cannot be spun down to zero watts between prompt arrivals without inducing unacceptably high latency:
              </p>
              <ul style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>
                  <strong>Static Power Floor:</strong> Xiao et al. (Nature Sustainability 2025) measured that enterprise GPU servers consume approximately <strong>23% of peak power (P_idle = 0.23)</strong> simply idling in high-availability memory standby.
                </li>
                <li>
                  <strong>Effective Utilization Multiplier:</strong> At an industry-average real-world server utilization rate of 25% (u = 0.25), the total facility power allocated per query is:
                  <br />
                  <code style={{ color: '#cbd5e1' }}>P_server = (P_max - P_idle)·u + P_idle = 0.3925·P_max</code>.
                </li>
                <li>
                  Comparing this to pure active compute (0.1625·P_max) yields an empirical <strong>2.415× idle multiplier</strong> when accounting for idle hardware capacity.
                </li>
              </ul>
            </div>

            {/* 3. Word to Token Tokenization Mechanics */}
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Scale size={16} style={{ color: 'var(--eco-emerald-light)' }} />
                <h4 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>
                  3. Tokenizer Heuristics & BPE Mapping
                </h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                Modern LLMs (GPT-4, Llama 3, Claude) process text via Byte-Pair Encoding (BPE) subword tokenizers:
              </p>
              <ul style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '8px', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <li>
                  <strong>Standard Ratio:</strong> In English natural language, 1 word averages <strong>1.33 tokens</strong> (or approximately 0.75 words per token).
                </li>
                <li>
                  <strong>Benchmark Standardization:</strong> Following Li et al. (2025) and Stojkovic et al. (2025), Aetheria normalizes user prompt length against an empirical baseline query of 800 input words (~1,064 tokens) and 225 output words (~300 tokens).
                </li>
              </ul>
            </div>

            {/* 4. Reliability & Scientific Limitations */}
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertTriangle size={16} style={{ color: 'var(--carbon-coral-light)' }} />
                <h4 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>
                  4. Scientific Reliability & Margin of Error
                </h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.55 }}>
                How reliable is this calculation mechanism in the real world?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px', fontSize: '0.78rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <CheckCircle2 size={13} style={{ color: 'var(--eco-emerald-light)', flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>High Accuracy for Macro Footprints:</strong> For typical conversational queries (50 to 1,500 words) on standard datacenter GPU nodes (A100/H100), empirical models demonstrate <strong>±10% to ±15% accuracy</strong> calibrated against direct RAPL and NVML hardware power meter traces.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <Info size={13} style={{ color: 'var(--energy-amber-light)', flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Multilingual Token Skew:</strong> Non-English languages (e.g. Hindi, Arabic, CJK) fragment into 2×–3.5× more subword tokens per word, proportionately increasing energy per word.</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <Info size={13} style={{ color: 'var(--water-cyan-light)', flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>Architecture & Batching:</strong> Mixture-of-Experts (MoE) models (e.g. Mixtral) and continuous request batching reduce active FLOPs and amortize memory reads across multiple concurrent users, shifting per-query decoding energy lower under heavy server loads.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 3: MATHEMATICAL FORMULATIONS (Merged from Methodology)
          ========================================================================= */}
      {activeSubTab === 'formulations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 className="font-display" style={{ fontSize: '1.25rem', color: '#fff' }}>
              Verified Peer-Reviewed Mathematical Formulations
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Every calculation in Aetheria executes directly from the mathematical models defined in Li et al. (2025), Xiao et al. (2025), Stojkovic et al. (2025), and Radovanović et al. (Google CICS).
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Formula 1 */}
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--energy-amber-light)', fontWeight: 600, marginBottom: '6px' }}>
                1. Dual-Phase Token-to-Energy Scaling (Stojkovic et al. / Li et al., 2025)
              </div>
              <MathFormula
                formula={`e_t = E_{\\text{base}} \\cdot \\left( 0.30 \\cdot \\frac{W_{\\text{in}}}{800} + 0.70 \\cdot \\frac{W_{\\text{out}}}{225} \\right)`}
              />
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
                Where <code style={{ color: 'var(--energy-amber)' }}>W_in</code> is the count of user prompt input words (normalized to 800 words), <code style={{ color: 'var(--water-cyan)' }}>W_out</code> is the generated token count (normalized to 225 words), and <code style={{ color: '#cbd5e1' }}>E_base</code> is the empirical server energy baseline in kWh for the selected model.
              </p>
            </div>

            {/* Formula 2 */}
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--water-cyan-light)', fontWeight: 600, marginBottom: '6px' }}>
                2. Operational Water Footprint (Li et al., 2025 Section 3.1)
              </div>
              <MathFormula
                formula={`\\text{Water}_{\\text{Operational}}(t) = \\underbrace{e_t \\cdot \\rho_{s1,t}}_{\\text{Scope 1 (On-Site Cooling)}} + \\underbrace{e_t \\cdot \\theta_t \\cdot \\rho_{s2,t}}_{\\text{Scope 2 (Off-Site Grid Generation)}}`}
              />
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
                Where <code style={{ color: 'var(--water-cyan)' }}>ρ_s1,t</code> is the on-site WUE (L/kWh) dynamically modulated by local ambient dry-bulb temperature and humidity, <code style={{ color: '#cbd5e1' }}>θ_t</code> is the facility PUE, and <code style={{ color: '#38bdf8' }}>ρ_s2,t</code> is the regional grid EWIF (L/kWh).
              </p>
            </div>

            {/* Formula 3 */}
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--carbon-coral-light)', fontWeight: 600, marginBottom: '6px' }}>
                3. Operational Carbon Footprint (Xiao et al. 2025 / Radovanović et al. 2023)
              </div>
              <MathFormula
                formula={`\\text{Carbon}_{\\text{Operational}}(t) = e_t \\cdot \\theta_t \\cdot \\eta^{(c)}(t)`}
              />
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
                Where <code style={{ color: 'var(--carbon-coral)' }}>η^(c)(t)</code> is the hourly marginal regional grid carbon intensity in kgCO₂e/kWh, tracking real-time generation fuel mixes (coal, gas, solar, wind, nuclear, hydro).
              </p>
            </div>

            {/* Formula 4 */}
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--eco-emerald-light)', fontWeight: 600, marginBottom: '6px' }}>
                4. Google CICS Multi-Objective Load Shifting (Radovanović et al. 2023)
              </div>
              <MathFormula
                formula={`\\min_{h \\in \\{0..23\\}} \\left[ w_{\\text{carbon}} \\cdot \\frac{\\text{Carbon}(h)}{\\text{Carbon}_{\\text{avg}}} + w_{\\text{water}} \\cdot \\frac{\\text{Water}(h)}{\\text{Water}_{\\text{avg}}} \\right]`}
              />
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.5 }}>
                Resolves the fundamental diurnal conflict: noon solar provides near-zero carbon but high ambient heat drives evaporative water loss, while midnight air is cold but the grid relies on fossil baseload power.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 4: FOUNDATIONAL PAPERS (Merged from Methodology)
          ========================================================================= */}
      {activeSubTab === 'papers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="glass-panel" style={{ padding: '1.25rem' }}>
            <h3 className="font-display" style={{ fontSize: '1.25rem', color: '#fff' }}>
              Peer-Reviewed Scientific Literature
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              The empirical coefficients, cooling tower evaporation curves, and power allocations implemented in Aetheria originate from four landmark publications:
            </p>
          </div>

          <div className="grid-2" style={{ gap: '1rem' }}>
            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FileText size={16} style={{ color: 'var(--water-cyan-light)' }} />
                <h4 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>Li et al. (CACM 2025)</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <em>"Making AI Less Thirsty: Uncovering and Addressing the Secret Water Footprint of AI Models"</em>
                <br />
                Communications of the ACM. Introduced empirical on-site cooling water measurements across 18 Microsoft datacenter regions, identifying Scope-1 cooling tower evaporation and the Hydropower Paradox.
              </p>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FileText size={16} style={{ color: 'var(--energy-amber-light)' }} />
                <h4 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>Xiao et al. (Nature Sustainability 2025)</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <em>"Environmental Footprints of AI: Energy, Water, and Carbon"</em>
                <br />
                Nature Sustainability. Quantified the counterintuitive 71% Scope 2 / 29% Scope 1 water division, idle server power penalties, and validated engineering mitigation curves.
              </p>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FileText size={16} style={{ color: 'var(--carbon-coral-light)' }} />
                <h4 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>Stojkovic et al. (ASPLOS 2025)</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <em>"Characterizing LLM Inference Energy Overhead Under Real-World Latency SLOs"</em>
                <br />
                ACM ASPLOS. Established empirical energy scaling separating parallelized prompt prefill (30% weight) from memory-bandwidth-bound autoregressive decoding (70% weight).
              </p>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1.25rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FileText size={16} style={{ color: 'var(--eco-emerald-light)' }} />
                <h4 style={{ fontSize: '0.95rem', color: '#fff', fontWeight: 700 }}>Radovanović et al. (Google CICS 2023)</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                <em>"Carbon-Intelligent Computing System (CICS) at Google Scale"</em>
                <br />
                IEEE Micro / Google Research. Detailed Google's Virtual Capacity Curve (VCC) and 24-hour load-shifting optimization against diurnal solar and grid availability.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleB3B1BExplainer;
