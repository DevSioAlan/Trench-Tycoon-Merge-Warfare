import React from 'react';
import { formatNum } from '../constants';

export const SummonView = ({ activeBanner, setActiveBanner, performSummon, res, summonCost, grid, pity }) => {
  const hasEmptySlot = grid.includes(null);

  return (
    <div className="action-row" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div className="banner-selector" style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
        <button className={activeBanner === 'standard' ? 'active' : ''} onClick={() => setActiveBanner('standard')} style={{ flex: 1, padding: '10px', background: activeBanner === 'standard' ? '#3b82f6' : '#1e293b', color: 'white', border: 'none', borderRadius: '5px' }}>
          Standard Banner
        </button>
        <button className={activeBanner === 'premium' ? 'active' : ''} onClick={() => setActiveBanner('premium')} style={{ flex: 1, padding: '10px', background: activeBanner === 'premium' ? '#a855f7' : '#1e293b', color: 'white', border: 'none', borderRadius: '5px' }}>
          Epic Banner
        </button>
      </div>

      <div className="pity-bar-container" style={{ width: '100%', background: '#334155', borderRadius: '5px', overflow: 'hidden', height: '10px', margin: '5px 0' }}>
        <div className="pity-bar-fill" style={{ width: `${pity}%`, background: pity >= 100 ? '#eab308' : '#38bdf8', height: '100%', transition: 'width 0.3s' }}></div>
      </div>
      <div style={{ textAlign: 'center', fontSize: '10px', color: '#94a3b8' }}>Pity: {pity}/100</div>

      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="summon-btn" onClick={() => performSummon(false)} disabled={(activeBanner === 'premium' ? res.gems < 10 : res.gold < summonCost) || !hasEmptySlot} style={{ flex: 2 }}>
          <span className="btn-title">INVOQUER</span>
          <span className="btn-cost">{activeBanner === 'premium' ? `💎 10` : `💳 ${formatNum(summonCost)}`}</span>
        </button>
        <button className="summon-btn" onClick={() => performSummon(true)} disabled={pity < 100 || !hasEmptySlot} style={{ flex: 1, background: pity >= 100 ? '#eab308' : '#475569' }}>
          <span className="btn-title">PITY SUMMON</span>
          <span className="btn-cost">GRATUIT</span>
        </button>
      </div>
    </div>
  );
};
