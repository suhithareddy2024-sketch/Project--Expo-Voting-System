import React, { useEffect, useRef } from 'react';

export default function SplineViewer({ sceneUrl = 'https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode' }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const hideWatermark = () => {
      if (!containerRef.current) return;
      const viewer = containerRef.current.querySelector('spline-viewer');
      if (viewer && viewer.shadowRoot) {
        const logo =
          viewer.shadowRoot.querySelector('#logo') ||
          viewer.shadowRoot.querySelector('a') ||
          viewer.shadowRoot.querySelector('.watermark') ||
          viewer.shadowRoot.querySelector('#watermark');
        if (logo) {
          logo.style.display = 'none';
          logo.style.opacity = '0';
          logo.style.visibility = 'hidden';
          logo.style.pointerEvents = 'none';
        }
      }
    };

    hideWatermark();
    const interval = setInterval(hideWatermark, 600);
    return () => clearInterval(interval);
  }, []);

  // Spotlight mouse effect
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const card = containerRef.current;
    let spotlight = card.querySelector('.spotlight-glow');
    if (spotlight) {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      spotlight.style.left = `${x}px`;
      spotlight.style.top = `${y}px`;
      spotlight.style.opacity = '1';
    }
  };

  const handleMouseLeave = () => {
    if (!containerRef.current) return;
    const spotlight = containerRef.current.querySelector('.spotlight-glow');
    if (spotlight) {
      spotlight.style.opacity = '0';
    }
  };

  return (
    <div
      ref={containerRef}
      className="glass-card p-3 rounded-4 mb-4 spotlight-card overflow-hidden position-relative"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="spotlight-glow"></div>
      <div className="d-flex justify-content-between align-items-center mb-2 px-2">
        <span className="badge bg-primary text-white fw-bold px-3 py-1 rounded-pill">
          <i className="fa-solid fa-cube me-1"></i> Interactive 3D Scene
        </span>
        <span className="text-light-50 small">
          <i className="fa-solid fa-hand-pointer me-1"></i> Drag / cursor to interact
        </span>
      </div>
      <div className="spline-scene-wrapper" style={{ height: '380px' }}>
        <spline-viewer url={sceneUrl} class="w-100 h-100"></spline-viewer>
      </div>
    </div>
  );
}
