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

      <div className={`battlefield-section weather-${BETA_FEATURES ? weather : 'clear'}`}>
        <div className="battlefield-texture"></div>

        <div className="ulti-container" data-testid="cannon-btn" onClick={triggerUltimate}>
          <div className="ulti-bar" style={{ width: `${ultiGauge}%`, backgroundColor: ultiGauge === 100 ? '#f59e0b' : '#3b82f6' }}></div>
          <div className="ulti-text">{ultiGauge === 100 ? '💥 CANON PRÊT 💥' : `Canon ${Math.floor(ultiGauge)}%`}</div>
        </div>

        {weather === 'storm' && <div className="weather-overlay weather-storm"></div>}
        {weather === 'heat' && <div className="weather-overlay weather-heat"></div>}

        <div className="battlefield-1d">
          <div className="physical-base-container base-player-container">
            <div className="base-label">Base Alliée</div>
            <div className="base-hp-bar">
              <div className="base-hp-fill base-player-fill" style={{ width: `${Math.max(0, Math.min(100, (combatState?.playerHp / (500 + ((buildings?.hq ?? 0) * 500))) * 100))}%` }}></div>
            </div>
            <div className="physical-base base-player" style={{ transform: `scale(${1 + ((buildings?.hq ?? 0) * 0.05)})`, transformOrigin: 'bottom left', position: 'relative', fontSize: '90px' }}>⛺</div>
          </div>

          <div className="physical-base-container base-enemy-container">
            <div className="base-label">Base Ennemie</div>
            <div className="base-hp-bar">
              <div className="base-hp-fill base-enemy-fill" style={{ width: `${Math.max(0, Math.min(100, (combatState?.enemyHp / combatState?.enemyMaxHp) * 100))}%` }}></div>
            </div>
            <div className="physical-base base-enemy" style={{ position: 'relative', fontSize: '90px' }}>🏯</div>
          </div>

          {field?.troops?.map(t => (
            <div key={t.id} className={`field-entity entity-troop ${t.isAttacking ? 'shake-anim' : ''}`} style={{ left: `${t.x}%`, zIndex: Math.floor(t.x) }}>
              <div className={`battlefield-aura aura-${t.level}`}></div>
              <div className="entity-level">Nv.{t.level}</div>
              <div className="entity-hp"><div className="entity-hp-fill" style={{width: `${(t.hp/t.maxHp)*100}%`}}></div></div>
              <span className="unit-emoji" style={{ fontSize: '35px', filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.5))', zIndex: 2 }}>{UNIT_TYPES[t.level]?.emoji}</span>
            </div>
          ))}
          {field?.enemies?.map(e => (
            <div key={e.id} className={`field-entity entity-enemy ${e.isBoss ? 'is-boss' : ''} ${e.isAttacking ? 'shake-anim' : ''}`} style={{ left: `${e.x}%`, zIndex: Math.floor(100 - e.x) }}>
              <div className={`battlefield-aura aura-${e.level}`}></div>
              <div className="entity-level">Nv.{e.level}</div>
              <div className="entity-hp"><div className="entity-hp-fill" style={{width: `${(e.hp/e.maxHp)*100}%`}}></div></div>
              <span className="unit-emoji" style={{ fontSize: e.isBoss ? '60px' : '35px', transform: 'scaleX(-1)', filter: 'drop-shadow(0 4px 4px rgba(0,0,0,0.5))', zIndex: 2 }}>{UNIT_TYPES[e.level]?.emoji}</span>
            </div>
          ))}

          {field?.projectiles?.map(p => (
            <div key={p.id} className="field-projectile" style={{
              position: 'absolute',
              left: `${p.x}%`,
              bottom: '40px',
              width: '10px',
              height: '4px',
              background: p.color || '#fff',
              boxShadow: `0 0 10px ${p.color || '#fff'}`,
              borderRadius: '2px',
              zIndex: 50,
              transition: 'left 0.2s linear'
            }}></div>
          ))}

          {floatingTexts?.map(ft => (
            <div key={ft.id} className={`floating-damage damage-${ft.type}`} style={{ left: `${ft.x}%`, top: `${ft.y}px`, transform: `scale(${ft.sizeMult}) translate(-50%, -50%)`, zIndex: 100 }}>{ft.text}</div>
          ))}
        </div>

        {isRaidBossWave && (
          <div className="bases-hud">
            <div className="raid-timer">00:{raidTimer < 10 ? `0${raidTimer}` : raidTimer}</div>
          </div>
        )}
      </div>
    </>
  );
});