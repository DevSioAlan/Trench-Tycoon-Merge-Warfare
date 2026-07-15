import { useState, useCallback } from 'react';
import { UNIT_TYPES } from '../constants';

export const useGacha = ({ res, setRes, grid, setGrid, setPity, setUiState, triggerAnim, summonCost }) => {
  const [activeBanner, setActiveBanner] = useState('standard');

  const performSummon = useCallback((isPity = false) => {
    const cost = isPity ? 0 : (activeBanner === 'premium' ? 10 : summonCost);
    const canAfford = isPity || (activeBanner === 'premium' ? res.gems >= cost : res.gold >= cost);

    if (canAfford) {
      const firstEmptyIndex = grid.findIndex(cell => cell === null);
      if (firstEmptyIndex !== -1) {
        if (!isPity) {
          if (activeBanner === 'premium') {
            setRes(r => ({ ...r, gems: r.gems - cost }));
          } else {
            setRes(r => ({ ...r, gold: r.gold - cost }));
          }
        }

        let spawnLevel = 1;
        let animType = 'pop-in';

        if (isPity) {
          spawnLevel = 5;
          setPity(0);
          setUiState(u => ({ ...u, cinematic: UNIT_TYPES[spawnLevel] }));
          setTimeout(() => setUiState(u => ({ ...u, cinematic: null })), 2000);
        } else if (activeBanner === 'premium') {
          spawnLevel = Math.random() > 0.8 ? 4 : 3;
        } else {
          const rand = Math.random();
          if (rand < 0.65) {
            spawnLevel = 1;
            setPity(prev => Math.min(100, prev + 5));
          } else if (rand < 0.95) {
            spawnLevel = 2;
          } else {
            spawnLevel = 3;
            animType = 'pop-in-jackpot';
          }
        }

        const newGrid = [...grid];
        const hasEquip = Math.random() < 0.05 ? 'medal' : null;
        newGrid[firstEmptyIndex] = { level: spawnLevel, id: Date.now(), equip: hasEquip };
        setGrid(newGrid);
        triggerAnim(firstEmptyIndex, animType);
      }
    }
  }, [activeBanner, grid, res, setGrid, setPity, setRes, setUiState, summonCost, triggerAnim]);

  return {
    activeBanner,
    setActiveBanner,
    performSummon
  };
};
