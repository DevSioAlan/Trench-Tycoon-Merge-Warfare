import { useEffect, useRef } from 'react';
import { ParticleEngine } from '../engine/ParticleEngine';

export const StartScreen = ({ setGameStarted, settings, setSettings }) => {
  const canvasRef = useRef(null);
  const particleEngine = useRef(null);

  useEffect(() => {
    if (settings.vfx && canvasRef.current && !particleEngine.current) {
      particleEngine.current = new ParticleEngine(canvasRef.current);
      // Custom update loop for background ash
      const emitAsh = () => {
        if (particleEngine.current) {
          particleEngine.current.emit(Math.random() * window.innerWidth, window.innerHeight + 10, '#fca5a5', 'spark', 1);
        }
      };
      const interval = setInterval(emitAsh, 200);
      particleEngine.current.update();

      return () => {
        clearInterval(interval);
        if (particleEngine.current) {
          particleEngine.current.destroy();
          particleEngine.current = null;
        }
      };
    }
  }, [settings.vfx]);

  return (
    <div className="start-screen new-start-screen">
      <div className="tactical-grid-bg"></div>
      <canvas ref={canvasRef} className="vfx-canvas" />

      <div className="audio-toggle" onClick={() => setSettings(s => ({...s, bgm: !s.bgm}))}>
        {settings.bgm ? '🔊' : '🔇'}
      </div>

      <div className="title-container">
        <h1 className="glitch-title" data-text="TRENCH TYCOON">TRENCH TYCOON</h1>
        <p className="subtitle">Tactical Warfare Edition</p>
      </div>

      <button className="confirm-btn" data-testid="start-button" onClick={() => setGameStarted(true)} style={{ position: 'relative', zIndex: 10000, width: '80%', padding: '20px', fontSize: '20px', background: 'linear-gradient(135deg, #10b981, #059669)' }}>
        DÉPLOYER LES TROUPES
      </button>
    </div>
  );
};
