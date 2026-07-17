import { formatNum } from '../constants';

export const HUD = ({ profile, res, setCurrentTab }) => {
  return (
    <header className="global-header">
      <div className="header-profile" onClick={() => setCurrentTab('profile')}>
        <div className={`mini-avatar frame-${profile?.frame ?? 'default'}`}>{profile?.avatar ?? '🪖'}</div>
        <div className="profile-info">
          <span className="profile-name">{profile?.name ?? 'Commandant'}</span>
        </div>
      </div>
      <div className="header-stats">
        <div className="res-item"><span className="icon">💰</span> <span className="val" style={{color: '#fbbf24'}}>{formatNum(res?.gold ?? 0)}</span></div>
        <div className="res-item"><span className="icon">💎</span> <span className="val" style={{color: '#38bdf8'}}>{formatNum(res?.gems ?? 0)}</span></div>
        <div className="res-item"><span className="icon">⚙️</span> <span className="val" style={{color: '#94a3b8'}}>{formatNum(res?.steel ?? 0)}</span></div>
        {res?.warMedals > 0 && <div className="res-item"><span className="icon">🎖️</span> <span className="val" style={{color: '#fb7185'}}>{formatNum(res?.warMedals ?? 0)}</span></div>}
      </div>
    </header>
  );
};