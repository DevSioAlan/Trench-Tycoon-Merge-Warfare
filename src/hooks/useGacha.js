import { useState, useCallback } from 'react';
import { UNIT_TYPES } from '../constants';

export const useGacha = ({ res, setRes, setInventory, setPity, setCinematicSummon, addToast, summonCost }) => {
  const [activeBanner, setActiveBanner] = useState('standard');

  const performSummon = useCallback((isPity = false) => {
    const cost = isPity ? 0 : (activeBanner === 'premium' ? 10 : summonCost);
    const canAfford = isPity || (activeBanner === 'premium' ? res.gems >= cost : res.gold >= cost);

    if (canAfford) {
      if (!isPity) {
        if (activeBanner === 'premium') {
          setRes(r => ({ ...r, gems: r.gems - cost }));
        } else {
          setRes(r => ({ ...r, gold: r.gold - cost }));
        }
      }

      let spawnLevel = 1;

      if (isPity) {
        spawnLevel = 5;
        setPity(0);
        setCinematicSummon({ active: true, item: { ...UNIT_TYPES[spawnLevel], rarity: 'legendary' } });
        setTimeout(() => setCinematicSummon({ active: false, item: null }), 3000);
      } else if (activeBanner === 'premium') {
        spawnLevel = Math.random() > 0.8 ? 4 : 3;
        if (spawnLevel === 4) {
          setCinematicSummon({ active: true, item: { ...UNIT_TYPES[spawnLevel], rarity: 'epic' } });
          setTimeout(() => setCinematicSummon({ active: false, item: null }), 3000);
        } else {
          addToast(`Invoqué : ${UNIT_TYPES[spawnLevel].name}!`, '#a855f7');
        }
      } else {
        const rand = Math.random();
        if (rand < 0.65) {
          spawnLevel = 1;
          setPity(prev => Math.min(100, prev + 5));
          addToast(`Invoqué : ${UNIT_TYPES[spawnLevel].name}`, '#94a3b8');
        } else if (rand < 0.95) {
          spawnLevel = 2;
          addToast(`Invoqué : ${UNIT_TYPES[spawnLevel].name}`, '#3b82f6');
        } else {
          spawnLevel = 3;
          addToast(`Invoqué : ${UNIT_TYPES[spawnLevel].name}!`, '#c084fc');
        }
      }

      const hasEquip = Math.random() < 0.05 ? 'medal' : null;
      const newUnit = { level: spawnLevel, id: Date.now() + Math.random().toString(), equip: hasEquip };
      setInventory(prev => [...prev, newUnit]);
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
