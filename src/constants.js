export const SAVE_KEY = 'trench_tycoon_save_ultimate_v8';

// Génération de vrais sprites 2D
export const getSprite = (seed) => `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=transparent`;

export const UNIT_TYPES = {
  1: { name: 'Infanterie', emoji: '🪖', color: '#94a3b8', rarity: 'Commun', rate: 50, cost: 50, hp: 100, damage: 15, speed: 2.5, range: 5, atkCooldown: 1000, deployCooldown: 2000 },
  2: { name: 'Jeep / Mitrailleuse', emoji: '🚙', color: '#3b82f6', rarity: 'Rare', rate: 30, cost: 75, hp: 150, damage: 30, speed: 3.5, range: 5, atkCooldown: 800, deployCooldown: 3000 },
  3: { name: 'Artillerie / Bazooka', emoji: '🚀', color: '#a855f7', rarity: 'Épique', rate: 15, cost: 150, hp: 120, damage: 80, speed: 0.5, range: 40, atkCooldown: 2500, deployCooldown: 5000 },
  4: { name: 'Tank Blindé', emoji: '🚜', color: '#eab308', rarity: 'Légendaire', rate: 4.5, cost: 300, hp: 4000, damage: 100, speed: 0.5, range: 8, atkCooldown: 2000, deployCooldown: 8000 },
  5: { name: 'Frappe Nucléaire', emoji: '☢️', color: '#ef4444', rarity: 'Mythique', rate: 0.4, cost: 600, hp: 3500, damage: 200, speed: 1.5, range: 20, atkCooldown: 2000, deployCooldown: 12000 },
  6: { name: 'Arme Laser', emoji: '🛰️', color: '#06b6d4', rarity: 'Ultra Légendaire', rate: 0.1, cost: 1200, hp: 8000, damage: 500, speed: 0.8, range: 25, atkCooldown: 3000, deployCooldown: 20000 },
  7: { name: 'Éveillé', emoji: '👽', color: '#f472b6', rarity: 'Commun', rate: 0, cost: 2500, hp: 6000, damage: 1000, speed: 1.5, range: 20, atkCooldown: 2000, deployCooldown: 30000 },
  8: { name: 'Dieu de Guerre', emoji: '👿', color: '#fde047', rarity: 'Commun', rate: 0, cost: 5000, hp: 15000, damage: 3000, speed: 1.0, range: 10, atkCooldown: 1500, deployCooldown: 40000 },
  9: { name: 'Transfiguration Flower', emoji: '🌸', color: '#fde047', rarity: 'Commun', rate: 0, cost: 4000, hp: 500, damage: 5000, speed: 0.5, range: 40, atkCooldown: 6000, deployCooldown: 35000 }
};

export const GRID_SIZE = 12;
export const DAMAGE_MAP = Object.fromEntries(Object.entries(UNIT_TYPES).map(([k, v]) => [k, v.damage]));
export const HP_MAP = Object.fromEntries(Object.entries(UNIT_TYPES).map(([k, v]) => [k, v.hp]));

export const formatNum = (num) => {
  if (num == null) return "0";
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return Math.floor(num).toString();
};

export const BETA_FEATURES = true;
