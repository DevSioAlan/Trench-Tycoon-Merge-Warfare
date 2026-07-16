import React from 'react';
import { Battlefield } from './Battlefield';
import { DeckView } from './DeckView';

export const CombatView = ({
  combatState, wave, isRaidBossWave, synergyBuffs, waveEvent, weather, rageTimer, ultiGauge, field, floatingTexts, triggerUltimate, raidTimer, buildings,
  handleDeployIndividual, combatDeck, cooldowns, now, setCurrentTab
}) => {
  return (
    <div className="tab-content fade-in" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '10px' }}>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-start', marginBottom: '5px' }}>
        <button className="confirm-btn" style={{ width: 'auto', background: '#334155', padding: '5px 10px', fontSize: '10px' }} onClick={() => setCurrentTab('map')}>
          ⬅️ FUIR
        </button>
      </div>

      <Battlefield
        combatState={combatState} wave={wave} isRaidBossWave={isRaidBossWave} synergyBuffs={synergyBuffs} waveEvent={waveEvent}
        weather={weather} rageTimer={rageTimer} ultiGauge={ultiGauge} field={field} floatingTexts={floatingTexts} triggerUltimate={triggerUltimate} raidTimer={raidTimer}
        buildings={buildings}
      />

      <div style={{ flex: 1 }}></div>

      <DeckView
        combatDeck={combatDeck}
        cooldowns={cooldowns}
        now={now}
        handleDeployIndividual={handleDeployIndividual}
        combatState={combatState}
      />
    </div>
  );
};
