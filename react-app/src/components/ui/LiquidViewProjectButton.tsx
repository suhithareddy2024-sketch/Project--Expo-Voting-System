'use client';
import React, { useState } from 'react';
import { Star, ArrowRight } from 'lucide-react';
import { Liquid } from './button-1';

export const LIQUID_COLORS = {
  color1: '#FFFFFF',
  color2: '#1E10C5',
  color3: '#9089E2',
  color4: '#FCFCFE',
  color5: '#F9F9FD',
  color6: '#B2B8E7',
  color7: '#0E2DCB',
  color8: '#0017E9',
  color9: '#4743EF',
  color10: '#7D7BF4',
  color11: '#0B06FC',
  color12: '#C5C1EA',
  color13: '#1403DE',
  color14: '#B6BAF6',
  color15: '#C1BEEB',
  color16: '#290ECB',
  color17: '#3F4CC0',
};

interface LiquidViewProjectButtonProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  text?: string;
  className?: string;
  ariaLabel?: string;
}

export const LiquidViewProjectButton: React.FC<LiquidViewProjectButtonProps> = ({
  onClick,
  text = 'View Project',
  className = '',
  ariaLabel = 'View Project',
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className={`futuristic-view-project-wrapper ${className}`}>
      <button
        type="button"
        onClick={onClick}
        aria-label={ariaLabel}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onFocus={() => setIsHovered(true)}
        onBlur={() => setIsHovered(false)}
        className="futuristic-view-project-btn group"
      >
        {/* Ambient Blur Outer Glow */}
        <div className="btn-glow-ambient" aria-hidden="true">
          <div className="btn-glow-liquid">
            <Liquid isHovered={isHovered} colors={LIQUID_COLORS} />
          </div>
        </div>

        {/* Deep Contrast Underlay */}
        <div className="btn-base-layer" aria-hidden="true"></div>

        {/* Core Liquid Sheen Background */}
        <div className="btn-liquid-sheen" aria-hidden="true">
          <Liquid isHovered={isHovered} colors={LIQUID_COLORS} />
        </div>

        {/* Frosted Glass Highlight Crescent */}
        <div className="btn-glass-highlight" aria-hidden="true"></div>

        {/* Diagonal Specular Shine Sweep on Hover */}
        <div className="btn-shine-sweep" aria-hidden="true"></div>

        {/* Button Content: ★ View Project → */}
        <span className="btn-inner-content">
          <Star className="btn-star-icon" aria-hidden="true" />
          <span className="btn-text-label">{text}</span>
          <ArrowRight className="btn-arrow-icon" aria-hidden="true" />
        </span>
      </button>
    </div>
  );
};

export default LiquidViewProjectButton;
