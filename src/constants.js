export const SAVE_KEY = 'trench_tycoon_save_ultimate_v8';

// Génération de vrais sprites 2D
export const getSprite = (seed) => `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=transparent`;

export const UNIT_TYPES = {
  1: { name: 'Recrue', emoji: '🪖', color: '#94a3b8' },
  2: { name: 'Infanterie', emoji: '🔫', color: '#3b82f6' },
  3: { name: 'Blindé', emoji: '🛡️', color: '#a855f7' },
  4: { name: 'Tank Léger', emoji: '🚜', color: '#eab308' },
  5: { name: 'Mecha', emoji: '🤖', color: '#ef4444' },
  6: { name: 'Titan', emoji: '👹', color: '#000000' },
  7: { name: 'Éveillé', emoji: '👽', color: '#06b6d4' },
  8: { name: 'Dieu de Guerre', emoji: '👿', color: '#f472b6' }
};

export const GRID_SIZE = 12;
export const DAMAGE_MAP = { 1: 5, 2: 25, 3: 100, 4: 400, 5: 1500, 6: 6000, 7: 25000, 8: 120000 };
export const HP_MAP = { 1: 20, 2: 80, 3: 300, 4: 1200, 5: 5000, 6: 20000, 7: 80000, 8: 300000 };

export const formatNum = (num) => {
  if (num == null) return "0";
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return Math.floor(num).toString();
};

export const BETA_FEATURES = true;
