import React, { useState } from 'react';
import { UNIT_TYPES } from '../constants';

export const TowerDefenseView = ({ combatDeck = [], setCombatDeck }) => {
  const [grid, setGrid] = useState(Array(9).fill(null));
  const [selectedDeckIndex, setSelectedDeckIndex] = useState(0);

  const placeUnit = (idx) => {
     const unit = combatDeck[selectedDeckIndex];
     if(unit && !grid[idx]) {
       const newGrid = [...grid];
       newGrid[idx] = unit;
       setGrid(newGrid);
     }
  };

  return (
    <div className="tab-content fade-in" style={{ padding: '15px' }}>
      <h2 style={{ textAlign: 'center', margin: '0 0 10px 0', color: '#fbbf24' }}>🛡️ DÉFENSE (PvE)</h2>
      <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>Placez vos unités pour repousser les vagues.</p>

      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', marginBottom: '15px', marginTop: '10px' }}>
        {combatDeck.map((unit, idx) => {
          const unitDef = unit ? (UNIT_TYPES[unit.level] || {}) : null;
          return (
            <div key={idx} onClick={() => setSelectedDeckIndex(idx)} style={{ width: '50px', height: '50px', background: selectedDeckIndex === idx ? '#38bdf8' : '#1e293b', border: '1px solid #475569', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', opacity: unit ? 1 : 0.3 }}>
              {unitDef ? unitDef.img || '🪖' : ''}
            </div>
          );
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '10px', padding: '20px', background: '#0f172a', borderRadius: '8px' }}>
        {grid.map((cell, idx) => {
           const cellDef = cell ? (UNIT_TYPES[cell.level] || {}) : null;
           return (
            <div key={idx} onClick={() => placeUnit(idx)} style={{ height: '80px', background: cell ? '#3b82f6' : '#1e293b', border: '1px solid #475569', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px' }}>
              {cellDef ? cellDef.img || '🪖' : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
};
