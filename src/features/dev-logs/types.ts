export type AuditEvent = {
  id: string;
  empresa_id: string | null;
  occurred_at: string;
  source: string;
  table_name: string | null;
  op: 'INSERT' | 'UPDATE' | 'DELETE' | 'SELECT';
  actor_id: string | null;
  actor_email: string | null;
  pk: Record<string, unknown> | null;
  row_old: Record<string, unknown> | null;
  row_new: Record<string, unknown> | null;
  diff: Record<string, { old: unknown; new: unknown }> | null;
  meta: Record<string, unknown> | null;
};

export type LogsFilters = {
  from?: Date | null;
  to?: Date | null;
  source?: string[];
  table?: string[];
  op?: ('INSERT' | 'UPDATE' | 'DELETE' | 'SELECT')[];
  q?: string;
  limit?: number;
};
