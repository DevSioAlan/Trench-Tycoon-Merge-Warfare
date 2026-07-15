import { useEffect } from 'react';
import { GRID_SIZE, HP_MAP, DAMAGE_MAP, BETA_FEATURES, SAVE_KEY, formatNum } from '../constants';
import { processCombatTick } from '../engine/combatEngine';

export const useGameLoop = ({
  isLoaded, gameStarted, currentTab, state,
  setRes, setCombatState, setRageTimer, setField, setWeather, setWaveEvent, setGrid,
  triggerAnim, playSfx, addFloatingText, particleEngine, doCameraPunch, triggerShake, maxPlayerHp, handleGameOver,
  setWave, setRaidTimer, setUltiGauge
}) => {
  const { buildings, lab, relics, waveEvent, wave, isRaidBossWave, field, rageTimer, settings, grid, combatState, prestigeUps, synergyBuffs } = state;
  const { stateRef } = state;

  // AUTO SAVE
  useEffect(() => {
    if (!isLoaded || !gameStarted) return;
    const saveTimer = setInterval(() => {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...stateRef.current, lastLogin: Date.now() }));
    }, 10000);
    return () => clearInterval(saveTimer);
  }, [isLoaded, gameStarted, stateRef]);

  // ECONOMY & WEATHER & PASSIVE ENEMIES
  useEffect(() => {
    if (!isLoaded || !gameStarted) return;
    const ecoTimer = setInterval(() => {
      const goldGain = (2 + buildings.refinery * 2 + lab.goldGen) * (1 + relics.goldBonus) * (waveEvent === 'supply' ? 2 : 1);
      setRes(r => ({ ...r, gold: r.gold + goldGain, rp: r.rp + (buildings.lab > 0 ? buildings.lab : 0) }));
      setCombatState(c => ({ ...c, energy: Math.min(100, c.energy + 5), combo: Math.max(0, c.combo - 1) }));
      if (rageTimer > 0) setRageTimer(rt => Math.max(0, rt - 1));

      if (currentTab === 'battle' && field.enemies.length < 5) {
        setField(f => {
           const eLvl = Math.max(1, Math.min(8, Math.floor(wave / 5) + 1));
           const isBoss = isRaidBossWave && f.enemies.length === 0;
           const hp = (isBoss ? HP_MAP[eLvl] * 8 : HP_MAP[eLvl]) * Math.pow(1.12, wave);
           const dmg = DAMAGE_MAP[eLvl] * Math.pow(1.08, wave);
           return { ...f, enemies: [...f.enemies, { id: Date.now()+Math.random(), level: eLvl, hp, maxHp: hp, dmg, x: 100, isBoss, speed: isBoss ? 1 : 3 }] };
        });
      }
    }, 1000);
    return () => clearInterval(ecoTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, gameStarted, buildings, lab, relics, waveEvent, currentTab, wave, isRaidBossWave, field.enemies.length, rageTimer]);

  useEffect(() => {
    if (!isLoaded || !gameStarted) return;
    const w = ['clear', 'clear', 'rain', 'snow', 'heat'];
    const wt = setInterval(() => setWeather(w[Math.floor(Math.random() * w.length)]), 45000);
    return () => clearInterval(wt);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, gameStarted]);

  useEffect(() => {
    if (Math.random() < 0.1) setWaveEvent('supply');
    else if (Math.random() < 0.15) setWaveEvent('ambush');
    else setWaveEvent(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wave]);

  // LAB AUTOMATION: AUTO SUMMON
  useEffect(() => {
    if (!isLoaded || !gameStarted || lab.autoSummon === 0) return;
    const interval = setInterval(() => {
      setRes(currentRes => {
        let goldSpent = 0;
        setGrid(currentGrid => {
          const emptyIdx = currentGrid.findIndex(c => c === null);
          const cost = Math.max(10, Math.floor(20 * Math.pow(1.1, currentGrid.filter(c => c !== null).length) - (lab.summonCostReduc * 2)));
          if (emptyIdx !== -1 && currentRes.gold >= cost) {
            goldSpent = cost;
            const newGrid = [...currentGrid];
            newGrid[emptyIdx] = { level: 1, id: Date.now(), equip: null };
            triggerAnim(emptyIdx, 'pop-in');
            return newGrid;
          }
          return currentGrid;
        });
        return { ...currentRes, gold: currentRes.gold - goldSpent };
      });
    }, 3000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, gameStarted, lab.autoSummon, wave, lab.summonCostReduc, triggerAnim]);

  // LAB AUTOMATION: AUTO MERGE
  useEffect(() => {
    if (!isLoaded || !gameStarted || lab.autoMerge === 0) return;
    const interval = setInterval(() => {
      setGrid(currentGrid => {
        let found = false;
        let newGrid = [...currentGrid];
        for (let i = 0; i < GRID_SIZE; i++) {
          if (newGrid[i]) {
            for (let j = i + 1; j < GRID_SIZE; j++) {
              if (newGrid[j] && newGrid[i].level === newGrid[j].level && newGrid[i].level < 8) {
                newGrid[j] = { level: newGrid[i].level + 1, id: Date.now(), equip: newGrid[i].equip || newGrid[j].equip };
                newGrid[i] = null; found = true;
                triggerAnim(j, newGrid[j].level >= 7 ? 'awakening-shockwave' : 'merge-shockwave');
                setCombatState(c => ({...c, combo: Math.min(20, c.combo + 1)}));
                setUltiGauge(prev => Math.min(100, prev + 15));
                playSfx('merge');
                break;
              }
            }
          }
          if (found) break;
        }
        return newGrid;
      });
    }, 2000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, gameStarted, lab.autoMerge, triggerAnim, playSfx]);

  // BETA AUTO ASSAULT
  useEffect(() => {
    if (BETA_FEATURES && settings.autoBattle && grid.some(c => c !== null) && combatState.energy >= 20 && field.troops.length === 0) {
        const timer = setTimeout(() => {
          const troops = grid.filter(cell => cell !== null);
          if (troops.length === 0) return;

          setCombatState(c => ({ ...c, energy: c.energy - 20 }));
          setField(f => {
            const newTroops = troops.map((t, idx) => ({
              id: Date.now() + idx, level: t.level,
              hp: HP_MAP[t.level] * prestigeUps.dmgMult * (t.equip === 'medal' ? 1.5 : 1),
              maxHp: HP_MAP[t.level] * prestigeUps.dmgMult * (t.equip === 'medal' ? 1.5 : 1),
              dmg: DAMAGE_MAP[t.level] * (t.equip === 'medal' ? 1.5 : 1),
              x: Math.random() * 10, speed: 2 + (lab.speed * 0.5)
            }));
            return { ...f, troops: [...f.troops, ...newTroops] };
          });
          setGrid(Array(GRID_SIZE).fill(null));
        }, 1500);
        return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.autoBattle, grid, combatState.energy, field.troops.length]);


  // COMBAT ENGINE (200ms)
  useEffect(() => {
    if (!gameStarted || currentTab !== 'battle') return;
    const combatTick = setInterval(() => {
      setField(currentField => {
        const { troops, enemies, newCombatState, reward } = processCombatTick({
          currentField, weather: state.weather, waveEvent, lab, relics, prestigeUps, synergyBuffs,
          combatState, rageTimer, settings, particleEngine, addFloatingText, playSfx, triggerShake, doCameraPunch,
          wave, isRaidBossWave, handleGameOver
        });

        if (reward) {
          setTimeout(() => {
            setRes(r => ({ ...r, gold: r.gold + reward.gold, keys: r.keys + reward.keys }));
            addFloatingText(`+${formatNum(reward.gold)}`, 90, 50, 'damage-gold');

            if (reward.relicDrop) {
               if (reward.relicDrop < 0.33) state.setRelics(r => ({...r, goldBonus: r.goldBonus + 0.1}));
               else if (reward.relicDrop < 0.66) state.setRelics(r => ({...r, critBonus: r.critBonus + 0.05}));
               else state.setRelics(r => ({...r, dmgBonus: r.dmgBonus + 0.1}));
               addFloatingText('RELIQUE TROUVÉE !', 50, 20, 'damage-crit');
            }

            setWave(w => w + 1); setRaidTimer(30);
            setField({ troops: [], enemies: [] });
            setCombatState(c => {
              const scale = ((wave + 1) % 10 === 0) ? 5 : 1.25;
              const newMax = Math.floor(c.enemyMaxHp * scale);
              return { ...c, playerHp: Math.min(maxPlayerHp, c.playerHp + 200), enemyMaxHp: newMax, enemyHp: newMax };
            });
          }, 500);
        } else if (newCombatState !== combatState) {
          setCombatState(newCombatState);
        }

        return { troops, enemies };
      });
    }, 200);
    return () => clearInterval(combatTick);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTab, gameStarted, state.weather, prestigeUps, combatState.combo, lab.crit, wave, isRaidBossWave, playSfx, addFloatingText, doCameraPunch, settings.vfx, triggerShake, maxPlayerHp, handleGameOver, synergyBuffs, rageTimer, relics]);

};