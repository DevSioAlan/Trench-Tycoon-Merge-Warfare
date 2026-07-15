import React, { useState } from 'react';

export const MultiplayerView = ({ res, setRes }) => {
  const [guildPoints, setGuildPoints] = useState(0);

  const handleDonateGold = () => {
    if (res.gold >= 1000) {
      setRes(prev => ({ ...prev, gold: prev.gold - 1000 }));
      setGuildPoints(prev => prev + 10);
    } else {
      alert("Or insuffisant pour donner !");
    }
  };

  return (
    <div className="tab-content hq-section fade-in">
      <h2>⚔️ Clan</h2>

      <div className="upgrades-list">
        <div className="upgrade-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <h3 style={{ color: '#38bdf8', marginBottom: '10px' }}>🛡️ Dons de Clan</h3>
          <p style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '15px' }}>Faites don d'Or pour gagner des Points de Guilde et améliorer le Clan.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span>Points de Guilde : {guildPoints}</span>
            <button className="confirm-btn" onClick={handleDonateGold} disabled={res.gold < 1000} style={{ width: 'auto' }}>
              Donner 1000 💰
            </button>
          </div>
          <div className="pity-bar-container" style={{ width: '100%', background: '#334155', borderRadius: '5px', overflow: 'hidden', height: '10px' }}>
            <div className="pity-bar-fill" style={{ width: `${Math.min(100, (guildPoints / 100) * 100)}%`, background: '#fbbf24', height: '100%', transition: 'width 0.3s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );
};
