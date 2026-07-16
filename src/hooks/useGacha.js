import { useState, useCallback } from 'react';
import { UNIT_TYPES } from '../constants';

export const useGacha = ({ res, setRes, setInventory, setPity, setCinematicSummon, addToast, summonCost }) => {
  const [activeBanner, setActiveBanner] = useState('standard');

  const getSummonResult = (banner) => {
    const rand = Math.random() * 100;
    let spawnLevel = 1;

    if (banner === 'premium') {
      if (rand < 0.1) spawnLevel = 6; // Ultra Legendaire
      else if (rand < 0.5) spawnLevel = 5; // Mythique
      else if (rand < 5) spawnLevel = 4; // Legendaire
      else if (rand < 20) spawnLevel = 3; // Epique
      else spawnLevel = 2; // Rare
    } else {
      if (rand < 0.05) spawnLevel = 6;
      else if (rand < 0.2) spawnLevel = 5;
      else if (rand < 2) spawnLevel = 4;
      else if (rand < 10) spawnLevel = 3;
      else if (rand < 35) spawnLevel = 2;
      else spawnLevel = 1;
    }

    return spawnLevel;
  };

  const performSummon = useCallback((amount = 1) => {
    const baseCost = activeBanner === 'premium' ? 10 : summonCost;
    const cost = baseCost * amount;
    const canAfford = (activeBanner === 'premium' ? res.gems >= cost : res.gold >= cost);

    if (canAfford) {
      if (activeBanner === 'premium') {
        setRes(r => ({ ...r, gems: r.gems - cost }));
      } else {
        setRes(r => ({ ...r, gold: r.gold - cost }));
      }

      let newUnits = [];
      let maxLevelPulled = 1;

      setPity(prev => {
        let newPity = { ...prev };

        for (let i = 0; i < amount; i++) {
          newPity.legendary += 1;
          newPity.mythic += 1;
          newPity.ultra += 1;

          let spawnLevel = getSummonResult(activeBanner);

          // Hard pity triggers (checked from highest to lowest)
          if (newPity.ultra >= 1500) {
            spawnLevel = 6;
          } else if (newPity.mythic >= 500 && spawnLevel < 5) {
            spawnLevel = 5;
          } else if (newPity.legendary >= 100 && spawnLevel < 4) {
            spawnLevel = 4;
          }

          // Reset pity based on rarity obtained
          if (spawnLevel === 6) newPity.ultra = 0;
          if (spawnLevel >= 5) newPity.mythic = 0;
          if (spawnLevel >= 4) newPity.legendary = 0;

          if (spawnLevel > maxLevelPulled) maxLevelPulled = spawnLevel;
          newUnits.push({ level: spawnLevel, id: Date.now() + Math.random().toString(), equip: Math.random() < 0.05 ? 'medal' : null });
        }

        return newPity;
      });

      setInventory(prev => [...prev, ...newUnits]);

      if (maxLevelPulled >= 4) {
        setCinematicSummon({ active: true, item: { ...UNIT_TYPES[maxLevelPulled] } });
        setTimeout(() => setCinematicSummon({ active: false, item: null }), 3000);
      } else if (amount === 1) {
        addToast(`Invoqué : ${UNIT_TYPES[maxLevelPulled].name}`, UNIT_TYPES[maxLevelPulled].color);
      } else {
        addToast(`${amount} invocations réussies !`, '#38bdf8');
      }

    } else {
        addToast("Fonds insuffisants", "#ef4444");
    }
  }, [activeBanner, res, setInventory, setPity, setRes, setCinematicSummon, addToast, summonCost]);

  return {
    activeBanner,
    setActiveBanner,
    performSummon
  };
};