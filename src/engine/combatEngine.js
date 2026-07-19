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
    speed: (UNIT_TYPES[unit.level]?.speed || 1.5) + (lab.speed * 0.5 || 0),
    lastAttack: 0
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
  let projectiles = currentField.projectiles ? currentField.projectiles.map(p => ({...p})) : [];
  let pDamageTaken = 0;
  let eDamageTaken = 0;

  let statsDiff = { damageDealt: 0, unitsKilled: 0 };
  let nextCombatState = { ...combatState };
  nextCombatState.playerHit = false;
  nextCombatState.enemyHit = false;

  const speedMod = weather === 'snow' ? 0.6 : 1;
  const heatDmg = weather === 'heat' ? 5 : 0;
  const eventDebuff = waveEvent === 'ambush' ? 0.7 : 1;

  // Sort troops by x ascending, enemies by x descending to process frontlines first
  newTroops.sort((a, b) => b.x - a.x);
  newEnemies.sort((a, b) => a.x - b.x);


  newTroops.forEach(t => {
    t.isHit = false;
    if (heatDmg) { t.hp -= heatDmg; addFloatingText(heatDmg, t.x, 60, 'damage-red', 0.5); }

    const unitDef = UNIT_TYPES[t.level] || {};
    const range = unitDef.range || 5;
    const atkCooldown = unitDef.atkCooldown || 1000;
    const now = Date.now();

    let target = newEnemies.find(e => Math.abs(e.x - t.x) <= range);
    t.isAttacking = false;

    const isCrit = Math.random() < (0.1 + (lab.crit * 0.05) + relics.critBonus);
    let tDmg = Math.floor(t.dmg * prestigeUps.dmgMult * synergyBuffs.dmgMult * (1 + relics.dmgBonus) * eventDebuff * (rageTimer > 0 ? 2 : 1));
    if (isCrit) tDmg *= 2;

    if (!target && t.x >= (100 - range)) {
      // Base attack
      if (now - (t.lastAttack || 0) >= atkCooldown) {
        t.lastAttack = now;
        t.isAttacking = true;

        if (range > 10) {
          projectiles.push({
            id: Date.now() + Math.random(),
            x: t.x, targetX: 95, y: 50, targetY: 40,
            speed: 5, damage: tDmg, isCrit, targetId: 'base', fromPlayer: true,
            color: unitDef.color || '#fff',
            emoji: unitDef.emoji || '☄️'
          });
        } else {
          eDamageTaken += tDmg;
          statsDiff.damageDealt += tDmg;
          addFloatingText(tDmg, 95, 40, isCrit ? 'damage-crit' : 'damage-white', isCrit ? 1.2 : 0.8);
          if (isCrit) doCameraPunch();
          if (settings.vfx && particleEngine.current) {
             particleEngine.current.emit(window.innerWidth, window.innerHeight/2, unitDef.color, 'spark', isCrit ? 15 : 5);
          }
        }
      }
    } else if (target) {
      if (now - (t.lastAttack || 0) >= atkCooldown) {
        t.lastAttack = now;
        t.isAttacking = true;

        if (range > 10) {
          projectiles.push({
            id: Date.now() + Math.random(),
            x: t.x, targetX: target.x, y: 50, targetY: 50,
            speed: 5, damage: tDmg, isCrit, targetId: target.id, fromPlayer: true,
            color: unitDef.color || '#fff',
            emoji: unitDef.emoji || '☄️'
          });
        } else {
          target.hp -= tDmg;
          target.isHit = true;
          statsDiff.damageDealt += tDmg;
          if (settings.vfx && particleEngine.current) {
             particleEngine.current.emit(window.innerWidth/2 + (t.x - 50)*2, window.innerHeight/2, unitDef.color, 'spark', isCrit ? 15 : 5);
          }
          if (isCrit) doCameraPunch();
          playSfx('hit');
          addFloatingText(tDmg, target.x, 40, isCrit ? 'damage-crit' : 'damage-white', isCrit ? 1.2 : 0.8);
        }
      }
    } else {
      let nearestEnemy = newEnemies.length > 0 ? newEnemies[newEnemies.length - 1] : null; // Already sorted
      if (!nearestEnemy || Math.abs(nearestEnemy.x - t.x) > range) {
        t.x += t.speed * speedMod;
      }
    }
  });

  newEnemies.forEach(e => {
    e.isHit = false;
    if (heatDmg) e.hp -= heatDmg;

    const unitDef = UNIT_TYPES[e.level] || {};
    const range = unitDef.range || 5;
    const atkCooldown = unitDef.atkCooldown || 1000;
    const now = Date.now();

    let target = newTroops.find(t => Math.abs(t.x - e.x) <= range);
    e.isAttacking = false;

    if (!target && e.x <= range) {
      if (now - (e.lastAttack || 0) >= atkCooldown) {
         e.lastAttack = now;
         e.isAttacking = true;

         if (range > 10) {
           projectiles.push({
             id: Date.now() + Math.random(),
             x: e.x, targetX: 5, y: 50, targetY: 40,
             speed: -5, damage: e.dmg, isCrit: false, targetId: 'base', fromPlayer: false,
             color: unitDef.color || '#fff',
             emoji: unitDef.emoji || '☄️'
           });
         } else {
           pDamageTaken += e.dmg;
         }
      }
    } else if (target) {
      if (now - (e.lastAttack || 0) >= atkCooldown) {
         e.lastAttack = now;
         e.isAttacking = true;

         if (range > 10) {
           projectiles.push({
             id: Date.now() + Math.random(),
             x: e.x, targetX: target.x, y: 50, targetY: 50,
             speed: -5, damage: e.dmg, isCrit: false, targetId: target.id, fromPlayer: false,
             color: unitDef.color || '#fff',
             emoji: unitDef.emoji || '☄️'
           });
         } else {
           target.hp -= e.dmg;
           target.isHit = true;
         }
      }
    } else {
      let nearestTroop = newTroops.length > 0 ? newTroops[newTroops.length - 1] : null;
      if (!nearestTroop || Math.abs(nearestTroop.x - e.x) > range) {
        e.x -= e.speed * speedMod;
      }
    }
  });


  // Process projectiles
  let remainingProjectiles = [];
  projectiles.forEach(p => {
    p.x += p.speed;

    // Check hit
    let hit = false;
    if (p.fromPlayer) {
      if (p.targetId === 'base' && p.x >= p.targetX) hit = true;
      else {
        let t = newEnemies.find(e => e.id === p.targetId);
        if (t) {
          if (p.x >= t.x) { hit = true; t.hp -= p.damage; t.isHit = true; statsDiff.damageDealt += p.damage; p.targetX = t.x; }
        } else {
          // Target died, check if it hits anything else on the way or remove
          let nearest = newEnemies.find(e => Math.abs(e.x - p.x) <= 2);
          if (nearest) { hit = true; nearest.hp -= p.damage; nearest.isHit = true; statsDiff.damageDealt += p.damage; p.targetX = nearest.x; }
          else if (p.x >= 95) { hit = true; eDamageTaken += p.damage; statsDiff.damageDealt += p.damage; p.targetX = 95; }
        }
      }

      if (hit) {
        if (p.targetId === 'base' || p.x >= 95) eDamageTaken += p.damage;

        addFloatingText(p.damage, p.targetX, p.targetY, p.isCrit ? 'damage-crit' : 'damage-white', p.isCrit ? 1.2 : 0.8);
        if (p.isCrit) doCameraPunch();
        playSfx('hit');
        addFloatingText('💥', p.targetX, p.targetY, 'damage-white', 1.5);
        if (settings.vfx && particleEngine.current) {
           particleEngine.current.emit(window.innerWidth/2 + (p.targetX - 50)*2, window.innerHeight/2, p.color, 'spark', p.isCrit ? 15 : 5);
        }
      }
    } else {
      if (p.targetId === 'base' && p.x <= p.targetX) hit = true;
      else {
        let t = newTroops.find(tr => tr.id === p.targetId);
        if (t) {
          if (p.x <= t.x) { hit = true; t.hp -= p.damage; t.isHit = true; p.targetX = t.x; }
        } else {
          let nearest = newTroops.find(tr => Math.abs(tr.x - p.x) <= 2);
          if (nearest) { hit = true; nearest.hp -= p.damage; nearest.isHit = true; p.targetX = nearest.x; }
          else if (p.x <= 5) { hit = true; pDamageTaken += p.damage; p.targetX = 5; }
        }
      }

      if (hit) {
        if (p.targetId === 'base' || p.x <= 5) pDamageTaken += p.damage;
        addFloatingText('💥', p.targetX, p.targetY, 'damage-white', 1.5);
        playSfx('hit');
      }
    }

    if (!hit) {
      remainingProjectiles.push(p);
    }
  });

  const killedEnemies = newEnemies.filter(e => e.hp <= 0).length;
  statsDiff.unitsKilled += killedEnemies;

  newTroops = newTroops.filter(t => t.hp > 0);
  newEnemies = newEnemies.filter(e => e.hp > 0);

  if (pDamageTaken > 0) {
    const newHp = Math.max(0, nextCombatState.playerHp - pDamageTaken);
    if (newHp === 0) setTimeout(handleGameOver, 100);
    nextCombatState.playerHp = newHp;
    nextCombatState.playerHit = true;
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
    nextCombatState.enemyHit = true;
    addFloatingText(eDamageTaken, 90, 50, 'damage-gold', 1.5);
    triggerShake('base-shake');
  }

  return { troops: newTroops, enemies: newEnemies, projectiles: remainingProjectiles, newCombatState: nextCombatState, reward: resultReward, statsDiff };
};