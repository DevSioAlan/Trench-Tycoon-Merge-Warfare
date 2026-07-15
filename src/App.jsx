import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './App.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ParticleEngine } from './engine/ParticleEngine';
import { useSaveSystem } from './hooks/useSaveSystem';
import { useGameLoop } from './hooks/useGameLoop';
import { GRID_SIZE, DAMAGE_MAP, HP_MAP, UNIT_TYPES, formatNum, BETA_FEATURES, SAVE_KEY } from './constants';

import { HUD } from './components/HUD';
import { Battlefield } from './components/Battlefield';
import { Grid } from './components/Grid';
import { StartScreen } from './components/StartScreen';
import { Cinematic, ProfileModal, AFKModal } from './components/Modals';

function GameContent() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentTab, setCurrentTab] = useState('battle');

  const state = useSaveSystem();
  const { profile, setProfile, settings, setSettings, res, setRes, wave, setWave, grid, setGrid, buildings, setBuildings, lab, setLab, prestige, setPrestige, prestigeUps, setPrestigeUps, relics, combatState, setCombatState, setPity, lastDaily, setLastDaily, afkReward, setAfkReward } = state;

  const [field, setField] = useState({ troops: [], enemies: [] });
  const [ultiGauge, setUltiGauge] = useState(0);
  const [rageTimer, setRageTimer] = useState(0);
  const [raidTimer, setRaidTimer] = useState(30);
  const [weather, setWeather] = useState('clear');
  const [waveEvent, setWaveEvent] = useState(null);

  const [activeBanner, setActiveBanner] = useState('standard');
  const [uiState, setUiState] = useState({ showProfile: false, showDaily: false, cinematic: null });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [animatingCells, setAnimatingCells] = useState({});
  const [floatingTexts, setFloatingTexts] = useState([]);
  const [cameraPunch, setCameraPunch] = useState(false);
  const [screenShake, setScreenShake] = useState('');
  const [artilleryFlash, setArtilleryFlash] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [now, setNow] = useState(0);

  const canvasRef = useRef(null);
  const particleEngine = useRef(null);
  const bgmRef = useRef(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setNow(Date.now());
      setIsLoaded(true);
    }, 0);
    const intervalId = setInterval(() => setNow(Date.now()), 10000);
    return () => { clearTimeout(timeoutId); clearInterval(intervalId); }
  }, []);

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
  const isRaidBossWave = wave % 10 === 0;

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wave, maxPlayerHp]);

  useGameLoop({
    isLoaded, gameStarted, currentTab, state: { ...state, weather, waveEvent, isRaidBossWave, field, rageTimer, synergyBuffs },
    setRes, setCombatState, setRageTimer, setField, setWeather, setWaveEvent, setGrid,
    triggerAnim, playSfx, addFloatingText, particleEngine, doCameraPunch, triggerShake, maxPlayerHp, handleGameOver,
    setWave, setRaidTimer, setUltiGauge
  });

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
      const ultiDamage = combatState.playerHp * 20 * prestigeUps.dmgMult * (1 + relics.dmgBonus);
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

  if (!gameStarted) {
    return <StartScreen setGameStarted={setGameStarted} settings={settings} setSettings={setSettings} />;
  }

  if (!isLoaded) return <div className="loading-screen">Chargement...</div>;
  const isHpCritical = combatState.playerHp / maxPlayerHp < 0.3;

  return (
    <div className={`game-wrapper ${settings.colorblind ? 'colorblind-mode' : ''} ${cameraPunch ? 'camera-punch' : ''}`}>
      <canvas ref={canvasRef} className="vfx-canvas" />
      <Cinematic uiState={uiState} />
      <ProfileModal uiState={uiState} setUiState={setUiState} profile={profile} setProfile={setProfile} wave={wave} />
      <AFKModal afkReward={afkReward} setAfkReward={setAfkReward} />

      <div className={`game-container ${isRaidBossWave ? 'raid-alert' : ''} weather-${BETA_FEATURES ? weather : 'clear'} ${isHpCritical ? 'critical-hp-vignette' : ''}`}>

        {artilleryFlash && <div className="artillery-flash"></div>}
        {screenShake && <div className={`shake-overlay ${screenShake}`}></div>}

        <HUD profile={profile} res={res} setUiState={setUiState} />

        {currentTab === 'battle' && (
          <div className="tab-content fade-in">
            <Battlefield
              combatState={combatState} wave={wave} isRaidBossWave={isRaidBossWave} synergyBuffs={synergyBuffs} waveEvent={waveEvent}
              weather={weather} rageTimer={rageTimer} ultiGauge={ultiGauge} field={field} floatingTexts={floatingTexts} triggerUltimate={triggerUltimate} raidTimer={raidTimer}
            />

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

            <Grid grid={grid} selectedSlot={selectedSlot} animatingCells={animatingCells} handleCellClick={handleCellClick} />
          </div>
        )}

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

        {currentTab === 'social' && (
          <div className="tab-content hq-section fade-in">
            <h2>🌐 Centre de Commandement</h2>
            <button className="confirm-btn" onClick={() => {
              if (now - lastDaily > 86400000) { setRes(r=>({...r, gold: r.gold+5000, gems: r.gems+50})); setLastDaily(Date.now()); alert("Cadeau récupéré!"); } else { alert("Revenez demain!"); }
            }} style={{marginBottom: '20px'}}>
              🎁 {(now - lastDaily) > 86400000 ? 'Ravitaillement Prêt !' : 'Déjà récupéré'}
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
                <button className="confirm-btn" style={{flex: 1, fontSize: '12px'}} onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(localStorage.getItem(SAVE_KEY) || "");
                  const downloadAnchorNode = document.createElement('a');
                  downloadAnchorNode.setAttribute("href", dataStr);
                  downloadAnchorNode.setAttribute("download", "trench_tycoon_save.json");
                  document.body.appendChild(downloadAnchorNode);
                  downloadAnchorNode.click();
                  downloadAnchorNode.remove();
                }}>💾 Exporter Save</button>
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

export default function App() {
  return (
    <ErrorBoundary>
      <GameContent />
    </ErrorBoundary>
  );
}