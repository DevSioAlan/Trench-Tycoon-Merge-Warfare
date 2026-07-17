import React from 'react';

export const QuestView = ({ quests, setQuests, res, setRes, profile, setProfile, setCurrentTab }) => {
  const claimDaily = (type, rewardGold, rewardGems) => {
    if (quests.claimed[type]) return;
    setQuests(q => ({ ...q, claimed: { ...q.claimed, [type]: true } }));
    setRes(r => ({ ...r, gold: r.gold + rewardGold, gems: r.gems + rewardGems }));
  };

  const claimAchievement = (type, rewardGems, titleReward) => {
    if (profile.unlockedTitles?.includes(titleReward)) return;
    setProfile(p => ({ ...p, unlockedTitles: [...(p.unlockedTitles || ['Recrue']), titleReward] }));
    setRes(r => ({ ...r, gems: r.gems + rewardGems }));
  };

  const dailyQuests = [
    { type: 'played', title: 'Combattre 3 fois', progress: quests?.daily?.played || 0, goal: 3, gold: 100, gems: 0 },
    { type: 'summoned', title: 'Invoquer 1 unité', progress: quests?.daily?.summoned || 0, goal: 1, gold: 0, gems: 5 },
    { type: 'energyUpgraded', title: 'Améliorer l\'énergie 5 fois', progress: quests?.daily?.energyUpgraded || 0, goal: 5, gold: 150, gems: 0 }
  ];

  const achievements = [
    { type: 'firstMythic', title: 'Obtenir une unité Mythique', condition: quests?.achievements?.firstMythic, gems: 50, titleReward: 'Chanceux' },
    { type: 'thousandKills', title: 'Tuer 1000 ennemis', condition: quests?.achievements?.thousandKills, gems: 100, titleReward: 'Général' }
  ];

  return (
    <div className="tab-content fade-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-start', marginBottom: '20px' }}>
        <button className="confirm-btn" style={{ width: 'auto', background: '#334155' }} onClick={() => setCurrentTab('hub')}>
          RETOUR
        </button>
      </div>

      <h2 style={{ textAlign: 'center', color: '#fbbf24', marginTop: 0 }}>QUÊTES & SUCCÈS</h2>

      <h3 style={{ color: '#38bdf8' }}>Quêtes Quotidiennes</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
        {dailyQuests.map(q => {
          const isDone = q.progress >= q.goal;
          const isClaimed = quests?.claimed?.[q.type];
          return (
            <div key={q.type} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 5px 0', color: 'white' }}>{q.title}</h4>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Progression: {Math.min(q.progress, q.goal)} / {q.goal}</div>
              </div>
              <button
                className="confirm-btn"
                style={{ width: 'auto', background: isClaimed ? '#475569' : (isDone ? '#10b981' : '#334155'), cursor: isClaimed ? 'default' : 'pointer' }}
                disabled={!isDone || isClaimed}
                onClick={() => claimDaily(q.type, q.gold, q.gems)}
              >
                {isClaimed ? 'Réclamé' : `+${q.gold ? q.gold+'💰' : q.gems+'💎'}`}
              </button>
            </div>
          );
        })}
      </div>

      <h3 style={{ color: '#a855f7' }}>Succès (Achievements)</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {achievements.map(a => {
          const isClaimed = profile?.unlockedTitles?.includes(a.titleReward);
          return (
            <div key={a.type} style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', padding: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h4 style={{ margin: '0 0 5px 0', color: 'white' }}>{a.title}</h4>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Récompense: Titre "{a.titleReward}"</div>
              </div>
              <button
                className="confirm-btn"
                style={{ width: 'auto', background: isClaimed ? '#475569' : (a.condition ? '#a855f7' : '#334155'), cursor: isClaimed ? 'default' : 'pointer' }}
                disabled={!a.condition || isClaimed}
                onClick={() => claimAchievement(a.type, a.gems, a.titleReward)}
              >
                {isClaimed ? 'Réclamé' : `+${a.gems}💎`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
