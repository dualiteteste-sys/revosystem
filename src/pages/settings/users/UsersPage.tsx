import React, { useState, useEffect, useMemo } from 'react';
import { UsersFilters as Filters, EmpresaUser, UserRole, UserStatus } from '@/features/users/types';
import { useUsersQuery } from '@/features/users/hooks/useUsersQuery';
import { UsersTable } from '@/features/users/UsersTable';
import { InviteUserDialog } from '@/features/users/InviteUserDialog';
import { EditUserRoleDrawer } from '@/features/users/EditUserRoleDrawer';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/forms/Input';
import MultiSelect from '@/components/ui/MultiSelect';
import { PlusCircle, Loader2, Users } from 'lucide-react';
import { useCan } from '@/hooks/useCan';

const roleOptions: { value: UserRole, label: string }[] = [
  { value: 'OWNER', label: 'Proprietário' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'FINANCE', label: 'Financeiro' },
  { value: 'OPS', label: 'Operações' },
  { value: 'READONLY', label: 'Somente Leitura' },
];

const statusOptions: { value: UserStatus, label: string }[] = [
  { value: 'ACTIVE', label: 'Ativo' },
  { value: 'PENDING', label: 'Pendente' },
  { value: 'INACTIVE', label: 'Inativo' },
];

export default function UsersPage() {
  const { data, isLoading, isError, errorMsg, hasMore, loadMore, isLoadingMore, fetchFirstPage, filters, setFilters } = useUsersQuery();
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<EmpresaUser | null>(null);

  const canCreate = useCan('usuarios', 'create');

  useEffect(() => {
    fetchFirstPage();
  }, [fetchFirstPage, filters]);

  const handleFilterChange = (patch: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...patch }));
  };

  const handleEditRole = (user: EmpresaUser) => {
    setSelectedUser(user);
    setIsEditOpen(true);
  };
  
  const handleUserUpdate = (userId: string, newRole: UserRole) => {
    // Optimistic update
    const updatedData = data.map(u => u.user_id === userId ? {...u, role: newRole} : u);
    // This is not ideal as it replaces the whole state, but works for the mock
    // A real implementation would have a dedicated `updateUserInState` function in the hook.
    fetchFirstPage(); // Re-fetch for simplicity
  };

  const handleUserStatusChange = () => {
    fetchFirstPage(); // Re-fetch to get updated status
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Usuários</h1>
        {canCreate && (
          <Button onClick={() => setIsInviteOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Convidar Usuário
          </Button>
        )}
      </div>

      <div className="mb-4 p-4 border bg-gray-50/50 rounded-xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Buscar por nome ou email"
            placeholder="Digite para buscar..."
            value={filters.q || ''}
            onChange={(e) => handleFilterChange({ q: e.target.value })}
          />
          <MultiSelect
            label="Papel"
            options={roleOptions}
            selected={filters.role || []}
            onChange={(roles) => handleFilterChange({ role: roles as UserRole[] })}
            placeholder="Todos os papéis"
          />
          <MultiSelect
            label="Status"
            options={statusOptions}
            selected={filters.status || []}
            onChange={(status) => handleFilterChange({ status: status as UserStatus[] })}
            placeholder="Todos os status"
          />
        </div>
      </div>

      {isLoading && data.length === 0 ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>
      ) : isError ? (
        <div className="text-center text-red-500 p-8">{errorMsg}</div>
      ) : data.length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium">Nenhum usuário encontrado</h3>
          <p className="mt-1 text-sm">Tente ajustar os filtros ou convide um novo usuário.</p>
        </div>
      ) : (
        <UsersTable
          rows={data}
          onEditRole={handleEditRole}
          onDanger={() => {}} // Will be handled by Edit Drawer
          onLoadMore={loadMore}
          isLoadingMore={isLoadingMore}
          hasMore={hasMore}
        />
      )}

      <InviteUserDialog
        open={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        onInvited={() => fetchFirstPage()}
      />
      
      <EditUserRoleDrawer
        open={isEditOpen}
        user={selectedUser}
        onClose={() => setIsEditOpen(false)}
        onSaved={handleUserUpdate}
        onUserDeactivated={handleUserStatusChange}
        onUserReactivated={handleUserStatusChange}
        onOwnershipTransferred={handleUserStatusChange}
      />
    </div>
  );
}
