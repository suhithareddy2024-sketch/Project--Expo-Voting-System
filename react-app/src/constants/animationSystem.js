/**
 * Animation System for Category Transitions
 * Handles triggering animations based on project category
 */

import { getCategoryAnimation } from './categoryConfig';

/**
 * Play animation based on category and execute callback when complete
 * @param {string} category - Project category
 * @param {Function} callback - Called when animation completes
 * @param {Object} animationContext - Context object with setActiveTransition
 */
export function playCategoryAnimation(category, callback, animationContext) {
  if (animationContext && animationContext.setActiveTransition) {
    animationContext.setActiveTransition(null);
  }
  if (callback) callback();
}

/**
 * Get animation duration for each type (milliseconds)
 */
function getAnimationDuration(animationType) {
  const durations = {
    ai: 1200,        // Water splash/electric effect
    water: 1200,     // Water ripple
    iot: 1500,       // Connected nodes animation
    robotics: 1000,  // Gear/mechanical
    cyber: 1000,     // Grid/encryption
    health: 1800,    // ECG + stethoscope
    agriculture: 1600,  // Plants + test tubes
    blockchain: 1200,   // Cube animation
    fire: 1200,      // Fire sparks
    leaf: 1200,      // Flying leaves
    robot: 1500      // Robot entrance
  };

  return durations[animationType] || 1200;
}

/**
 * Initialize animation handlers for page navigation
 * Should be called once during app initialization
 */
export function initializeAnimationHandlers() {
  // Add any global animation setup here if needed
}

/**
 * Clean up animation state
 */
export function clearAnimation(animationContext) {
  if (animationContext && animationContext.setActiveTransition) {
    animationContext.setActiveTransition(null);
  }
}

/**
 * Get animation class names for CSS-based animations
 */
export function getAnimationClass(animationType) {
  const classMap = {
    ai: 'transition-ai-water',
    water: 'transition-water-ripple',
    iot: 'transition-iot-nodes',
    robotics: 'transition-robotics-gears',
    cyber: 'transition-cyber-grid',
    health: 'transition-health-ecg',
    agriculture: 'transition-agriculture-plants',
    blockchain: 'transition-blockchain-cubes',
    fire: 'transition-fire-sparks',
    leaf: 'transition-leaf-fall',
    robot: 'transition-robot-entrance'
  };

  return classMap[animationType] || '';
}
