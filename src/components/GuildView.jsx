import React from 'react';

export const GuildView = ({ guild, setGuild, res, setRes, setCurrentTab }) => {
  const handleCreate = () => {
    if (res.gold >= 1000) {
      setRes(r => ({ ...r, gold: r.gold - 1000 }));
      setGuild(g => ({ ...g, id: Date.now(), name: 'Ma Guilde ' + Math.floor(Math.random()*100), joinedAt: Date.now(), buffType: Math.random() > 0.5 ? 'gold' : 'energy' }));
    }
  };

  const handleJoin = () => {
    setGuild(g => ({ ...g, id: Date.now(), name: 'Guilde Publique ' + Math.floor(Math.random()*100), joinedAt: Date.now(), buffType: Math.random() > 0.5 ? 'gold' : 'energy' }));
  };

  const handleCheckIn = () => {
    const today = new Date().setHours(0,0,0,0);
    if (guild.lastCheckIn < today) {
      setRes(r => ({ ...r, gems: r.gems + 5 }));
      setGuild(g => ({ ...g, lastCheckIn: Date.now() }));
    }
  };

  const today = new Date().setHours(0,0,0,0);
  const canCheckIn = guild.id && guild.lastCheckIn < today;

  return (
    <div className="tab-content fade-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', marginBottom: '20px' }}>
        <button className="confirm-btn" style={{ width: 'auto', background: '#334155' }} onClick={() => setCurrentTab('hub')}>
          RETOUR
        </button>
      </div>

      <h2 style={{ textAlign: 'center', color: '#fbbf24', marginTop: 0 }}>🛡️ GUILDE</h2>

      {!guild.id ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center', marginTop: '20px' }}>
          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', width: '100%', maxWidth: '300px', textAlign: 'center' }}>
            <h3 style={{ color: 'white', marginTop: 0 }}>Créer une Guilde</h3>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>Devenez le chef de votre propre guilde.</p>
            <button className="confirm-btn" onClick={handleCreate} disabled={res.gold < 1000} style={{ background: '#3b82f6', border: 'none', boxShadow: '0 4px 0 #1d4ed8' }}>
              Créer (1000💰)
            </button>
          </div>

          <div style={{ background: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155', width: '100%', maxWidth: '300px', textAlign: 'center' }}>
            <h3 style={{ color: 'white', marginTop: 0 }}>Rejoindre une Guilde</h3>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>Rejoignez une guilde aléatoire du serveur.</p>
            <button className="confirm-btn" onClick={handleJoin}>
              Rejoindre Gratuitement
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
          <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', border: '2px solid #38bdf8', width: '100%', textAlign: 'center', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)' }}>
            <h3 style={{ margin: 0, fontSize: '24px', color: 'white' }}>{guild.name}</h3>
            <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '5px' }}>
              Rejoint le: {new Date(guild.joinedAt).toLocaleDateString()}
            </div>
          </div>

          <div style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', border: '1px solid #334155', width: '100%' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#a855f7' }}>Buff de Guilde Actif</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '30px' }}>{guild.buffType === 'gold' ? '💰' : '⚡'}</div>
              <div>
                <div style={{ fontWeight: 'bold', color: 'white' }}>{guild.buffType === 'gold' ? '+10% Or en Combat' : '+10% Régénération Énergie'}</div>
                <div style={{ fontSize: '12px', color: '#94a3b8' }}>Avantage passif appliqué automatiquement.</div>
              </div>
            </div>
          </div>

          <div style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', border: '1px solid #334155', width: '100%', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#38bdf8' }}>Check-in Quotidien</h4>
            <p style={{ fontSize: '12px', color: '#94a3b8' }}>Connectez-vous à la guilde chaque jour pour recevoir 5 Gemmes gratuites.</p>
            <button className="confirm-btn" onClick={handleCheckIn} disabled={!canCheckIn} style={{ background: canCheckIn ? '#10b981' : '#475569' }}>
              {canCheckIn ? 'Faire le Check-in (+5💎)' : 'Déjà réclamé aujourd\'hui'}
            </button>
          </div>

          <div style={{ background: '#450a0a', padding: '15px', borderRadius: '8px', border: '2px solid #ef4444', width: '100%', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: '-10px', top: '-10px', fontSize: '60px', opacity: 0.2 }}>👹</div>
            <h4 style={{ margin: '0 0 10px 0', color: '#fca5a5', position: 'relative', zIndex: 1 }}>⚔️ Guerre de Clan</h4>
            <p style={{ fontSize: '12px', color: '#f87171', position: 'relative', zIndex: 1 }}>Affrontez le Boss de Guilde ! Vous avez 60 secondes pour infliger un maximum de dégâts et gagner des Médailles de Guerre.</p>
            <div style={{ fontSize: '14px', color: '#fbbf24', marginBottom: '10px', fontWeight: 'bold' }}>Record: {guild.highscore || 0} Dégâts</div>
            <button className="confirm-btn" onClick={() => setCurrentTab('clanWar')} style={{ background: 'linear-gradient(180deg, #ef4444 0%, #b91c1c 100%)', boxShadow: '0 4px 0 #7f1d1d', position: 'relative', zIndex: 1 }}>
              ATTAQUER LE BOSS
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
