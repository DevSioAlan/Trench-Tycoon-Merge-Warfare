import React, { useState, useEffect, useRef, useCallback } from 'react';
import './GameBoard.css';

// ==========================================
// CONFIGURATION & FLAGS BETA
// ==========================================
const BETA_FEATURES = true;
const SAVE_KEY = 'trench_tycoon_save_v5_definitive';

const UNIT_TYPES = {
  1: { name: 'Soldat', icon: '🪖', color: '#cbd5e1' },
  2: { name: 'Sniper', icon: '🎯', color: '#93c5fd' },
  3: { name: 'Blindé', icon: '🚙', color: '#c084fc' },
  4: { name: 'Tank', icon: '🚜', color: '#fde047' },
  5: { name: 'Mécha', icon: '🤖', color: '#fca5a5' },
  6: { name: 'Titan', icon: '👹', color: '#000000' },
  7: { name: 'Éveillé', icon: '⚡', color: '#06b6d4' },
  8: { name: 'Transcendant', icon: '🌌', color: '#a855f7' }
};

const GRID_SIZE = 12;
const DAMAGE_MAP = { 1: 10, 2: 35, 3: 120, 4: 450, 5: 1500, 6: 5000, 7: 25000, 8: 150000 };

const formatNum = (num) => {
  if (num === undefined || num === null) return "0";
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return Math.floor(num).toString();
};

// ==========================================
// MOTEUR DE PARTICULES (VFX)
// ==========================================
class ParticleEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas?.getContext('2d');
    this.particles = [];
    if (this.canvas) {
      this.resize();
      window.addEventListener('resize', () => this.resize());
    }
  }
  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  emit(x, y, color, type = 'spark', count = 15) {
    if (!this.ctx) return;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * (type === 'explosion' ? 20 : 10),
        vy: (Math.random() - 0.5) * 10 - (type === 'spark' ? 2 : 0),
        life: 1,
        color,
        size: type === 'explosion' ? Math.random() * 8 + 4 : Math.random() * 4 + 2,
        type
      });
    }
  }
  update() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      let p = this.particles[i];
      p.x += p.vx; p.y += p.vy; 
      if (p.type === 'spark') p.vy += 0.3; // Gravité
      p.life -= p.type === 'explosion' ? 0.05 : 0.02;
      
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }
      
      this.ctx.globalAlpha = p.life;
      this.ctx.fillStyle = p.color;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
    requestAnimationFrame(() => this.update());
  }
}

