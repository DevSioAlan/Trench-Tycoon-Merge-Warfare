import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './App.css';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ParticleEngine } from './engine/ParticleEngine';
import { useSaveSystem } from './hooks/useSaveSystem';
import { useGameLoop } from './hooks/useGameLoop';
import { GRID_SIZE, DAMAGE_MAP, HP_MAP, UNIT_TYPES, formatNum, BETA_FEATURES, SAVE_KEY } from './constants';

import { HUD } from './components/HUD';
import { Battlefield } from './components/Battlefield';
import { StartScreen } from './components/StartScreen';
import { Cinematic, ProfileModal, AFKModal } from './components/Modals';
import { deployUnitAction } from './engine/combatEngine';
import { SummonView } from './components/SummonView';
import { DeckView } from './components/DeckView';
import { useGacha } from './hooks/useGacha';
import { CombatView } from './components/CombatView';
import { HubView } from './components/HubView';
import { MapView } from './components/MapView';

function GameContent() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [currentTab, setCurrentTab] = useState('hub');

  const state = useSaveSystem();
  const { profile, setProfile, settings, setSettings, res, setRes, wave, setWave, combatDeck, setCombatDeck, inventory, setInventory, buildings, setBuildings, lab, setLab, prestige, setPrestige, prestigeUps, setPrestigeUps, relics, combatState, setCombatState, pity, setPity, lastDaily, setLastDaily, afkReward, setAfkReward } = state;

  const [field, setField] = useState({ troops: [], enemies: [] });
  const [ultiGauge, setUltiGauge] = useState(0);
  const [rageTimer, setRageTimer] = useState(0);
  const [raidTimer, setRaidTimer] = useState(30);
  const [weather, setWeather] = useState('clear');
  const [waveEvent, setWaveEvent] = useState(null);

  const [uiState, setUiState] = useState({ showProfile: false, showDaily: false, cinematic: null });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [animatingCells, setAnimatingCells] = useState({});
  const [cooldowns, setCooldowns] = useState({});
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

  // Auto update combat deck based on highest units for now since manual equip isn't fully implemented yet
  useEffect(() => {
    if (inventory && inventory.length > 0) {
      const sorted = [...inventory].sort((a, b) => b.level - a.level);
      const newDeck = Array(6).fill(null);
      for(let i=0; i<Math.min(6, sorted.length); i++) {
        newDeck[i] = sorted[i];
      }
      setCombatDeck(newDeck);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inventory]);

  const synergyBuffs = useMemo(() => {
    const counts = {};
    (combatDeck || []).forEach(c => { if (c) counts[c.level] = (counts[c.level] || 0) + 1; });
    return {
      dmgMult: counts[2] >= 3 ? 1.5 : 1,
      extraHp: counts[4] >= 2 ? 1000 : 0
    };
  }, [combatDeck]);

  const maxPlayerHp = 500 + (buildings.hq * 500) + (lab.baseHp * 250) + synergyBuffs.extraHp;
  const summonCost = 150; // Fixed cost for standard summon for easier balance
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

  const addToast = useCallback((msg, color) => {
    const id = Date.now() + Math.random();
    setUiState(prev => ({ ...prev, toasts: [...(prev.toasts || []), { id, msg, color }] }));
    setTimeout(() => setUiState(prev => ({ ...prev, toasts: (prev.toasts || []).filter(t => t.id !== id) })), 3000);
  }, [setUiState]);

  const { activeBanner, setActiveBanner, performSummon } = useGacha({ res, setRes, setInventory, setPity, setCinematicSummon: (sum) => setUiState(prev => ({ ...prev, cinematicSummon: sum })), addToast, summonCost });

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
    alert(`💥 RETRAITE ! La ligne de front a reculé.`);
    setCombatState(prev => ({ ...prev, playerHp: maxPlayerHp, combo: 0, enemyHp: prev.enemyMaxHp }));
    setField({ troops: [], enemies: [] });
    setCurrentTab('hub');
    setUltiGauge(0); setRageTimer(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxPlayerHp]);

  useGameLoop({
    isLoaded, gameStarted, currentTab, state: { ...state, weather, waveEvent, isRaidBossWave, field, rageTimer, synergyBuffs },
    setRes, setCombatState, setRageTimer, setField, setWeather, setWaveEvent, setGrid: () => {},
    triggerAnim, playSfx, addFloatingText, particleEngine, doCameraPunch, triggerShake, maxPlayerHp, handleGameOver,
    setWave, setRaidTimer, setUltiGauge
  });


  const handleDeployIndividual = (indexToDeploy) => {
    const targetIndex = indexToDeploy !== undefined ? indexToDeploy : selectedSlot;
    if (targetIndex === null || !combatDeck[targetIndex]) return;

    // Check cooldown
    if (cooldowns[targetIndex] && now < cooldowns[targetIndex]) {
      return addFloatingText("En recharge", 50, 80, 'damage-red');
    }

    const unit = combatDeck[targetIndex];
    const energyCost = unit.level * 10;

    if (combatState.energy < energyCost) {
      return addFloatingText("Énergie Insuff.", 50, 80, 'damage-red');
    }

    const result = deployUnitAction(combatState, field, unit, energyCost, prestigeUps, lab);
    if (result) {
      setCombatState(result.newCombatState);
      setField(result.newField);
      // Set cooldown (e.g. 2 seconds + 0.5s per level)
      setCooldowns(prev => ({
        ...prev,
        [targetIndex]: Date.now() + 2000 + (unit.level * 500)
      }));
    }
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


  if (!gameStarted) {
    return <StartScreen setGameStarted={setGameStarted} settings={settings} setSettings={setSettings} />;
  }

  if (!isLoaded) return <div className="loading-screen">Chargement...</div>;
  const isHpCritical = combatState.playerHp / maxPlayerHp < 0.3;

  return (
    <div className={`game-wrapper theme-${settings?.theme || 'standard'} ${settings?.colorblind ? 'colorblind-mode' : ''} ${cameraPunch ? 'camera-punch' : ''}`}>
      <canvas ref={canvasRef} className="vfx-canvas" />
      <Cinematic uiState={uiState} />
      <ProfileModal uiState={uiState} setUiState={setUiState} profile={profile} setProfile={setProfile} wave={wave} />
      <AFKModal afkReward={afkReward} setAfkReward={setAfkReward} />

      {/* TOAST NOTIFICATIONS */}
      <div style={{ position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 11000, display: 'flex', flexDirection: 'column', gap: '5px', pointerEvents: 'none' }}>
        {(uiState.toasts || []).map(t => (
          <div key={t.id} style={{ background: 'rgba(0,0,0,0.8)', border: `1px solid ${t.color}`, padding: '8px 12px', borderRadius: '4px', color: 'white', fontWeight: 'bold', fontSize: '12px' }}>
            {t.msg}
          </div>
        ))}
      </div>

      <div className={`game-container ${isRaidBossWave ? 'raid-alert' : ''} weather-${BETA_FEATURES ? weather : 'clear'} ${isHpCritical ? 'critical-hp-vignette' : ''}`}>

        {artilleryFlash && <div className="artillery-flash"></div>}
        {screenShake && <div className={`shake-overlay ${screenShake}`}></div>}

        <HUD profile={profile} res={res} setUiState={setUiState} />

        {currentTab === 'hub' && <HubView setCurrentTab={setCurrentTab} />}
        {currentTab === 'map' && <MapView maxWave={wave} setCurrentTab={setCurrentTab} onSelectLevel={(l) => { setWave(l); setCurrentTab('combat'); setField({troops:[], enemies:[]}); }} />}

        {currentTab === 'combat' && (
          <CombatView
            combatState={combatState} wave={wave} isRaidBossWave={isRaidBossWave} synergyBuffs={synergyBuffs} waveEvent={waveEvent}
            weather={weather} rageTimer={rageTimer} ultiGauge={ultiGauge} field={field} floatingTexts={floatingTexts} triggerUltimate={triggerUltimate} raidTimer={raidTimer}
            buildings={buildings} combatDeck={combatDeck} setCurrentTab={setCurrentTab}
            handleDeployIndividual={handleDeployIndividual} cooldowns={cooldowns} now={now}
          />
        )}

        {currentTab === 'deck' && (
          <DeckView combatDeck={combatDeck} setCurrentTab={setCurrentTab} isStandalone={true} />
        )}

        {currentTab === 'summon' && (
          <SummonView activeBanner={activeBanner} setActiveBanner={setActiveBanner} performSummon={performSummon} res={res} summonCost={summonCost} pity={pity} setCurrentTab={setCurrentTab} />
        )}

        {currentTab === 'quests' && (
          <div className="tab-content fade-in" style={{ padding: '20px' }}>
             <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-start', marginBottom: '20px' }}>
              <button className="confirm-btn" style={{ width: 'auto', background: '#334155' }} onClick={() => setCurrentTab('hub')}>
                ⬅️ RETOUR
              </button>
            </div>
            <h2 style={{ textAlign: 'center' }}>QUÊTES & SUCCÈS</h2>
            <p style={{ textAlign: 'center', color: '#94a3b8' }}>En développement...</p>
          </div>
        )}

        {currentTab === 'settings' && (
          <div className="tab-content hq-section fade-in" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-start', marginBottom: '20px' }}>
              <button className="confirm-btn" style={{ width: 'auto', background: '#334155' }} onClick={() => setCurrentTab('hub')}>
                ⬅️ RETOUR
              </button>
            </div>
            <h2>⚙️ Options</h2>
            <div className="upgrades-list">
              <div className="setting-row">
                <span>🎨 Thème UI</span>
                <select value={settings?.theme || 'standard'} onChange={e => setSettings(s => ({...s, theme: e.target.value}))} style={{background:'#1e293b', color:'white', border:'1px solid #334155', borderRadius:'4px', padding:'2px'}}>
                  <option value="standard">Standard</option>
                  <option value="red-alert">Alerte Rouge</option>
                </select>
              </div>
              <div className="setting-row"><span>✨ VFX</span><input type="checkbox" checked={settings.vfx} onChange={e => setSettings(s => ({...s, vfx: e.target.checked}))} /></div>
              <div className="setting-row"><span>🔊 SFX</span><input type="checkbox" checked={settings.sfx} onChange={e => setSettings(s => ({...s, sfx: e.target.checked}))} /></div>
              <div className="setting-row"><span>🎵 Musique</span><input type="checkbox" checked={settings.bgm} onChange={e => setSettings(s => ({...s, bgm: e.target.checked}))} /></div>
              <div className="setting-row"><span>👁️ Mode Daltonien</span><input type="checkbox" checked={settings.colorblind} onChange={e => setSettings(s => ({...s, colorblind: e.target.checked}))} /></div>

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