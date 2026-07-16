import React from 'react';

export const MapView = ({ maxWave, onSelectLevel, setCurrentTab }) => {
  // Generate map levels. Let's assume the max visible is next multiple of 10 for progression padding.
  const mapMax = Math.ceil((maxWave + 5) / 10) * 10;
  const levels = Array.from({ length: Math.max(20, mapMax) }, (_, i) => i + 1);

  return (
    <div className="tab-content fade-in map-view" style={{ paddingBottom: '20px' }}>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-start', marginBottom: '10px' }}>
        <button className="confirm-btn" style={{ width: 'auto', background: '#334155' }} onClick={() => setCurrentTab('hub')}>
          ⬅️ RETOUR
        </button>
      </div>
      <h2 style={{ textAlign: 'center', margin: '0 0 20px 0' }}>CARTE DU MONDE</h2>

      <div className="map-grid">
        {levels.map(level => {
          const isLocked = level > maxWave;
          const isBoss = level % 10 === 0;

          return (
            <div
              key={level}
              className={`map-level-btn ${isLocked ? 'locked' : ''} ${isBoss ? 'boss' : ''}`}
              onClick={() => !isLocked && onSelectLevel(level)}
            >
              {isBoss && <div style={{ fontSize: '24px', marginBottom: '5px' }}>💀</div>}
              {!isBoss && <div style={{ fontSize: '20px', marginBottom: '5px' }}>⛺</div>}
              <div className="map-level-number">{level}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