// ==========================================
// ERROR BOUNDARY (Anti-Crash)
// ==========================================
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'white', background: '#0f172a', height: '100vh', fontFamily: 'sans-serif' }}>
          <h2>💥 Erreur Critique du Front</h2>
          <p style={{ color: '#ef4444', padding: '10px', background: 'rgba(0,0,0,0.5)', borderRadius: '5px' }}>{this.state.error?.toString()}</p>
          <button onClick={() => { localStorage.removeItem(SAVE_KEY); window.location.reload(); }} style={{ padding: '15px', background: '#dc2626', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '20px', fontWeight: 'bold' }}>
            ☢️ Réinitialiser la sauvegarde (HARD RESET)
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// COMPOSANT JEU INTERNE
// ==========================================
function GameBoardContent() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTab, setCurrentTab] = useState('battle'); 
  const [afkReward, setAfkReward] = useState({ gold: 0, steel: 0 });

  // --- REGLAGES ---
  const [settings, setSettings] = useState({ vfx: true, sfx: true, bgm: false, colorblind: false, autoBattle: false });

  // --- ECONOMIE MULTI-RESSOURCES ---
  const [res, setRes] = useState({ gold: 0, gems: 0, steel: 0, rp: 0 });
  const [wave, setWave] = useState(1);
  const [grid, setGrid] = useState(Array(GRID_SIZE).fill(null));
  
  // --- BATIMENTS & RECHERCHE ---
  const [buildings, setBuildings] = useState({ hq: 1, refinery: 0, lab: 0, barracks: 1 });
  const [research, setResearch] = useState({ dmgTech: 0, ecoTech: 0 });

  // --- PRESTIGE & ASCENSION ---
  const [prestige, setPrestige] = useState({ medals: 0, crystals: 0 });
  const [prestigeUps, setPrestigeUps] = useState({ dmgMult: 1, startGold: 0, afkYield: 1 });
  const [relics, setRelics] = useState({ goldBonus: 0, critBonus: 0, dmgBonus: 0 });
  
  // --- COMBAT STATES ---
  const [combo, setCombo] = useState(0);
  const [waveEvent, setWaveEvent] = useState(null); 
  const [synergyBuffs, setSynergyBuffs] = useState({ dmgMult: 1, extraHp: 0 });
  
  const maxPlayerHp = 500 + (buildings.hq * 500) + synergyBuffs.extraHp;
  const [playerHp, setPlayerHp] = useState(maxPlayerHp);
  const [enemyMaxHp, setEnemyMaxHp] = useState(1000);
  const [enemyHp, setEnemyHp] = useState(1000);
  const [activeEnemy, setActiveEnemy] = useState(null);
  const [activeTroops, setActiveTroops] = useState([]);
  const [ultiGauge, setUltiGauge] = useState(0); 
  const [rageTimer, setRageTimer] = useState(0); 
  const [pity, setPity] = useState(0);

  const isRaidBossWave = wave % 10 === 0;
  const [raidTimer, setRaidTimer] = useState(30);

  // --- UI & FX STATES ---
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [animatingCells, setAnimatingCells] = useState({});
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [cameraPunch, setCameraPunch] = useState(false);
  const [screenShake, setScreenShake] = useState('');
  const [artilleryFlash, setArtilleryFlash] = useState(false);
  const [critFlash, setCritFlash] = useState(false);
  const [weather, setWeather] = useState('clear');

  const canvasRef = useRef(null);
  const particleEngine = useRef(null);
  const bgmRef = useRef(null);
  const stateRef = useRef({});

  // --- CALCULS DERIVÉS ---
  const goldPerSec = (5 + (buildings.refinery * 2)) * (1 + relics.goldBonus) * (1 + (research.ecoTech * 0.1)) * (waveEvent === 'supply' ? 2 : 1);
  const steelPerSec = buildings.refinery * 1;
  const rpPerSec = buildings.lab * 1;
  const summonCost = Math.floor(50 * Math.pow(1.08, grid.filter(c => c !== null).length + wave));

  // Synchronisation ref pour la sauvegarde
  useEffect(() => {
    stateRef.current = { res, wave, grid, buildings, research, prestige, prestigeUps, relics, enemyMaxHp, enemyHp, playerHp, pity, settings };
  }, [res, wave, grid, buildings, research, prestige, prestigeUps, relics, enemyMaxHp, enemyHp, playerHp, pity, settings]);

  // --- CHARGEMENT SAUVEGARDE ---
  useEffect(() => {
    const savedData = localStorage.getItem(SAVE_KEY);
    if (savedData) {
      try {
        const p = JSON.parse(savedData);
        setWave(p.wave ?? 1);
        setGrid(p.grid ?? Array(GRID_SIZE).fill(null));
        setBuildings(p.buildings ?? { hq: 1, refinery: 0, lab: 0, barracks: 1 });
        setResearch(p.research ?? { dmgTech: 0, ecoTech: 0 });
        setPrestige(p.prestige ?? { medals: 0, crystals: 0 });
        setPrestigeUps(p.prestigeUps ?? { dmgMult: 1, startGold: 0, afkYield: 1 });
        setRelics(p.relics ?? { goldBonus: 0, critBonus: 0, dmgBonus: 0 });
        setPity(p.pity ?? 0);
        setSettings(p.settings ?? { vfx: true, sfx: true, bgm: false, colorblind: false, autoBattle: false });
        setEnemyMaxHp(p.enemyMaxHp ?? 1000);
        setEnemyHp(p.enemyHp ?? 1000);
        setRes(p.res ?? { gold: 0, gems: 0, steel: 0, rp: 0 });
        
        if (p.lastLogin) {
          const diffSecs = Math.floor((Date.now() - p.lastLogin) / 1000);
          if (diffSecs > 60) {
            const effSecs = Math.min(diffSecs, 12 * 3600);
            const afkMult = p.prestigeUps?.afkYield ?? 1;
            const refBonus = p.buildings?.refinery ?? 0;
            const gGold = Math.floor(effSecs * (5 + (refBonus * 2)) * afkMult);
            const gSteel = Math.floor(effSecs * refBonus * 1);
            setAfkReward({ gold: gGold, steel: gSteel });
            setRes(r => ({ ...r, gold: r.gold + gGold, steel: r.steel + gSteel }));
          }
        }
        setPlayerHp(p.playerHp ?? 500);
      } catch (e) { console.error("Corrupted save", e); }
    }
    setIsLoaded(true);
  }, []);

  // --- AUDIO & VFX INIT ---
  useEffect(() => {
    if (settings.vfx && canvasRef.current && !particleEngine.current) {
      particleEngine.current = new ParticleEngine(canvasRef.current);
      particleEngine.current.update();
    }
    if (!bgmRef.current) {
      bgmRef.current = new Audio('https://actions.google.com/sounds/v1/ambiences/outdoor_battle_with_distant_explosions.ogg');
      bgmRef.current.loop = true; 
      bgmRef.current.volume = 0.2;
    }
  }, [settings.vfx]);

  useEffect(() => {
    if (bgmRef.current) { settings.bgm ? bgmRef.current.play().catch(()=>{}) : bgmRef.current.pause(); }
  }, [settings.bgm]);

  const playSfx = useCallback((type) => {
    if (!settings.sfx) return;
    const urls = { 
      merge: 'https://actions.google.com/sounds/v1/weapons/laser_gun.ogg', 
      hit: 'https://actions.google.com/sounds/v1/weapons/bullet_impact_dirt.ogg', 
      ult: 'https://actions.google.com/sounds/v1/weapons/huge_explosion.ogg' 
    };
    if (urls[type]) { const a = new Audio(urls[type]); a.volume = 0.4; a.play().catch(()=>{}); }
  }, [settings.sfx]);

  // --- LOOPS (Tick, Save, Weather) ---
  useEffect(() => {
    if (!isLoaded) return;
    const timer = setInterval(() => {
      setRes(r => ({ ...r, gold: r.gold + goldPerSec, steel: r.steel + steelPerSec, rp: r.rp + rpPerSec }));
      if (combo > 0) setCombo(c => Math.max(0, c - 1));
      if (rageTimer > 0) setRageTimer(rt => Math.max(0, rt - 1));
      localStorage.setItem(SAVE_KEY, JSON.stringify({ ...stateRef.current, lastLogin: Date.now() }));
    }, 1000);
    return () => clearInterval(timer);
  }, [isLoaded, goldPerSec, steelPerSec, rpPerSec, combo, rageTimer]);

  useEffect(() => {
    const w = ['clear', 'rain', 'snow', 'ash'];
    const wt = setInterval(() => setWeather(w[Math.floor(Math.random() * w.length)]), 120000);
    return () => clearInterval(wt);
  }, []);

  useEffect(() => {
    if (Math.random() < 0.1) setWaveEvent('supply');
    else if (Math.random() < 0.15) setWaveEvent('ambush');
    else setWaveEvent(null);
  }, [wave]);

  // Raid Timer
  useEffect(() => {
    if (isRaidBossWave && currentTab === 'battle' && enemyHp > 0) {
      const timer = setInterval(() => setRaidTimer(p => { if (p <= 1) { handleGameOver(); return 30; } return p - 1; }), 1000);
      return () => clearInterval(timer);
    }
  }, [isRaidBossWave, currentTab, enemyHp]);

  // --- AUTOMATISATION ---
  useEffect(() => {
    if (!isLoaded || research.ecoTech < 5) return; 
    const interval = setInterval(() => {
      setRes(currentRes => {
        let goldSpent = 0;
        setGrid(currentGrid => {
          const emptyIdx = currentGrid.findIndex(c => c === null);
          const cost = Math.floor(50 * Math.pow(1.08, currentGrid.filter(c => c !== null).length + wave));
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
  }, [isLoaded, research.ecoTech, wave]);

  // Auto-Merge (Nécessite le labo pour être cohérent, disons ecoTech 8)
  useEffect(() => {
    if (!isLoaded || research.ecoTech < 8) return;
    const interval = setInterval(() => {
      setGrid(currentGrid => {
        let found = false;
        let newGrid = [...currentGrid];
        for (let i = 0; i < GRID_SIZE; i++) {
          if (newGrid[i]) {
            for (let j = i + 1; j < GRID_SIZE; j++) {
              if (newGrid[j] && newGrid[i].level === newGrid[j].level && newGrid[i].level < 8) {
                newGrid[j] = { level: newGrid[i].level + 1, id: Date.now() };
                newGrid[i] = null;
                found = true;
                triggerAnim(j, newGrid[j].level >= 7 ? 'awakening-shockwave' : 'merge-shockwave');
                setCombo(c => Math.min(10, c + 1));
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
  }, [isLoaded, research.ecoTech, playSfx]);

  // Auto-Battle (BETA)
  useEffect(() => {
    if (BETA_FEATURES && settings.autoBattle && grid.some(c => c !== null) && activeTroops.length === 0) {
        const timer = setTimeout(() => handleAssault(), 2000);
        return () => clearTimeout(timer);
    }
  }, [settings.autoBattle, grid, activeTroops]);

  // --- UTILS VISUELS ---
  const addFloatingText = (damage, target, type = 'normal', sizeMult = 1) => {
    const formattedDmg = typeof damage === 'number' ? formatNum(damage) : damage;
    const newText = { 
      id: Date.now() + Math.random(), damage: formattedDmg, target, type, sizeMult, 
      offsetX: Math.floor(Math.random() * 60 - 30) + 'px', 
      offsetY: Math.floor(Math.random() * 60 - 30) + 'px' 
    };
    setFloatingTexts(prev => [...prev, newText]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(ft => ft.id !== newText.id)), 1200);
  };

  const triggerAnim = (index, anim) => {
    setAnimatingCells(prev => ({ ...prev, [index]: anim }));
    setTimeout(() => setAnimatingCells(prev => { const n = { ...prev }; delete n[index]; return n; }), 500); 
  };

  const doCameraPunch = () => {
    if (!settings.vfx) return;
    setCameraPunch(true); setTimeout(() => setCameraPunch(false), 300);
  };

  const triggerShake = (type, duration = 500) => {
    setScreenShake(type);
    setTimeout(() => setScreenShake(''), duration);
  };

  // --- GACHA & ACTIONS ---
  const handleSummon = (isPityPull = false) => {
    const cost = isPityPull ? 0 : summonCost;
    if (res.gold >= cost || isPityPull) {
      const firstEmptyIndex = grid.findIndex(cell => cell === null);
      if (firstEmptyIndex !== -1) {
        if (!isPityPull) setRes(r => ({ ...r, gold: r.gold - cost }));
        
        let spawnLevel = 1; let animType = 'pop-in';
        if (isPityPull) { spawnLevel = Math.random() > 0.5 ? 4 : 5; animType = 'pop-in-jackpot'; setPity(0); } 
        else {
          const rand = Math.random();
          // Le buff chance vient maintenant du prestige et labo si on veut, on simule ici
          if (rand < 0.6) { spawnLevel = 1; setPity(prev => Math.min(100, prev + 10)); } 
          else if (rand < 0.90) { spawnLevel = 2; } 
          else { spawnLevel = 3; animType = 'pop-in-jackpot'; }
        }

        const newGrid = [...grid];
        const hasEquip = Math.random() < 0.05 ? 'medal' : null;
        newGrid[firstEmptyIndex] = { level: spawnLevel, id: Date.now(), equip: hasEquip };
        setGrid(newGrid); triggerAnim(firstEmptyIndex, animType);
      }
    }
  };

  const handleCellClick = (index) => {
    if (selectedSlot === null) { if (grid[index]) setSelectedSlot(index); return; }
    if (selectedSlot === index) { setSelectedSlot(null); return; }

    const selectedUnit = grid[selectedSlot]; const targetUnit = grid[index];
    if (!targetUnit) {
      const newGrid = [...grid]; newGrid[index] = selectedUnit; newGrid[selectedSlot] = null;
      setGrid(newGrid); setSelectedSlot(null); return;
    }

    if (selectedUnit.level === targetUnit.level && selectedUnit.level < 8) {
      const newGrid = [...grid];
      newGrid[index] = { level: selectedUnit.level + 1, id: Date.now(), equip: selectedUnit.equip || targetUnit.equip };
      newGrid[selectedSlot] = null;
      setGrid(newGrid); setSelectedSlot(null);
      triggerAnim(index, selectedUnit.level >= 6 ? 'awakening-shockwave' : 'merge-shockwave');
      setUltiGauge(prev => Math.min(100, prev + 15));
      setCombo(c => Math.min(20, c + 1));
      playSfx('merge');
      if (settings.vfx && particleEngine.current) particleEngine.current.emit(window.innerWidth/2, window.innerHeight/2, '#fde047', 'spark', 20);
      return;
    }
    setSelectedSlot(index);
  };

  const handleAssault = () => {
    const troops = grid.filter(cell => cell !== null);
    if (troops.length === 0) return;
    setActiveTroops(troops); setGrid(Array(GRID_SIZE).fill(null)); setSelectedSlot(null);
  };

  const triggerUltimate = () => {
    if (ultiGauge < 100) return;
    setUltiGauge(0); setArtilleryFlash(true); doCameraPunch(); triggerShake('base-shake-massive', 1000); playSfx('ult');
    setTimeout(() => {
      setArtilleryFlash(false);
      const ultiDamage = playerHp * 20 * prestigeUps.dmgMult * (1 + relics.dmgBonus); 
      if (activeEnemy) { setActiveEnemy(null); addFloatingText('RAYÉ DE LA CARTE!', 'enemy-troop', 'crit', 1.5); }
      setEnemyHp(prev => { addFloatingText(ultiDamage, 'enemy-base', 'crit', 2); return Math.max(0, prev - ultiDamage); });
      if (settings.vfx && particleEngine.current) particleEngine.current.emit(window.innerWidth/2, window.innerHeight/3, '#ef4444', 'explosion', 50);
    }, 800);
  };

  const buyRageSerum = () => {
    const cost = 5000;
    if (res.gold >= cost) {
      setRes(r => ({ ...r, gold: r.gold - cost }));
      setRageTimer(15); 
      triggerShake('base-shake', 500);
    }
  };

  // --- MOTEUR DE COMBAT (Dégâts & Application) ---
  useEffect(() => {
    if (activeTroops.length > 0) {
      const timer = setTimeout(() => {
        let totalDamageToApply = 0; let isGlobalCrit = false;
        const comboMult = 1 + (combo * 0.05); 
        const weatherDebuff = BETA_FEATURES && weather === 'snow' ? 0.8 : 1; 
        const eventDebuff = waveEvent === 'ambush' ? 0.7 : 1;
        const labDmgBuff = 1 + (research.dmgTech * 0.1);

        activeTroops.forEach((troop, idx) => {
          let dmg = (DAMAGE_MAP[troop.level] || 0) * (troop.equip === 'medal' ? 1.5 : 1);
          const critChance = 0.2 + relics.critBonus;
          const isCrit = Math.random() < critChance; 
          if (isCrit) { dmg *= 2; isGlobalCrit = true; }
          
          let finalDmg = Math.floor(dmg * prestigeUps.dmgMult * (1 + relics.dmgBonus) * comboMult * weatherDebuff * eventDebuff * labDmgBuff * (rageTimer > 0 ? 2 : 1));
          totalDamageToApply += finalDmg;

          setTimeout(() => {
            const sizeMult = isCrit ? 1.5 : (troop.level >= 5 ? 1.2 : 1);
            addFloatingText(finalDmg, 'enemy-base', isCrit ? 'crit' : 'normal', sizeMult);
            playSfx('hit');
            if (settings.vfx && particleEngine.current) {
                const rect = document.querySelector('.enemy-base')?.getBoundingClientRect();
                if(rect) particleEngine.current.emit(rect.left + rect.width/2, rect.top + rect.height/2, UNIT_TYPES[troop.level].color, 'spark', isCrit ? 15 : 5);
            }
          }, idx * 100); 
        });

        if (isGlobalCrit) doCameraPunch();

        setActiveEnemy(currentEnemy => {
          let remainingDamage = totalDamageToApply;
          const hasAwakened = activeTroops.some(t => t.level >= 7);
          
          if (hasAwakened) {
             doCameraPunch();
             triggerShake('base-shake-massive');
             if (currentEnemy) currentEnemy = { ...currentEnemy, hp: currentEnemy.hp - remainingDamage };
             setEnemyHp(prev => Math.max(0, prev - remainingDamage));
             return (currentEnemy && currentEnemy.hp <= 0) ? null : currentEnemy;
          }

          if (currentEnemy) {
            if (currentEnemy.hp <= remainingDamage) { remainingDamage -= currentEnemy.hp; currentEnemy = null; } 
            else return { ...currentEnemy, hp: currentEnemy.hp - remainingDamage };
          }
          if (remainingDamage > 0) setEnemyHp(prev => Math.max(0, prev - remainingDamage));
          return currentEnemy;
        });
        setActiveTroops([]);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [activeTroops, prestigeUps, relics, combo, weather, waveEvent, research, rageTimer, settings.vfx, playSfx]);

  const handleGameOver = () => {
    alert(`💥 DÉFAITE ! Le front s'est effondré à la Vague ${wave}.`);
    setPlayerHp(maxPlayerHp); setEnemyMaxHp(1000); setEnemyHp(1000); setWave(1);
    setGrid(Array(GRID_SIZE).fill(null)); setActiveEnemy(null); setActiveTroops([]); setUltiGauge(0); setRaidTimer(30); setCombo(0);
  };

  useEffect(() => { if (playerHp <= 0) handleGameOver(); }, [playerHp, maxPlayerHp]);

  // Calcul HP exponentiel plus doux
  const getNextHp = (currentMax, currentWave) => {
    const isNextBoss = (currentWave + 1) % 10 === 0;
    let multiplier = 1.15; 
    if (currentWave > 20) multiplier = 1.25;
    if (currentWave > 50) multiplier = 1.40;
    if (isNextBoss) multiplier *= 4; 
    return Math.floor(currentMax * multiplier);
  };

  useEffect(() => {
    if (enemyHp <= 0 && enemyMaxHp > 0) {
      const rewardGold = isRaidBossWave ? 5000 * wave : 500 * wave;
      const rewardGems = isRaidBossWave ? 10 : 0;
      setRes(r => ({ ...r, gold: r.gold + rewardGold, gems: r.gems + rewardGems }));
      addFloatingText(`+${formatNum(rewardGold)} Or`, 'enemy-base', 'gold', 1.2);
      if (rewardGems) addFloatingText(`+${rewardGems} Gemmes`, 'enemy-base', 'crit', 1.5);
      
      if (isRaidBossWave && Math.random() < 0.4) {
        const dropType = Math.random();
        if (dropType < 0.33) { setRelics(r => ({...r, goldBonus: r.goldBonus + 0.1})); addFloatingText('Relique Or!', 'enemy-base', 'crit'); }
        else if (dropType < 0.66) { setRelics(r => ({...r, critBonus: r.critBonus + 0.05})); addFloatingText('Relique Crit!', 'enemy-base', 'crit'); }
        else { setRelics(r => ({...r, dmgBonus: r.dmgBonus + 0.1})); addFloatingText('Relique Dégâts!', 'enemy-base', 'crit'); }
      }

      setWave(prev => prev + 1); setRaidTimer(30);
      setPlayerHp(prev => Math.min(maxPlayerHp, prev + (maxPlayerHp * 0.2)));

      setTimeout(() => {
        setEnemyMaxHp(prevMax => {
          const newMax = getNextHp(prevMax, wave);
          setEnemyHp(newMax); return newMax;
        });
      }, 500);
    }
  }, [enemyHp, wave, maxPlayerHp, isRaidBossWave]);

  // --- PRESTIGE ---
  const handleRebirth = () => {
    if (wave >= 50) {
      const medalsEarned = Math.floor(wave / 10);
      setPrestige(p => ({ ...p, medals: p.medals + medalsEarned }));
      setWave(1); setRes(r => ({ ...r, gold: prestigeUps.startGold })); 
      setGrid(Array(GRID_SIZE).fill(null)); setEnemyMaxHp(1000); setEnemyHp(1000); setPlayerHp(maxPlayerHp); setRageTimer(0);
      alert(`🌠 PRESTIGE ! +${medalsEarned} Médailles de Bravoure.`);
      setCurrentTab('prestige');
    }
  };

  const hardReset = () => {
    if (window.confirm("⚠️ ATTENTION ! Voulez-vous tout effacer et recommencer à zéro ?")) {
      localStorage.removeItem(SAVE_KEY);
      window.location.reload();
    }
  };

  const exportSave = () => {
    navigator.clipboard.writeText(btoa(JSON.stringify(stateRef.current)));
    alert("Sauvegarde copiée dans le presse-papier !");
  };

  // --- RENDER ---
  if (!isLoaded) return <div className="loading-screen">Connexion au Front...</div>;
  const isHpCritical = playerHp / maxPlayerHp < 0.3;

  return (
    <div className={`game-wrapper ${settings.colorblind ? 'colorblind-mode' : ''} ${cameraPunch ? 'camera-punch' : ''}`}>
      <canvas ref={canvasRef} className="vfx-canvas" />
      
      <div className={`game-container ${isRaidBossWave ? 'raid-alert' : ''} weather-${BETA_FEATURES ? weather : 'clear'} ${isHpCritical ? 'critical-hp-vignette' : ''}`}>
        
        {afkReward.gold > 0 && (
          <div className="modal-overlay">
            <div className="modal-box pop-in-jackpot">
              <h2>Rapport d'Absence</h2><div className="modal-icon">🌙</div>
              <div className="modal-amount">+{formatNum(afkReward.gold)} Or</div>
              <div className="modal-amount" style={{color: '#94a3b8', fontSize: '18px'}}>+{formatNum(afkReward.steel)} Acier</div>
              <button className="confirm-btn" onClick={() => setAfkReward({gold:0, steel:0})}>Retour au Front</button>
            </div>
          </div>
        )}

        {artilleryFlash && <div className="artillery-flash"></div>}
        {critFlash && <div className="crit-flash"></div>}

        <header className="global-header">
          <div className="header-stats">
            <div className="res-item"><span className="icon">💰</span> <span className="val" style={{color: '#fbbf24'}}>{formatNum(res.gold)}</span></div>
            <div className="res-item"><span className="icon">💎</span> <span className="val" style={{color: '#38bdf8'}}>{formatNum(res.gems)}</span></div>
            <div className="res-item"><span className="icon">⚙️</span> <span className="val" style={{color: '#94a3b8'}}>{formatNum(res.steel)}</span></div>
            <div className="res-item"><span className="icon">🔬</span> <span className="val" style={{color: '#a855f7'}}>{formatNum(res.rp)}</span></div>
          </div>
          <div className="header-right">
            {combo > 1 && <div className="combo-meter">x{combo} COMBO</div>}
            <div className={`wave-badge ${isRaidBossWave ? 'boss-badge' : ''}`}>
              {isRaidBossWave ? '⚠️ BOSS ⚠️' : `VAGUE ${wave}`}
            </div>
            <div className="wave-progress"><div className="wave-progress-fill" style={{width: `${(enemyMaxHp - enemyHp) / enemyMaxHp * 100}%`}}></div></div>
          </div>
        </header>

        {/* ========================================================= */}
        {/* ONGLET 1 : FRONT (COMBAT) */}
        {/* ========================================================= */}
        {currentTab === 'battle' && (
          <div className="tab-content fade-in">
            <div className="synergy-bar">
              {waveEvent === 'supply' && <span className="buff-good">📦 Ravitaillement</span>}
              {waveEvent === 'ambush' && <span className="buff-bad">⚠️ Embuscade</span>}
              {synergyBuffs.dmgMult > 1 && <span className="buff-sniper">🎯 Snipers Actifs</span>}
              {BETA_FEATURES && weather !== 'clear' && <span className="buff-weather">☁️ {weather}</span>}
              {rageTimer > 0 && <span className="buff-rage">💉 RAGE ({rageTimer}s)</span>}
            </div>

            <div className="battlefield-section">
              <div className="battlefield-texture"></div>
              {isRaidBossWave && <div className="raid-timer">00:{raidTimer < 10 ? `0${raidTimer}` : raidTimer}</div>}

              <div className="ulti-container" onClick={triggerUltimate}>
                <div className="ulti-bar" style={{ width: `${ultiGauge}%`, backgroundColor: ultiGauge === 100 ? '#f59e0b' : '#3b82f6' }}></div>
                <div className="ulti-text">{ultiGauge === 100 ? '🔥 FRAPPE D\'ARTILLERIE 🔥' : `Artillerie ${Math.floor(ultiGauge)}%`}</div>
              </div>

              <div className="battlefield">
                <div className={`base-structure player-base ${screenShake.includes('player') ? 'shake-anim' : ''} ${screenShake.includes('massive') ? 'shake-massive' : ''}`}>
                  <div className="base-building">⛺</div>
                  <div className="hp-bar-container"><div className="hp-bar player-hp" style={{ width: `${Math.max(0, (playerHp / maxPlayerHp) * 100)}%` }}></div></div>
                  <div className="hp-text">{formatNum(playerHp)} / {formatNum(maxPlayerHp)}</div>
                  {floatingTexts.filter(t => t.target === 'player-base').map(text => (
                    <div key={text.id} className="floating-damage damage-red" style={{ left: `calc(50% + ${text.offsetX})`, top: `calc(50% + ${text.offsetY})` }}>-{text.damage}</div>
                  ))}
                  <div className="troop-spawn-zone">
                    {activeTroops.map((troop, idx) => (
                      <div key={`${troop.id}-${idx}`} className={`combat-unit unit-lvl-${troop.level} troop-charge ${troop.level >= 5 ? 'trail-fx' : ''}`} style={{ top: `${(idx % 3) * 35}px`, left: `${Math.floor(idx / 3) * 15}px` }}>{UNIT_TYPES[troop.level]?.icon}</div>
                    ))}
                  </div>
                </div>

                {activeEnemy && (
                  <div className="active-enemy enemy-charge">
                    <div className="enemy-sprite">{activeEnemy.sprite}</div>
                  </div>
                )}

                <div className={`base-structure enemy-base ${enemyHp <= 0 ? 'shatter-anim' : ''} ${screenShake.includes('base') ? 'shake-anim' : ''} ${screenShake.includes('massive') ? 'shake-massive' : ''}`}>
                  <div className="base-building" style={{ fontSize: isRaidBossWave ? '70px' : '50px' }}>{isRaidBossWave ? '🦑' : '🏯'}</div>
                  <div className="hp-bar-container">
                    <div className="hp-bar enemy-chip-hp" style={{ width: `${Math.max(0, (enemyHp / enemyMaxHp) * 100)}%` }}></div>
                    <div className="hp-bar enemy-main-hp" style={{ width: `${Math.max(0, (enemyHp / enemyMaxHp) * 100)}%` }}></div>
                  </div>
                  <div className="hp-text">{formatNum(enemyHp)} / {formatNum(enemyMaxHp)}</div>
                  {floatingTexts.filter(t => t.target === 'enemy-base').map(text => (
                    <div key={text.id} className={`floating-damage ${text.type === 'gold' ? 'damage-gold' : text.type === 'crit' ? 'damage-crit' : 'damage-white'}`} style={{ left: `calc(50% + ${text.offsetX})`, top: `calc(50% + ${text.offsetY})`, transform: `scale(${text.sizeMult})` }}>
                      {text.type === 'gold' ? '' : '-'}{text.damage}{text.type === 'crit' ? '!' : ''}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="action-row">
              <div style={{display: 'flex', flexDirection: 'column', flex: 1, gap: '5px'}}>
                <button className="summon-btn" onClick={() => handleSummon(false)} disabled={res.gold < summonCost || !grid.includes(null)}>
                  <span className="btn-title">INVOQUER</span><span className="btn-cost">💳 {formatNum(summonCost)}</span>
                </button>
                <div className="pity-container" onClick={() => { if(pity >= 100 && grid.includes(null)) handleSummon(true) }}>
                  <div className="pity-bar" style={{ width: `${pity}%`, background: pity >= 100 ? '#eab308' : '#a855f7' }}></div>
                  <div className="pity-text">{pity >= 100 ? '✨ GARANTI ✨' : `Pity: ${pity}%`}</div>
                </div>
              </div>
              <button className="assault-btn" onClick={handleAssault} disabled={!grid.some(cell => cell !== null) || activeTroops.length > 0}>⚔️ ASSAUT</button>
            </div>

            <div className="grid-container">
              <div className="grid-background-pattern"></div>
              {grid.map((cell, index) => {
                const isSelected = selectedSlot === index;
                const isMergeable = selectedSlot !== null && selectedSlot !== index && cell && grid[selectedSlot].level === cell.level && cell.level < 8;
                const animClass = animatingCells[index] || '';
                return (
                  <div key={index} className={`grid-cell ${isSelected ? 'selected-pulse' : ''} ${isMergeable ? 'merge-hint' : ''} ${animClass}`} onClick={() => handleCellClick(index)}>
                    {cell && (
                      <div className={`unit-card unit-lvl-${cell.level}`}>
                        {cell.equip === 'medal' && <div className="equip-badge">🎖️</div>}
                        <div className="unit-image">{UNIT_TYPES[cell.level]?.icon}</div>
                        <div className="unit-info"><span className="unit-name">{UNIT_TYPES[cell.level]?.name}</span></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ONGLET 2 : BASE & INFRASTRUCTURES */}
        {/* ========================================================= */}
        {currentTab === 'base' && (
          <div className="tab-content hq-section fade-in">
            <h2>🏗️ Gestion de la Base</h2>
            <p className="hq-desc">Développez vos bâtiments pour générer plus de ressources.</p>
            <div className="upgrades-list">
              <div className="upgrade-card consumable-card">
                <div className="up-icon">💉</div>
                <div className="up-info"><h3 style={{color: '#ef4444'}}>Sérum de Rage</h3><p>Dégâts x2 pendant 15s.</p></div>
                <button className="up-btn consumable-btn" disabled={res.gold < 5000 || rageTimer > 0} onClick={buyRageSerum}>{rageTimer > 0 ? 'ACTIF' : '5K 💰'}</button>
              </div>
              <div className="upgrade-card">
                <div className="up-icon">⛺</div>
                <div className="up-info"><h3>Quartier Général (Niv.{buildings.hq})</h3><p>Débloque les bâtiments. +500 HP.</p></div>
                <button className="up-btn" disabled={res.steel < buildings.hq * 100} onClick={() => { setRes(r=>({...r, steel: r.steel - buildings.hq * 100})); setBuildings(b=>({...b, hq: b.hq + 1})); setPlayerHp(p => p + 500); }}>{buildings.hq * 100} ⚙️</button>
              </div>
              <div className="upgrade-card">
                <div className="up-icon">🏭</div>
                <div className="up-info"><h3>Raffinerie (Niv.{buildings.refinery})</h3><p>+{formatNum((buildings.refinery+1)*2)} Or/s, +1 Acier/s.</p></div>
                <button className="up-btn" disabled={res.gold < (buildings.refinery+1) * 1000 || buildings.hq < 2} onClick={() => { setRes(r=>({...r, gold: r.gold - (buildings.refinery+1) * 1000})); setBuildings(b=>({...b, refinery: b.refinery + 1})); }}>{buildings.hq < 2 ? 'QG Niv.2 req.' : `${formatNum((buildings.refinery+1) * 1000)} 💰`}</button>
              </div>
              <div className="upgrade-card">
                <div className="up-icon">🔬</div>
                <div className="up-info"><h3>Laboratoire (Niv.{buildings.lab})</h3><p>Génère +1 Point de Recherche (RP) par seconde.</p></div>
                <button className="up-btn" disabled={res.steel < (buildings.lab+1) * 50 || buildings.hq < 3} onClick={() => { setRes(r=>({...r, steel: r.steel - (buildings.lab+1) * 50})); setBuildings(b=>({...b, lab: b.lab + 1})); }}>{buildings.hq < 3 ? 'QG Niv.3 req.' : `${(buildings.lab+1) * 50} ⚙️`}</button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ONGLET 3 : LABO DE RECHERCHE */}
        {/* ========================================================= */}
        {currentTab === 'lab' && (
          <div className="tab-content hq-section fade-in">
            <h2 style={{color: '#a855f7'}}>🔬 Arbre Technologique</h2>
            <p className="hq-desc">Dépensez vos RP ({res.rp} 🔬) pour des buffs passifs.</p>
            <div className="upgrades-list">
              <div className="upgrade-card" style={{borderColor: '#a855f7'}}>
                <div className="up-icon">⚔️</div>
                <div className="up-info"><h3>Munitions Lourdes (Niv.{research.dmgTech})</h3><p>+10% Dégâts globaux.</p></div>
                <button className="up-btn" style={{background:'#a855f7', color:'white'}} disabled={res.rp < (research.dmgTech+1) * 100} onClick={() => { setRes(r=>({...r, rp: r.rp - (research.dmgTech+1) * 100})); setResearch(re=>({...re, dmgTech: re.dmgTech + 1})); }}>{(research.dmgTech+1) * 100} 🔬</button>
              </div>
              <div className="upgrade-card" style={{borderColor: '#a855f7'}}>
                <div className="up-icon">📈</div>
                <div className="up-info"><h3>Optimisation Fiscale (Niv.{research.ecoTech})</h3><p>+10% Or global. Niv 5 = Auto-Summon. Niv 8 = Auto-Merge.</p></div>
                <button className="up-btn" style={{background:'#a855f7', color:'white'}} disabled={res.rp < (research.ecoTech+1) * 150} onClick={() => { setRes(r=>({...r, rp: r.rp - (research.ecoTech+1) * 150})); setResearch(re=>({...re, ecoTech: re.ecoTech + 1})); }}>{(research.ecoTech+1) * 150} 🔬</button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ONGLET 4 : PRESTIGE & CODEX */}
        {/* ========================================================= */}
        {currentTab === 'prestige' && (
          <div className="tab-content hq-section fade-in">
            <h2 className="rainbow-text">🌌 Ascension & Héritage</h2>
            <p className="hq-desc">Médailles : <strong style={{color: '#fbbf24'}}>{prestige.medals} 🏅</strong> | Cristaux : <strong style={{color: '#38bdf8'}}>{prestige.crystals} 💎</strong></p>
            
            <div className="prestige-tree">
              <div className="upgrade-card prestige-card"><div className="up-icon">⚔️</div><div className="up-info"><h3>Puissance Pure</h3><p>Dégâts x{prestigeUps.dmgMult.toFixed(1)}</p></div><button className="up-btn prestige-btn" disabled={prestige.medals < 1} onClick={() => { setPrestige(p=>({...p, medals: p.medals-1})); setPrestigeUps(u=>({...u, dmgMult: u.dmgMult+0.5})) }}>1 🏅</button></div>
              <button className="rebirth-btn" disabled={wave < 50} onClick={handleRebirth}>{wave < 50 ? `Atteindre Vague 50 (${wave}/50)` : '⭐ EFFECTUER LE PRESTIGE ⭐'}</button>
            </div>

            <h3 style={{color: '#06b6d4', marginTop:'20px'}}>📖 Codex & Reliques Actives</h3>
            <div className="relics-container">
              <div className="relic-item">🏺 <span>+{(relics.goldBonus * 100).toFixed(0)}% Or</span></div>
              <div className="relic-item">👁️ <span>+{(relics.critBonus * 100).toFixed(0)}% Crit</span></div>
              <div className="relic-item">⚔️ <span>+{(relics.dmgBonus * 100).toFixed(0)}% Dmg</span></div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ONGLET 5 : SOCIAL (BETA) */}
        {/* ========================================================= */}
        {currentTab === 'social' && BETA_FEATURES && (
          <div className="tab-content hq-section fade-in">
            <h2>🌐 Réseau d'Alliances (BETA)</h2>
            <p className="hq-desc">Classement Local de votre secteur.</p>
            <div className="upgrades-list">
              <div className="setting-row"><strong>1. TueurDeTanks99</strong> <span>Vague 145</span></div>
              <div className="setting-row"><strong>2. MergeMaster</strong> <span>Vague 112</span></div>
              <div className="setting-row" style={{border: '1px solid #38bdf8', color: '#38bdf8'}}><strong>3. Vous (Joueur)</strong> <span>Vague {wave}</span></div>
              <div className="setting-row"><strong>4. NoobSaibot</strong> <span>Vague 12</span></div>
            </div>
            <button className="up-btn consumable-btn" style={{marginTop: '20px', width: '100%', background: '#475569', boxShadow: 'none'}}>Rejoindre un Clan (Bientôt)</button>
          </div>
        )}

        {/* ========================================================= */}
        {/* ONGLET 6 : REGLAGES */}
        {/* ========================================================= */}
        {currentTab === 'settings' && (
          <div className="tab-content hq-section fade-in">
            <h2>⚙️ Réglages Système</h2>
            <div className="upgrades-list">
              <div className="setting-row"><span>✨ Particules & VFX</span><input type="checkbox" checked={settings.vfx} onChange={e => setSettings(s => ({...s, vfx: e.target.checked}))} /></div>
              <div className="setting-row"><span>🔊 Bruitages (SFX)</span><input type="checkbox" checked={settings.sfx} onChange={e => setSettings(s => ({...s, sfx: e.target.checked}))} /></div>
              <div className="setting-row"><span>🎵 Ambiance Sonore</span><input type="checkbox" checked={settings.bgm} onChange={e => setSettings(s => ({...s, bgm: e.target.checked}))} /></div>
              <div className="setting-row"><span>👁️ Mode Daltonien</span><input type="checkbox" checked={settings.colorblind} onChange={e => setSettings(s => ({...s, colorblind: e.target.checked}))} /></div>
              {BETA_FEATURES && <div className="setting-row" style={{border: '1px dashed #ef4444'}}><span style={{color: '#ef4444'}}>🧪 BETA: Auto-Assaut</span><input type="checkbox" checked={settings.autoBattle} onChange={e => setSettings(s => ({...s, autoBattle: e.target.checked}))} /></div>}
              
              <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                <button className="confirm-btn" style={{flex: 1, fontSize: '12px'}} onClick={exportSave}>💾 Exporter Save</button>
                <button className="confirm-btn" style={{flex: 1, fontSize: '12px', background: '#ef4444', boxShadow: '0 4px 0 #7f1d1d'}} onClick={hardReset}>☢️ Reset Total</button>
              </div>
            </div>
          </div>
        )}

        {/* BARRE DE NAVIGATION INFÉRIEURE */}
        <nav className="bottom-nav">
          <div className={`nav-item ${currentTab === 'battle' ? 'active' : ''}`} onClick={() => setCurrentTab('battle')}><div className="nav-icon">⚔️</div><span>Front</span></div>
          <div className={`nav-item ${currentTab === 'base' ? 'active' : ''}`} onClick={() => setCurrentTab('base')}><div className="nav-icon">🏗️</div><span>Base</span></div>
          <div className={`nav-item ${currentTab === 'lab' ? 'active' : ''}`} onClick={() => setCurrentTab('lab')}><div className="nav-icon">🔬</div><span>Labo</span></div>
          <div className={`nav-item ${currentTab === 'prestige' ? 'active' : ''}`} onClick={() => setCurrentTab('prestige')}><div className="nav-icon">🌌</div><span>Héros</span></div>
          {BETA_FEATURES && <div className={`nav-item ${currentTab === 'social' ? 'active' : ''}`} onClick={() => setCurrentTab('social')}><div className="nav-icon">🌐</div><span>Clan</span></div>}
          <div className={`nav-item ${currentTab === 'settings' ? 'active' : ''}`} onClick={() => setCurrentTab('settings')}><div className="nav-icon">⚙️</div><span>Options</span></div>
        </nav>

      </div>
    </div>
  );
}

// Export enveloppé par l'ErrorBoundary pour la sécurité absolue
export default function GameBoard() {
  return (
    <ErrorBoundary>
      <GameBoardContent />
    </ErrorBoundary>
  );
}