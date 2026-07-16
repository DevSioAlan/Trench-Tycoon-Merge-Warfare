import { memo } from 'react';
import { UNIT_TYPES } from '../constants';

export const DeckView = memo(({ combatDeck, cooldowns, now, handleDeployIndividual, combatState, setCurrentTab, isStandalone, handleUpgradeEnergy }) => {
  // If isStandalone, it means we are in the HUB menu looking at our deck
  // Otherwise, we are in combat.

  if (isStandalone) {
    return (
      <div className="tab-content fade-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-start', marginBottom: '20px' }}>
          <button className="confirm-btn" style={{ width: 'auto', background: '#334155' }} onClick={() => setCurrentTab('hub')}>
            ⬅️ RETOUR
          </button>
        </div>
        <h2 style={{ textAlign: 'center', margin: '0 0 20px 0' }}>VOTRE ÉQUIPE</h2>
        <p style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', marginBottom: '20px' }}>
          La gestion avancée du deck est en cours de déploiement par le QG.<br/>Les meilleures unités invoquées y sont ajoutées automatiquement.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', width: '100%', maxWidth: '400px' }}>
          {(combatDeck || Array(6).fill(null)).map((unit, idx) => (
            <div key={idx} style={{
              background: '#1e293b', border: '2px solid #334155', borderRadius: '12px',
              aspectRatio: '3/4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden'
            }}>
              {unit ? (
                <>
                  <div className={`aura-glow aura-${unit.level}`}></div>
                  <div style={{ position: 'absolute', top: 0, left: 0, background: 'rgba(0,0,0,0.8)', padding: '2px 5px', fontSize: '10px', color: 'white', fontWeight: 'bold' }}>Lv.{unit.level}</div>
                  <div style={{ fontSize: '40px', zIndex: 2 }}>{UNIT_TYPES[unit.level]?.emoji}</div>
                  <div style={{ position: 'absolute', bottom: 0, width: '100%', textAlign: 'center', background: 'rgba(0,0,0,0.8)', fontSize: '10px', padding: '3px 0' }}>
                    {UNIT_TYPES[unit.level]?.name}
                  </div>
                </>
              ) : (
                <div style={{ color: '#475569', fontSize: '30px' }}>+</div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }


  // Combat Mode Render
  const upgradeCost = Math.floor(100 * Math.pow(1.5, (combatState?.energyLevel || 1) - 1));
  const canUpgrade = combatState?.energy >= upgradeCost;

  return (
    <div className="deck-container" style={{ display: 'flex', gap: '8px', padding: '10px', background: '#0f172a', borderRadius: '12px', overflowX: 'auto', border: '1px solid #334155', justifyContent: 'center', alignItems: 'center' }}>

      <div
        data-testid="upgrade-energy-btn"
        onClick={handleUpgradeEnergy}
        style={{
          width: '60px', height: '80px', background: '#1e293b', borderRadius: '8px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          cursor: canUpgrade ? 'pointer' : 'not-allowed', opacity: canUpgrade ? 1 : 0.5,
          border: `2px solid ${canUpgrade ? '#10b981' : '#475569'}`, marginRight: '10px', position: 'relative'
        }}
      >
        <div style={{ fontSize: '20px' }}>⚡</div>
        <div style={{ fontSize: '10px', color: '#fbbf24', textAlign: 'center' }}>Niv. {combatState?.energyLevel || 1}</div>
        <div style={{ fontSize: '10px', color: 'white', background: '#ef4444', padding: '2px', borderRadius: '4px', marginTop: '5px' }}>{upgradeCost}⚡</div>
      </div>

      {(combatDeck || Array(6).fill(null)).map((unit, idx) => {
        if (!unit) {
           return <div key={idx} style={{ width: '60px', height: '80px', background: '#1e293b', border: '2px dashed #334155', borderRadius: '8px' }}></div>;
        }

        const energyCost = UNIT_TYPES[unit.level]?.cost || (unit.level * 10);
        const cooldownTime = cooldowns && cooldowns[idx] ? cooldowns[idx] : 0;
        const isOnCooldown = cooldownTime > now;
        const cdRemaining = isOnCooldown ? Math.ceil((cooldownTime - now) / 1000) : 0;
        const canAfford = combatState.energy >= energyCost;
        const isReady = !isOnCooldown && canAfford;

        return (
          <div
            key={idx}
            data-testid={`deploy-unit-${idx}`}
            onClick={() => handleDeployIndividual(idx)}
            style={{
              width: '60px', height: '80px', background: '#1e293b', borderRadius: '8px',
              position: 'relative', overflow: 'hidden', cursor: isReady ? 'pointer' : 'not-allowed',
              opacity: isReady ? 1 : 0.5, border: `2px solid ${isReady ? '#10b981' : '#ef4444'}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}
          >
            {isOnCooldown && <div className="cooldown-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, color: 'white', fontWeight: 'bold' }}>{cdRemaining}s</div>}
            <div style={{ position: 'absolute', top: 0, right: 0, background: '#3b82f6', color: 'white', fontSize: '10px', padding: '2px 4px', borderRadius: '0 0 0 4px', fontWeight: 'bold', zIndex: 5 }}>
              {energyCost}⚡
            </div>
            <div className={`aura-glow aura-${unit.level}`}></div>
            <div style={{ fontSize: '30px', zIndex: 2 }}>{UNIT_TYPES[unit.level]?.emoji}</div>
            <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.8)', color: 'white', fontSize: '9px', textAlign: 'center', zIndex: 5, padding: '2px 0' }}>
              Lv. {unit.level}
            </div>
          </div>
        );
      })}
    </div>
  );
});