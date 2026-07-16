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

  const performSummon = useCallback((amount = 1, isPity = false) => {
    const baseCost = activeBanner === 'premium' ? 10 : summonCost;
    const cost = isPity ? 0 : baseCost * amount;
    const canAfford = isPity || (activeBanner === 'premium' ? res.gems >= cost : res.gold >= cost);

    if (canAfford) {
      if (!isPity) {
        if (activeBanner === 'premium') {
          setRes(r => ({ ...r, gems: r.gems - cost }));
        } else {
          setRes(r => ({ ...r, gold: r.gold - cost }));
        }
      }

      let newUnits = [];
      let maxLevelPulled = 1;

      if (isPity) {
        const spawnLevel = 5;
        maxLevelPulled = spawnLevel;
        setPity(0);
        newUnits.push({ level: spawnLevel, id: Date.now() + Math.random().toString(), equip: Math.random() < 0.05 ? 'medal' : null });
      } else {
        for (let i = 0; i < amount; i++) {
          const spawnLevel = getSummonResult(activeBanner);
          if (spawnLevel > maxLevelPulled) maxLevelPulled = spawnLevel;
          newUnits.push({ level: spawnLevel, id: Date.now() + Math.random().toString(), equip: Math.random() < 0.05 ? 'medal' : null });
          if (spawnLevel === 1) setPity(prev => Math.min(100, prev + (100 / 90))); // Approx 90 pulls to pity
        }
      }

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
