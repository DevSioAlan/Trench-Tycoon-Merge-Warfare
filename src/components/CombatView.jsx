import React from 'react';
import { Battlefield } from './Battlefield';
import { Grid } from './Grid';

export const CombatView = ({
  combatState, wave, isRaidBossWave, synergyBuffs, waveEvent, weather, rageTimer, ultiGauge, field, floatingTexts, triggerUltimate, raidTimer, buildings,
  handleDeployIndividual, selectedSlot, grid, animatingCells, handleCellClick, cooldowns, now
}) => {
  return (
    <div className="tab-content fade-in">
      <Battlefield
        combatState={combatState} wave={wave} isRaidBossWave={isRaidBossWave} synergyBuffs={synergyBuffs} waveEvent={waveEvent}
        weather={weather} rageTimer={rageTimer} ultiGauge={ultiGauge} field={field} floatingTexts={floatingTexts} triggerUltimate={triggerUltimate} raidTimer={raidTimer}
        buildings={buildings}
      />
      <div className="action-row">
        <button className="assault-btn" onClick={handleDeployIndividual} disabled={selectedSlot === null || combatState.energy < (grid[selectedSlot]?.level * 10 || 0)}>
          ⚔️ DÉPLOYER {selectedSlot !== null && grid[selectedSlot] ? `(-${grid[selectedSlot].level * 10}⚡)` : ''}
        </button>
      </div>
      <Grid grid={grid} selectedSlot={selectedSlot} animatingCells={animatingCells} handleCellClick={handleCellClick} cooldowns={cooldowns} now={now} />
    </div>
  );
};
