import React, { useState, useEffect, useRef } from 'react';

const SCULPTURE_FRAMES = [
  '/assets/sculpture/sculpture_frame_1.webp',
  '/assets/sculpture/sculpture_frame_2.webp',
  '/assets/sculpture/sculpture_frame_3.webp',
  '/assets/sculpture/sculpture_frame_4.webp',
  '/assets/sculpture/sculpture_frame_5.webp',
];

export const SculptureHeroAnimation: React.FC = () => {
  const [activeFrame, setActiveFrame] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-play the 5-frame animation loop
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFrame((prev) => (prev + 1) % SCULPTURE_FRAMES.length);
    }, 2800);

    return () => clearInterval(interval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setMousePos({ x, y });
  };

  // Calculate subtle 3D tilt
  const tiltX = isHovered ? (mousePos.y - 0.5) * -8 : 0;
  const tiltY = isHovered ? (mousePos.x - 0.5) * 10 : 0;

  return (
    <div
      className="sculpture-hero-wrapper"
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      id="sculpture-hero-stage"
    >
      {/* Ambient Spotlight Behind Sculpture */}
      <div className="sculpture-backlight-halo" />

      {/* 3D Tilt Stage */}
      <div
        className="sculpture-tilt-stage"
        style={{
          transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
        }}
      >
        {/* The 5 Stacked Crossfading Image Frames */}
        <div className="sculpture-frames-stack">
          {SCULPTURE_FRAMES.map((src, index) => (
            <img
              key={src}
              src={src}
              alt={`Surreal digital sculpture state ${index + 1}`}
              className={`sculpture-frame-img ${activeFrame === index ? 'frame-active' : ''}`}
              loading="eager"
            />
          ))}
        </div>

        {/* Refractive Glass Louvers / Slats Overlay */}
        <div className="sculpture-glass-louvers">
          <div className="glass-louver slat-1" />
          <div className="glass-louver slat-2" />
          <div className="glass-louver slat-3" />
          <div className="glass-louver slat-4" />
          <div className="glass-louver slat-5" />
        </div>

        {/* Interactive Target Indicator Dot matching reference (•) */}
        <div
          className="sculpture-focus-reticle"
          style={{
            left: `${mousePos.x * 100}%`,
            top: `${mousePos.y * 100}%`,
            opacity: isHovered ? 1 : 0.35,
          }}
        >
          <span className="reticle-circle" />
          <span className="reticle-dot" />
        </div>
      </div>

      {/* Minimal Frame Navigation Dots */}
      <div className="sculpture-frame-indicators">
        {SCULPTURE_FRAMES.map((_, i) => (
          <button
            key={i}
            type="button"
            className={`frame-dot ${activeFrame === i ? 'dot-active' : ''}`}
            onClick={() => setActiveFrame(i)}
            aria-label={`View animation frame ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
};
