import React from 'react';

export const WarShopView = ({ setCurrentTab }) => {
  return (
    <div className="tab-content fade-in" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-start', marginBottom: '20px' }}>
        <button className="confirm-btn" style={{ width: 'auto', background: '#334155' }} onClick={() => setCurrentTab('hub')}>
          ⬅️ RETOUR
        </button>
      </div>
      <h2 style={{ textAlign: 'center' }}>BOUTIQUE DE GUERRE</h2>
      <p style={{ textAlign: 'center', color: '#94a3b8' }}>Nouveaux arrivages bientôt !</p>
    </div>
  );
};
