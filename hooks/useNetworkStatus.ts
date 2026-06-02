import NetInfo from '@react-native-community/netinfo';
import { useState, useEffect, useRef } from 'react';

// Verifica conectividad real haciendo un fetch a un endpoint confiable
async function checkRealConnectivity(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    const res = await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    return res.status === 204 || res.ok;
  } catch {
    return false;
  }
}

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const checkingRef = useRef(false);

  async function verify() {
    if (checkingRef.current) return;
    checkingRef.current = true;
    const real = await checkRealConnectivity();
    setIsConnected(real);
    checkingRef.current = false;
  }

  useEffect(() => {
    // Verificar inmediatamente al montar
    verify();

    // Cuando NetInfo detecta cambio de adaptador, verificar conectividad real
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!state.isConnected) {
        // Si el adaptador dice que no hay red, confiar directamente
        setIsConnected(false);
      } else {
        // Si el adaptador dice que hay red, verificar con ping real
        verify();
      }
    });

    // Re-verificar cada 10s para detectar Network Link Conditioner
    const interval = setInterval(() => { verify(); }, 10_000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return { isConnected };
}
