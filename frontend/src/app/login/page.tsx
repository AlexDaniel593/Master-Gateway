'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Login from '@react-login-page/page5';
import '@react-login-page/page5/esm/index.css';
import { ShieldCheck } from 'lucide-react';
import { authApi } from '@/lib/api';
import { authStore } from '@/lib/auth-store';

export default function LoginPage() {
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) return;

    const loading = toast.loading('Iniciando sesión...');
    try {
      const { data } = await authApi.login(email, password);
      authStore.getState().setTempToken(data.tempToken);
      authStore.getState().setRoles(data.roles);
      authStore.getState().setUser({ email, nombre: '' });
      toast.success('Credenciales válidas', { id: loading });
      router.push('/select-role');
    } catch {
      toast.error('Credenciales inválidas', { id: loading, duration: 5000 });
    }
  };

  const cssVars = {
    '--login-bg': '#1e3a5f',
    '--login-btn-bg': '#375c8c',
    '--login-btn-focus': '#1d4ed8',
    '--login-btn-hover': '#3557b5',
    '--login-btn-active': '#1e40af',
    '--login-input-before': 'rgba(37, 99, 235, 0.15)',
    '--login-input-after': 'rgba(30, 64, 175, 0.2)',
  } as React.CSSProperties;

  return (
    <form onSubmit={handleSubmit} style={{ height: '100vh' }}>
      <Login style={{ height: '100%', ...cssVars }}>
        <Login.Logo>
          <ShieldCheck size={32} />
        </Login.Logo>
        <Login.Title>Master Gateway</Login.Title>
        <Login.Username placeholder="Correo electrónico" />
        <Login.Password placeholder="Contraseña" />
        <Login.Submit>Iniciar Sesión</Login.Submit>
      </Login>
    </form>
  );
}
