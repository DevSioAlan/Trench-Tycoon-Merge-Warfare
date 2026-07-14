import { formatNum } from '../constants';

export const Cinematic = ({ uiState }) => {
  if (!uiState.cinematic) return null;
  return (
    <div className="cinematic-overlay">
      <div className="cinematic-content">
        <div className="cine-bg"></div>
        <img src={uiState.cinematic.img} alt="Unit" className="cine-sprite" />
        <h1 style={{color: uiState.cinematic.color}}>{uiState.cinematic.name}</h1>
      </div>
    </div>
  );
};

export const ProfileModal = ({ uiState, setUiState, profile, setProfile, wave }) => {
  if (!uiState.showProfile) return null;
  return (
    <div className="modal-overlay" onClick={() => setUiState(u => ({...u, showProfile: false}))}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h2 className="rainbow-text">Dossier Militaire</h2>
        <div style={{display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', justifyContent:'center'}}>
          <div className={`profile-avatar frame-${profile.frame}`}>{profile.avatar}</div>
          <div style={{textAlign: 'left'}}>
            <h3 style={{margin:0}}>{profile.name}</h3>
            <span style={{color: '#a855f7', fontSize: '12px'}}>{profile.title}</span><br/>
            <span style={{color: '#94a3b8', fontSize: '10px'}}>Vague Max: {wave}</span>
          </div>
        </div>
        <input type="text" value={profile.name} onChange={e => setProfile(p => ({...p, name: e.target.value}))} placeholder="Nom de code" className="input-field" />
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