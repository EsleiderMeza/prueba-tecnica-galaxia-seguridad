import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { errorMessage } from '../api/client';
import type { Paginated } from '../api/types';

interface State<T> {
  key: string | null;
  items: T[];
  page: number;
  lastPage: number;
  total: number;
  error: string | null;
}

const EMPTY = { key: null, items: [], page: 1, lastPage: 1, total: 0, error: null };

function fromResponse<T>(k: string, res: Paginated<T>): State<T> {
  return {
    key: k,
    items: res.data,
    page: res.meta.current_page,
    lastPage: res.meta.last_page,
    total: res.meta.total,
    error: null,
  };
}

/** Lista paginada de Laravel con "cargar más" al llegar al final y pull-to-refresh. */
export function usePaginated<T>(fetchPage: (page: number) => Promise<Paginated<T>>, deps: unknown[]) {
  const key = JSON.stringify(deps);
  const fetchRef = useRef(fetchPage);
  useEffect(() => {
    fetchRef.current = fetchPage;
  });

  const [state, setState] = useState<State<T>>(EMPTY);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const focusedOnce = useRef(false);
  const keyRef = useRef(key);
  useEffect(() => {
    keyRef.current = key;
  }, [key]);

  const fetchFirst = useCallback(async () => {
    try {
      const res = await fetchRef.current(1);
      if (keyRef.current === key) setState(fromResponse(key, res));
    } catch (e) {
      if (keyRef.current === key) setState((prev) => ({ ...prev, key, error: errorMessage(e) }));
    }
  }, [key]);

  useEffect(() => {
    focusedOnce.current = false;
    let active = true;
    fetchRef.current(1).then(
      (res) => active && setState(fromResponse(key, res)),
      (e) => active && setState({ ...EMPTY, key, error: errorMessage(e) }),
    );
    return () => {
      active = false;
    };
  }, [key]);

  useFocusEffect(
    useCallback(() => {
      if (!focusedOnce.current) {
        focusedOnce.current = true;
        return;
      }
      fetchFirst();
    }, [fetchFirst]),
  );

  const current = state.key === key;

  const loadMore = useCallback(async () => {
    if (!current || loadingMore || state.page >= state.lastPage) return;
    setLoadingMore(true);
    try {
      const res = await fetchRef.current(state.page + 1);
      if (keyRef.current === key) {
        setState((prev) => ({
          ...prev,
          items: [...prev.items, ...res.data],
          page: res.meta.current_page,
          lastPage: res.meta.last_page,
          total: res.meta.total,
        }));
      }
    } catch (e) {
      setState((prev) => ({ ...prev, error: errorMessage(e) }));
    } finally {
      setLoadingMore(false);
    }
  }, [current, key, loadingMore, state.page, state.lastPage]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFirst();
    setRefreshing(false);
  }, [fetchFirst]);

  return {
    items: current ? state.items : [],
    total: current ? state.total : 0,
    error: current ? state.error : null,
    loading: !current,
    refreshing,
    loadingMore,
    loadMore,
    refresh,
  };
}
