import { Component, type ErrorInfo, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@shared/ui/button';

type LazyViewErrorBoundaryProps = {
  children: ReactNode;
  title: string;
  retryLabel: string;
};

type LazyViewErrorBoundaryState = {
  hasError: boolean;
};

/** Evita que un fallo al descargar un chunk derribe todo el panel autenticado. */
export class LazyViewErrorBoundary extends Component<
  LazyViewErrorBoundaryProps,
  LazyViewErrorBoundaryState
> {
  state: LazyViewErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): LazyViewErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _errorInfo: ErrorInfo) {
    console.error('No se pudo cargar la vista autenticada', error);
  }

  handleRetry = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-sm text-red-700">{this.props.title}</p>
        <Button variant="outline" onClick={this.handleRetry}>
          <RefreshCw className="mr-2 size-4" />
          {this.props.retryLabel}
        </Button>
      </div>
    );
  }
}
