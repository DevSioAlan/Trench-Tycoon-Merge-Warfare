import React from 'react';
import { formatNum } from '../constants';

export const TalentTreeView = ({ res, setRes, talents, setTalents, setCurrentTab }) => {
  
  const getCost = (level) => Math.floor(100 * Math.pow(1.5, level));

  const buyTalent = (branch) => {
    const cost = getCost(talents[branch]);
    if (res.gold >= cost) {
      setRes(prev => ({ ...prev, gold: prev.gold - cost }));
      setTalents(prev => ({ ...prev, [branch]: prev[branch] + 1 }));
    } else {
      alert("Fonds insuffisants en Or !");
    }
  };

  return (
    <div className="tab-content fade-in" style={{ alignItems: 'center' }}>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', marginBottom: '20px', maxWidth: '900px' }}>
        <button className="confirm-btn" style={{ width: 'auto', background: '#334155', borderBottomColor: '#1e293b' }} onClick={() => setCurrentTab('hub')}>⬅️ RETOUR</button>
        <div className="energy-meter" style={{ background: 'rgba(251, 191, 36, 0.2)', border: '1px solid #fbbf24', color: '#fde047', boxShadow: 'none' }}>
          💰 {formatNum(res.gold)} Or
        </div>
      </div>
      
      <h2 style={{ color: '#10b981', fontSize: '36px', margin: '0 0 10px 0', textShadow: '0 2px 10px rgba(16,185,129,0.5)' }}>CENTRE DE RECHERCHE</h2>
      <p style={{ color: '#94a3b8', marginBottom: '40px' }}>Investissez l'Or récolté en combat pour améliorer vos troupes de manière permanente.</p>

      <div style={{ display: 'flex', gap: '30px', maxWidth: '1000px', width: '100%', justifyContent: 'center', flexWrap: 'wrap' }}>
        
        {/* BRANCHE : PUISSANCE DE FEU */}
        <div style={{ background: '#0f172a', border: '2px solid #ef4444', borderRadius: '12px', padding: '25px', width: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 'inset 0 0 30px rgba(239,68,68,0.1)' }}>
          <div style={{ fontSize: '50px', marginBottom: '15px' }}>⚔️</div>
          <h3 style={{ color: '#fca5a5', margin: '0 0 5px 0' }}>Puissance de Feu</h3>
          <p style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', minHeight: '40px' }}>Augmente les dégâts de toutes les unités de +5% par niveau.</p>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: '15px 0' }}>Niveau {talents.firepower}</div>
          <div style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '15px' }}>Actuel : +{talents.firepower * 5}% DGT</div>
          <button className="confirm-btn" style={{ background: '#ef4444', borderBottomColor: '#991b1b' }} onClick={() => buyTalent('firepower')} disabled={res.gold < getCost(talents.firepower)}>
            AMÉLIORER <br/><span style={{ fontSize: '12px' }}>💰 {formatNum(getCost(talents.firepower))}</span>
          </button>
        </div>

        {/* BRANCHE : BLINDAGE */}
        <div style={{ background: '#0f172a', border: '2px solid #3b82f6', borderRadius: '12px', padding: '25px', width: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 'inset 0 0 30px rgba(59,130,246,0.1)' }}>
          <div style={{ fontSize: '50px', marginBottom: '15px' }}>🛡️</div>
          <h3 style={{ color: '#bae6fd', margin: '0 0 5px 0' }}>Blindage Lourd</h3>
          <p style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', minHeight: '40px' }}>Augmente les Points de Vie (HP) de toutes les unités de +5% par niveau.</p>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: '15px 0' }}>Niveau {talents.armor}</div>
          <div style={{ color: '#38bdf8', fontWeight: 'bold', marginBottom: '15px' }}>Actuel : +{talents.armor * 5}% HP</div>
          <button className="confirm-btn" style={{ background: '#3b82f6', borderBottomColor: '#0369a1' }} onClick={() => buyTalent('armor')} disabled={res.gold < getCost(talents.armor)}>
            AMÉLIORER <br/><span style={{ fontSize: '12px' }}>💰 {formatNum(getCost(talents.armor))}</span>
          </button>
        </div>

        {/* BRANCHE : LOGISTIQUE */}
        <div style={{ background: '#0f172a', border: '2px solid #f59e0b', borderRadius: '12px', padding: '25px', width: '280px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: 'inset 0 0 30px rgba(245,158,11,0.1)' }}>
          <div style={{ fontSize: '50px', marginBottom: '15px' }}>⚙️</div>
          <h3 style={{ color: '#fde047', margin: '0 0 5px 0' }}>Logistique</h3>
          <p style={{ color: '#94a3b8', fontSize: '12px', textAlign: 'center', minHeight: '40px' }}>Accélère la régénération d'Énergie et augmente les gains d'Or de +10%.</p>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', margin: '15px 0' }}>Niveau {talents.logistics}</div>
          <div style={{ color: '#fbbf24', fontWeight: 'bold', marginBottom: '15px' }}>Actuel : +{talents.logistics * 10}% OR/NRJ</div>
          <button className="confirm-btn" style={{ background: '#f59e0b', borderBottomColor: '#b45309' }} onClick={() => buyTalent('logistics')} disabled={res.gold < getCost(talents.logistics)}>
            AMÉLIORER <br/><span style={{ fontSize: '12px' }}>💰 {formatNum(getCost(talents.logistics))}</span>
          </button>
        </div>

      </div>
    </div>
  );
};