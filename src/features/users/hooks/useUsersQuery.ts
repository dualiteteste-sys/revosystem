import { useCallback, useMemo, useRef, useState } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import type { EmpresaUser, UsersFilters, UserRole, UserStatus } from '../types';
import mockUsers from '../__mocks__/users.json';
import { useDebounce } from '@/hooks/useDebounce';

type State = {
  data: EmpresaUser[];
  isLoading: boolean;
  isError: boolean;
  errorMsg?: string;
  isLoadingMore: boolean;
  cursorAfter: string | null; // invited_at (created_at) of the last item
};

const DEFAULT_LIMIT = 20;

function mapFiltersToParams(filters: UsersFilters, after: string | null) {
  return {
    p_q: filters.q?.trim() || null,
    p_role: filters.role?.length ? filters.role : null,
    p_status: filters.status?.length ? filters.status : null,
    p_after: after,
    p_limit: Math.min(filters.limit ?? DEFAULT_LIMIT, 100),
  };
}

export function useUsersQuery(initialFilters: UsersFilters = {}) {
  const supabase = useSupabase();
  const [state, setState] = useState<State>({
    data: [],
    isLoading: false,
    isError: false,
    errorMsg: undefined,
    isLoadingMore: false,
    cursorAfter: null,
  });

  const [filters, setFilters] = useState<UsersFilters>(initialFilters);
  const debouncedQuery = useDebounce(filters.q, 500);

  const filtersForQuery = useMemo(() => ({
    ...filters,
    q: debouncedQuery,
  }), [filters, debouncedQuery]);

  const fetchFirstPage = useCallback(async () => {
    setState(s => ({ ...s, isLoading: true, isError: false, errorMsg: undefined, data: [], cursorAfter: null }));

    if (!supabase) {
      console.warn('[RPC][USERS] Modo de demonstração ativado.');
      setState(s => ({ 
        ...s, 
        isLoading: false, 
        data: mockUsers as EmpresaUser[], 
        cursorAfter: null
      }));
      return;
    }

    try {
      const params = mapFiltersToParams(filtersForQuery, null);
      console.log('[RPC] list_users_for_current_empresa', params);
      const { data, error } = await supabase.rpc('list_users_for_current_empresa', params);

      if (error) throw error;

      const rows = (data ?? []) as EmpresaUser[];
      const nextCursor = rows.length === params.p_limit ? rows[rows.length - 1]?.invited_at : null;

      setState(s => ({ ...s, isLoading: false, data: rows, cursorAfter: nextCursor }));
    } catch (e: any) {
      console.error('[RPC][USERS][ERROR]', e);
      setState(s => ({ ...s, isLoading: false, isError: true, errorMsg: e.message || 'Falha ao buscar usuários.' }));
    }
  }, [supabase, filtersForQuery]);

  const loadMore = useCallback(async () => {
    if (!state.cursorAfter || !supabase) return;

    setState(s => ({ ...s, isLoadingMore: true }));

    try {
      const params = mapFiltersToParams(filtersForQuery, state.cursorAfter);
      console.log('[RPC] list_users_for_current_empresa (more)', params);
      const { data, error } = await supabase.rpc('list_users_for_current_empresa', params);

      if (error) throw error;

      const newRows = (data ?? []) as EmpresaUser[];
      const nextCursor = newRows.length === params.p_limit ? newRows[newRows.length - 1]?.invited_at : null;

      setState(s => ({
        ...s,
        isLoadingMore: false,
        data: s.data.concat(newRows),
        cursorAfter: nextCursor,
      }));
    } catch (e: any) {
      console.error('[RPC][USERS][ERROR][MORE]', e);
      setState(s => ({ ...s, isLoadingMore: false, isError: true, errorMsg: e.message || 'Falha ao carregar mais.' }));
    }
  }, [supabase, filtersForQuery, state.cursorAfter]);

  const hasMore = !!state.cursorAfter;

  const value = useMemo(() => ({
    ...state,
    hasMore,
    loadMore,
    fetchFirstPage,
    filters,
    setFilters,
  }), [state, hasMore, loadMore, fetchFirstPage, filters]);

  return value;
}
