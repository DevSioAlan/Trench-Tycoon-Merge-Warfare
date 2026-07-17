import React, { useState } from 'react';
import { formatNum } from '../constants';

export const SummonView = ({ activeBanner, setActiveBanner, performSummon, res, summonCost, pity, setCurrentTab, setUiState }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const baseCost = activeBanner === 'premium' ? 10 : summonCost;

  const handleSummon = (amount) => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 300);
    performSummon(amount);
  };

  return (
    <div className={`action-row fade-in ${isAnimating ? 'shake-anim' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '15px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', marginBottom: '10px' }}>
        <button className="confirm-btn" style={{ width: 'auto', background: '#334155' }} onClick={() => setCurrentTab('hub')}>
          ⬅️ RETOUR
        </button>
        <button className="confirm-btn" style={{ width: 'auto', background: '#0f172a', border: '1px solid #38bdf8', color: '#38bdf8' }} onClick={() => setUiState(prev => ({...prev, showDropRates: true}))}>
          📊 Voir Probabilités
        </button>
      </div>

      <h2 style={{ textAlign: 'center', margin: '0 0 10px 0', color: '#fbbf24' }}>✨ INVOCATION ✨</h2>

      <div className="banner-selector" style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <button className={activeBanner === 'standard' ? 'active' : ''} onClick={() => setActiveBanner('standard')} style={{ flex: 1, padding: '10px', background: activeBanner === 'standard' ? '#3b82f6' : '#1e293b', color: 'white', border: activeBanner === 'standard' ? '2px solid #60a5fa' : '2px solid #334155', borderRadius: '5px', transition: 'all 0.2s' }}>
          Standard (Or)
        </button>
        <button className={activeBanner === 'premium' ? 'active' : ''} onClick={() => setActiveBanner('premium')} style={{ flex: 1, padding: '10px', background: activeBanner === 'premium' ? '#a855f7' : '#1e293b', color: 'white', border: activeBanner === 'premium' ? '2px solid #c084fc' : '2px solid #334155', borderRadius: '5px', transition: 'all 0.2s' }}>
          Épique (Gemmes)
        </button>
      </div>

      <div style={{ background: '#0f172a', padding: '15px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: '60px', marginBottom: '10px', animation: 'float 3s ease-in-out infinite' }}>
          {activeBanner === 'standard' ? '🎫' : '💎'}
        </div>

        <div style={{ width: '100%', marginBottom: '15px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#eab308', marginBottom: '2px' }}>
            <span>Légendaire Garanti</span><span>{Math.floor(pity?.legendary ?? 0)}/100</span>
          </div>
          <div className="pity-bar-container" style={{ width: '100%', background: '#334155', borderRadius: '5px', overflow: 'hidden', height: '6px', marginBottom: '8px' }}>
            <div className="pity-bar-fill" style={{ width: `${Math.min(100, (Math.floor(pity?.legendary ?? 0) / 100) * 100)}%`, background: '#eab308', height: '100%', transition: 'width 0.3s' }}></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#ef4444', marginBottom: '2px' }}>
            <span>Mythique Garanti</span><span>{Math.floor(pity?.mythic ?? 0)}/500</span>
          </div>
          <div className="pity-bar-container" style={{ width: '100%', background: '#334155', borderRadius: '5px', overflow: 'hidden', height: '6px', marginBottom: '8px' }}>
            <div className="pity-bar-fill" style={{ width: `${Math.min(100, (Math.floor(pity?.mythic ?? 0) / 500) * 100)}%`, background: '#ef4444', height: '100%', transition: 'width 0.3s' }}></div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#06b6d4', marginBottom: '2px' }}>
            <span>Ultra Garanti</span><span>{Math.floor(pity?.ultra ?? 0)}/1500</span>
          </div>
          <div className="pity-bar-container" style={{ width: '100%', background: '#334155', borderRadius: '5px', overflow: 'hidden', height: '6px' }}>
            <div className="pity-bar-fill" style={{ width: `${Math.min(100, (Math.floor(pity?.ultra ?? 0) / 1500) * 100)}%`, background: '#06b6d4', height: '100%', transition: 'width 0.3s' }}></div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', width: '100%', marginBottom: '10px' }}>
          <button className="summon-btn" onClick={() => handleSummon(1)} disabled={(activeBanner === 'premium' ? res.gems < baseCost : res.gold < baseCost)} style={{ flex: 1, padding: '15px', fontSize: '16px', fontWeight: 'bold' }}>
            <span className="btn-title">1x INVOCATION</span>
            <div className="btn-cost" style={{ fontSize: '12px', marginTop: '5px' }}>{activeBanner === 'premium' ? `💎 ${baseCost}` : `💰 ${formatNum(baseCost)}`}</div>
          </button>

          <button className="summon-btn" onClick={() => handleSummon(10)} disabled={(activeBanner === 'premium' ? res.gems < baseCost * 10 : res.gold < baseCost * 10)} style={{ flex: 1, padding: '15px', fontSize: '16px', fontWeight: 'bold', background: 'linear-gradient(135deg, #a855f7, #7e22ce)', boxShadow: '0 4px 0 #4c1d95' }}>
            <span className="btn-title">10x INVOCATION</span>
            <div className="btn-cost" style={{ fontSize: '12px', marginTop: '5px' }}>{activeBanner === 'premium' ? `💎 ${baseCost * 10}` : `💰 ${formatNum(baseCost * 10)}`}</div>
          </button>
        </div>

      </div>
    </div>
  );
};
