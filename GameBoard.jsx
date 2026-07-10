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

const DAMAGE_MAP = {
  1: 10,
  2: 30,
  3: 100,
  4: 250,
  5: 600
};

export default function GameBoard() {
  const [gold, setGold] = useState(0);
  const [grid, setGrid] = useState(Array(GRID_SIZE).fill(null));
  const [selectedSlot, setSelectedSlot] = useState(null);

  // To handle animations on specific cells
  const [animatingCells, setAnimatingCells] = useState({});

  // Combat States
  const [enemyMaxHp, setEnemyMaxHp] = useState(1000);
  const [enemyHp, setEnemyHp] = useState(1000);
  const [playerMaxHp, setPlayerMaxHp] = useState(500);
  const [playerHp, setPlayerHp] = useState(500);
  const [activeTroops, setActiveTroops] = useState([]);
  const [activeEnemy, setActiveEnemy] = useState(null);
  const [baseShake, setBaseShake] = useState(false);

  // Economy loop
  useEffect(() => {
    const timer = setInterval(() => {
      setGold(prev => prev + 5);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Ref to hold the latest activeEnemy state safely for asynchronous timeouts
  const activeEnemyRef = React.useRef(activeEnemy);
  useEffect(() => {
    activeEnemyRef.current = activeEnemy;
  }, [activeEnemy]);

  // Enemy Spawner
  useEffect(() => {
    const spawner = setInterval(() => {
      const enemyId = Date.now();
      const spawnHp = Math.floor(enemyMaxHp * 0.05) || 50;
      const enemyData = { id: enemyId, hp: spawnHp, maxHp: spawnHp, damage: spawnHp };

      setActiveEnemy(enemyData);

      setTimeout(() => {
        // Evaluate the condition using the ref instead of the updater function
        const currentEnemy = activeEnemyRef.current;
        if (currentEnemy && currentEnemy.id === enemyId) {
          setPlayerHp(p => p - currentEnemy.damage);
          setActiveEnemy(null);
        }
      }, 2000);
    }, 4000);

    return () => clearInterval(spawner);
  }, [enemyMaxHp]);

  // Assault Action
  const handleAssault = () => {
    const troops = grid.filter(cell => cell !== null);
    if (troops.length === 0) return;

    setActiveTroops(troops);
    setGrid(Array(GRID_SIZE).fill(null));
    setSelectedSlot(null);
  };

  // Combat Loop: Troops travel and hit
  useEffect(() => {
    if (activeTroops.length > 0) {
      const timer = setTimeout(() => {
        const totalDamage = activeTroops.reduce((sum, troop) => sum + (DAMAGE_MAP[troop.level] || 0), 0);
        const currentEnemy = activeEnemyRef.current;

        if (currentEnemy) {
          if (totalDamage >= currentEnemy.hp) {
            // Enemy destroyed, surplus to base
            const surplus = totalDamage - currentEnemy.hp;
            setEnemyHp(prev => Math.max(0, prev - surplus));
            setActiveEnemy(null);
          } else {
            // Enemy survives, no surplus
            setActiveEnemy(prev => ({ ...prev, hp: prev.hp - totalDamage }));
          }
        } else {
          // No enemy, base takes full damage
          setEnemyHp(prev => Math.max(0, prev - totalDamage));
        }

        setActiveTroops([]);
      }, 1000); // 1s animation time

      return () => clearTimeout(timer);
    }
  }, [activeTroops]);

  // Victory Loop: Base destroyed
  useEffect(() => {
    if (enemyHp <= 0 && enemyMaxHp > 0) {
      setGold(prev => prev + 500);
      setBaseShake(true);
      setActiveEnemy(null);

      // We don't put the timeout in a cleanup that gets canceled by baseShake
      // by pulling the state logic into a localized timeout.
      setTimeout(() => {
        setEnemyMaxHp(prevMax => {
          const newMax = Math.floor(prevMax * 1.5);
          setEnemyHp(newMax);
          return newMax;
        });
        setBaseShake(false);
      }, 500); // Shake duration
    }
  }, [enemyHp]);

  // Game Over Loop
  useEffect(() => {
    if (playerHp <= 0) {
      alert('Base Détruite ! Game Over.');
      setGold(0);
      setGrid(Array(GRID_SIZE).fill(null));
      setSelectedSlot(null);
      setPlayerHp(500);
      setPlayerMaxHp(500);
      setEnemyMaxHp(1000);
      setEnemyHp(1000);
      setActiveEnemy(null);
      setActiveTroops([]);
    }
  }, [playerHp]);

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
      {/* Moitié Haute : Battlefield */}
      <div className="battlefield-section">
        <div className="battlefield">
          {/* Base du Joueur (Gauche) */}
          <div className="player-base">
            <div className="base-sprite">🛡️</div>
            <div className="hp-bar-container">
              <div
                className="hp-bar player-hp-bar"
                style={{ width: `${Math.max(0, (playerHp / playerMaxHp) * 100)}%` }}
              ></div>
            </div>
            <div className="hp-text">{playerHp} / {playerMaxHp}</div>

            {/* Zone d'apparition des troupes */}
            <div className="troop-spawn-zone">
              {activeTroops.map((troop, idx) => (
                <div
                  key={`${troop.id}-${idx}`}
                  className={`unit unit-lvl-${troop.level} active-troop troop-charge`}
                  style={{ top: `${(idx % 3) * 30}px`, left: `${Math.floor(idx / 3) * -10}px` }}
                >
                  <span className="unit-level">Lvl {troop.level}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Ennemi Actif (Centre/Mouvement) */}
          {activeEnemy && (
            <div className="active-enemy enemy-charge">
              <div className="enemy-sprite">👿</div>
              <div className="hp-bar-container mini-hp-bar">
                <div
                  className="hp-bar"
                  style={{ width: `${Math.max(0, (activeEnemy.hp / activeEnemy.maxHp) * 100)}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Base Ennemie (Droite) */}
          <div className={`enemy-base ${baseShake ? 'base-shake' : ''}`}>
            <div className="base-sprite">🏰</div>
            <div className="hp-bar-container">
              <div
                className="hp-bar"
                style={{ width: `${Math.max(0, (enemyHp / enemyMaxHp) * 100)}%` }}
              ></div>
            </div>
            <div className="hp-text">{enemyHp} / {enemyMaxHp}</div>
          </div>
        </div>
      </div>

      {/* Bouton d'Assaut au Milieu */}
      <button
        className="assault-button"
        onClick={handleAssault}
        disabled={!grid.some(cell => cell !== null) || activeTroops.length > 0}
      >
        ⚔️ LANCER L'ASSAUT ⚔️
      </button>

      {/* Moitié Basse : Management (Économie & Grille) */}
      <div className="management-section">
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
    </div>
  );
}
