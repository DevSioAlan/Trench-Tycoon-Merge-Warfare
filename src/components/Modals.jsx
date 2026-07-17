import { formatNum } from '../constants';

export const Cinematic = ({ uiState }) => {
  if (!uiState?.cinematicSummon?.active || !uiState.cinematicSummon.item) return null;
  const item = uiState.cinematicSummon.item;
  return (
    <div className="cinematic-overlay">
      <div className="cinematic-content">
        <div className="cine-bg"></div>
        <div className="cine-sprite" style={{ fontSize: '150px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {item.emoji}
        </div>
        <h1 style={{color: item.color}}>{item.name}</h1>
      </div>
    </div>
  );
};

export const DropRateModal = ({ uiState, setUiState }) => {
  if (!uiState?.showDropRates) return null;
  return (
    <div className="modal-overlay" onClick={() => setUiState(u => ({...u, showDropRates: false}))}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
        <h2 style={{ color: '#fbbf24', marginTop: 0 }}>Probabilités (Drop Rates)</h2>

        <h3 style={{ color: '#3b82f6', marginBottom: '5px' }}>Bannière Standard</h3>
        <div style={{ background: '#0f172a', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '12px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}><span>Commun</span><span>~52.75%</span></div>
           <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3b82f6' }}><span>Rare</span><span>35.0%</span></div>
           <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a855f7' }}><span>Épique</span><span>10.0%</span></div>
           <div style={{ display: 'flex', justifyContent: 'space-between', color: '#eab308' }}><span>Légendaire</span><span>2.0%</span></div>
           <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}><span>Mythique</span><span>0.2%</span></div>
           <div style={{ display: 'flex', justifyContent: 'space-between', color: '#06b6d4' }}><span>Ultra Légendaire</span><span>0.05%</span></div>
        </div>

        <h3 style={{ color: '#a855f7', marginBottom: '5px' }}>Bannière Épique</h3>
        <div style={{ background: '#0f172a', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '12px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', color: '#3b82f6' }}><span>Rare</span><span>~74.4%</span></div>
           <div style={{ display: 'flex', justifyContent: 'space-between', color: '#a855f7' }}><span>Épique</span><span>15.0%</span></div>
           <div style={{ display: 'flex', justifyContent: 'space-between', color: '#eab308' }}><span>Légendaire</span><span>4.5%</span></div>
           <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}><span>Mythique</span><span>0.4%</span></div>
           <div style={{ display: 'flex', justifyContent: 'space-between', color: '#06b6d4', fontWeight: 'bold' }}><span>Ultra Légendaire</span><span>0.1%</span></div>
        </div>

        <p style={{ fontSize: '10px', color: '#94a3b8' }}>* La Pity garantit l'obtention de la rareté correspondante si atteinte.</p>
        <button className="confirm-btn" onClick={() => setUiState(u => ({...u, showDropRates: false}))}>Fermer</button>
      </div>
    </div>
  );
};

export const ProfileModal = ({ uiState, setUiState, profile, setProfile, wave }) => {
  if (!uiState?.showProfile) return null;
  return (
    <div className="modal-overlay" onClick={() => setUiState(u => ({...u, showProfile: false}))}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h2 className="rainbow-text">Dossier Militaire</h2>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', justifyContent:'center'}}>
          <div className={`profile-avatar frame-${profile?.frame ?? 'default'}`}>{profile?.avatar ?? '🪖'}</div>
          <div style={{textAlign: 'left'}}>
            <h3 style={{margin:0}}>{profile?.name ?? 'Commandant'}</h3>
            <span style={{color: '#a855f7', fontSize: '12px'}}>{profile?.title ?? 'Recrue'}</span><br/>
            <span style={{color: '#94a3b8', fontSize: '10px'}}>Vague Max: {wave}</span>
          </div>
        </div>
        <div style={{ background: '#0f172a', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '12px' }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}><span>Unités Tuées</span><span>{formatNum(profile?.stats?.unitsKilled || 0)}</span></div>
           <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}><span>Invocations Réalisées</span><span>{formatNum(profile?.stats?.summons || 0)}</span></div>
           <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8' }}><span>Dégâts Infligés</span><span>{formatNum(profile?.stats?.damageDealt || 0)}</span></div>
        </div>
        <input type="text" value={profile?.name ?? ''} onChange={e => setProfile(p => ({...p, name: e.target.value}))} placeholder="Nom de code" className="input-field" />
        <div style={{display: 'flex', gap: '5px', margin: '10px 0', justifyContent:'center'}}>
          {['default', 'gold', 'neon', 'flame'].map(f => (
            <button key={f} className="up-btn" onClick={() => setProfile(p => ({...p, frame: f}))}>{f}</button>
          ))}
        </div>
        <button className="confirm-btn" onClick={() => setUiState(u => ({...u, showProfile: false}))}>Fermer</button>
      </div>
    </div>
  );
};

export const AFKModal = ({ afkReward, setAfkReward }) => {
  if (!afkReward) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-box pop-in-jackpot">
        <h2>Rapport d'Absence</h2><div className="modal-icon">🌙</div>
        <div className="modal-amount">+{formatNum(afkReward)} Or</div>
        <button className="confirm-btn" onClick={() => setAfkReward(null)}>Encaisser</button>
      </div>
    </div>
  );
};