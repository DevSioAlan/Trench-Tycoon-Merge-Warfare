import { useState, useEffect, useRef } from 'react';
import { SAVE_KEY, GRID_SIZE } from '../constants';

export const useSaveSystem = () => {
  const [profile, setProfile] = useState({ name: 'Commandant', avatar: '🪖', frame: 'default', title: 'Recrue' });
  const [settings, setSettings] = useState({ vfx: true, sfx: true, bgm: false, colorblind: false, autoBattle: false, theme: 'standard' });
  const [res, setRes] = useState({ gold: 150, gems: 0, keys: 0, rp: 0 });
  const [wave, setWave] = useState(1);
  const [grid, setGrid] = useState(Array(GRID_SIZE).fill(null));
  const [inventory, setInventory] = useState([]);
  const [combatDeck, setCombatDeck] = useState(Array(6).fill(null));
  const [buildings, setBuildings] = useState({ hq: 1, refinery: 0, lab: 0 });
  const [lab, setLab] = useState({ goldGen: 1, baseHp: 1, summonCostReduc: 0, speed: 0, crit: 0, autoSummon: 0, autoMerge: 0, infantryDmg: 0, armorHp: 0, advancedEco: 0, orbitalStrike: 0 });
  const [prestige, setPrestige] = useState({ medals: 0, crystals: 0 });
  const [prestigeUps, setPrestigeUps] = useState({ dmgMult: 1, startGold: 0, afkYield: 1 });
  const [relics, setRelics] = useState({ goldBonus: 0, critBonus: 0, dmgBonus: 0 });
  const [combatState, setCombatState] = useState({ playerHp: 500, enemyMaxHp: 100, enemyHp: 100, energy: 0, combo: 0, energyLevel: 1, maxEnergy: 100, energyGen: 5 });
  const [pity, setPity] = useState(0);
  const [lastDaily, setLastDaily] = useState(0);

  const [afkReward, setAfkReward] = useState(null);

  const stateRef = useRef({});

  useEffect(() => {
    stateRef.current = { profile, settings, res, wave, grid, inventory, combatDeck, buildings, lab, prestige, prestigeUps, relics, combatState, pity, lastDaily };
  }, [profile, settings, res, wave, grid, inventory, combatDeck, buildings, lab, prestige, prestigeUps, relics, combatState, pity, lastDaily]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        try {
          const p = JSON.parse(saved);
          setProfile(p.profile ?? { name: 'Commandant', avatar: '🪖', frame: 'default', title: 'Recrue' });
          setSettings(p.settings ?? { vfx: true, sfx: true, bgm: false, colorblind: false, autoBattle: false, theme: 'standard' });
          setRes(p.res ?? { gold: 150, gems: 0, keys: 0, rp: 0 });
          setWave(p.wave ?? 1);
          setGrid(p.grid ?? Array(GRID_SIZE).fill(null));
          setInventory(p.inventory ?? []);
          setCombatDeck(p.combatDeck ?? Array(6).fill(null));
          setBuildings(p.buildings ?? { hq: 1, refinery: 0, lab: 0 });
          setLab({ goldGen: 1, baseHp: 1, summonCostReduc: 0, speed: 0, crit: 0, autoSummon: 0, autoMerge: 0, infantryDmg: 0, armorHp: 0, advancedEco: 0, orbitalStrike: 0, ...(p.lab || {}) });
          setPrestige(p.prestige ?? { medals: 0, crystals: 0 });
          setPrestigeUps(p.prestigeUps ?? { dmgMult: 1, startGold: 0, afkYield: 1 });
          setRelics(p.relics ?? { goldBonus: 0, critBonus: 0, dmgBonus: 0 });
          setCombatState(p.combatState ?? { playerHp: 500, enemyMaxHp: 100, enemyHp: 100, energy: 0, combo: 0, energyLevel: 1, maxEnergy: 100, energyGen: 5 });
          setPity(p.pity ?? 0);
          setLastDaily(p.lastDaily ?? 0);

          if (p.lastLogin) {
            const diffSecs = Math.floor((Date.now() - p.lastLogin) / 1000);
            if (diffSecs > 60) {
              const effSecs = Math.min(diffSecs, 12 * 3600);
              const goldEarned = Math.floor(effSecs * (2 + (p.buildings?.refinery || 0)*2) * (p.prestigeUps?.afkYield || 1));
              setRes(r => ({ ...r, gold: r.gold + goldEarned }));
              setAfkReward(goldEarned);
            }
          }
        } catch (e) { console.error("Save error", e); }
      }
    }, 0);
    return () => clearTimeout(timeoutId);
  }, []);

  return {
    profile, setProfile,
    settings, setSettings,
    res, setRes,
    wave, setWave,
    grid, setGrid,
    inventory, setInventory,
    combatDeck, setCombatDeck,
    buildings, setBuildings,
    lab, setLab,
    prestige, setPrestige,
    prestigeUps, setPrestigeUps,
    relics, setRelics,
    combatState, setCombatState,
    pity, setPity,
    lastDaily, setLastDaily,
    afkReward, setAfkReward,
    stateRef
  };
};