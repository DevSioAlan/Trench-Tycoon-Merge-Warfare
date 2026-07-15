import React from 'react';
import { UNIT_TYPES } from '../constants';

export const InventoryView = ({ inventory = [] }) => {
  return (
    <div className="tab-content fade-in" style={{ padding: '15px' }}>
      <h2 style={{ textAlign: 'center', margin: '0 0 10px 0', color: '#fbbf24' }}>🎒 INVENTAIRE</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
        {inventory.length === 0 ? (
          <p style={{ color: '#94a3b8', gridColumn: 'span 4', textAlign: 'center' }}>Votre inventaire est vide.</p>
        ) : (
          inventory.map((item, idx) => {
            const unitDef = UNIT_TYPES[item.level] || {};
            return (
              <div key={idx} className={`unit-card rarity-${item.rarity || 'common'}`} style={{ border: '1px solid #334155', borderRadius: '5px', padding: '10px', textAlign: 'center', background: '#1e293b' }}>
                <div style={{ fontSize: '30px' }}>{unitDef.img || '🪖'}</div>
                <div style={{ fontSize: '10px', marginTop: '5px', color: '#cbd5e1' }}>{unitDef.name || 'Unité'}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
