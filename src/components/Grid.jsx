import { UNIT_TYPES } from '../constants';

export const Grid = ({ grid, selectedSlot, animatingCells, handleCellClick }) => {
  return (
    <div className="grid-container">
      <div className="grid-background-pattern"></div>
      {grid.map((cell, index) => {
        const isSelected = selectedSlot === index;
        const isMergeable = selectedSlot !== null && selectedSlot !== index && cell && grid[selectedSlot] && grid[selectedSlot].level === cell.level && cell.level < 8;
        const animClass = animatingCells[index] || '';
        return (
          <div key={index} className={`grid-cell ${isSelected ? 'selected-pulse' : ''} ${isMergeable ? 'merge-hint' : ''} ${animClass}`} onClick={() => handleCellClick(index)}>
            {cell && (
              <div className="unit-card">
                <div className={`aura-glow aura-${cell.level}`}></div>
                {cell.equip === 'medal' && <div className="equip-badge">🎖️</div>}
                <img src={UNIT_TYPES[cell.level].img} className="unit-image" alt="unit" />
                <div className="unit-info"><span className="unit-name" style={{color: UNIT_TYPES[cell.level].color}}>{UNIT_TYPES[cell.level].name}</span></div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};