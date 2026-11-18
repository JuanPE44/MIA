import {Component, type ErrorInfo, type ReactNode} from 'react';

interface ErrorBoundaryState {
  hasError: boolean;
}

/** Global safety net: shows a styled Spanish fallback instead of a blank screen. */
export class ErrorBoundary extends Component<{children: ReactNode}, ErrorBoundaryState> {
  state: ErrorBoundaryState = {hasError: false};

  static getDerivedStateFromError(): ErrorBoundaryState {
    return {hasError: true};
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div
        role="alert"
        style={{
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          padding: '1.5rem',
          textAlign: 'center',
          background: 'var(--mia-bg-page)',
          color: 'var(--mia-text-default)',
        }}
      >
        <h1 style={{fontSize: '1.75rem', fontWeight: 700, color: 'var(--mia-text-strong)'}}>Algo salió mal</h1>
        <p style={{maxWidth: '28rem'}}>
          Ocurrió un error inesperado. Recarga la página para continuar; tus datos guardados no se pierden.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: '0.5rem 1.25rem',
            borderRadius: '0.5rem',
            border: 'none',
            cursor: 'pointer',
            fontWeight: 600,
            background: 'var(--mia-primary)',
            color: 'var(--mia-text-on-primary)',
          }}
        >
          Recargar
        </button>
      </div>
    );
  }
}
