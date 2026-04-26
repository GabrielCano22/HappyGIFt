import { Component, type ReactNode } from 'react';

interface Props { children: ReactNode }
interface State { error: Error | null }

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          maxWidth: 720, margin: '40px auto', padding: 24,
          background: 'oklch(22% 0.10 20)',
          border: '1px solid var(--pink, #ff4d8b)',
          borderRadius: 12, color: '#fff',
          fontFamily: 'monospace',
        }}>
          <h2 style={{ marginBottom: 12, fontSize: 18 }}>💥 Error en runtime</h2>
          <div style={{
            background: '#000', padding: 12, borderRadius: 8,
            fontSize: 12, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            maxHeight: 320, overflowY: 'auto',
          }}>
            <strong>{this.state.error.name}:</strong> {this.state.error.message}
            {this.state.error.stack && (
              <div style={{ marginTop: 10, opacity: 0.7, fontSize: 11 }}>
                {this.state.error.stack}
              </div>
            )}
          </div>
          <button
            onClick={() => { this.setState({ error: null }); location.reload(); }}
            style={{
              marginTop: 12, padding: '8px 16px',
              background: '#fff', color: '#000', border: 'none',
              borderRadius: 6, cursor: 'pointer', fontWeight: 700,
            }}
          >Recargar</button>
        </div>
      );
    }
    return this.props.children;
  }
}
