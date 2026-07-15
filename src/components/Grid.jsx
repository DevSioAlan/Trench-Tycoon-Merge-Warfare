import { memo } from 'react';
import { UNIT_TYPES } from '../constants';

export const Grid = memo(({ grid, selectedSlot, animatingCells, handleCellClick, cooldowns, now }) => {
  return (
    <div className="grid-container">
      <div className="grid-background-pattern"></div>
      {grid.map((cell, index) => {
        const isSelected = selectedSlot === index;
        const isMergeable = selectedSlot !== null && selectedSlot !== index && cell && grid[selectedSlot] && grid[selectedSlot].level === cell.level && cell.level < 8;
        const animClass = animatingCells[index] || '';

        const cooldownTime = cooldowns && cooldowns[index] ? cooldowns[index] : 0;
        const isOnCooldown = cooldownTime > now;
        const cdRemaining = isOnCooldown ? Math.ceil((cooldownTime - now) / 1000) : 0;

        return (
          <div key={index} className={`grid-cell ${isSelected ? 'selected-pulse' : ''} ${isMergeable ? 'merge-hint' : ''} ${animClass}`} onClick={() => handleCellClick(index)}>
            {cell && (
              <div className="unit-card">
                {isOnCooldown && <div className="cooldown-overlay">{cdRemaining}s</div>}
                <div className="unit-level-badge">Lv. {cell.level}</div>
                <div className={`aura-glow aura-${cell.level}`}></div>
                {cell.equip === 'medal' && <div className="equip-badge">🎖️</div>}
                <div className="unit-emoji-grid" style={{ fontSize: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>{UNIT_TYPES[cell.level].emoji}</div>
                <div className="unit-info"><span className="unit-name" style={{color: UNIT_TYPES[cell.level].color}}>{UNIT_TYPES[cell.level].name}</span></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});