import React, { useState, useEffect, useRef, useCallback } from 'react';
import './GameBoard.css';

// ==========================================
// CONFIGURATION & ASSETS
// ==========================================
const SAVE_KEY = 'trench_tycoon_save_ultimate_v8';

// Génération de vrais sprites 2D
const getSprite = (seed) => `https://api.dicebear.com/7.x/bottts/svg?seed=${seed}&backgroundColor=transparent`;

const UNIT_TYPES = {
  1: { name: 'Recrue', img: getSprite('Recruit1'), color: '#94a3b8' },
  2: { name: 'Infanterie', img: getSprite('Infantry2'), color: '#3b82f6' },
  3: { name: 'Blindé', img: getSprite('Armor3'), color: '#a855f7' },
  4: { name: 'Tank Léger', img: getSprite('Tank4'), color: '#eab308' },
  5: { name: 'Mecha', img: getSprite('Mech5'), color: '#ef4444' },
  6: { name: 'Titan', img: getSprite('Titan6'), color: '#000000' },
  7: { name: 'Éveillé', img: getSprite('Awaken7'), color: '#06b6d4' },
  8: { name: 'Dieu de Guerre', img: getSprite('God8'), color: '#f472b6' }
};

const GRID_SIZE = 12;
const DAMAGE_MAP = { 1: 5, 2: 25, 3: 100, 4: 400, 5: 1500, 6: 6000, 7: 25000, 8: 120000 };
const HP_MAP = { 1: 20, 2: 80, 3: 300, 4: 1200, 5: 5000, 6: 20000, 7: 80000, 8: 300000 };

const formatNum = (num) => {
  if (num == null) return "0";
  if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return Math.floor(num).toString();
};

