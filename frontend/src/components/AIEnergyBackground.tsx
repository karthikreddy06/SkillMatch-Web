import React, { useEffect, useRef } from 'react';

interface Particle {
  angle: number;
  radius: number;
  baseRadius: number;
  radialSpeed: number;
  angularSpeed: number;
  size: number;
  alpha: number;
  baseAlpha: number;
  color: string;
  pulsePhase: number;
  isHighlight: boolean;
}

interface SoftBokeh {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

const PALETTE = [
  '#22D3EE', // Electric Cyan
  '#38BDF8', // Electric Blue
  '#4F46E5', // Deep Indigo
  '#6366F1', // Primary Purple/Blue
  '#8B5CF6', // Accent Violet
  '#A855F7', // Bright Purple
  '#EC4899', // Pink/Magenta
  '#F472B6', // Soft Pink
];

export const AIEnergyBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    let dpr = 1;

    // Accessibility check
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Particle & Bokeh Collections
    let particles: Particle[] = [];
    let bokehs: SoftBokeh[] = [];

    const initDimensions = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.parentElement?.getBoundingClientRect() || {
        width: window.innerWidth,
        height: window.innerHeight,
      };
      width = rect.width;
      height = rect.height;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.scale(dpr, dpr);
    };

    const createParticles = () => {
      particles = [];
      const isMobile = width < 768;
      const count = isMobile ? 650 : 1800;

      const maxDist = Math.max(width, height) * 0.65;

      for (let i = 0; i < count; i++) {
        // Orbital radius distribution biased toward center with soft tail
        const rNorm = Math.pow(Math.random(), 1.8);
        const radius = 25 + rNorm * maxDist;
        const color = Math.random() < 0.15 ? '#FFFFFF' : PALETTE[Math.floor(Math.random() * PALETTE.length)];
        const isHighlight = color === '#FFFFFF' || Math.random() < 0.1;

        particles.push({
          angle: Math.random() * Math.PI * 2,
          radius,
          baseRadius: radius,
          radialSpeed: (Math.random() - 0.5) * 0.15,
          angularSpeed: (0.0008 + (1 - rNorm) * 0.0025) * (Math.random() < 0.5 ? 1 : 1.1),
          size: isHighlight ? Math.random() * 1.8 + 1.2 : Math.random() * 1.4 + 0.6,
          alpha: Math.random() * 0.6 + 0.25,
          baseAlpha: Math.random() * 0.5 + 0.3,
          color,
          pulsePhase: Math.random() * Math.PI * 2,
          isHighlight,
        });
      }

      // Floating soft ambient bokeh spheres
      bokehs = [];
      const bokehCount = isMobile ? 8 : 18;
      for (let i = 0; i < bokehCount; i++) {
        bokehs.push({
          x: Math.random() * width,
          y: Math.random() * height * 0.8,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          radius: Math.random() * 80 + 40,
          color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
          alpha: Math.random() * 0.08 + 0.03,
        });
      }
    };

    initDimensions();
    createParticles();

    let time = 0;

    const renderFrame = () => {
      time += 0.012;

      // Center of swirl — located in hero upper region
      const centerX = width * 0.5;
      const centerY = Math.min(height * 0.38, 420);

      // Deep Navy background fill with subtle motion trail
      ctx.fillStyle = '#0B1020';
      ctx.fillRect(0, 0, width, height);

      // Central AI Core Bloom — Layered Radial Gradients
      const breathScale = 1 + 0.12 * Math.sin(time * 0.8);
      const coreRadius = Math.min(width * 0.4, 480) * breathScale;

      const coreGradient = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        coreRadius
      );
      coreGradient.addColorStop(0, 'rgba(168, 85, 247, 0.22)');
      coreGradient.addColorStop(0.25, 'rgba(99, 102, 241, 0.16)');
      coreGradient.addColorStop(0.55, 'rgba(34, 211, 238, 0.09)');
      coreGradient.addColorStop(1, 'rgba(11, 16, 32, 0)');

      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, coreRadius, 0, Math.PI * 2);
      ctx.fill();

      // Outer Ambient Gradient Glow
      const ambientGradient = ctx.createRadialGradient(
        centerX,
        centerY * 1.5,
        100,
        centerX,
        centerY * 1.5,
        width * 0.7
      );
      ambientGradient.addColorStop(0, 'rgba(236, 72, 153, 0.06)');
      ambientGradient.addColorStop(0.6, 'rgba(79, 70, 229, 0.04)');
      ambientGradient.addColorStop(1, 'transparent');

      ctx.fillStyle = ambientGradient;
      ctx.fillRect(0, 0, width, height);

      // Render Floating Soft Bokeh Spheres
      for (let i = 0; i < bokehs.length; i++) {
        const b = bokehs[i];
        if (!prefersReducedMotion) {
          b.x += b.vx;
          b.y += b.vy;

          if (b.x < -b.radius) b.x = width + b.radius;
          if (b.x > width + b.radius) b.x = -b.radius;
          if (b.y < -b.radius) b.y = height + b.radius;
          if (b.y > height + b.radius) b.y = -b.radius;
        }

        const bGrad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius);
        bGrad.addColorStop(0, b.color);
        bGrad.addColorStop(1, 'transparent');

        ctx.globalAlpha = b.alpha;
        ctx.fillStyle = bGrad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1.0;

      // Particle Swirl Simulation & Rendering
      const positions: { x: number; y: number; color: string; alpha: number }[] = [];

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        if (!prefersReducedMotion) {
          p.angle += p.angularSpeed;
          p.pulsePhase += 0.02;

          // Organic breathing radial distance offset
          const radialWave = Math.sin(time * 0.9 + p.pulsePhase) * 18 * breathScale;
          p.radius = p.baseRadius + radialWave;
        }

        // Elliptical orbital path for cinematic depth perspective
        const x = centerX + Math.cos(p.angle) * p.radius;
        const y = centerY + Math.sin(p.angle) * p.radius * 0.58;

        // Save position for neural filament rendering
        if (p.baseRadius < width * 0.38) {
          positions.push({ x, y, color: p.color, alpha: p.alpha });
        }

        // Particle rendering with subtle bloom glow
        const currentAlpha = p.baseAlpha * (0.7 + 0.3 * Math.sin(p.pulsePhase));

        ctx.fillStyle = p.color;
        ctx.globalAlpha = Math.min(Math.max(currentAlpha, 0.1), 0.95);

        ctx.beginPath();
        ctx.arc(x, y, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Extra outer glow for highlight particles
        if (p.isHighlight) {
          ctx.shadowColor = p.color;
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(x, y, p.size * 1.3, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      ctx.globalAlpha = 1.0;

      // Neural Filament Energy Mesh Connections
      ctx.lineWidth = 0.6;
      const maxConnectDist = width < 768 ? 48 : 65;

      for (let i = 0; i < positions.length; i += 3) {
        const p1 = positions[i];
        for (let j = i + 1; j < positions.length; j += 4) {
          const p2 = positions[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < maxConnectDist * maxConnectDist) {
            const lineAlpha = (1 - Math.sqrt(distSq) / maxConnectDist) * 0.18;
            ctx.strokeStyle = p1.color;
            ctx.globalAlpha = lineAlpha;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1.0;

      // Vignette Overlay to ensure seamless blending at edges and maximum text contrast in center
      const vignette = ctx.createRadialGradient(
        centerX,
        centerY,
        width * 0.25,
        centerX,
        centerY,
        Math.max(width, height) * 0.75
      );
      vignette.addColorStop(0, 'rgba(11, 16, 32, 0)');
      vignette.addColorStop(0.7, 'rgba(11, 16, 32, 0.45)');
      vignette.addColorStop(1, 'rgba(11, 16, 32, 0.85)');

      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);

      if (!prefersReducedMotion) {
        animationFrameId = requestAnimationFrame(renderFrame);
      }
    };

    renderFrame();

    const handleResize = () => {
      initDimensions();
      createParticles();
      if (prefersReducedMotion) renderFrame();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        backgroundColor: '#0B1020',
      }}
    >
      <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
    </div>
  );
};
