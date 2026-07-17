import React from 'react';

export const QuestView = ({ setCurrentTab }) => {
  return (
    <div className="tab-content fade-in" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-start', marginBottom: '20px' }}>
        <button className="confirm-btn" style={{ width: 'auto', background: '#334155' }} onClick={() => setCurrentTab('hub')}>
          ⬅️ RETOUR
        </button>
      </div>
      <h2 style={{ textAlign: 'center' }}>QUÊTES & SUCCÈS</h2>
      <div className="upgrades-list">
        <div className="upgrade-card">
          <div className="up-icon">📜</div>
          <div className="up-info">
            <h3>Première Bataille</h3>
            <p>Atteindre la vague 5.</p>
          </div>
          <button className="up-btn" disabled>Récupéré</button>
        </div>
        <div className="upgrade-card">
          <div className="up-icon">🏆</div>
          <div className="up-info">
            <h3>Commandant Vétéran</h3>
            <p>Atteindre la vague 50.</p>
          </div>
          <button className="up-btn">0 / 50</button>
        </div>
      </div>
    </div>
  );
};