// ==========================================
// MOTEUR DE PARTICULES (VFX Canvas Sécurisé)
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
  emit(x, y, color, type = 'spark', count = 10) {
    if (!this.ctx) return;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x, y,
        vx: (Math.random() - 0.5) * (type === 'explosion' ? 15 : 8),
        vy: (Math.random() - 0.5) * 10 - (type === 'spark' ? 2 : 0),
        life: 1, color,
        size: type === 'explosion' ? Math.random() * 6 + 3 : Math.random() * 3 + 1,
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
      if (p.type === 'spark') p.vy += 0.4; 
      p.life -= p.type === 'explosion' ? 0.04 : 0.02;
      
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
// ERROR BOUNDARY ANTI-CRASH
// ==========================================
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'white', background: '#0f172a', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2>💥 Erreur Critique du Moteur</h2>
          <p style={{ color: '#ef4444', background: 'rgba(0,0,0,0.5)', padding: '10px' }}>{this.state.error?.toString()}</p>
          <button onClick={() => { localStorage.removeItem(SAVE_KEY); window.location.reload(); }} style={{ padding: '15px', background: '#dc2626', color: 'white', borderRadius: '8px', marginTop: '20px' }}>
            ☢️ Effacer la Sauvegarde (Hard Reset)
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ==========================================
// COMPOSANT JEU PRINCIPAL
// ==========================================
function GameBoardContent() {
  const [gameStarted, setGameStarted] = useState(false); // Fix écran blanc Audio
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentTab, setCurrentTab] = useState('battle'); 
  
  // --- ÉTATS JOUEUR & PROFILS ---
  const [profile, setProfile] = useState({ name: 'Commandant', avatar: '🪖', frame: 'default', title: 'Recrue' });
  const [settings, setSettings] = useState({ vfx: true, sfx: true, bgm: false, colorblind: false, autoBattle: false });

  // --- ECONOMIE ---
  const [res, setRes] = useState({ gold: 150, gems: 0, keys: 0, rp: 0 });
  const [wave, setWave] = useState(1);
  const [grid, setGrid] = useState(Array(GRID_SIZE).fill(null));
  
  // --- BASE & LABO ---
  const [buildings, setBuildings] = useState({ hq: 1, refinery: 0, lab: 0 });
  const [lab, setLab] = useState({ goldGen: 1, baseHp: 1, summonCostReduc: 0, speed: 0, crit: 0, autoSummon: 0, autoMerge: 0 });
  
  // --- PRESTIGE & LOOT ---
  const [prestige, setPrestige] = useState({ medals: 0, crystals: 0 });
  const [prestigeUps, setPrestigeUps] = useState({ dmgMult: 1, startGold: 0, afkYield: 1 });
  const [relics, setRelics] = useState({ goldBonus: 0, critBonus: 0, dmgBonus: 0 });

  // --- COMBAT BIDIRECTIONNEL ---
  const [combatState, setCombatState] = useState({ playerHp: 500, enemyMaxHp: 100, enemyHp: 100, energy: 100, combo: 0 });
  const [field, setField] = useState({ troops: [], enemies: [] });
  const [ultiGauge, setUltiGauge] = useState(0); 
  const [rageTimer, setRageTimer] = useState(0); 

  const isRaidBossWave = wave % 10 === 0;
  const [raidTimer, setRaidTimer] = useState(30);
  const [weather, setWeather] = useState('clear');
  const [waveEvent, setWaveEvent] = useState(null); 

  // --- GACHA & UI ---
  const [pity, setPity] = useState(0);
  const [activeBanner, setActiveBanner] = useState('standard');
  const [uiState, setUiState] = useState({ showProfile: false, showDaily: false, cinematic: null, afkReward: null });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [animatingCells, setAnimatingCells] = useState({});
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [cameraPunch, setCameraPunch] = useState(false);
  const [screenShake, setScreenShake] = useState('');
  const [artilleryFlash, setArtilleryFlash] = useState(false);
  const [lastDaily, setLastDaily] = useState(0);

  const canvasRef = useRef(null);
  const particleEngine = useRef(null);
  const bgmRef = useRef(null);
  const stateRef = useRef({});

  // --- SYNERGIES CALCULÉES ---
  const synergyBuffs = useMemo(() => {
    const counts = {};
    grid.forEach(c => { if (c) counts[c.level] = (counts[c.level] || 0) + 1; });
    return { 
      dmgMult: counts[2] >= 3 ? 1.5 : 1, 
      extraHp: counts[4] >= 2 ? 1000 : 0 
    };
  }, [grid]);

  const maxPlayerHp = 500 + (buildings.hq * 500) + (lab.baseHp * 250) + synergyBuffs.extraHp;
  const summonCost = Math.max(10, Math.floor(30 * Math.pow(1.08, grid.filter(c => c !== null).length + wave) - (lab.summonCostReduc * 2)));

  // --- FONCTIONS UTILITAIRES ---
  const addFloatingText = useCallback((damage, x, y, type = 'normal', sizeMult = 1) => {
    const newText = { id: Date.now() + Math.random(), text: typeof damage === 'number' ? formatNum(damage) : damage, x, y, type, sizeMult };
    setFloatingTexts(prev => [...prev, newText]);
    setTimeout(() => setFloatingTexts(prev => prev.filter(ft => ft.id !== newText.id)), 1000);
  }, []);

  const triggerAnim = useCallback((index, anim) => {
    setAnimatingCells(prev => ({ ...prev, [index]: anim }));
    setTimeout(() => setAnimatingCells(prev => { const n = { ...prev }; delete n[index]; return n; }), 500); 
  }, []);

  const doCameraPunch = useCallback(() => {
    if (!settings.vfx) return;
    setCameraPunch(true); setTimeout(() => setCameraPunch(false), 300);
  }, [settings.vfx]);

  const triggerShake = useCallback((type, duration = 500) => {
    setScreenShake(type); setTimeout(() => setScreenShake(''), duration);
  }, []);

  const playSfx = useCallback((type) => {
    if (!settings.sfx) return;
    const urls = { 
      merge: 'https://actions.google.com/sounds/v1/weapons/laser_gun.ogg', 
      hit: 'https://actions.google.com/sounds/v1/weapons/bullet_impact_dirt.ogg', 
      ult: 'https://actions.google.com/sounds/v1/weapons/huge_explosion.ogg' 
    };
    if (urls[type]) { const a = new Audio(urls[type]); a.volume = 0.3; a.play().catch(()=>{}); }
  }, [settings.sfx]);

  const handleGameOver = useCallback(() => {
    alert(`💥 DÉFAITE ! Le front est tombé à la Vague ${wave}.`);
    setCombatState(prev => ({ ...prev, playerHp: maxPlayerHp, enemyMaxHp: 100, enemyHp: 100, combo: 0 }));
    setWave(1); setGrid(Array(GRID_SIZE).fill(null)); setField({ troops: [], enemies: [] }); setUltiGauge(0); setRageTimer(0);
  }, [wave, maxPlayerHp]);

  // --- SYNCHRONISATION SAUVEGARDE ---
  useEffect(() => {
    stateRef.current = { profile, settings, res, wave, grid, buildings, lab, prestige, prestigeUps, relics, combatState, pity, lastDaily };
  }, [profile, settings, res, wave, grid, buildings, lab, prestige, prestigeUps, relics, combatState, pity, lastDaily]);

  // --- CHARGEMENT ---
  useEffect(() => {
    const saved = localStorage.getItem(SAVE_KEY);
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setProfile(p.profile ?? { name: 'Commandant', avatar: '🪖', frame: 'default', title: 'Recrue' });
        setSettings(p.settings ?? { vfx: true, sfx: true, bgm: false, colorblind: false, autoBattle: false });
        setRes(p.res ?? { gold: 150, gems: 0, keys: 0, rp: 0 });
        setWave(p.wave ?? 1);
        setGrid(p.grid ?? Array(GRID_SIZE).fill(null));
        setBuildings(p.buildings ?? { hq: 1, refinery: 0, lab: 0 });
        setLab(p.lab ?? { goldGen: 1, baseHp: 1, summonCostReduc: 0, speed: 0, crit: 0, autoSummon: 0, autoMerge: 0 });
        setPrestige(p.prestige ?? { medals: 0, crystals: 0 });
        setPrestigeUps(p.prestigeUps ?? { dmgMult: 1, startGold: 0, afkYield: 1 });
        setRelics(p.relics ?? { goldBonus: 0, critBonus: 0, dmgBonus: 0 });
        setCombatState(p.combatState ?? { playerHp: 500, enemyMaxHp: 100, enemyHp: 100, energy: 100, combo: 0 });
        setPity(p.pity ?? 0);
        setLastDaily(p.lastDaily ?? 0);
        
        if (p.lastLogin) {
          const diffSecs = Math.floor((Date.now() - p.lastLogin) / 1000);
          if (diffSecs > 60) {
            const effSecs = Math.min(diffSecs, 12 * 3600);
            const goldEarned = Math.floor(effSecs * (2 + (p.buildings?.refinery || 0)*2) * (p.prestigeUps?.afkYield || 1));
            setRes(r => ({ ...r, gold: r.gold + goldEarned }));
            setUiState(u => ({ ...u, afkReward: goldEarned }));
          }
        }
      } catch (e) { console.error("Save error", e); }
    }
    setIsLoaded(true);
  }, []);

  // --- AUDIO & VFX (Au clic 'Jouer') ---
  useEffect(() => {
    if (gameStarted && settings.vfx && canvasRef.current && !particleEngine.current) {
      particleEngine.current = new ParticleEngine(canvasRef.current);
      particleEngine.current.update();
    }
    if (gameStarted && !bgmRef.current) {
      bgmRef.current = new Audio('https://actions.google.com/sounds/v1/ambiences/outdoor_battle_with_distant_explosions.ogg');
      bgmRef.current.loop = true; bgmRef.current.volume = 0.2;
      if (settings.bgm) bgmRef.current.play().catch(()=>{});
    }
  }, [gameStarted, settings.vfx, settings.bgm]);

  useEffect(() => {
    if (bgmRef.current) { settings.bgm ? bgmRef.current.play().catch(()=>{}) : bgmRef.current.pause(); }
  }, [settings.bgm]);

  // --- SAUVEGARDE AUTO (10s) ---
  useEffect(() => {
    if (!isLoaded || !gameStarted) return;
    const saveTimer = setInterval(() => localStorage.setItem(SAVE_KEY, JSON.stringify({ ...stateRef.current, lastLogin: Date.now() })), 10000);
    return () => clearInterval(saveTimer);
  }, [isLoaded, gameStarted]);

  // --- BOUCLE ÉCONOMIE & MÉTÉO (1s) ---
  useEffect(() => {
    if (!isLoaded || !gameStarted) return;
    const ecoTimer = setInterval(() => {
      const goldGain = (2 + buildings.refinery * 2 + lab.goldGen) * (1 + relics.goldBonus) * (waveEvent === 'supply' ? 2 : 1);
      setRes(r => ({ ...r, gold: r.gold + goldGain, rp: r.rp + (buildings.lab > 0 ? buildings.lab : 0) }));
      setCombatState(c => ({ ...c, energy: Math.min(100, c.energy + 5), combo: Math.max(0, c.combo - 1) }));
      if (rageTimer > 0) setRageTimer(rt => Math.max(0, rt - 1));
      
      // Spawn ennemi passif
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
  }, [isLoaded, gameStarted, buildings, lab, relics, waveEvent, currentTab, wave, isRaidBossWave, field.enemies.length, rageTimer]);

  useEffect(() => {
    const w = ['clear', 'clear', 'rain', 'snow', 'heat'];
    const wt = setInterval(() => setWeather(w[Math.floor(Math.random() * w.length)]), 45000);
    return () => clearInterval(wt);
  }, []);

  useEffect(() => {
    if (Math.random() < 0.1) setWaveEvent('supply');
    else if (Math.random() < 0.15) setWaveEvent('ambush');
    else setWaveEvent(null);
  }, [wave]);

  // --- AUTOMATISATION (LABO) ---
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
  }, [isLoaded, gameStarted, lab.autoSummon, wave, lab.summonCostReduc, triggerAnim]);

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
  }, [isLoaded, gameStarted, lab.autoMerge, triggerAnim, playSfx]);

  useEffect(() => {
    if (BETA_FEATURES && settings.autoBattle && grid.some(c => c !== null) && combatState.energy >= 20 && field.troops.length === 0) {
        const timer = setTimeout(() => handleAssault(), 1500);
        return () => clearTimeout(timer);
    }
  }, [settings.autoBattle, grid, combatState.energy, field.troops.length]);

  // --- COMBAT BIDIRECTIONNEL (Toutes les 200ms) ---
  useEffect(() => {
    if (!gameStarted || currentTab !== 'battle') return;
    const combatTick = setInterval(() => {
      setField(currentField => {
        let newTroops = currentField.troops.map(t => ({...t}));
        let newEnemies = currentField.enemies.map(e => ({...e}));
        let pDamageTaken = 0;
        let eDamageTaken = 0; 

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
          setCombatState(prev => {
            const newHp = Math.max(0, prev.playerHp - pDamageTaken);
            if (newHp === 0) setTimeout(handleGameOver, 100);
            return { ...prev, playerHp: newHp };
          });
          addFloatingText(pDamageTaken, 10, 50, 'damage-red', 1.5);
          triggerShake('player-shake');
        }
        
        if (eDamageTaken > 0) {
          setCombatState(prev => {
            const newHp = Math.max(0, prev.enemyHp - eDamageTaken);
            if (newHp === 0 && prev.enemyHp > 0) {
              setTimeout(() => {
                const reward = isRaidBossWave ? 2000 * wave : 200 * wave;
                setRes(r => ({ ...r, gold: r.gold + reward, keys: r.keys + (Math.random() < 0.1 ? 1 : 0) }));
                addFloatingText(`+${formatNum(reward)}`, 90, 50, 'damage-gold');
                
                if (isRaidBossWave && Math.random() < 0.4) {
                   const dropType = Math.random();
                   if (dropType < 0.33) setRelics(r => ({...r, goldBonus: r.goldBonus + 0.1}));
                   else if (dropType < 0.66) setRelics(r => ({...r, critBonus: r.critBonus + 0.05}));
                   else setRelics(r => ({...r, dmgBonus: r.dmgBonus + 0.1}));
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
            }
            return { ...prev, enemyHp: newHp };
          });
          addFloatingText(eDamageTaken, 90, 50, 'damage-gold', 1.5);
          triggerShake('base-shake');
        }

        return { troops: newTroops, enemies: newEnemies };
      });
    }, 200); 
    return () => clearInterval(combatTick);
  }, [currentTab, gameStarted, weather, prestigeUps, combo, lab.crit, wave, isRaidBossWave, playSfx, addFloatingText, doCameraPunch, settings.vfx, triggerShake, maxPlayerHp, handleGameOver, synergyBuffs.dmgMult, rageTimer, relics]);

  // --- ACTIONS UI ---
  const handleSummon = (isPity = false) => {
    const cost = isPity ? 0 : (activeBanner === 'premium' ? 10 : summonCost);
    const canAfford = isPity || (activeBanner === 'premium' ? res.gems >= cost : res.gold >= cost);

    if (canAfford) {
      const firstEmptyIndex = grid.findIndex(cell => cell === null);
      if (firstEmptyIndex !== -1) {
        if (!isPity) {
          activeBanner === 'premium' ? setRes(r => ({ ...r, gems: r.gems - cost })) : setRes(r => ({ ...r, gold: r.gold - cost }));
        }
        
        let spawnLevel = 1; let animType = 'pop-in';
        
        if (isPity) {
          spawnLevel = 5; setPity(0);
          setUiState(u => ({ ...u, cinematic: UNIT_TYPES[spawnLevel] }));
          setTimeout(() => setUiState(u => ({ ...u, cinematic: null })), 2000);
        } else if (activeBanner === 'premium') {
          spawnLevel = Math.random() > 0.8 ? 4 : 3;
        } else {
          const rand = Math.random();
          if (rand < 0.65) { spawnLevel = 1; setPity(prev => Math.min(100, prev + 5)); } 
          else if (rand < 0.95) { spawnLevel = 2; } 
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
      setUltiGauge(prev => Math.min(100, prev + 10));
      setCombatState(c => ({...c, combo: Math.min(30, c.combo + 1)}));
      playSfx('merge');
      if (settings.vfx && particleEngine.current) particleEngine.current.emit(window.innerWidth/2, window.innerHeight/2, '#fde047', 'spark', 20);
      return;
    }
    setSelectedSlot(index);
  };

  const handleAssault = () => {
    if (combatState.energy < 20) return addFloatingText("Énergie Insuff.", 50, 80, 'damage-red');
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
    setGrid(Array(GRID_SIZE).fill(null)); setSelectedSlot(null);
  };

  const triggerUltimate = () => {
    if (ultiGauge < 100) return;
    setUltiGauge(0); setArtilleryFlash(true); doCameraPunch(); triggerShake('base-shake-massive', 1000); playSfx('ult');
    setTimeout(() => {
      setArtilleryFlash(false);
      const ultiDamage = playerHp * 20 * prestigeUps.dmgMult * (1 + relics.dmgBonus); 
      setField(f => ({ ...f, enemies: [] })); // Wipe enemies
      setCombatState(c => {
         const newHp = Math.max(0, c.enemyHp - ultiDamage);
         addFloatingText(ultiDamage, 90, 50, 'damage-crit', 2);
         if(newHp === 0) addFloatingText("ÉCRASÉ", 90, 40, 'damage-gold', 1.5);
         return { ...c, enemyHp: newHp };
      });
      if (settings.vfx && particleEngine.current) particleEngine.current.emit(window.innerWidth/2, window.innerHeight/3, '#ef4444', 'explosion', 50);
    }, 800);
  };

  const buyRageSerum = () => {
    if (res.gold >= 5000) {
      setRes(r => ({ ...r, gold: r.gold - 5000 }));
      setRageTimer(15); triggerShake('base-shake', 500);
    }
  };

  const handleRebirth = () => {
    if (wave >= 50) {
      const medalsEarned = Math.floor(wave / 10);
      setPrestige(p => ({ ...p, medals: p.medals + medalsEarned }));
      setWave(1); setRes(r => ({ ...r, gold: prestigeUps.startGold })); 
      setGrid(Array(GRID_SIZE).fill(null)); setField({troops:[], enemies:[]});
      setCombatState({ playerHp: maxPlayerHp, enemyMaxHp: 100, enemyHp: 100, energy: 100, combo: 0 });
      setRageTimer(0);
      alert(`🌠 PRESTIGE ! +${medalsEarned} Médailles de Bravoure.`);
      setCurrentTab('prestige');
    }
  };

  // --- RENDU ECRAN D'ACCUEIL ---
  if (!gameStarted) {
    return (
      <div className="start-screen">
        <h1 className="rainbow-text" style={{fontSize:'40px'}}>TRENCH TYCOON</h1>
        <p>Tactical Warfare Edition</p>
        <button className="confirm-btn" style={{width:'80%', padding:'20px', fontSize:'20px'}} onClick={() => setGameStarted(true)}>
          DÉPLOYER LES TROUPES
        </button>
      </div>
    );
  }

  if (!isLoaded) return <div className="loading-screen">Chargement...</div>;
  const isHpCritical = combatState.playerHp / maxPlayerHp < 0.3;

  return (
    <div className={`game-wrapper ${settings.colorblind ? 'colorblind-mode' : ''} ${cameraPunch ? 'camera-punch' : ''}`}>
      <canvas ref={canvasRef} className="vfx-canvas" />
      
      {/* CINEMATIQUE */}
      {uiState.cinematic && (
        <div className="cinematic-overlay">
          <div className="cinematic-content">
            <div className="cine-bg"></div>
            <img src={uiState.cinematic.img} alt="Unit" className="cine-sprite" />
            <h1 style={{color: uiState.cinematic.color}}>{uiState.cinematic.name}</h1>
          </div>
        </div>
      )}

      {/* MODAL PROFIL */}
      {uiState.showProfile && (
        <div className="modal-overlay" onClick={() => setUiState(u => ({...u, showProfile: false}))}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h2 className="rainbow-text">Dossier Militaire</h2>
            <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', justifyContent:'center'}}>
              <div className={`profile-avatar frame-${profile.frame}`}>{profile.avatar}</div>
              <div style={{textAlign: 'left'}}>
                <h3 style={{margin:0}}>{profile.name}</h3>
                <span style={{color: '#a855f7', fontSize: '12px'}}>{profile.title}</span><br/>
                <span style={{color: '#94a3b8', fontSize: '10px'}}>Vague Max: {wave}</span>
              </div>
            </div>
            <input type="text" value={profile.name} onChange={e => setProfile(p => ({...p, name: e.target.value}))} placeholder="Nom de code" className="input-field" />
            <div style={{display: 'flex', gap: '5px', margin: '10px 0', justifyContent:'center'}}>
              {['default', 'gold', 'neon', 'flame'].map(f => (
                <button key={f} className="up-btn" onClick={() => setProfile(p => ({...p, frame: f}))}>{f}</button>
              ))}
            </div>
            <button className="confirm-btn" onClick={() => setUiState(u => ({...u, showProfile: false}))}>Fermer</button>
          </div>
        </div>
      )}

      {/* MODAL AFK */}
      {uiState.afkReward && (
        <div className="modal-overlay">
          <div className="modal-box pop-in-jackpot">
            <h2>Rapport d'Absence</h2><div className="modal-icon">🌙</div>
            <div className="modal-amount">+{formatNum(uiState.afkReward)} Or</div>
            <button className="confirm-btn" onClick={() => setUiState(u => ({...u, afkReward: null}))}>Encaisser</button>
          </div>
        </div>
      )}

      <div className={`game-container ${isRaidBossWave ? 'raid-alert' : ''} weather-${BETA_FEATURES ? weather : 'clear'} ${isHpCritical ? 'critical-hp-vignette' : ''}`}>
        
        {artilleryFlash && <div className="artillery-flash"></div>}
        {screenShake && <div className={`shake-overlay ${screenShake}`}></div>}

        <header className="global-header">
          <div className="header-profile" onClick={() => setUiState(u => ({...u, showProfile: true}))}>
            <div className={`mini-avatar frame-${profile.frame}`}>{profile.avatar}</div>
            <div className="profile-info">
              <span className="profile-name">{profile.name}</span>
            </div>
          </div>
          <div className="header-stats">
            <div className="res-item"><span className="icon">💰</span> <span className="val" style={{color: '#fbbf24'}}>{formatNum(res.gold)}</span></div>
            <div className="res-item"><span className="icon">💎</span> <span className="val" style={{color: '#38bdf8'}}>{formatNum(res.gems)}</span></div>
            <div className="res-item"><span className="icon">⚙️</span> <span className="val" style={{color: '#94a3b8'}}>{formatNum(res.steel)}</span></div>
          </div>
        </header>

        {/* --- FRONT --- */}
        {currentTab === 'battle' && (
          <div className="tab-content fade-in">
            <div className="combat-hud">
              <div className="combo-meter">COMBO x{combatState.combo}</div>
              <div className="energy-meter">⚡ {Math.floor(combatState.energy)}/100</div>
              <div className={`wave-badge ${isRaidBossWave ? 'boss-badge' : ''}`}>{isRaidBossWave ? '⚠️ BOSS ⚠️' : `VAGUE ${wave}`}</div>
            </div>

            <div className="synergy-bar">
              {waveEvent === 'supply' && <span className="buff-good">📦 Ravitaillement</span>}
              {waveEvent === 'ambush' && <span className="buff-bad">⚠️ Embuscade</span>}
              {BETA_FEATURES && weather !== 'clear' && <span className="buff-weather">☁️ {weather}</span>}
              {rageTimer > 0 && <span className="buff-rage">💉 RAGE ({rageTimer}s)</span>}
            </div>

            <div className="battlefield-section">
              <div className="battlefield-texture"></div>
              
              <div className="ulti-container" onClick={triggerUltimate}>
                <div className="ulti-bar" style={{ width: `${ultiGauge}%`, backgroundColor: ultiGauge === 100 ? '#f59e0b' : '#3b82f6' }}></div>
                <div className="ulti-text">{ultiGauge === 100 ? '🔥 FRAPPE ORBITALE 🔥' : `Artillerie ${Math.floor(ultiGauge)}%`}</div>
              </div>

              <div className="battlefield-1d">
                {field.troops.map(t => (
                  <div key={t.id} className="field-entity entity-troop" style={{ left: `${t.x}%` }}>
                    <div className="entity-hp"><div className="entity-hp-fill" style={{width: `${(t.hp/t.maxHp)*100}%`}}></div></div>
                    <img src={UNIT_TYPES[t.level].img} alt="T" />
                  </div>
                ))}
                {field.enemies.map(e => (
                  <div key={e.id} className={`field-entity entity-enemy ${e.isBoss ? 'is-boss' : ''}`} style={{ left: `${e.x}%` }}>
                    <div className="entity-hp"><div className="entity-hp-fill" style={{width: `${(e.hp/e.maxHp)*100}%`, background: '#ef4444'}}></div></div>
                    <img src={UNIT_TYPES[e.level].img} alt="E" />
                  </div>
                ))}
                {floatingTexts.map(ft => (
                  <div key={ft.id} className={`floating-damage damage-${ft.type}`} style={{ left: `${ft.x}%`, top: `${ft.y}px`, transform: `scale(${ft.sizeMult}) translate(-50%, -50%)` }}>{ft.text}</div>
                ))}
              </div>

              <div className="bases-hud">
                <div className="base-hp player">Base: {formatNum(combatState.playerHp)}</div>
                {isRaidBossWave && <div className="raid-timer">00:{raidTimer < 10 ? `0${raidTimer}` : raidTimer}</div>}
                <div className="base-hp enemy">Objectif: {formatNum(combatState.enemyHp)}</div>
              </div>
            </div>

            <div className="action-row">
              <div style={{display: 'flex', flexDirection: 'column', flex: 1, gap: '5px'}}>
                <div className="banner-selector">
                  <button className={activeBanner === 'standard' ? 'active' : ''} onClick={() => setActiveBanner('standard')}>Standard</button>
                  <button className={activeBanner === 'premium' ? 'active' : ''} onClick={() => setActiveBanner('premium')}>Premium</button>
                </div>
                <button className="summon-btn" onClick={() => handleSummon(false)} disabled={(activeBanner === 'premium' ? res.gems < 10 : res.gold < summonCost) || !grid.includes(null)}>
                  <span className="btn-title">INVOQUER</span>
                  <span className="btn-cost">{activeBanner === 'premium' ? `💎 10` : `💳 ${formatNum(summonCost)}`}</span>
                </button>
              </div>
              <button className="assault-btn" onClick={handleAssault} disabled={combatState.energy < 20 || !grid.some(c => c !== null)}>
                ⚔️ DÉPLOYER (-20⚡)
              </button>
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
                      <div className="unit-card">
                        <div className={`aura-glow aura-${cell.level}`}></div>
                        {cell.equip === 'medal' && <div className="equip-badge">🎖️</div>}
                        <img src={UNIT_TYPES[cell.level].img} className="unit-image" alt="unit" />
                        <div className="unit-info"><span className="unit-name" style={{color: UNIT_TYPES[cell.level].color}}>{UNIT_TYPES[cell.level].name}</span></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* --- BASE --- */}
        {currentTab === 'base' && (
          <div className="tab-content hq-section fade-in">
            <h2>🏗️ Base Militaire</h2>
            <div className="upgrades-list">
              <div className="upgrade-card consumable-card">
                <div className="up-icon">💉</div>
                <div className="up-info"><h3 style={{color: '#ef4444'}}>Sérum de Rage</h3><p>Dégâts x2 pendant 15s.</p></div>
                <button className="up-btn consumable-btn" disabled={res.gold < 5000 || rageTimer > 0} onClick={buyRageSerum}>{rageTimer > 0 ? 'ACTIF' : '5K 💰'}</button>
              </div>
              <div className="upgrade-card">
                <div className="up-icon">⛺</div>
                <div className="up-info"><h3>Quartier Général (Niv.{buildings.hq})</h3><p>+500 HP Base.</p></div>
                <button className="up-btn" disabled={res.steel < buildings.hq * 100} onClick={() => { setRes(r=>({...r, steel: r.steel - buildings.hq * 100})); setBuildings(b=>({...b, hq: b.hq + 1})); setCombatState(c => ({...c, playerHp: c.playerHp + 500})); }}>{buildings.hq * 100} ⚙️</button>
              </div>
              <div className="upgrade-card">
                <div className="up-icon">🏭</div>
                <div className="up-info"><h3>Raffinerie (Niv.{buildings.refinery})</h3><p>+{formatNum((buildings.refinery+1)*2)} Or/s, +1 Acier/s.</p></div>
                <button className="up-btn" disabled={res.gold < (buildings.refinery+1) * 1000} onClick={() => { setRes(r=>({...r, gold: r.gold - (buildings.refinery+1) * 1000})); setBuildings(b=>({...b, refinery: b.refinery + 1})); }}>{(buildings.refinery+1) * 1000} 💰</button>
              </div>
              <div className="upgrade-card">
                <div className="up-icon">🔬</div>
                <div className="up-info"><h3>Laboratoire (Niv.{buildings.lab})</h3><p>+1 Point Recherche/s.</p></div>
                <button className="up-btn" disabled={res.steel < (buildings.lab+1) * 50} onClick={() => { setRes(r=>({...r, steel: r.steel - (buildings.lab+1) * 50})); setBuildings(b=>({...b, lab: b.lab + 1})); }}>{(buildings.lab+1) * 50} ⚙️</button>
              </div>
            </div>
          </div>
        )}

        {/* --- LABO --- */}
        {currentTab === 'lab' && (
          <div className="tab-content hq-section fade-in">
            <h2 style={{color: '#a855f7'}}>🔬 Arbre Technologique</h2>
            <div className="upgrades-list">
              <div className="upgrade-card" style={{borderColor: '#a855f7'}}>
                <div className="up-icon">⚔️</div>
                <div className="up-info"><h3>Armement (Niv.{lab.crit})</h3><p>+5% Chances Crit.</p></div>
                <button className="up-btn" style={{background:'#a855f7', color:'white'}} disabled={res.rp < (lab.crit+1) * 100} onClick={() => { setRes(r=>({...r, rp: r.rp - (lab.crit+1) * 100})); setLab(l=>({...l, crit: l.crit + 1})); }}>{(lab.crit+1) * 100} 🔬</button>
              </div>
              <div className="upgrade-card" style={{borderColor: '#a855f7'}}>
                <div className="up-icon">📉</div>
                <div className="up-info"><h3>Logistique (Niv.{lab.summonCostReduc})</h3><p>Réduit le coût d'invocation.</p></div>
                <button className="up-btn" style={{background:'#a855f7', color:'white'}} disabled={res.rp < (lab.summonCostReduc+1) * 150} onClick={() => { setRes(r=>({...r, rp: r.rp - (lab.summonCostReduc+1) * 150})); setLab(l=>({...l, summonCostReduc: l.summonCostReduc + 1})); }}>{(lab.summonCostReduc+1) * 150} 🔬</button>
              </div>
              <div className="upgrade-card" style={{borderColor: '#a855f7'}}>
                <div className="up-icon">🤖</div>
                <div className="up-info"><h3>Auto-Summon</h3><p>{lab.autoSummon > 0 ? 'Actif' : 'Automatise les invocations'}</p></div>
                <button className="up-btn" style={{background:'#a855f7', color:'white'}} disabled={res.rp < 1000 || lab.autoSummon > 0} onClick={() => { setRes(r=>({...r, rp: r.rp - 1000})); setLab(l=>({...l, autoSummon: 1})); }}>{lab.autoSummon > 0 ? 'ACQUIS' : '1000 🔬'}</button>
              </div>
            </div>
          </div>
        )}

        {/* --- PRESTIGE --- */}
        {currentTab === 'prestige' && (
          <div className="tab-content hq-section fade-in">
            <h2 className="rainbow-text">🌌 Ascension</h2>
            <div className="prestige-tree">
              <div className="upgrade-card prestige-card"><div className="up-icon">⚔️</div><div className="up-info"><h3>Dégâts Globaux</h3><p>x{prestigeUps.dmgMult.toFixed(1)}</p></div><button className="up-btn prestige-btn" disabled={prestige.medals < 1} onClick={() => { setPrestige(p=>({...p, medals: p.medals-1})); setPrestigeUps(u=>({...u, dmgMult: u.dmgMult+0.5})) }}>1 🏅</button></div>
              <button className="rebirth-btn" disabled={wave < 50} onClick={handleRebirth}>{wave < 50 ? `Atteindre Vague 50 (${wave}/50)` : '⭐ PRESTIGE ⭐'}</button>
            </div>
            <h3 style={{color: '#06b6d4', marginTop:'20px'}}>💎 Reliques</h3>
            <div className="relics-container">
              <div className="relic-item">🏺 <span>+{(relics.goldBonus * 100).toFixed(0)}% Or</span></div>
              <div className="relic-item">👁️ <span>+{(relics.critBonus * 100).toFixed(0)}% Crit</span></div>
              <div className="relic-item">⚔️ <span>+{(relics.dmgBonus * 100).toFixed(0)}% Dmg</span></div>
            </div>
          </div>
        )}

        {/* --- SOCIAL --- */}
        {currentTab === 'social' && (
          <div className="tab-content hq-section fade-in">
            <h2>🌐 Centre de Commandement</h2>
            <button className="confirm-btn" onClick={() => {
              if (Date.now() - lastDaily > 86400000) { setRes(r=>({...r, gold: r.gold+5000, gems: r.gems+50})); setLastDaily(Date.now()); alert("Cadeau récupéré!"); } else { alert("Revenez demain!"); }
            }} style={{marginBottom: '20px'}}>
              🎁 {Date.now() - lastDaily > 86400000 ? 'Ravitaillement Prêt !' : 'Déjà récupéré'}
            </button>
            <div className="setting-row" style={{marginBottom: '20px'}}>
              <input type="text" value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())} placeholder="Code promo" className="input-field" style={{width: '60%'}}/>
              <button className="up-btn" onClick={() => { if(promoCode === 'BETA') { setRes(r=>({...r, gems: r.gems+1000})); alert('Code valide !'); setPromoCode(''); } }}>Valider</button>
            </div>
            {BETA_FEATURES && (
              <>
                <h3 style={{color: '#38bdf8'}}>🏆 Leaderboard Local (BETA)</h3>
                <div className="upgrades-list">
                  <div className="setting-row"><strong>1. GachaWhale</strong> <span>Vague 250</span></div>
                  <div className="setting-row" style={{border: '1px solid #38bdf8', color: '#38bdf8'}}><strong>2. {profile.name}</strong> <span>Vague {wave}</span></div>
                  <div className="setting-row"><strong>3. IdleNoob</strong> <span>Vague 12</span></div>
                </div>
              </>
            )}
          </div>
        )}

        {/* --- SETTINGS --- */}
        {currentTab === 'settings' && (
          <div className="tab-content hq-section fade-in">
            <h2>⚙️ Options</h2>
            <div className="upgrades-list">
              <div className="setting-row"><span>✨ VFX</span><input type="checkbox" checked={settings.vfx} onChange={e => setSettings(s => ({...s, vfx: e.target.checked}))} /></div>
              <div className="setting-row"><span>🔊 SFX</span><input type="checkbox" checked={settings.sfx} onChange={e => setSettings(s => ({...s, sfx: e.target.checked}))} /></div>
              <div className="setting-row"><span>🎵 Musique</span><input type="checkbox" checked={settings.bgm} onChange={e => setSettings(s => ({...s, bgm: e.target.checked}))} /></div>
              <div className="setting-row"><span>👁️ Mode Daltonien</span><input type="checkbox" checked={settings.colorblind} onChange={e => setSettings(s => ({...s, colorblind: e.target.checked}))} /></div>
              {BETA_FEATURES && <div className="setting-row" style={{border: '1px dashed #ef4444'}}><span style={{color: '#ef4444'}}>🧪 BETA: Auto-Assaut</span><input type="checkbox" checked={settings.autoBattle} onChange={e => setSettings(s => ({...s, autoBattle: e.target.checked}))} /></div>}
              <div style={{display: 'flex', gap: '10px', marginTop: '20px'}}>
                <button className="confirm-btn" style={{flex: 1, fontSize: '12px'}} onClick={exportSave}>💾 Exporter Save</button>
                <button className="confirm-btn" style={{flex: 1, fontSize: '12px', background: '#ef4444', boxShadow: '0 4px 0 #7f1d1d'}} onClick={() => { if(window.confirm('Reset ?')) { localStorage.removeItem(SAVE_KEY); window.location.reload(); } }}>☢️ Reset Total</button>
              </div>
            </div>
          </div>
        )}

        <nav className="bottom-nav">
          <div className={`nav-item ${currentTab === 'battle' ? 'active' : ''}`} onClick={() => setCurrentTab('battle')}><div className="nav-icon">⚔️</div><span>Front</span></div>
          <div className={`nav-item ${currentTab === 'base' ? 'active' : ''}`} onClick={() => setCurrentTab('base')}><div className="nav-icon">🏗️</div><span>Base</span></div>
          <div className={`nav-item ${currentTab === 'lab' ? 'active' : ''}`} onClick={() => setCurrentTab('lab')}><div className="nav-icon">🔬</div><span>Labo</span></div>
          <div className={`nav-item ${currentTab === 'prestige' ? 'active' : ''}`} onClick={() => setCurrentTab('prestige')}><div className="nav-icon">🌌</div><span>Héros</span></div>
          {BETA_FEATURES && <div className={`nav-item ${currentTab === 'social' ? 'active' : ''}`} onClick={() => setCurrentTab('social')}><div className="nav-icon">🌐</div><span>Social</span></div>}
          <div className={`nav-item ${currentTab === 'settings' ? 'active' : ''}`} onClick={() => setCurrentTab('settings')}><div className="nav-icon">⚙️</div><span>Options</span></div>
        </nav>

      </div>
    </div>
  );
}

// ==========================================
// EXPORT FINAL (Avec Error Boundary)
// ==========================================
export default function GameBoard() {
  return (
    <ErrorBoundary>
      <GameBoardContent />
    </ErrorBoundary>
  );
}