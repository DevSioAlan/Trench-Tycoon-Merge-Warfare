import React, { useState, useEffect } from 'react';
import './GameBoard.css';

// Data Dictionary
const UNIT_TYPES = {
  1: 'Soldat',
  2: 'Sniper',
  3: 'Blindé Léger',
  4: 'Tank Lourd',
  5: 'Mécha'
};

const SUMMON_COST = 50;
const GRID_SIZE = 12;

export default function GameBoard() {
  const [gold, setGold] = useState(0);
  const [grid, setGrid] = useState(Array(GRID_SIZE).fill(null));
  const [selectedSlot, setSelectedSlot] = useState(null);

  // To handle animations on specific cells
  const [animatingCells, setAnimatingCells] = useState({});

  // Economy loop
  useEffect(() => {
    const timer = setInterval(() => {
      setGold(prev => prev + 5);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const triggerAnimation = (index, animationType) => {
    setAnimatingCells(prev => ({ ...prev, [index]: animationType }));
    setTimeout(() => {
      setAnimatingCells(prev => {
        const newAnim = { ...prev };
        delete newAnim[index];
        return newAnim;
      });
    }, 500); // Animation duration matched in CSS
  };

  const handleSummon = () => {
    if (gold >= SUMMON_COST) {
      const firstEmptyIndex = grid.findIndex(cell => cell === null);
      if (firstEmptyIndex !== -1) {
        setGold(prev => prev - SUMMON_COST);

        // Gacha probabilities
        const rand = Math.random();
        let spawnLevel = 1;
        let animationType = 'pop-in';

        if (rand < 0.7) {
          spawnLevel = 1;
        } else if (rand < 0.95) {
          spawnLevel = 2;
        } else {
          spawnLevel = 3;
          animationType = 'pop-in-jackpot';
        }

        const newGrid = [...grid];
        newGrid[firstEmptyIndex] = { level: spawnLevel, id: Date.now() };
        setGrid(newGrid);
        triggerAnimation(firstEmptyIndex, animationType);
      }
    }
  };

  const handleCellClick = (index) => {
    // If nothing selected
    if (selectedSlot === null) {
      if (grid[index]) {
        setSelectedSlot(index);
      }
      return;
    }

    // If tapping the already selected slot, deselect it
    if (selectedSlot === index) {
      setSelectedSlot(null);
      return;
    }

    const selectedUnit = grid[selectedSlot];
    const targetUnit = grid[index];

    // Move to empty cell
    if (!targetUnit) {
      const newGrid = [...grid];
      newGrid[index] = selectedUnit;
      newGrid[selectedSlot] = null;
      setGrid(newGrid);
      setSelectedSlot(null);
      return;
    }

    // Merge with same level
    if (selectedUnit.level === targetUnit.level) {
      const newGrid = [...grid];
      newGrid[index] = { level: selectedUnit.level + 1, id: Date.now() };
      newGrid[selectedSlot] = null;
      setGrid(newGrid);
      setSelectedSlot(null);
      triggerAnimation(index, 'merge-shockwave');
      return;
    }

    // If clicking on a different unit (cannot merge), select it instead
    setSelectedSlot(index);
  };

  return (
    <div className="game-container">
      <header className="game-header">
        <div className="gold-counter">
          💰 Or : {gold}
        </div>
        <button
          className="summon-button gacha-btn"
          onClick={handleSummon}
          disabled={gold < SUMMON_COST || grid.every(cell => cell === null === false)}
        >
          <span className="summon-title">✨ INVOQUER ✨</span>
          <span className="summon-cost">Coût : {SUMMON_COST} Or</span>
        </button>
      </header>

      <div className="grid-container">
        {grid.map((cell, index) => {
          const isSelected = selectedSlot === index;
          const animClass = animatingCells[index] || '';

          let cellClasses = `grid-cell`;
          if (isSelected) cellClasses += ' selected-pulse';
          if (animClass) cellClasses += ` ${animClass}`;

          return (
            <div
              key={index}
              className={cellClasses}
              onClick={() => handleCellClick(index)}
            >
              {cell && (
                <div className={`unit unit-lvl-${cell.level}`}>
                  <span className="unit-name">{UNIT_TYPES[cell.level] || `Niv. ${cell.level}`}</span>
                  <span className="unit-level">Lvl {cell.level}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
