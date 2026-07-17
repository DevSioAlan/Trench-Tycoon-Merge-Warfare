import { useEffect, useRef } from 'react';
import { GRID_SIZE, HP_MAP, DAMAGE_MAP, BETA_FEATURES, SAVE_KEY, formatNum, UNIT_TYPES } from '../constants';
import { processCombatTick } from '../engine/combatEngine';

export const useGameLoop = ({
  isLoaded, gameStarted, currentTab, state,
  setRes, setCombatState, setRageTimer, setField, setWeather, setWaveEvent, setGrid,
  triggerAnim, playSfx, addFloatingText, particleEngine, doCameraPunch, triggerShake, maxPlayerHp, handleGameOver,
  setWave, setRaidTimer, setUltiGauge
}) => {
  const { buildings, lab, relics, waveEvent, wave, isRaidBossWave, field, rageTimer, settings, grid, combatState, prestigeUps, synergyBuffs, combatMode, setUiState } = state;
  const { stateRef } = state;
  const combatTimeRef = useRef(0);

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
      const guildBuff = state.guild?.buffType;
      const goldGain = (2 + buildings.refinery * 2 + lab.goldGen) * (1 + relics.goldBonus) * (waveEvent === 'supply' ? 2 : 1) * (guildBuff === 'gold' ? 1.1 : 1);
      setRes(r => ({ ...r, gold: r.gold + goldGain, rp: r.rp + (buildings.lab > 0 ? buildings.lab : 0) }));

      setCombatState(c => {
         const gen = (c.energyGen || 5) * (guildBuff === 'energy' ? 1.1 : 1);
         const max = c.maxEnergy || 100;
         return { ...c, energy: Math.min(max, c.energy + gen), combo: Math.max(0, c.combo - 1) };
      });

      if (rageTimer > 0) setRageTimer(rt => Math.max(0, rt - 1));


      if (currentTab === 'combat') {
        combatTimeRef.current += 1;
        if (combatMode === 'clanWar') {
          setRaidTimer(rt => {
             if (rt <= 1) {
                 handleGameOver('clanWar');
                 return 0;
             }
             return rt - 1;
          });
        }

        // Cannon logic
        setUltiGauge(u => Math.min(100, u + 2)); // Takes 50s to charge

        // Wave script
        const t = combatTimeRef.current;
        setField(f => {
          let newEnemies = [...f.enemies];

          if (combatMode === 'clanWar') {
            if (f.enemies.length === 0) {
              newEnemies.push({ id: Date.now()+Math.random(), level: 8, hp: 999999999, maxHp: 999999999, dmg: 500, x: 95, isBoss: true, speed: 0 });
            }
          } else if (combatMode === 'survival') {
            if (f.enemies.length < 5 && t % 3 === 0) {
              const eLvl = Math.max(1, Math.min(8, Math.floor(wave / 5) + 1));
              const hp = HP_MAP[eLvl] * Math.pow(1.2, wave);
              const dmg = DAMAGE_MAP[eLvl] * Math.pow(1.2, wave);
              newEnemies.push({ id: Date.now()+Math.random(), level: eLvl, hp, maxHp: hp, dmg, x: 95, isBoss: false, speed: UNIT_TYPES[eLvl]?.speed || 1.5 });
            }
            if (f.enemies.length === 0 && t > 5) setWave(w => w + 1);
          } else if (wave === 1) {
            // Script Niveau 1
            if (t % 5 === 0 && t < 40) {
              const hp = HP_MAP[1];
              newEnemies.push({ id: Date.now()+Math.random(), level: 1, hp, maxHp: hp, dmg: DAMAGE_MAP[1], x: 95, isBoss: false, speed: UNIT_TYPES[1].speed });
            }
            if (t === 40 && newEnemies.length === 0) { // spawn mini-boss
              const hp = HP_MAP[2] * 5;
              newEnemies.push({ id: Date.now()+Math.random(), level: 2, hp, maxHp: hp, dmg: DAMAGE_MAP[2], x: 95, isBoss: true, speed: 1.0 });
            }
          } else {
            // Default generic fallback
            if (f.enemies.length < 5 && t % 3 === 0) {
              const eLvl = Math.max(1, Math.min(8, Math.floor(wave / 5) + 1));
              const isBoss = isRaidBossWave && f.enemies.length === 0;
              const hp = (isBoss ? HP_MAP[eLvl] * 8 : HP_MAP[eLvl]) * Math.pow(1.12, wave);
              const dmg = DAMAGE_MAP[eLvl] * Math.pow(1.08, wave);
              newEnemies.push({ id: Date.now()+Math.random(), level: eLvl, hp, maxHp: hp, dmg, x: 95, isBoss, speed: isBoss ? 1 : UNIT_TYPES[eLvl]?.speed || 1.5 });
            }
          }
          return { ...f, enemies: newEnemies };
        });
      } else {
        combatTimeRef.current = 0; // Reset time when not in combat
      }
    }, 1000);

    return () => clearInterval(ecoTimer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, gameStarted, buildings, lab, relics, waveEvent, currentTab, wave, isRaidBossWave, field.enemies.length, rageTimer]);

  useEffect(() => {
    if (!isLoaded || !gameStarted) return;
    const w = ['clear', 'clear', 'rain', 'snow', 'heat', 'storm'];
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

  // AUTO SUMMON AND MERGE REMOVED FOR BATTLE CATS REFACTOR


  // COMBAT ENGINE (200ms)
  useEffect(() => {
    if (!gameStarted || currentTab !== 'combat') return;
    const combatTick = setInterval(() => {
      setField(currentField => {
        const { troops, enemies, newCombatState, reward, statsUpdates } = processCombatTick({
          currentField, weather: state.weather, waveEvent, lab, relics, prestigeUps, synergyBuffs,
          combatState, rageTimer, settings, particleEngine, addFloatingText, playSfx, triggerShake, doCameraPunch,
          wave, isRaidBossWave, handleGameOver, combatMode
        });

        if (statsUpdates?.enemiesDefeated || statsUpdates?.battlesWon) {
           state.setStats?.(s => {
             const newDefeated = s.enemiesDefeated + (statsUpdates.enemiesDefeated || 0);
             if (newDefeated >= 1000) {
                 state.setQuests?.(q => ({...q, achievements: {...q.achievements, thousandKills: true}}));
             }
             return {
             ...s,
             enemiesDefeated: newDefeated,
             battlesWon: s.battlesWon + (statsUpdates.battlesWon || 0)
           };});
           if (statsUpdates.battlesWon) {
              state.setQuests?.(q => ({...q, daily: {...q.daily, played: q.daily.played + 1}}));
           }
        }

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

            if (combatMode === 'campaign') { setWave(w => w + 1); setRaidTimer(30); combatTimeRef.current = 0; setUltiGauge(0); }
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