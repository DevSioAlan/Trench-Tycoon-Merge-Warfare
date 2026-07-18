import React from 'react';
import { SAVE_KEY } from '../constants';

export const SettingsView = ({ settings, setSettings, setCurrentTab }) => {
  
  const handleWipe = () => {
    if (window.confirm("⚠️ ATTENTION : Voulez-vous effacer toutes vos données de commandement ? (Action irréversible)")) {
      localStorage.removeItem(SAVE_KEY);
      window.location.reload();
    }
  };

  return (
    <div className="tab-content fade-in" style={{ alignItems: 'center' }}>
      <div style={{ display: 'flex', width: '100%', justifyContent: 'flex-start', marginBottom: '20px', maxWidth: '600px' }}>
        <button className="confirm-btn" style={{ width: 'auto', background: '#334155', borderBottomColor: '#1e293b' }} onClick={() => setCurrentTab('hub')}>⬅️ RETOUR</button>
      </div>
      
      <h2 style={{ color: '#f8fafc', fontSize: '32px', margin: '0 0 30px 0' }}>⚙️ CONFIGURATION SYSTÈME</h2>

      <div style={{ background: '#0f172a', padding: '30px', borderRadius: '12px', border: '1px solid #334155', width: '100%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>
          <div><h4 style={{margin:0, color: 'white'}}>Musique (BGM)</h4><span style={{fontSize:'12px', color:'#94a3b8'}}>Musique d'ambiance militaire</span></div>
          <input type="checkbox" checked={settings.bgm} onChange={e => setSettings(s => ({...s, bgm: e.target.checked}))} style={{width:'24px', height:'24px'}} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>
          <div><h4 style={{margin:0, color: 'white'}}>Effets Sonores (SFX)</h4><span style={{fontSize:'12px', color:'#94a3b8'}}>Tirs, explosions, UI</span></div>
          <input type="checkbox" checked={settings.sfx} onChange={e => setSettings(s => ({...s, sfx: e.target.checked}))} style={{width:'24px', height:'24px'}} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>
          <div><h4 style={{margin:0, color: 'white'}}>Textes de Dégâts</h4><span style={{fontSize:'12px', color:'#94a3b8'}}>Affiche les nombres au-dessus des cibles</span></div>
          <input type="checkbox" checked={settings.showDamage} onChange={e => setSettings(s => ({...s, showDamage: e.target.checked}))} style={{width:'24px', height:'24px'}} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '10px' }}>
          <div><h4 style={{margin:0, color: 'white'}}>Qualité VFX</h4><span style={{fontSize:'12px', color:'#94a3b8'}}>Réduire en cas de ralentissements</span></div>
          <select value={settings.vfxMode} onChange={e => setSettings(s => ({...s, vfxMode: e.target.value}))} className="input-field" style={{width: 'auto', padding: '5px 10px'}}>
            <option value="high">Élevée</option>
            <option value="low">Faible</option>
          </select>
        </div>

        <div style={{ marginTop: '20px' }}>
          <button className="confirm-btn" style={{ background: '#ef4444', borderBottomColor: '#991b1b' }} onClick={handleWipe}>
            ☢️ PROTOCOLE DE DESTRUCTION (WIPE SAVE)
          </button>
        </div>

      </div>
    </div>
  );
};