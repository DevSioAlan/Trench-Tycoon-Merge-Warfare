import { UNIT_TYPES, formatNum, BETA_FEATURES } from '../constants';

export const Battlefield = ({
  combatState, wave, isRaidBossWave, waveEvent, weather, rageTimer,
  ultiGauge, field, floatingTexts, triggerUltimate, raidTimer
}) => {
  return (
    <>
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
    </>
  );
};