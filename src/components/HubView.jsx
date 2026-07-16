import React from 'react';

export const HubView = ({ setCurrentTab }) => {
  return (
    <div className="tab-content fade-in" style={{ paddingBottom: '0' }}>
      <div className="hub-menu">
        <button className="hub-btn hub-btn-combat" onClick={() => setCurrentTab('map')}>
          <span className="hub-icon">⚔️</span> COMBAT
        </button>
        <button className="hub-btn" onClick={() => setCurrentTab('deck')}>
          <span className="hub-icon">⚓</span> ÉQUIPE
        </button>
        <button className="hub-btn" onClick={() => setCurrentTab('summon')}>
          <span className="hub-icon">✨</span> INVOCATION
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
