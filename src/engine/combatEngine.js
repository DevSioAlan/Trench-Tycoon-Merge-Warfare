import { UNIT_TYPES } from '../constants';

import { HP_MAP, DAMAGE_MAP } from '../constants';

export const deployUnitAction = (combatState, field, unit, energyCost, prestigeUps, lab) => {
  if (combatState.energy < energyCost) return null;

  const newTroop = {
    id: Date.now() + Math.random(),
    level: unit.level,
    hp: HP_MAP[unit.level] * prestigeUps.dmgMult * (unit.equip === 'medal' ? 1.5 : 1),
    maxHp: HP_MAP[unit.level] * prestigeUps.dmgMult * (unit.equip === 'medal' ? 1.5 : 1),
    dmg: DAMAGE_MAP[unit.level] * (unit.equip === 'medal' ? 1.5 : 1),
    x: 5, // Starts at player base (extreme left)
    speed: 2 + (lab.speed * 0.5 || 0)
  };

  return {
    newCombatState: { ...combatState, energy: combatState.energy - energyCost },
    newField: { ...field, troops: [...field.troops, newTroop] }
  };
};

export const processCombatTick = ({
  currentField, weather, waveEvent, lab, relics, prestigeUps, synergyBuffs, combatState, rageTimer,
  settings, particleEngine, addFloatingText, playSfx, triggerShake, doCameraPunch,
  wave, isRaidBossWave, handleGameOver
}) => {
  let newTroops = currentField.troops.map(t => ({...t}));
  let newEnemies = currentField.enemies.map(e => ({...e}));
  let pDamageTaken = 0;
  let eDamageTaken = 0;
  let nextCombatState = { ...combatState };

  const speedMod = weather === 'snow' ? 0.6 : 1;
  const heatDmg = weather === 'heat' ? 5 : 0;
  const eventDebuff = waveEvent === 'ambush' ? 0.7 : 1;

  // Sort troops by x ascending, enemies by x descending to process frontlines first
  newTroops.sort((a, b) => b.x - a.x);
  newEnemies.sort((a, b) => a.x - b.x);

  newTroops.forEach(t => {
    if (heatDmg) { t.hp -= heatDmg; addFloatingText(heatDmg, t.x, 60, 'damage-red', 0.5); }

    let target = newEnemies.find(e => Math.abs(e.x - t.x) < 5); // strict melee range
    if (!target && t.x >= 95) {
      // Reached enemy base
      const isCrit = Math.random() < (0.1 + (lab.crit * 0.05) + relics.critBonus);
      let tDmg = Math.floor(t.dmg * prestigeUps.dmgMult * synergyBuffs.dmgMult * (1 + relics.dmgBonus) * eventDebuff * (rageTimer > 0 ? 2 : 1));
      if (isCrit) tDmg *= 2;
      eDamageTaken += tDmg;
      t.hp = 0; // Sacrificed at base
      addFloatingText(tDmg, 95, 40, isCrit ? 'damage-crit' : 'damage-white', isCrit ? 1.2 : 0.8);
      if (isCrit) doCameraPunch();
    } else if (target) {
      const isCrit = Math.random() < (0.1 + (lab.crit * 0.05) + relics.critBonus);
      let tDmg = Math.floor(t.dmg * prestigeUps.dmgMult * synergyBuffs.dmgMult * (1 + relics.dmgBonus) * eventDebuff * (rageTimer > 0 ? 2 : 1));
      if (isCrit) tDmg *= 2;

      target.hp -= tDmg;
      // We don't take damage here, enemy loop handles enemy attacks

      if (settings.vfx && particleEngine.current) {
         particleEngine.current.emit(window.innerWidth/2 + (t.x - 50)*2, window.innerHeight/2, UNIT_TYPES[t.level].color, 'spark', isCrit ? 15 : 5);
      }
      if (isCrit) doCameraPunch();
      playSfx('hit');
      addFloatingText(tDmg, target.x, 40, isCrit ? 'damage-crit' : 'damage-white', isCrit ? 1.2 : 0.8);
    } else {
      t.x += t.speed * speedMod;
    }
  });

  newEnemies.forEach(e => {
    if (heatDmg) e.hp -= heatDmg;
    let target = newTroops.find(t => Math.abs(t.x - e.x) < 5);

    if (!target && e.x <= 5) {
      pDamageTaken += e.dmg;
      e.hp = 0;
    } else if (target) {
      target.hp -= e.dmg;
    } else {
      e.x -= e.speed * speedMod;
    }
  });

  newTroops = newTroops.filter(t => t.hp > 0);
  newEnemies = newEnemies.filter(e => e.hp > 0);

  if (pDamageTaken > 0) {
    const newHp = Math.max(0, nextCombatState.playerHp - pDamageTaken);
    if (newHp === 0) setTimeout(handleGameOver, 100);
    nextCombatState.playerHp = newHp;
    addFloatingText(pDamageTaken, 10, 50, 'damage-red', 1.5);
    triggerShake('player-shake');
  }

  let resultReward = null;

  if (eDamageTaken > 0) {
    const newHp = Math.max(0, nextCombatState.enemyHp - eDamageTaken);
    if (newHp === 0 && nextCombatState.enemyHp > 0) {
      resultReward = {
        gold: isRaidBossWave ? 2000 * wave : 200 * wave,
        keys: Math.random() < 0.1 ? 1 : 0,
        relicDrop: isRaidBossWave && Math.random() < 0.4 ? Math.random() : null
      };
    }
    nextCombatState.enemyHp = newHp;
    addFloatingText(eDamageTaken, 90, 50, 'damage-gold', 1.5);
    triggerShake('base-shake');
  }

  return { troops: newTroops, enemies: newEnemies, newCombatState: nextCombatState, reward: resultReward };
};