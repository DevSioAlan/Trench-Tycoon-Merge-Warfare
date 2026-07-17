import React from 'react';
import { formatNum, UNIT_TYPES } from '../constants';

export const WarShopView = ({ res, setRes, inventory, setInventory, setCurrentTab, addToast }) => {
  const handleBuy = () => {
    if (res.warMedals >= 5000) {
      // Check if already owned
      if (inventory.some(u => u.level === 10)) {
        addToast("Unité déjà possédée", "#ef4444");
        return;
      }

      setRes(r => ({ ...r, warMedals: r.warMedals - 5000 }));
      setInventory(prev => [...prev, { level: 10, id: Date.now() + Math.random().toString(), equip: null }]);
      addToast("Achat Réussi !", "#10b981");
    } else {
      addToast("Médailles Insuffisantes", "#ef4444");
    }
  };

  const champion = UNIT_TYPES[10];
  const isOwned = inventory.some(u => u.level === 10);

  return (
    <div className="tab-content fade-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-start', marginBottom: '20px' }}>
        <button className="confirm-btn" style={{ width: 'auto', background: '#334155' }} onClick={() => setCurrentTab('guild')}>
          RETOUR
        </button>
      </div>

      <h2 style={{ textAlign: 'center', color: '#ef4444', marginTop: 0 }}>🛒 BOUTIQUE DE GUERRE</h2>
      <div style={{ textAlign: 'center', color: '#fb7185', fontWeight: 'bold', marginBottom: '20px' }}>Vos Médailles: {formatNum(res.warMedals || 0)} 🎖️</div>

      <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', border: '2px solid #ef4444', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ fontSize: '80px', filter: 'drop-shadow(0 0 20px #ef4444)', marginBottom: '10px' }}>{champion?.emoji || '👑'}</div>
        <h3 style={{ margin: '0 0 5px 0', color: champion?.color || 'white' }}>{champion?.name || "Champion de l'Arène"}</h3>
        <span style={{ color: '#06b6d4', fontSize: '12px', fontWeight: 'bold', marginBottom: '15px' }}>Rareté Excusive - Ultra Légendaire</span>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', width: '100%', background: '#1e293b', padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '12px' }}>
          <div><span style={{color:'#ef4444'}}>HP:</span> {formatNum(champion?.hp)}</div>
          <div><span style={{color:'#f59e0b'}}>DMG:</span> {formatNum(champion?.damage)}</div>
          <div><span style={{color:'#3b82f6'}}>Coût:</span> {champion?.cost}⚡</div>
          <div><span style={{color:'#a855f7'}}>Portée:</span> {champion?.range}</div>
        </div>

        <button
          className="confirm-btn"
          onClick={handleBuy}
          disabled={res.warMedals < 5000 || isOwned}
          style={{ background: isOwned ? '#10b981' : 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)', boxShadow: isOwned ? 'none' : '0 4px 0 #7f1d1d' }}
        >
          {isOwned ? "Déjà Possédé" : "Acheter (5000 🎖️)"}
        </button>
      </div>
    </div>
  );
};
