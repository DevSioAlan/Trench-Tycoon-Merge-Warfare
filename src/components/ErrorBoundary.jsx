import { Component } from 'react';
import { SAVE_KEY } from '../constants';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'white', background: '#0f172a', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h2>💥 Erreur Critique du Moteur</h2>
          <p style={{ color: '#ef4444', background: 'rgba(0,0,0,0.5)', padding: '10px' }}>{this.state.error?.toString()}</p>
          <button onClick={() => { localStorage.removeItem(SAVE_KEY); window.location.reload(); }} style={{ padding: '15px', background: '#dc2626', color: 'white', borderRadius: '8px', marginTop: '20px' }}>
            ☢️ Effacer la Sauvegarde (Hard Reset)
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}