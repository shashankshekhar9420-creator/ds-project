import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Thermometer,
  Play,
  Pause,
  Cpu,
  Database,
  Scale,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Zap,
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
  type: 'steam' | 'water' | 'electron';
}

export const ModuleB3B1BExplainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Simulation Controls State
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [simTemp, setSimTemp] = useState<number>(28); // Celsius ambient temperature
  const [activeScope, setActiveScope] = useState<'all' | 'scope1' | 'scope2'>('all');
  const [storyStage, setStoryStage] = useState<number>(0);
  const [activeSubTab, setActiveSubTab] = useState<'canvas' | 'token-methodology' | 'formulations' | 'papers'>('canvas');

  // Particles array persisted across animation renders
  const particlesRef = useRef<Particle[]>([]);

  // Canvas Animation Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 900);
    let height = (canvas.height = 420);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = 420;
    };
    window.addEventListener('resize', handleResize);

    const particles = particlesRef.current;
    particles.length = 0;

    let tick = 0;

    const render = () => {
      tick++;

      // Clear Canvas with clean light surface
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);

      // Subtle Grid Lines
      ctx.strokeStyle = '#F1F5F9';
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
      ctx.strokeStyle = '#E5E7EB';
      ctx.beginPath();
      ctx.moveTo(midX, 36);
      ctx.lineTo(midX, height - 24);
      ctx.stroke();
      ctx.restore();

      // Section Headings on Canvas
      ctx.font = '600 12px Inter, sans-serif';

      // Scope 1 Label
      ctx.fillStyle = activeScope === 'scope2' ? '#9CA3AF' : '#111827';
      ctx.fillText('SCOPE 1: ON-SITE EVAPORATIVE COOLING (29%)', 28, 28);

      // Scope 2 Label
      ctx.fillStyle = activeScope === 'scope1' ? '#9CA3AF' : '#111827';
      ctx.fillText('SCOPE 2: OFF-SITE POWER GENERATION (71%)', midX + 28, 28);

      // ========================================================================
      // 1. LEFT SIDE: DATA CENTER (Server Racks -> Coolant Loop -> Cooling Tower)
      // ========================================================================
      const isScope1Dimmed = activeScope === 'scope2';
      ctx.globalAlpha = isScope1Dimmed ? 0.3 : 1.0;

      // Server Rack Box
      const rackX = 36;
      const rackY = 150;
      const rackW = 110;
      const rackH = 190;

      ctx.fillStyle = '#F8F9FA';
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(rackX, rackY, rackW, rackH, 8);
      ctx.fill();
      ctx.stroke();

      // Server blades
      for (let b = 0; b < 6; b++) {
        const bladeY = rackY + 14 + b * 28;
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = '#E5E7EB';
        ctx.lineWidth = 1;
        ctx.strokeRect(rackX + 8, bladeY, rackW - 16, 20);
        ctx.fillRect(rackX + 8, bladeY, rackW - 16, 20);

        const isGpuActive = Math.sin(tick * 0.05 + b) > -0.2;
        ctx.fillStyle = isGpuActive ? '#2563EB' : '#CBD5E1';
        ctx.beginPath();
        ctx.arc(rackX + 18, bladeY + 10, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // GPU Silicon Die
        ctx.fillStyle = '#E5E7EB';
        ctx.fillRect(rackX + 32, bladeY + 5, 22, 10);
        ctx.fillRect(rackX + 60, bladeY + 5, 22, 10);
      }

      ctx.font = '600 11px Inter, sans-serif';
      ctx.fillStyle = '#111827';
      ctx.fillText('GPU Clusters (H100)', rackX + 6, rackY - 8);

      // Cooling Loop Pipes
      const towerX = midX - 100;
      const towerY = 140;
      const towerW = 80;
      const towerH = 200;

      // Hot Coolant
      ctx.strokeStyle = '#6B7280';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(rackX + rackW, rackY + 45);
      ctx.bezierCurveTo(rackX + rackW + 30, rackY + 45, towerX - 30, towerY + 80, towerX, towerY + 80);
      ctx.stroke();

      // Chilled Coolant
      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(towerX, towerY + 160);
      ctx.bezierCurveTo(towerX - 30, towerY + 160, rackX + rackW + 30, rackY + 140, rackX + rackW, rackY + 140);
      ctx.stroke();

      // Labels
      ctx.font = '500 10px JetBrains Mono, monospace';
      ctx.fillStyle = '#111827';
      ctx.fillText('Heat Flux →', rackX + rackW + 8, rackY + 36);
      ctx.fillStyle = '#2563EB';
      ctx.fillText('← Chilled Loop', rackX + rackW + 8, rackY + 132);

      // Cooling Tower Graphic
      ctx.fillStyle = '#F8F9FA';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(towerX, towerY + towerH);
      ctx.bezierCurveTo(towerX + 18, towerY + 110, towerX + 10, towerY + 35, towerX + 14, towerY);
      ctx.lineTo(towerX + towerW - 14, towerY);
      ctx.bezierCurveTo(towerX + towerW - 10, towerY + 35, towerX + towerW - 18, towerY + 110, towerX + towerW, towerY + towerH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#111827';
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
          alpha: 0.6,
          life: 0,
          maxLife: 70 + Math.random() * 40,
          type: 'steam',
        });
      }

      // ========================================================================
      // 2. RIGHT SIDE: OFF-SITE POWER GENERATION (Scope 2: 71%)
      // ========================================================================
      const isScope2Dimmed = activeScope === 'scope1';
      ctx.globalAlpha = isScope2Dimmed ? 0.3 : 1.0;

      // Power Lines connecting right to left
      ctx.strokeStyle = '#CBD5E1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(midX + 20, rackY + 95);
      ctx.lineTo(rackX + rackW, rackY + 95);
      ctx.stroke();

      // Electron dots moving leftward
      const electronOffset = (tick * 2) % (rackX + rackW - (midX + 20));
      ctx.fillStyle = '#2563EB';
      ctx.beginPath();
      ctx.arc(midX + 20 + electronOffset, rackY + 95, 3, 0, Math.PI * 2);
      ctx.fill();

      // Thermal Power Plant Stack
      const plantX = midX + 60;
      const plantY = 160;
      const plantW = 60;
      const plantH = 180;

      ctx.fillStyle = '#F8F9FA';
      ctx.strokeStyle = '#111827';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(plantX, plantY + plantH);
      ctx.lineTo(plantX + 10, plantY);
      ctx.lineTo(plantX + plantW - 10, plantY);
      ctx.lineTo(plantX + plantW, plantY + plantH);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#111827';
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
          alpha: 0.6,
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
      ctx.fillStyle = '#E5E7EB';
      ctx.fillRect(damX, damY, 35, damH);

      // Water Reservoir Body
      ctx.fillStyle = '#EFF6FF';
      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = 1.5;
      ctx.fillRect(damX + 35, damY + 25, damW - 35, damH - 25);
      ctx.strokeRect(damX + 35, damY + 25, damW - 35, damH - 25);

      ctx.fillStyle = '#111827';
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
        p.radius += 0.05;

        const lifeRatio = p.life / p.maxLife;
        const currentAlpha = Math.max(0, p.alpha * (1 - lifeRatio));

        if (p.type === 'steam') {
          ctx.fillStyle = `rgba(156, 163, 175, ${currentAlpha * 0.5})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.type === 'water') {
          ctx.fillStyle = `rgba(37, 99, 235, ${currentAlpha * 0.6})`;
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
      <div style={{ marginBottom: '8px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
          How AI Uses Electricity and Water
        </h2>
        <p style={{ fontSize: '1rem', color: 'var(--text-muted)', maxWidth: '65ch', lineHeight: 1.6 }}>
          Every time an AI answers a question, electricity turns into heat inside high-powered computing chips. To keep those chips from overheating, datacenters evaporate clean water in cooling towers. At the same time, the power plants generating that electricity consume even more water off-site. Here is how both systems work together.
        </p>
      </div>

      {/* Segmented Sub-Navigation Pills */}
      <div className="sub-nav-segmented" style={{ display: 'flex', gap: '6px', background: 'var(--surface)', padding: '4px', borderRadius: 'var(--radius)', border: '1px solid var(--border)', width: 'fit-content', flexWrap: 'wrap' }}>
        <button
          className={`sub-nav-pill ${activeSubTab === 'canvas' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('canvas')}
          style={{
            padding: '6px 14px',
            fontSize: '0.8125rem',
            borderRadius: 'var(--radius)',
            border: 'none',
            cursor: 'pointer',
            background: activeSubTab === 'canvas' ? 'var(--accent)' : 'transparent',
            color: activeSubTab === 'canvas' ? '#FFFFFF' : 'var(--text-muted)',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 150ms ease',
          }}
        >
          <Layers size={14} />
          <span>Interactive Cooling Cycle</span>
        </button>

        <button
          className={`sub-nav-pill ${activeSubTab === 'token-methodology' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('token-methodology')}
          style={{
            padding: '6px 14px',
            fontSize: '0.8125rem',
            borderRadius: 'var(--radius)',
            border: 'none',
            cursor: 'pointer',
            background: activeSubTab === 'token-methodology' ? 'var(--accent)' : 'transparent',
            color: activeSubTab === 'token-methodology' ? '#FFFFFF' : 'var(--text-muted)',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 150ms ease',
          }}
        >
          <Cpu size={14} />
          <span>How Queries Become Energy</span>
        </button>

        <button
          className={`sub-nav-pill ${activeSubTab === 'formulations' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('formulations')}
          style={{
            padding: '6px 14px',
            fontSize: '0.8125rem',
            borderRadius: 'var(--radius)',
            border: 'none',
            cursor: 'pointer',
            background: activeSubTab === 'formulations' ? 'var(--accent)' : 'transparent',
            color: activeSubTab === 'formulations' ? '#FFFFFF' : 'var(--text-muted)',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 150ms ease',
          }}
        >
          <Scale size={14} />
          <span>Formulas & Calculations</span>
        </button>

        <button
          className={`sub-nav-pill ${activeSubTab === 'papers' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('papers')}
          style={{
            padding: '6px 14px',
            fontSize: '0.8125rem',
            borderRadius: 'var(--radius)',
            border: 'none',
            cursor: 'pointer',
            background: activeSubTab === 'papers' ? 'var(--accent)' : 'transparent',
            color: activeSubTab === 'papers' ? '#FFFFFF' : 'var(--text-muted)',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 150ms ease',
          }}
        >
          <FileText size={14} />
          <span>Scientific Research</span>
        </button>
      </div>

      {/* =========================================================================
          SUB-TAB 1: THERMODYNAMICS SIMULATION
          ========================================================================= */}
      {activeSubTab === 'canvas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="canvas-viewport-card">
            <div className="explainer-header-bar">
              <div>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    color: 'var(--accent)',
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    fontWeight: 600,
                  }}
                >
                  Interactive Cooling Cycle
                </span>
                <h3 style={{ fontSize: '1.25rem', color: 'var(--text)', marginTop: '4px', fontWeight: 600 }}>
                  Where Does the Water Go? On-Site vs. Off-Site
                </h3>
              </div>

              <div className="explainer-controls">
                <div className="scope-selector-pills">
                  <button
                    className={`scope-pill-btn ${activeScope === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveScope('all')}
                  >
                    Both Sources Combined
                  </button>
                  <button
                    className={`scope-pill-btn ${activeScope === 'scope1' ? 'active' : ''}`}
                    onClick={() => setActiveScope('scope1')}
                  >
                    Scope 1: On-Site Cooling (29%)
                  </button>
                  <button
                    className={`scope-pill-btn ${activeScope === 'scope2' ? 'active' : ''}`}
                    onClick={() => setActiveScope('scope2')}
                  >
                    Scope 2: Off-Site Power Plants (71%)
                  </button>
                </div>

                <button
                  className="btn-secondary btn-sm"
                  onClick={() => setIsPlaying(!isPlaying)}
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
                marginTop: '16px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius)',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '20px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Thermometer size={18} style={{ color: 'var(--text)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text)' }}>
                    Ambient Outside Temperature: <span style={{ color: 'var(--accent)' }}>{simTemp}°C ({Math.round(simTemp * 1.8 + 32)}°F)</span>
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    When it is hot outside, datacenters cannot rely on outdoor air alone. They must evaporate significantly more clean water to cool the building.
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div className="ribbon-stat-big">71%</div>
              <div className="ribbon-content">
                <h4 style={{ margin: 0, fontSize: '1rem', color: 'var(--text)', fontWeight: 600 }}>
                  The Surprising Reality of AI Water Use (Xiao et al., Nature Sustainability 2025)
                </h4>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  Most people picture the cooling towers sitting right on datacenter rooftops (Scope 1 = 29%). But over <strong>71%</strong> of AI's water footprint actually vanishes miles away at the power plants generating its electricity. Steam plants evaporate cooling water, and large hydroelectric dams lose millions of liters every sunny day to natural surface evaporation.
                </p>
              </div>
            </div>
            <div className="ribbon-stat-big" style={{ color: 'var(--text-muted)' }}>29%</div>
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
              <div className="story-card-number">STAGE 01 // COMPUTING CHIPS</div>
              <div className="story-card-title">1. Heat on the Chips</div>
              <p className="story-card-desc">
                High-performance AI chips (like the Nvidia H100) consume up to 700 watts each—roughly the same heat as a kitchen toaster packed into a chip the size of a postage stamp. Millions of calculations happening billions of times per second turn electricity directly into heat that must be moved away immediately.
              </p>
            </div>

            <div
              className={`story-card ${storyStage === 1 ? 'active' : ''}`}
              onClick={() => {
                setStoryStage(1);
                setActiveScope('scope1');
              }}
            >
              <div className="story-card-number">STAGE 02 // ON-SITE COOLING</div>
              <div className="story-card-title">2. Datacenter Cooling Towers</div>
              <p className="story-card-desc">
                Liquid coolant flows across metal plates resting on the chips, carrying their heat to rooftop cooling towers. There, clean tap water is sprayed into huge fans. As that water evaporates into steam, it carries the heat away into the air (absorbing about 2,260 kilojoules of heat for every liter evaporated).
              </p>
            </div>

            <div
              className={`story-card ${storyStage === 2 ? 'active' : ''}`}
              onClick={() => {
                setStoryStage(2);
                setActiveScope('scope2');
              }}
            >
              <div className="story-card-number">STAGE 03 // OFF-SITE POWER PLANTS</div>
              <div className="story-card-title">3. Power Plants & Reservoirs</div>
              <p className="story-card-desc">
                The electricity feeding the datacenter carries its own hidden water cost. Coal, natural gas, and nuclear power plants must condense high-pressure steam back into water to keep turbines spinning. Meanwhile, hydroelectric dams create huge artificial lakes that lose millions of liters of water to sunlight and wind every day.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 2: TOKEN CALCULATION METHODOLOGY & RELIABILITY
          ========================================================================= */}
      {activeSubTab === 'token-methodology' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Overview Banner */}
          <div className="clean-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <Zap size={20} style={{ color: 'var(--accent)' }} />
              <h3 style={{ fontSize: '1.25rem', color: 'var(--text)', fontWeight: 600 }}>
                How a Question Turns into Electricity, Water, and Carbon
              </h3>
            </div>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text)', lineHeight: 1.6 }}>
              AI models do not consume electricity like a simple lightbulb where every letter typed costs the same amount.
              Instead, there is a fundamental difference between <strong>reading your question</strong> and <strong>writing out the answer</strong>, plus the fact that servers draw continuous electricity even while waiting between requests.
            </p>
          </div>

          {/* Grid of Key Methodological Mechanics */}
          <div className="grid-2">
            {/* 1. Dual-Phase Asymmetry */}
            <div className="panel-surface">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Cpu size={18} style={{ color: 'var(--accent)' }} />
                <h4 style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600 }}>
                  1. Why Writing Answers Takes More Energy Than Reading Questions
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6 }}>
                Stojkovic et al. (ASPLOS 2025) and Li et al. (CACM 2025) discovered that running an AI model involves two completely different types of computing work:
              </p>
              <ul style={{ fontSize: '0.875rem', color: 'var(--text)', marginTop: '10px', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  <strong>Reading Phase (Input Prompt, ~30% base energy):</strong> The computer ingests your entire question all at once in parallel. Thousands of processor cores work simultaneously, making this stage fast and highly efficient.
                </li>
                <li>
                  <strong>Writing Phase (Generating Answers, ~70% base energy):</strong> The computer must create its response one word piece (token) at a time. For every single piece it writes, the processor has to stop, reload hundreds of billions of numbers from high-speed memory chips, and then calculate the next piece. This memory bottleneck burns near-maximum electricity for every word.
                </li>
              </ul>
              <div style={{ marginTop: '12px', padding: '10px 12px', background: 'var(--bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)', fontSize: '0.8125rem', color: 'var(--text)' }}>
                <strong>Key Takeaway:</strong> Writing one word of an answer uses roughly <strong>2 to 3 times more electricity</strong> than reading one word of a prompt.
              </div>
            </div>

            {/* 2. Idle Server Power Overhead */}
            <div className="panel-surface">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Database size={18} style={{ color: 'var(--accent)' }} />
                <h4 style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600 }}>
                  2. The Cost of Servers Waiting Between Questions (Idle Overhead)
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6 }}>
                AI servers cannot simply be turned on and off for every question, because loading an AI model into high-speed memory takes several minutes:
              </p>
              <ul style={{ fontSize: '0.875rem', color: 'var(--text)', marginTop: '10px', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  <strong>Baseline Power Draw:</strong> Xiao et al. (Nature Sustainability 2025) measured that enterprise AI servers draw about <strong>23% of peak power</strong> simply sitting idle in memory standby, waiting for the next user request.
                </li>
                <li>
                  <strong>Real-World Server Use:</strong> Across commercial datacenters, servers are actively computing only about 25% of the day. The rest of the time is spent waiting on standby.
                </li>
                <li>
                  <strong>Allocating Real Electricity:</strong> When you account for the idle time required to keep servers ready on demand, the total real-world electricity needed per question is roughly <strong>2.4× higher</strong> than measuring active computing alone.
                </li>
              </ul>
            </div>

            {/* 3. Word to Token Tokenization Mechanics */}
            <div className="panel-surface">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Scale size={18} style={{ color: 'var(--accent)' }} />
                <h4 style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600 }}>
                  3. Words vs. Tokens: How Computers Read Text
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6 }}>
                AI models do not read whole words or individual letters. They slice language into small pieces called tokens:
              </p>
              <ul style={{ fontSize: '0.875rem', color: 'var(--text)', marginTop: '10px', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>
                  <strong>The 3/4 Rule:</strong> In standard English text, 1 word is roughly <strong>1.33 tokens</strong> (or about 0.75 words per token). Common words like "the" are one token; longer words like "understanding" may be split into two or three pieces.
                </li>
                <li>
                  <strong>Standard Reference Benchmark:</strong> In peer-reviewed research (Li et al. 2025 and Stojkovic et al. 2025), a standard query is defined as reading 800 words (~1,064 tokens) and writing a 225-word answer (~300 tokens). Our calculator scales energy up or down proportionally from this baseline.
                </li>
              </ul>
            </div>

            {/* 4. Reliability & Scientific Limitations */}
            <div className="panel-surface">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <AlertTriangle size={18} style={{ color: 'var(--accent)' }} />
                <h4 style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600 }}>
                  4. Accuracy, Margins of Error, and Limitations
                </h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6 }}>
                How closely do these estimates match what happens in a real datacenter?
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px', fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                  <CheckCircle2 size={16} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '2px' }} />
                  <span><strong>High Accuracy for Everyday Prompts:</strong> For typical conversational questions (50 to 1,500 words) on standard datacenter GPU nodes (like Nvidia A100/H100), these formulas demonstrate <strong>±10% to ±15% accuracy</strong> when compared directly to physical hardware power meters.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 3: MATHEMATICAL FORMULATIONS
          ========================================================================= */}
      {activeSubTab === 'formulations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="clean-panel">
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text)', fontWeight: 600 }}>
              The Math Behind the Calculations
            </h3>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Every calculation on this website uses the exact peer-reviewed mathematical formulations published by Li et al. (2025), Xiao et al. (2025), Stojkovic et al. (2025), and Google Research. Here is what each equation calculates in plain language:
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Formula 1 */}
            <div className="panel-surface">
              <div style={{ fontSize: '0.875rem', color: 'var(--text)', fontWeight: 600, marginBottom: '8px' }}>
                1. Calculating Server Electricity from Words and Answers (Stojkovic et al. / Li et al., 2025)
              </div>
              <MathFormula
                formula={`e_t = E_{\\text{base}} \\cdot \\left( 0.30 \\cdot \\frac{W_{\\text{in}}}{800} + 0.70 \\cdot \\frac{W_{\\text{out}}}{225} \\right)`}
              />
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '10px', lineHeight: 1.6 }}>
                <strong>In plain language:</strong> Total server electricity (e_t) equals the model's base energy (E_base) multiplied by a weighted sum. Input words (W_in) get a 30% weight relative to an 800-word benchmark, while output words (W_out) get a 70% weight relative to a 225-word benchmark. This mathematically captures why generating answers uses over twice as much electricity per word as reading prompt text.
              </p>
            </div>

            {/* Formula 2 */}
            <div className="panel-surface">
              <div style={{ fontSize: '0.875rem', color: 'var(--text)', fontWeight: 600, marginBottom: '8px' }}>
                2. Calculating Total Water Use: Cooling Towers + Power Plants (Li et al., 2025 Section 3.1)
              </div>
              <MathFormula
                formula={`\\text{Water}_{\\text{Operational}}(t) = \\underbrace{e_t \\cdot \\rho_{s1,t}}_{\\text{Scope 1 (On-Site Cooling)}} + \\underbrace{e_t \\cdot \\theta_t \\cdot \\rho_{s2,t}}_{\\text{Scope 2 (Off-Site Grid Generation)}}`}
              />
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '10px', lineHeight: 1.6 }}>
                <strong>In plain language:</strong> Total water use combines two distinct sources. <em>Scope 1</em> is the electricity used by the servers (e_t) multiplied by how much water the on-site cooling towers evaporate per kilowatt-hour (ρ_s1,t, which rises when outside weather is hot). <em>Scope 2</em> is the total facility energy (server energy multiplied by the facility overhead factor θ_t) multiplied by how much water the regional power grid consumes per kilowatt-hour (ρ_s2,t).
              </p>
            </div>

            {/* Formula 3 */}
            <div className="panel-surface">
              <div style={{ fontSize: '0.875rem', color: 'var(--text)', fontWeight: 600, marginBottom: '8px' }}>
                3. Calculating Carbon Emissions from the Electric Grid (Xiao et al. 2025 / Radovanović et al. 2023)
              </div>
              <MathFormula
                formula={`\\text{Carbon}_{\\text{Operational}}(t) = e_t \\cdot \\theta_t \\cdot \\eta^{(c)}(t)`}
              />
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '10px', lineHeight: 1.6 }}>
                <strong>In plain language:</strong> Operational carbon emissions equal the total electricity delivered to the building (server electricity e_t multiplied by the facility overhead multiplier θ_t) multiplied by the regional electric grid's carbon intensity (η^(c)(t)). A grid powered by coal or gas produces high emissions, while a grid running on solar, wind, or nuclear produces very low emissions.
              </p>
            </div>

            {/* Formula 4 */}
            <div className="panel-surface">
              <div style={{ fontSize: '0.875rem', color: 'var(--text)', fontWeight: 600, marginBottom: '8px' }}>
                4. Balancing Carbon and Water When Moving Computing Work (Google CICS, Radovanović et al. 2023)
              </div>
              <MathFormula
                formula={`\\min_{h \\in \\{0..23\\}} \\left[ w_{\\text{carbon}} \\cdot \\frac{\\text{Carbon}(h)}{\\text{Carbon}_{\\text{avg}}} + w_{\\text{water}} \\cdot \\frac{\\text{Water}(h)}{\\text{Water}_{\\text{avg}}} \\right]`}
              />
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '10px', lineHeight: 1.6 }}>
                <strong>In plain language:</strong> When scheduling flexible computing tasks across the 24 hours of a day (h), this equation finds the optimal hour by weighing carbon against water. At midday, abundant solar energy keeps carbon near zero, but hot afternoon air forces cooling towers to evaporate more water. At midnight, cool air saves water, but the grid may rely on fossil fuel plants. This formula lets operators choose the best balance between the two priorities.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-TAB 4: FOUNDATIONAL PAPERS
          ========================================================================= */}
      {activeSubTab === 'papers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="clean-panel">
            <h3 style={{ fontSize: '1.25rem', color: 'var(--text)', fontWeight: 600 }}>
              Peer-Reviewed Scientific Literature
            </h3>
            <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              The empirical measurements, cooling tower evaporation curves, and power allocations implemented across this project originate from four landmark publications:
            </p>
          </div>

          <div className="grid-2">
            <div className="panel-surface">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FileText size={18} style={{ color: 'var(--accent)' }} />
                <h4 style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600 }}>Li et al. (CACM 2025)</h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6 }}>
                <em>"Making AI Less Thirsty: Uncovering and Addressing the Secret Water Footprint of AI Models"</em>
                <br />
                Communications of the ACM. First major study to measure on-site cooling water across 18 datacenter regions. Documented that datacenters evaporate fresh drinking water in cooling towers and identified the Hydropower Paradox (clean hydro energy can still evaporate massive amounts of water from open reservoirs).
              </p>
            </div>

            <div className="panel-surface">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FileText size={18} style={{ color: 'var(--accent)' }} />
                <h4 style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600 }}>Xiao et al. (Nature Sustainability 2025)</h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6 }}>
                <em>"Environmental Footprints of AI: Energy, Water, and Carbon"</em>
                <br />
                Nature Sustainability. Quantified the counterintuitive reality that 71% of AI's water footprint occurs off-site at power plants rather than on-site. Also measured the 23% idle power floor for enterprise servers and validated key engineering mitigation curves.
              </p>
            </div>

            <div className="panel-surface">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FileText size={18} style={{ color: 'var(--accent)' }} />
                <h4 style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600 }}>Stojkovic et al. (ASPLOS 2025)</h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6 }}>
                <em>"Characterizing LLM Inference Energy Overhead Under Real-World Latency SLOs"</em>
                <br />
                ACM ASPLOS. Established the empirical energy scaling that separates parallelized prompt reading (30% baseline weight) from memory-bandwidth-bound answer generation (70% baseline weight).
              </p>
            </div>

            <div className="panel-surface">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <FileText size={18} style={{ color: 'var(--accent)' }} />
                <h4 style={{ fontSize: '1rem', color: 'var(--text)', fontWeight: 600 }}>Radovanović et al. (Google CICS 2023)</h4>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text)', lineHeight: 1.6 }}>
                <em>"Carbon-Intelligent Computing System (CICS) at Google Scale"</em>
                <br />
                IEEE Micro / Google Research. Detailed Google's Virtual Capacity Curve (VCC) and 24-hour load-shifting framework to synchronize computing work with regional solar and wind availability.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleB3B1BExplainer;
