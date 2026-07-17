import React from 'react';

export const HubView = ({ setCurrentTab }) => {
  return (
    <div className="tab-content fade-in" style={{ paddingBottom: '0' }}>
      <div className="hub-menu">
        <button className="hub-btn hub-btn-combat" onClick={() => setCurrentTab('map')}>
          <span className="hub-icon">⚔️</span> COMBAT
        </button>
        <button className="hub-btn" onClick={() => setCurrentTab('ranked')} style={{ background: 'linear-gradient(180deg, #f59e0b 0%, #b45309 100%)', borderColor: '#fde047' }}>
          <span className="hub-icon">🏆</span> CLASSÉ
        </button>
        <button className="hub-btn" onClick={() => setCurrentTab('deck')}>
          <span className="hub-icon">⚓</span> ÉQUIPE
        </button>
        <button className="hub-btn" onClick={() => setCurrentTab('summon')}>
          <span className="hub-icon">✨</span> INVOCATION
        </button>
        <button className="hub-btn" onClick={() => setCurrentTab('guild')}>
          <span className="hub-icon">🛡️</span> GUILDE
        </button>
        <button className="hub-btn" onClick={() => setCurrentTab('quests')}>
          <span className="hub-icon">📜</span> QUÊTES / SUCCÈS
        </button>
        <button className="hub-btn" onClick={() => setCurrentTab('settings')}>
          <span className="hub-icon">⚙️</span> PARAMÈTRES
        </button>
      </div>
    </div>
  );
};
