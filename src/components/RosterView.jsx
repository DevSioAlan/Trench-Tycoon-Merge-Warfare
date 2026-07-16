import React from 'react';
import { UNIT_TYPES } from '../constants';

export const RosterView = ({ inventory = [], combatDeck = [], setCombatDeck, setCurrentTab }) => {
  const handleEquip = (unit) => {
    // Strict restriction: One unit = 1 slot maximum (check by level/type)
    if (combatDeck.some(u => u && u.level === unit.level)) {
      return; // Already equipped
    }

    const newDeck = [...combatDeck];
    const emptySlot = newDeck.findIndex(u => !u);
    if (emptySlot !== -1) {
      newDeck[emptySlot] = unit;
      setCombatDeck(newDeck);
    }
  };

  const handleAutoEquip = () => {
    // Sort inventory by level descending
    // Filter to get only the highest level unit of each type
    const uniqueUnits = [];
    const seenLevels = new Set();

    // Sort inventory by level (rarity) descending, then by id (just for consistent sorting)
    const sortedInventory = [...inventory].sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level;
      return a.id.localeCompare(b.id);
    });

    for (const unit of sortedInventory) {
      if (!seenLevels.has(unit.level)) {
        uniqueUnits.push(unit);
        seenLevels.add(unit.level);
      }
      if (uniqueUnits.length >= 6) break;
    }

    const newDeck = Array(6).fill(null);
    for (let i = 0; i < uniqueUnits.length; i++) {
      newDeck[i] = uniqueUnits[i];
    }

    setCombatDeck(newDeck);
  };

  const handleUnequip = (index) => {
    const newDeck = [...combatDeck];
    newDeck[index] = null;
    setCombatDeck(newDeck);
  };

  return (
    <div className="tab-content fade-in" style={{ padding: '15px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-start', marginBottom: '10px' }}>
        <button className="confirm-btn" style={{ width: 'auto', background: '#334155' }} onClick={() => setCurrentTab('hub')}>
          ⬅️ RETOUR
        </button>
      </div>
      <h2 style={{ textAlign: 'center', margin: '0 0 10px 0', color: '#fbbf24', marginTop: 0 }}>⚓ ÉQUIPE</h2>

      <div style={{ background: '#0f172a', padding: '10px', borderRadius: '8px', marginBottom: '15px', position: 'relative' }}>
        <button
          onClick={handleAutoEquip}
          style={{ position: 'absolute', right: '10px', top: '10px', background: '#3b82f6', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '5px', fontSize: '10px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          ⚡ Équipement Auto
        </button>
        <h3 style={{ fontSize: '14px', color: '#38bdf8', marginTop: 0 }}>Deck de Combat</h3>
        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
          {combatDeck.map((unit, idx) => {
            const unitDef = unit ? (UNIT_TYPES[unit.level] || {}) : null;
            return (
              <div key={idx} onClick={() => handleUnequip(idx)} style={{ width: '60px', height: '60px', background: '#1e293b', border: '1px dashed #475569', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', cursor: 'pointer' }}>
                {unitDef ? unitDef.emoji || '🪖' : ''}
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
              <div key={idx} onClick={() => handleEquip(unit)} style={{ background: '#1e293b', padding: '10px', borderRadius: '5px', textAlign: 'center', border: '1px solid #334155', cursor: 'pointer' }}>
                 <div style={{ fontSize: '24px' }}>{unitDef.emoji || '🪖'}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};