/**
 * Category Configuration System
 * Centralized mapping of categories to animations, default images, and styling
 */

// Default category images (using high-quality placeholder images)
export const CATEGORY_DEFAULT_IMAGES = {
  AI: 'https://images.unsplash.com/photo-1677442d019cecf8d92835a9c03b768d?auto=format&fit=crop&w=800&q=80',
  IoT: 'https://images.unsplash.com/photo-1518694712202-898b827b51a7?auto=format&fit=crop&w=800&q=80',
  Robotics: 'https://images.unsplash.com/photo-1518894917744-3277c6de5d12?auto=format&fit=crop&w=800&q=80',
  'Cyber Security': 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
  Healthcare: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80',
  Agriculture: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80',
  Blockchain: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80'
};

// Global default project image (fallback if category doesn't exist)
export const DEFAULT_PROJECT_IMAGE = 'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=800&q=80';

// Category animation mapping
export const CATEGORY_ANIMATIONS = {
  AI: 'premium-water-splash',           // Water splash effect
  IoT: 'premium-smart-irrigation',      // Smart farming/irrigation effect
  Robotics: 'premium-robotics-rescue',  // Autonomous rescue robot effect
  'Cyber Security': 'premium-biometric-security',  // Biometric security effect
  Healthcare: 'health',                 // ECG/heartbeat + stethoscope (existing)
  Agriculture: 'agriculture',           // Plants/test tubes (existing)
  Blockchain: 'blockchain'              // Cube/chain nodes (existing)
};

// Color themes for each category
export const CATEGORY_COLORS = {
  AI: { primary: '#00E5FF', secondary: '#4F7CFF', accent: '#08132e' },
  IoT: { primary: '#00D9FF', secondary: '#0066FF', accent: '#050816' },
  Robotics: { primary: '#FFD700', secondary: '#FF8C00', accent: '#1a1a1a' },
  'Cyber Security': { primary: '#00FF00', secondary: '#00D700', accent: '#001400' },
  Healthcare: { primary: '#FF3366', secondary: '#FF69B4', accent: '#1a0007' },
  Agriculture: { primary: '#5DD65D', secondary: '#00AA00', accent: '#0a1a0a' },
  Blockchain: { primary: '#FFD700', secondary: '#FFA500', accent: '#1a1400' }
};

/**
 * Get the appropriate image for a project
 * Priority: provided image > category default > global default
 */
export function getProjectImage(project) {
  // If project has a specific image, use it
  if (project && project.image && project.image.trim()) {
    return project.image;
  }

  // Use category default image
  if (project && project.category) {
    return CATEGORY_DEFAULT_IMAGES[project.category] || DEFAULT_PROJECT_IMAGE;
  }

  // Fallback to global default
  return DEFAULT_PROJECT_IMAGE;
}

/**
 * Get the animation type for a category
 */
export function getCategoryAnimation(category) {
  return CATEGORY_ANIMATIONS[category] || null;
}

/**
 * Get category color theme
 */
export function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.AI;
}

/**
 * Validate category exists
 */
export function isValidCategory(category) {
  return Object.keys(CATEGORY_DEFAULT_IMAGES).includes(category);
}
