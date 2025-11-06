import { useEffect, useMemo, useState } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import { useLogsQuery } from '@/features/dev-logs/hooks/useLogsQuery';
import { LogsFilters as FiltersType, AuditEvent } from '@/features/dev-logs/types';
import { LogsFilters } from '@/features/dev-logs/LogsFilters';
import LogsTable from '@/features/dev-logs/LogsTable';
import LogDiffDialog from '@/features/dev-logs/LogDiffDialog';
import { Loader2, ListChecks } from 'lucide-react';
import { useToast } from '@/contexts/ToastProvider';
import GlassCard from '@/components/ui/GlassCard';

const now = () => new Date();
const daysAgo = (d: number) => {
  const dt = new Date();
  dt.setDate(dt.getDate() - d);
  return dt;
};

const DEFAULT_FILTERS: FiltersType = {
  from: daysAgo(30),
  to: now(),
  source: undefined,
  table: undefined,
  op: undefined,
  q: '',
  limit: 50,
};

export default function LogsPage() {
  const [filters, setFilters] = useState<FiltersType>(DEFAULT_FILTERS);
  const [pendingFilters, setPendingFilters] = useState<FiltersType>(DEFAULT_FILTERS);
  const [selectedEvent, setSelectedEvent] = useState<AuditEvent | null>(null);
  const supabase = useSupabase();
  const { addToast } = useToast();

  const { data, isLoading, isError, errorMsg, isLoadingMore, hasMore, fetchFirstPage, loadMore, setFilters: setHookFilters } =
    useLogsQuery(filters);

  const periodInvalid = useMemo(() => {
    if (!pendingFilters.from || !pendingFilters.to) return false;
    return pendingFilters.from.getTime() > pendingFilters.to.getTime();
  }, [pendingFilters.from, pendingFilters.to]);

  const onSubmitFilters = () => {
    if (periodInvalid) return;
    setFilters(pendingFilters);
  };

  useEffect(() => {
    setHookFilters(filters);
    fetchFirstPage();
  }, [filters, fetchFirstPage, setHookFilters]);

  useEffect(() => {
    if (isError && errorMsg) {
      addToast(errorMsg, 'error');
    }
  }, [isError, errorMsg, addToast]);

  const tableNames = useMemo(() => {
    const names = new Set(data.map(event => event.table_name).filter(Boolean));
    return Array.from(names) as string[];
  }, [data]);

  const envBanner = !supabase ? (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6 rounded-r-lg" role="alert">
      <p className="font-bold">Modo Demonstração</p>
      <p>Configuração Supabase ausente. Defina <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code>.</p>
    </div>
  ) : null;

  return (
    <div className="p-1">
      <h1 className="text-3xl font-bold text-gray-800">Logs</h1>
      <p className="text-gray-600 mb-6">Auditoria de eventos do sistema.</p>

      <GlassCard className="p-6">
        {envBanner}
        
        <LogsFilters
          value={pendingFilters}
          onChange={setPendingFilters}
          onSubmit={onSubmitFilters}
          onClear={() => setPendingFilters(DEFAULT_FILTERS)}
          isApplyDisabled={periodInvalid}
          isApplying={isLoading}
          tableNames={tableNames}
        />

        {isLoading && data.length === 0 ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="animate-spin text-blue-500" size={48} />
          </div>
        ) : !isLoading && data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-gray-500">
            <ListChecks size={48} className="mb-4" />
            <p className="font-semibold">Nenhum log encontrado</p>
            <p className="text-sm">Tente ajustar os filtros ou o período de busca.</p>
          </div>
        ) : (
          <LogsTable
            events={data}
            onShowDetails={setSelectedEvent}
            onLoadMore={loadMore}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
          />
        )}
      </GlassCard>

      {selectedEvent && (
        <LogDiffDialog
          event={selectedEvent}
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  );
}
