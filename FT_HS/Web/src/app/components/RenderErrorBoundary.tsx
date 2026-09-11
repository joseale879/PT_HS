import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@shared/ui/card';

type Props = {
  children: ReactNode;
  title?: string;
  description?: string;
};

type State = { hasError: boolean };

export class RenderErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[HidroSmart] Error al renderizar la vista', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <CardTitle>{this.props.title || 'No se pudo cargar este apartado'}</CardTitle>
          <CardDescription>
            {this.props.description ||
              'Ocurrió un error inesperado al mostrar la información. Puedes reintentar sin cerrar tu sesión.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }
}
