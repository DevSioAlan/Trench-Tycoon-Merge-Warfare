import { formatNum } from '../constants';

export const HUD = ({ profile, res, setUiState }) => {
  return (
    <header className="global-header">
      <div className="header-profile" onClick={() => setUiState(u => ({...u, showProfile: true}))}>
        <div className={`mini-avatar frame-${profile.frame}`}>{profile.avatar}</div>
        <div className="profile-info">
          <span className="profile-name">{profile.name}</span>
        </div>
      </div>
      <div className="header-stats">
        <div className="res-item"><span className="icon">💰</span> <span className="val" style={{color: '#fbbf24'}}>{formatNum(res.gold)}</span></div>
        <div className="res-item"><span className="icon">💎</span> <span className="val" style={{color: '#38bdf8'}}>{formatNum(res.gems)}</span></div>
        <div className="res-item"><span className="icon">⚙️</span> <span className="val" style={{color: '#94a3b8'}}>{formatNum(res.steel)}</span></div>
      </div>
    </header>
  );
};