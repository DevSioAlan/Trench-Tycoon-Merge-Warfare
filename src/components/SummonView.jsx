import React from 'react';
import { formatNum } from '../constants';

export const SummonView = ({ activeBanner, setActiveBanner, performSummon, res, summonCost, pity, setCurrentTab }) => {
  const baseCost = activeBanner === 'premium' ? 10 : summonCost;

  return (
    <div className="action-row fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '15px', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-start', marginBottom: '10px' }}>
        <button className="confirm-btn" style={{ width: 'auto', background: '#334155' }} onClick={() => setCurrentTab('hub')}>
          ⬅️ RETOUR
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

        {/* Drop Rates Table */}
        <div style={{ width: '100%', background: '#1e293b', borderRadius: '8px', padding: '10px', marginBottom: '15px', fontSize: '11px', border: '1px solid #334155' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', borderBottom: '1px solid #334155', paddingBottom: '5px', marginBottom: '5px' }}>
            <span>Rareté</span><span>Taux</span>
          </div>
          {activeBanner === 'premium' ? (
             <>
               <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3b82f6' }}><span>Rare</span><span>~74.4%</span></div>
               <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a855f7' }}><span>Épique</span><span>15.0%</span></div>
               <div style={{ display: 'flex', justifyContent: 'space-between', color: '#eab308' }}><span>Légendaire</span><span>4.5%</span></div>
               <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}><span>Mythique</span><span>0.4%</span></div>
               <div style={{ display: 'flex', justifyContent: 'space-between', color: '#06b6d4', fontWeight: 'bold' }}><span>Ultra Légendaire</span><span>0.1%</span></div>
             </>
          ) : (
             <>
               <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}><span>Commun</span><span>~52.75%</span></div>
               <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3b82f6' }}><span>Rare</span><span>35.0%</span></div>
               <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a855f7' }}><span>Épique</span><span>10.0%</span></div>
               <div style={{ display: 'flex', justifyContent: 'space-between', color: '#eab308' }}><span>Légendaire</span><span>2.0%</span></div>
               <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}><span>Mythique</span><span>0.2%</span></div>
               <div style={{ display: 'flex', justifyContent: 'space-between', color: '#06b6d4' }}><span>Ultra Légendaire</span><span>0.05%</span></div>
             </>
          )}
        </div>

        <div className="pity-bar-container" style={{ width: '100%', background: '#334155', borderRadius: '5px', overflow: 'hidden', height: '10px', margin: '5px 0' }}>
          <div className="pity-bar-fill" style={{ width: `${pity}%`, background: pity >= 100 ? '#eab308' : '#38bdf8', height: '100%', transition: 'width 0.3s' }}></div>
        </div>
        <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8', marginBottom: '15px' }}>Pity: {Math.floor(pity)}/100</div>

        <div style={{ display: 'flex', gap: '10px', width: '100%', marginBottom: '10px' }}>
          <button className="summon-btn" onClick={() => performSummon(1, false)} disabled={(activeBanner === 'premium' ? res.gems < baseCost : res.gold < baseCost)} style={{ flex: 1, padding: '15px', fontSize: '16px', fontWeight: 'bold' }}>
            <span className="btn-title">1x INVOCATION</span>
            <div className="btn-cost" style={{ fontSize: '12px', marginTop: '5px' }}>{activeBanner === 'premium' ? `💎 ${baseCost}` : `💰 ${formatNum(baseCost)}`}</div>
          </button>

          <button className="summon-btn" onClick={() => performSummon(10, false)} disabled={(activeBanner === 'premium' ? res.gems < baseCost * 10 : res.gold < baseCost * 10)} style={{ flex: 1, padding: '15px', fontSize: '16px', fontWeight: 'bold', background: 'linear-gradient(135deg, #a855f7, #7e22ce)', boxShadow: '0 4px 0 #4c1d95' }}>
            <span className="btn-title">10x INVOCATION</span>
            <div className="btn-cost" style={{ fontSize: '12px', marginTop: '5px' }}>{activeBanner === 'premium' ? `💎 ${baseCost * 10}` : `💰 ${formatNum(baseCost * 10)}`}</div>
          </button>
        </div>

        <button className="summon-btn" onClick={() => performSummon(1, true)} disabled={pity < 100} style={{ width: '100%', background: pity >= 100 ? '#eab308' : '#475569', color: pity >= 100 ? '#000' : '#9ca3af', padding: '10px', fontWeight: 'bold' }}>
          <span className="btn-title">INVOCATION PITY (LÉGENDAIRE GARANTI)</span>
        </button>
      </div>
    </div>
  );
};
