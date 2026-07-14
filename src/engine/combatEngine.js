import { UNIT_TYPES } from '../constants';

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

  newTroops.forEach(t => {
    if (heatDmg) { t.hp -= heatDmg; addFloatingText(heatDmg, t.x, 60, 'damage-red', 0.5); }

    let target = newEnemies.find(e => Math.abs(e.x - t.x) < 8);
    if (target) {
      const isCrit = Math.random() < (0.1 + (lab.crit * 0.05) + relics.critBonus);
      let tDmg = Math.floor(t.dmg * prestigeUps.dmgMult * synergyBuffs.dmgMult * (1 + relics.dmgBonus) * (1 + (combatState.combo*0.05)) * eventDebuff * (rageTimer > 0 ? 2 : 1));
      if (isCrit) tDmg *= 2;

      target.hp -= tDmg;
      t.hp -= target.dmg;

      if (settings.vfx && particleEngine.current) {
         particleEngine.current.emit(window.innerWidth/2 + (t.x - 50)*2, window.innerHeight/2, UNIT_TYPES[t.level].color, 'spark', isCrit ? 15 : 5);
      }
      if (isCrit) doCameraPunch();
      playSfx('hit');
      addFloatingText(tDmg, target.x, 40, isCrit ? 'damage-crit' : 'damage-white', isCrit ? 1.2 : 0.8);
    } else {
      t.x += t.speed * speedMod;
      if (t.x >= 100) { eDamageTaken += t.dmg * prestigeUps.dmgMult; t.hp = 0; }
    }
  });

  newEnemies.forEach(e => {
    if (heatDmg) e.hp -= heatDmg;
    let target = newTroops.find(t => Math.abs(t.x - e.x) < 8);
    if (!target) {
      e.x -= e.speed * speedMod;
      if (e.x <= 0) { pDamageTaken += e.dmg; e.hp = 0; }
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