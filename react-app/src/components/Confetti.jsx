import React, { useEffect, useState } from 'react';

export default function Confetti({ active, duration = 4000 }) {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    if (!active) {
      setPieces([]);
      return;
    }

    const colors = ['#ff4d4d', '#00E5FF', '#FFD700', '#7CFC00', '#FF69B4', '#FFFFFF'];
    const newPieces = Array.from({ length: 120 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.8,
      duration: 2.5 + Math.random() * 1.5,
      rotation: 720 + Math.random() * 360,
      size: 8 + Math.random() * 6
    }));

    setPieces(newPieces);

    const timer = setTimeout(() => {
      setPieces([]);
    }, duration);

    return () => clearTimeout(timer);
  }, [active, duration]);

  if (pieces.length === 0) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 10000, overflow: 'hidden' }}>
      {pieces.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}vw`,
            top: '-20px',
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            borderRadius: p.id % 2 === 0 ? '50%' : '2px',
            animation: `confettiFall ${p.duration}s linear ${p.delay}s forwards`
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(105vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
