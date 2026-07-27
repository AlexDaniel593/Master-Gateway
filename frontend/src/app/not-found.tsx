import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Home, ShieldAlert } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <div className="text-center space-y-8 max-w-md">
        <div className="animate-float">
          <ShieldAlert className="h-24 w-24 mx-auto text-destructive/80" />
        </div>

        <div className="space-y-2 animate-fade-in-up">
          <h1 className="text-7xl font-bold tracking-tighter text-foreground">404</h1>
          <p className="text-xl text-muted-foreground">Página no encontrada</p>
        </div>

        <p className="text-sm text-muted-foreground animate-fade-in-up-delay">
          La ruta a la que intentas acceder no existe o ha sido movida.
        </p>

        <div className="animate-fade-in-up-delay-2">
          <Button asChild size="lg" className="gap-2">
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
              Volver al inicio
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
