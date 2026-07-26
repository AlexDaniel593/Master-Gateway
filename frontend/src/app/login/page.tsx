'use client';

import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authApi } from '@/lib/api';
import { authStore } from '@/lib/auth-store';
import { LogIn } from 'lucide-react';

const schema = z.object({
  email: z.string().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export default function LoginPage() {
  const router = useRouter();

  const [form, fields] = useForm({
    onValidate({ formData }) {
      return parseWithZod(formData, { schema });
    },
    onSubmit: async (event) => {
      event.preventDefault();
      const formData = new FormData(event.currentTarget);
      const submission = parseWithZod(formData, { schema });
      if (submission.status !== 'success') return submission;

      const loading = toast.loading('Iniciando sesión...');
      try {
        const { data } = await authApi.login(
          formData.get('email') as string,
          formData.get('password') as string,
        );
        authStore.getState().setTempToken(data.tempToken);
        authStore.getState().setRoles(data.roles);
        authStore.getState().setUser({
          email: formData.get('email') as string,
          nombre: '',
        });
        toast.success('Credenciales válidas', { id: loading });
        router.push('/select-role');
      } catch {
        toast.error('Credenciales inválidas', { id: loading });
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Master Gateway</CardTitle>
          <CardDescription>Ingresa tus credenciales</CardDescription>
        </CardHeader>
        <CardContent>
          <form id={form.id} onSubmit={form.onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <Input id="email" name="email" type="email" placeholder="admin@test.com" required />
              {fields.email.errors && (
                <p className="text-sm text-destructive">{fields.email.errors}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" name="password" type="password" placeholder="••••••••" required />
              {fields.password.errors && (
                <p className="text-sm text-destructive">{fields.password.errors}</p>
              )}
            </div>
            <Button type="submit" className="w-full">
              <LogIn className="h-4 w-4" />
              Iniciar Sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
