import React, { useMemo } from 'react';
import { UNIT_TYPES, formatNum } from '../constants';

export const ProfileView = ({ profile, setProfile, stats, inventory, setCurrentTab }) => {
  const uniqueAvatars = useMemo(() => {
    const levels = new Set(inventory.map(u => u.level));
    return Array.from(levels).map(level => UNIT_TYPES[level]?.emoji).filter(Boolean);
  }, [inventory]);

  return (
    <div className="tab-content fade-in" style={{ padding: '20px', display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-start', marginBottom: '20px' }}>
        <button className="confirm-btn" style={{ width: 'auto', background: '#334155' }} onClick={() => setCurrentTab('hub')}>
          RETOUR
        </button>
      </div>

      <h2 className="rainbow-text" style={{ textAlign: 'center', marginTop: 0 }}>Dossier Militaire</h2>

      <div style={{ background: '#0f172a', padding: '20px', borderRadius: '12px', border: '2px solid #38bdf8', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '20px', justifyContent: 'center', boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)' }}>
        <div className={`profile-avatar frame-${profile?.frame ?? 'default'}`} style={{ fontSize: '60px', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e293b', borderRadius: '50%' }}>
          {profile?.avatar ?? '🪖'}
        </div>
        <div style={{ textAlign: 'left' }}>
          <h3 style={{ margin: 0, fontSize: '24px', color: 'white' }}>{profile?.name ?? 'Commandant'}</h3>
          <span style={{ color: '#a855f7', fontSize: '14px', fontWeight: 'bold' }}>{profile?.title ?? 'Recrue'}</span>
        </div>
      </div>

      <h3 style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '10px' }}>Changer de Nom</h3>
      <input type="text" value={profile?.name ?? ''} onChange={e => setProfile(p => ({...p, name: e.target.value}))} placeholder="Nom de code" className="input-field" style={{ marginBottom: '20px', width: '100%', boxSizing: 'border-box' }} />

      <h3 style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '10px' }}>Titres Débloqués</h3>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {(profile?.unlockedTitles || ['Recrue']).map(t => (
          <button key={t} onClick={() => setProfile(p => ({...p, title: t}))} style={{ background: profile?.title === t ? '#a855f7' : '#1e293b', color: 'white', border: `1px solid ${profile?.title === t ? '#d8b4fe' : '#334155'}`, padding: '8px 12px', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>
            {t}
          </button>
        ))}
      </div>

      <h3 style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '10px' }}>Avatars Disponibles (Unités possédées)</h3>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {uniqueAvatars.map(av => (
          <button key={av} onClick={() => setProfile(p => ({...p, avatar: av}))} style={{ background: profile?.avatar === av ? '#3b82f6' : '#1e293b', border: `2px solid ${profile?.avatar === av ? '#60a5fa' : '#334155'}`, fontSize: '24px', width: '50px', height: '50px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {av}
          </button>
        ))}
      </div>

      <h3 style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '10px' }}>Statistiques Globales</h3>
      <div style={{ background: '#1e293b', padding: '15px', borderRadius: '8px', border: '1px solid #334155', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <div style={{ background: '#0f172a', padding: '10px', borderRadius: '5px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>Combats Gagnés</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#38bdf8' }}>{formatNum(stats?.battlesWon ?? 0)}</div>
        </div>
        <div style={{ background: '#0f172a', padding: '10px', borderRadius: '5px', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>Ennemis Vaincus</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#ef4444' }}>{formatNum(stats?.enemiesDefeated ?? 0)}</div>
        </div>
        <div style={{ background: '#0f172a', padding: '10px', borderRadius: '5px', textAlign: 'center', gridColumn: '1 / -1' }}>
          <div style={{ fontSize: '10px', color: '#94a3b8' }}>Unités Débloquées</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#eab308' }}>{uniqueAvatars.length} / {Object.keys(UNIT_TYPES).length}</div>
        </div>
      </div>
    </div>
  );
};
