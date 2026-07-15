import { memo } from 'react';
import { UNIT_TYPES } from '../constants';

export const DeckView = memo(({ grid, cooldowns, now, handleDeployIndividual, combatState }) => {
  // Use the highest 5 levels found in the grid as the "Deck"
  const getDeck = () => {
    const validUnits = grid
      .filter(cell => cell !== null)
      .map((cell, originalIndex) => ({ ...cell, originalIndex }));

    // Sort by level descending
    validUnits.sort((a, b) => b.level - a.level);

    // Return top 5 unique highest level units, or if duplicates are fine just top 5
    return validUnits.slice(0, 5);
  };

  const deck = getDeck();

  return (
    <div className="deck-container" style={{ display: 'flex', gap: '8px', padding: '10px', background: '#0f172a', borderRadius: '12px', overflowX: 'auto', border: '1px solid #334155' }}>
      {deck.map((unit, idx) => {
        const energyCost = unit.level * 10;
        const cooldownTime = cooldowns && cooldowns[unit.originalIndex] ? cooldowns[unit.originalIndex] : 0;
        const isOnCooldown = cooldownTime > now;
        const cdRemaining = isOnCooldown ? Math.ceil((cooldownTime - now) / 1000) : 0;
        const canAfford = combatState.energy >= energyCost;
        const isReady = !isOnCooldown && canAfford;

        return (
          <div
            key={idx}
            onClick={() => handleDeployIndividual(unit.originalIndex)}
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
            <div style={{ fontSize: '30px', zIndex: 2 }}>{UNIT_TYPES[unit.level].emoji}</div>
            <div style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.8)', color: 'white', fontSize: '9px', textAlign: 'center', zIndex: 5, padding: '2px 0' }}>
              Lv. {unit.level}
            </div>
          </div>
        );
      })}
      {deck.length === 0 && (
        <div style={{ width: '100%', textAlign: 'center', color: '#94a3b8', fontSize: '12px', padding: '20px 0' }}>
          Invoquez des unités sur le front pour remplir votre Deck !
        </div>
      )}
    </div>
  );
});