import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', minHeight: '100vh',
          background: '#0f172a', color: '#f8fafc', fontFamily: 'sans-serif',
          padding: '2rem', textAlign: 'center'
        }}>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#f87171' }}>
            Something went wrong
          </h1>
          <pre style={{
            background: '#1e293b', padding: '1rem', borderRadius: '0.5rem',
            fontSize: '0.75rem', color: '#94a3b8', maxWidth: '600px',
            overflowX: 'auto', textAlign: 'left', whiteSpace: 'pre-wrap'
          }}>
            {this.state.error?.message}
            {'\n'}
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1.5rem', padding: '0.5rem 1.5rem',
              background: '#10b981', color: 'white', border: 'none',
              borderRadius: '0.5rem', cursor: 'pointer', fontSize: '0.875rem'
            }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
