import React from 'react';
import { formatNum } from '../constants';

export const SummonView = ({ activeBanner, setActiveBanner, performSummon, res, summonCost, pity }) => {
  return (
    <div className="action-row" style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '15px' }}>
      <h2 style={{ textAlign: 'center', margin: '0 0 10px 0', color: '#fbbf24' }}>✨ GACHA SYSTEM ✨</h2>

      <div className="banner-selector" style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <button className={activeBanner === 'standard' ? 'active' : ''} onClick={() => setActiveBanner('standard')} style={{ flex: 1, padding: '10px', background: activeBanner === 'standard' ? '#3b82f6' : '#1e293b', color: 'white', border: activeBanner === 'standard' ? '2px solid #60a5fa' : '2px solid #334155', borderRadius: '5px', transition: 'all 0.2s' }}>
          Bannière Standard
        </button>
        <button className={activeBanner === 'premium' ? 'active' : ''} onClick={() => setActiveBanner('premium')} style={{ flex: 1, padding: '10px', background: activeBanner === 'premium' ? '#a855f7' : '#1e293b', color: 'white', border: activeBanner === 'premium' ? '2px solid #c084fc' : '2px solid #334155', borderRadius: '5px', transition: 'all 0.2s' }}>
          Bannière Épique
        </button>
      </div>

      <div style={{ background: '#0f172a', padding: '15px', borderRadius: '8px', border: '1px solid #334155', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ fontSize: '60px', marginBottom: '10px', animation: 'float 3s ease-in-out infinite' }}>
          {activeBanner === 'standard' ? '🎫' : '💎'}
        </div>
        <p style={{ margin: '0 0 15px 0', fontSize: '14px', color: '#94a3b8', textAlign: 'center' }}>
          {activeBanner === 'standard'
            ? 'Invoquez des troupes communes à rares.'
            : 'Invoquez des troupes épiques et légendaires !'}
        </p>

        <div className="pity-bar-container" style={{ width: '100%', background: '#334155', borderRadius: '5px', overflow: 'hidden', height: '10px', margin: '5px 0' }}>
          <div className="pity-bar-fill" style={{ width: `${pity}%`, background: pity >= 100 ? '#eab308' : '#38bdf8', height: '100%', transition: 'width 0.3s' }}></div>
        </div>
        <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8', marginBottom: '15px' }}>Pity: {pity}/100</div>

        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
          <button className="summon-btn" onClick={() => performSummon(false)} disabled={(activeBanner === 'premium' ? res.gems < 10 : res.gold < summonCost)} style={{ flex: 2, padding: '15px', fontSize: '16px', fontWeight: 'bold' }}>
            <span className="btn-title">INVOQUER</span>
            <div className="btn-cost" style={{ fontSize: '12px', marginTop: '5px' }}>{activeBanner === 'premium' ? `💎 10` : `💳 ${formatNum(summonCost)}`}</div>
          </button>
          <button className="summon-btn" onClick={() => performSummon(true)} disabled={pity < 100} style={{ flex: 1, background: pity >= 100 ? '#eab308' : '#475569', color: pity >= 100 ? '#000' : '#9ca3af', padding: '15px', fontWeight: 'bold' }}>
            <span className="btn-title">PITY</span>
            <div className="btn-cost" style={{ fontSize: '12px', marginTop: '5px' }}>GRATUIT</div>
          </button>
        </div>
      </div>
    </div>
  );
};
