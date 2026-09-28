import React from 'react';

export default function RadarScanner() {
  return (
    <div className="glass-card p-3 rounded-4 mb-4 spotlight-card overflow-hidden">
      <div className="d-flex justify-content-between align-items-center mb-2 px-2">
        <span className="badge bg-warning text-dark fw-bold px-3 py-1 rounded-pill">
          <i className="fa-solid fa-radar me-1"></i> Robotics Radar / Scanning Telemetry
        </span>
        <span className="text-cyan small font-monospace">
          <i className="fa-solid fa-wifi me-1"></i> Live Sensor Feed
        </span>
      </div>
      <div className="radar-scanner-container">
        <div className="radar-screen">
          <div className="radar-ring radar-ring-1"></div>
          <div className="radar-ring radar-ring-2"></div>
          <div className="radar-ring radar-ring-3"></div>
          <div className="radar-crosshair-v"></div>
          <div className="radar-crosshair-h"></div>
          <div className="radar-sweep"></div>
          <div className="radar-blip radar-blip-1"></div>
          <div className="radar-blip radar-blip-2"></div>
          <div className="radar-blip radar-blip-3"></div>
        </div>
        <div className="radar-hud-info">
          <span>SYS: ONLINE</span> | <span>RADAR: SCANNING 360°</span>
        </div>
      </div>
    </div>
  );
}
