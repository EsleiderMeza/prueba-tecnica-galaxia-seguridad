import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { errorMessage } from '../api/client';

interface State<T> {
  key: string | null; // clave de los parámetros con los que se cargó
  data: T | null;
  error: string | null;
}

/**
 * Carga datos de la API. Se vuelve a cargar cuando cambian `deps` y, de forma
 * silenciosa, cada vez que la pantalla recupera el foco (para reflejar cambios
 * hechos en otras pantallas).
 */
export function useApi<T>(fetcher: () => Promise<T>, deps: unknown[] = []) {
  const key = JSON.stringify(deps);
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  const [state, setState] = useState<State<T>>({ key: null, data: null, error: null });
  const [refreshing, setRefreshing] = useState(false);
  const focusedOnce = useRef(false);

  const fetchNow = useCallback(async () => {
    try {
      const data = await fetcherRef.current();
      setState({ key, data, error: null });
    } catch (e) {
      setState((prev) => ({ key, data: prev.key === key ? prev.data : null, error: errorMessage(e) }));
    }
  }, [key]);

  useEffect(() => {
    focusedOnce.current = false;
    let active = true;
    fetcherRef.current().then(
      (data) => active && setState({ key, data, error: null }),
      (e) => active && setState({ key, data: null, error: errorMessage(e) }),
    );
    return () => {
      active = false;
    };
  }, [key]);

  useFocusEffect(
    useCallback(() => {
      if (!focusedOnce.current) {
        focusedOnce.current = true; // el primer foco coincide con la carga inicial
        return;
      }
      fetchNow();
    }, [fetchNow]),
  );

  const reload = useCallback(async () => {
    setRefreshing(true);
    await fetchNow();
    setRefreshing(false);
  }, [fetchNow]);

  const setData = useCallback(
    (updater: (prev: T | null) => T) => setState((prev) => ({ ...prev, data: updater(prev.data) })),
    [],
  );

  const current = state.key === key;
  return {
    data: current ? state.data : null,
    error: current ? state.error : null,
    loading: !current,
    refreshing,
    reload,
    setData,
  };
}
