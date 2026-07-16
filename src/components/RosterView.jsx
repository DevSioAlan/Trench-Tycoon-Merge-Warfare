import React from 'react';
import { UNIT_TYPES } from '../constants';

export const RosterView = ({ inventory = [], combatDeck = [], setCombatDeck }) => {
  const handleEquip = (unit) => {
    // Basic logic: equip first empty slot
    const newDeck = [...combatDeck];
    const emptySlot = newDeck.findIndex(u => !u);
    if (emptySlot !== -1) {
      newDeck[emptySlot] = unit;
      setCombatDeck(newDeck);
    }
  };

  const handleUnequip = (index) => {
    const newDeck = [...combatDeck];
    newDeck[index] = null;
    setCombatDeck(newDeck);
  };

  return (
    <div className="tab-content fade-in" style={{ padding: '15px' }}>
      <h2 style={{ textAlign: 'center', margin: '0 0 10px 0', color: '#fbbf24' }}>⚓ ÉQUIPE</h2>

      <div style={{ background: '#0f172a', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
        <h3 style={{ fontSize: '14px', color: '#38bdf8', marginTop: 0 }}>Deck de Combat</h3>
        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
          {combatDeck.map((unit, idx) => {
            const unitDef = unit ? (UNIT_TYPES[unit.level] || {}) : null;
            return (
              <div key={idx} onClick={() => handleUnequip(idx)} style={{ width: '60px', height: '60px', background: '#1e293b', border: '1px dashed #475569', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                {unitDef ? unitDef.img || '🪖' : ''}
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: '14px', color: '#94a3b8' }}>Unités Disponibles</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {inventory.map((unit, idx) => {
            const unitDef = UNIT_TYPES[unit.level] || {};
            return (
              <div key={idx} onClick={() => handleEquip(unit)} style={{ background: '#1e293b', padding: '10px', borderRadius: '5px', textAlign: 'center', border: '1px solid #334155' }}>
                 <div style={{ fontSize: '24px' }}>{unitDef.img || '🪖'}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
