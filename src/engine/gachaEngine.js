import { UNIT_TYPES } from '../constants';

export const GACHA_RATES = [
  { rarity: 'omega', level: 8, chance: 0.0005, pityLimit: 1000 },
  { rarity: 'transcendant', level: 7, chance: 0.0015, pityLimit: 500 },
  { rarity: 'titan', level: 6, chance: 0.008, pityLimit: 250 },
  { rarity: 'mythique', level: 5, chance: 0.02, pityLimit: 100 },
  { rarity: 'legendaire', level: 4, chance: 0.05, pityLimit: 50 },
  { rarity: 'epique', level: 3, chance: 0.12, pityLimit: 10 },
  { rarity: 'rare', level: 2, chance: 0.30, pityLimit: 0 },
  { rarity: 'commun', level: 1, chance: 0.50, pityLimit: 0 }
];

export const performRoll = (currentPity) => {
  let nextPity = { ...currentPity };
  let rolledLevel = 1;
  let rolledRarity = 'commun';

  // 1. Incrémente tous les compteurs de pity
  Object.keys(nextPity).forEach(k => nextPity[k] += 1);

  // 2. Vérifie les Pity "Hard" (du plus rare au moins rare)
  for (const tier of GACHA_RATES) {
    if (tier.pityLimit > 0 && nextPity[tier.rarity] >= tier.pityLimit) {
      rolledLevel = tier.level;
      rolledRarity = tier.rarity;
      break; // On arrête à la rareté garantie la plus haute
    }
  }

  // 3. Si aucun Pity n'a proc, on fait un vrai jet RNG
  if (rolledLevel === 1) {
    const roll = Math.random();
    let cumulative = 0;
    for (const tier of GACHA_RATES) {
      cumulative += tier.chance;
      if (roll <= cumulative) {
        rolledLevel = tier.level;
        rolledRarity = tier.rarity;
        break;
      }
    }
  }

  // 4. Reset du pity pour la rareté obtenue ET toutes les raretés inférieures
  // (Ex: Tirer un Oméga reset le compteur Oméga, mais aussi Titan, etc.)
  let hasReset = false;
  for (const tier of GACHA_RATES) {
    if (tier.pityLimit > 0) {
      if (tier.rarity === rolledRarity || hasReset) {
        nextPity[tier.rarity] = 0;
        hasReset = true;
      }
    }
  }

  return {
    unit: { id: Date.now() + Math.random(), level: rolledLevel, name: UNIT_TYPES[rolledLevel].name },
    newPity: nextPity,
    rarity: rolledRarity
  };
};