import React, { useState, useEffect } from 'react';

export const RankedView = ({ stats, setCurrentTab, setWave, setField, setCombatState, setRaidTimer, setIsRaidBossWave, setMode }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [playerRank, setPlayerRank] = useState(0);

  useEffect(() => {
    // Generate simulated leaderboard around player's highscore
    const pScore = stats?.highScoreSurvie || 0;
    const bots = [];

    // Generate 50 bots
    for (let i = 0; i < 50; i++) {
        bots.push({
            id: i,
            name: `Joueur${Math.floor(Math.random() * 9000) + 1000}`,
            score: Math.floor(Math.random() * 50) + (Math.random() < 0.2 ? pScore + Math.floor(Math.random() * 20) : pScore > 10 ? pScore - Math.floor(Math.random() * 10) : 0)
        });
    }

    bots.push({ id: 'player', name: 'VOUS', score: pScore, isPlayer: true });
    bots.sort((a, b) => b.score - a.score);

    // Make sure we have unique places even with ties to find rank properly
    setLeaderboard(bots);
    const rank = bots.findIndex(b => b.isPlayer) + 1;
    setPlayerRank(rank);
  }, [stats]);

  const startSurvival = () => {
    setMode('survival');
    setWave(1);
    setField({ troops: [], enemies: [] });
    setCombatState(c => ({ ...c, playerHp: 500, enemyMaxHp: 9999999, enemyHp: 9999999, energy: 0, combo: 0, energyLevel: 1, maxEnergy: 100 }));
    setRaidTimer(0);
    setIsRaidBossWave(false);
    setCurrentTab('combat');
  };

  return (
    <div className="tab-content fade-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-start', marginBottom: '20px' }}>
        <button className="confirm-btn" style={{ width: 'auto', background: '#334155' }} onClick={() => setCurrentTab('hub')}>
          RETOUR
        </button>
      </div>

      <h2 style={{ textAlign: 'center', color: '#f59e0b', marginTop: 0 }}>🏆 MODE CLASSÉ</h2>

      <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', border: '2px solid #f59e0b', marginBottom: '20px', textAlign: 'center' }}>
        <h3 style={{ color: 'white', marginTop: 0 }}>Mode Survie</h3>
        <p style={{ fontSize: '12px', color: '#94a3b8' }}>Défendez votre base contre des vagues infinies d'ennemis. Le but est d'atteindre la vague la plus haute possible pour grimper dans le classement.</p>
        <div style={{ fontSize: '18px', color: '#fde047', fontWeight: 'bold', margin: '15px 0' }}>Record Actuel: {stats?.highScoreSurvie || 0} vagues</div>
        <button className="confirm-btn" onClick={startSurvival} style={{ background: 'linear-gradient(180deg, #f59e0b 0%, #b45309 100%)', boxShadow: '0 4px 0 #78350f', fontSize: '18px', padding: '15px' }}>
          LANCER LA SURVIE
        </button>
      </div>

      <h3 style={{ color: '#38bdf8' }}>Leaderboard (Ligue Régionale)</h3>
      <div style={{ background: '#1e293b', borderRadius: '8px', border: '1px solid #334155', overflow: 'hidden' }}>
        <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', background: '#0f172a', borderBottom: '1px solid #334155', color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' }}>
           <span style={{ width: '50px' }}>Rang</span>
           <span style={{ flex: 1 }}>Joueur</span>
           <span>Vagues</span>
        </div>

        {leaderboard.slice(0, 100).map((entry, idx) => (
           <div key={entry.id} style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155', background: entry.isPlayer ? 'rgba(59, 130, 246, 0.2)' : 'transparent', color: entry.isPlayer ? '#38bdf8' : 'white', fontWeight: entry.isPlayer ? 'bold' : 'normal', fontSize: '14px' }}>
             <span style={{ width: '50px', color: idx < 3 ? '#fbbf24' : '#94a3b8' }}>#{idx + 1}</span>
             <span style={{ flex: 1 }}>{entry.name} {entry.isPlayer && '(Vous)'}</span>
             <span>{entry.score}</span>
           </div>
        ))}
      </div>
    </div>
  );
};
