import { memo } from 'react';
import { UNIT_TYPES, formatNum, BETA_FEATURES } from '../constants';

export const Battlefield = memo(({
  combatState, wave, isRaidBossWave, waveEvent, weather, rageTimer,
  ultiGauge, field, floatingTexts, triggerUltimate, raidTimer, buildings
}) => {
  return (
    <>
      <div className="combat-hud">
        <div className="combo-meter">COMBO x{combatState?.combo ?? 0}</div>
        <div className="energy-meter">⚡ {Math.floor(combatState?.energy ?? 0)}/100</div>
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

        {weather === 'storm' && <div className="weather-overlay weather-storm"></div>}
        {weather === 'heat' && <div className="weather-overlay weather-heat"></div>}

        <div className="battlefield-1d" style={{ height: '140px', overflow: 'hidden' }}>
          <div className="physical-base base-player" style={{ transform: `scale(${1 + ((buildings?.hq ?? 0) * 0.05)})`, transformOrigin: 'bottom left', left: '-10px', fontSize: '90px' }}>⛺</div>
          <div className="physical-base base-enemy" style={{ right: '-10px', fontSize: '90px' }}>🏯</div>

          {field?.troops?.map(t => (
            <div key={t.id} className="field-entity entity-troop" style={{ left: `${t.x}%`, zIndex: Math.floor(t.x) }}>
              <div className="unit-level-badge">Lv. {t.level}</div>
              <div className="entity-hp"><div className="entity-hp-fill" style={{width: `${(t.hp/t.maxHp)*100}%`}}></div></div>
              <span className="unit-emoji" style={{ fontSize: '35px', filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.5))' }}>{UNIT_TYPES[t.level]?.emoji}</span>
            </div>
          ))}
          {field?.enemies?.map(e => (
            <div key={e.id} className={`field-entity entity-enemy ${e.isBoss ? 'is-boss' : ''}`} style={{ left: `${e.x}%`, zIndex: Math.floor(100 - e.x) }}>
              <div className="unit-level-badge">Lv. {e.level}</div>
              <div className="entity-hp"><div className="entity-hp-fill" style={{width: `${(e.hp/e.maxHp)*100}%`, background: '#ef4444'}}></div></div>
              <span className="unit-emoji" style={{ fontSize: e.isBoss ? '60px' : '35px', transform: 'scaleX(-1)', filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.5))' }}>{UNIT_TYPES[e.level]?.emoji}</span>
            </div>
          ))}
          {floatingTexts?.map(ft => (
            <div key={ft.id} className={`floating-damage damage-${ft.type}`} style={{ left: `${ft.x}%`, top: `${ft.y}px`, transform: `scale(${ft.sizeMult}) translate(-50%, -50%)`, zIndex: 100 }}>{ft.text}</div>
          ))}
        </div>

        <div className="bases-hud">
          <div className="base-hp player">Base: {formatNum(combatState?.playerHp ?? 0)}</div>
          {isRaidBossWave && <div className="raid-timer">00:{raidTimer < 10 ? `0${raidTimer}` : raidTimer}</div>}
          <div className="base-hp enemy">Objectif: {formatNum(combatState?.enemyHp ?? 0)}</div>
        </div>
      </div>
    </>
  );
});