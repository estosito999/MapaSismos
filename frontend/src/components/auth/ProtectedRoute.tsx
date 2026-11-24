'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  getStoredToken,
  getStoredUser,
  removeStoredToken,
  setStoredUser,
  apiFetch,
} from '../../lib/api';

interface Props {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export function ProtectedRoute({ children, requiredRoles }: Props) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verifyAccess = async () => {
      const token = getStoredToken();
      const localUser = getStoredUser();

      if (!token || !localUser) {
        removeStoredToken();
        router.push('/login');
        return;
      }

      try {
        // Validación activa del token criptográfico JWT contra el backend
        const freshUser = await apiFetch('/users/profile');
        if (isMounted) {
          setStoredUser(freshUser);

          if (freshUser.requiereCambioClave) {
            router.push('/cambiar-clave');
            return;
          }

          if (requiredRoles && requiredRoles.length > 0) {
            const hasRole = requiredRoles.some((r) => freshUser.roles?.includes(r));
            if (!hasRole) {
              router.push('/dashboard');
              return;
            }
          }

          setAuthorized(true);
        }
      } catch {
        // Token inválido, expirado (RNF03) o cuenta suspendida
        if (isMounted) {
          removeStoredToken();
          router.push('/login');
        }
      }
    };

    verifyAccess();

    return () => {
      isMounted = false;
    };
  }, []);

  if (!authorized) {
    return (
      <div className="p-8 text-center text-zinc-500 flex flex-col items-center justify-center min-h-[300px]">
        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm">Verificando credenciales con el servidor...</p>
      </div>
    );
  }

  return <>{children}</>;
}
