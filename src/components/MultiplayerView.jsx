import React, { useState } from 'react';

export const MultiplayerView = ({ combatState, setCombatState, maxPlayerHp }) => {
  const [donatedEnergy, setDonatedEnergy] = useState(0);

  const handleDonateEnergy = () => {
    if (combatState.energy >= 20) {
      setCombatState(prev => ({ ...prev, energy: prev.energy - 20 }));
      setDonatedEnergy(prev => prev + 20);
    } else {
      alert("Énergie insuffisante pour donner !");
    }
  };

  const simulate2v2 = () => {
    setCombatState(prev => ({
      ...prev,
      playerHp: maxPlayerHp * 2,
      enemyMaxHp: prev.enemyMaxHp * 2,
      enemyHp: prev.enemyMaxHp * 2
    }));
    alert("Match 2v2 simulé ! PV de la base doublés.");
  };

  return (
    <div className="tab-content hq-section fade-in">
      <h2>⚔️ Clan / Multijoueur</h2>

      <div className="upgrades-list">
        <div className="upgrade-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <h3 style={{ color: '#38bdf8', marginBottom: '10px' }}>🛡️ Guerre de Clans</h3>
          <p style={{ fontSize: '12px', color: '#cbd5e1', marginBottom: '15px' }}>Donnez de l'énergie pour débloquer des buffs de clan.</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span>Énergie donnée : {donatedEnergy}</span>
            <button className="confirm-btn" onClick={handleDonateEnergy} disabled={combatState.energy < 20} style={{ width: 'auto' }}>
              Donner 20 ⚡
            </button>
          </div>
          <div className="pity-bar-container" style={{ width: '100%', background: '#334155', borderRadius: '5px', overflow: 'hidden', height: '10px' }}>
            <div className="pity-bar-fill" style={{ width: `${Math.min(100, (donatedEnergy / 100) * 100)}%`, background: '#10b981', height: '100%', transition: 'width 0.3s' }}></div>
          </div>
        </div>

        <div className="upgrade-card" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
          <h3 style={{ color: '#ef4444', marginBottom: '10px' }}>⚔️ Modes 2v2</h3>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="confirm-btn" onClick={simulate2v2} style={{ background: '#3b82f6', boxShadow: '0 4px 0 #1d4ed8' }}>
              1 Humain + 1 Bot VS 2 Bots
            </button>
            <button className="confirm-btn" onClick={simulate2v2} style={{ background: '#a855f7', boxShadow: '0 4px 0 #7e22ce' }}>
              Co-op Local
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
