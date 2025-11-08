import React from 'react';
import { EmpresaUser } from './types';
import { MoreVertical, Loader2 } from 'lucide-react';

type Props = {
  rows: EmpresaUser[];
  onEditRole: (u: EmpresaUser) => void;
  onDanger: (u: EmpresaUser) => void;
  onLoadMore: () => void;
  isLoadingMore?: boolean;
  hasMore: boolean;
};

const roleLabels: Record<EmpresaUser['role'], string> = {
  OWNER: 'Proprietário',
  ADMIN: 'Admin',
  FINANCE: 'Financeiro',
  OPS: 'Operações',
  READONLY: 'Somente Leitura',
};

const statusConfig: Record<EmpresaUser['status'], { label: string; color: string }> = {
  ACTIVE: { label: 'Ativo', color: 'bg-green-100 text-green-800' },
  PENDING: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
  INACTIVE: { label: 'Inativo', color: 'bg-gray-100 text-gray-800' },
};

export function UsersTable({ rows, onEditRole, onDanger, onLoadMore, isLoadingMore, hasMore }: Props) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome / Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Papel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Acesso</th>
              <th className="relative px-6 py-3"><span className="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map(user => (
              <tr key={user.user_id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{user.name || '(Não confirmado)'}</div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{roleLabels[user.role]}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusConfig[user.status].color}`}>
                    {statusConfig[user.status].label}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString('pt-BR') : 'Nunca'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => onEditRole(user)} className="text-indigo-600 hover:text-indigo-900">
                    Gerenciar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasMore && (
        <div className="p-4 text-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="flex items-center justify-center gap-2 mx-auto px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 disabled:opacity-50"
          >
            {isLoadingMore ? <Loader2 className="animate-spin" size={16} /> : null}
            Carregar mais
          </button>
        </div>
      )}
    </div>
  );
}
