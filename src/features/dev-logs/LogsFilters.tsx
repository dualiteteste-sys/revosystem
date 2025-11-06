import React, { useEffect, useState } from 'react';
import type { LogsFilters as FiltersType } from './types';
import { useDebounce } from '@/hooks/useDebounce';
import DatePicker from '@/components/ui/DatePicker';
import MultiSelect from '@/components/ui/MultiSelect';
import Input from '@/components/ui/forms/Input';
import { Loader2 } from 'lucide-react';

type Props = {
  value: FiltersType;
  onChange: (next: FiltersType) => void;
  onSubmit: () => void;
  onClear: () => void;
  isApplyDisabled?: boolean;
  isApplying: boolean;
  tableNames: string[];
};

const opOptions = [
  { value: 'INSERT', label: 'Criação' },
  { value: 'UPDATE', label: 'Atualização' },
  { value: 'DELETE', label: 'Exclusão' },
  { value: 'SELECT', label: 'Leitura' },
];

const sourceOptions = [
  { value: 'postgrest', label: 'API' },
  { value: 'trigger', label: 'Gatilho (DB)' },
  { value: 'func', label: 'Função (RPC)' },
];

function toLocalInputValue(d?: Date | null) {
  if (!d) return '';
  try {
    const date = new Date(d);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  } catch {
    return '';
  }
}

export function LogsFilters({ value, onChange, onSubmit, onClear, isApplyDisabled, isApplying, tableNames }: Props) {
  const [qLocal, setQLocal] = useState(value.q ?? '');
  const debouncedQ = useDebounce(qLocal, 500);

  useEffect(() => {
    setQLocal(value.q ?? '');
  }, [value.q]);

  useEffect(() => {
    onChange({ ...value, q: debouncedQ.slice(0, 256) });
  }, [debouncedQ]);

  const handleDateChange = (key: 'from' | 'to', dateStr: string) => {
    const date = dateStr ? new Date(dateStr) : null;
    onChange({ ...value, [key]: date });
  };

  const tableOptions = tableNames.map(name => ({ value: name, label: name }));

  return (
    <div className="p-4 bg-white/60 rounded-xl border border-gray-200 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-3 gap-4 items-end">
        <DatePicker
          label="De"
          value={toLocalInputValue(value.from)}
          onChange={(e) => handleDateChange('from', e.target.value)}
        />
        <DatePicker
          label="Até"
          value={toLocalInputValue(value.to)}
          onChange={(e) => handleDateChange('to', e.target.value)}
        />
        <Input
          label="Busca textual"
          value={qLocal}
          onChange={(e) => setQLocal(e.target.value)}
          placeholder="Buscar em dados..."
        />
        <MultiSelect
          label="Origem"
          options={sourceOptions}
          selected={value.source || []}
          onChange={(selected) => onChange({ ...value, source: selected })}
        />
        <MultiSelect
          label="Operação"
          options={opOptions}
          selected={value.op || []}
          onChange={(selected) => onChange({ ...value, op: selected })}
        />
        <MultiSelect
          label="Tabela"
          options={tableOptions}
          selected={value.table || []}
          onChange={(selected) => onChange({ ...value, table: selected })}
        />
      </div>
      <hr className="my-4 border-gray-200" />
      <div className="flex items-center gap-2 justify-end">
        <button
          type="button"
          onClick={onClear}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Limpar
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={isApplyDisabled || isApplying}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isApplying ? <Loader2 className="animate-spin" size={16} /> : null}
          Aplicar Filtros
        </button>
      </div>
    </div>
  );
}
