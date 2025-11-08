import React, { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { Button } from '@/components/ui/button';
import Select from '@/components/ui/forms/Select';
import { EmpresaUser, UserRole } from './types';
import { useToast } from '@/contexts/ToastProvider';
import { useSupabase } from '@/providers/SupabaseProvider';
import { Loader2 } from 'lucide-react';
import DangerZoneUser from './DangerZoneUser';

type Props = {
  open: boolean;
  user?: EmpresaUser | null;
  onClose: () => void;
  onSaved: (userId: string, newRole: UserRole) => void;
  onUserDeactivated: (userId: string) => void;
  onUserReactivated: (userId: string) => void;
  onOwnershipTransferred: (from: string, to: string) => void;
};

const roleOptions: { value: UserRole, label: string }[] = [
  { value: 'OWNER', label: 'Proprietário' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'FINANCE', label: 'Financeiro' },
  { value: 'OPS', label: 'Operações' },
  { value: 'READONLY', label: 'Somente Leitura' },
];

export function EditUserRoleDrawer({ open, user, onClose, onSaved, onUserDeactivated, onUserReactivated, onOwnershipTransferred }: Props) {
  const [role, setRole] = useState<UserRole>('READONLY');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const supabase = useSupabase();

  useEffect(() => {
    if (user) setRole(user.role);
  }, [user]);

  if (!user) return null;

  const isLastOwner = user.role === 'OWNER'; // Simplified: real logic would be on backend

  const handleSave = async () => {
    if (role === user.role) {
      onClose();
      return;
    }
    setLoading(true);
    console.log('[FORM] EditUserRole submit', { userId: user.user_id, newRole: role });

    try {
      if (!supabase) {
        console.warn('[RPC] update_user_role_for_current_empresa (DEMO)');
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        const { error } = await supabase.rpc('update_user_role_for_current_empresa', { p_user_id: user.user_id, p_role: role });
        if (error) throw error;
      }
      addToast('Papel do usuário atualizado.', 'success');
      onSaved(user.user_id, role);
      onClose();
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeactivate = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        console.warn('[RPC] deactivate_user_for_current_empresa (DEMO)');
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        await supabase.rpc('deactivate_user_for_current_empresa', { p_user_id: user.user_id });
      }
      addToast('Usuário desativado.', 'success');
      onUserDeactivated(user.user_id);
      onClose();
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleReactivate = async () => {
    setLoading(true);
    try {
      if (!supabase) {
        console.warn('[RPC] reactivate_user_for_current_empresa (DEMO)');
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        await supabase.rpc('reactivate_user_for_current_empresa', { p_user_id: user.user_id });
      }
      addToast('Usuário reativado.', 'success');
      onUserReactivated(user.user_id);
      onClose();
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };
  
  const handleTransfer = async (toUserId: string) => {
    setLoading(true);
    try {
      if (!supabase) {
        console.warn('[RPC] transfer_owner_for_current_empresa (DEMO)');
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        await supabase.rpc('transfer_owner_for_current_empresa', { p_from: user.user_id, p_to: toUserId });
      }
      addToast('Propriedade transferida.', 'success');
      onOwnershipTransferred(user.user_id, toUserId);
      onClose();
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={open} onClose={onClose} title="Gerenciar Usuário" size="2xl">
      <div className="p-6 space-y-6">
        <div>
          <p className="font-semibold text-lg">{user.name || user.email}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        
        <div className="space-y-2">
          <Select label="Papel do Usuário" value={role} onChange={e => setRole(e.target.value as UserRole)}>
            {roleOptions.map(opt => (
              <option key={opt.value} value={opt.value} disabled={isLastOwner && opt.value !== 'OWNER'}>
                {opt.label}
              </option>
            ))}
          </Select>
          {isLastOwner && <p className="text-xs text-orange-600">Este é o único proprietário. Para alterar o papel, transfira a propriedade primeiro.</p>}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} disabled={loading || role === user.role}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Salvar Alterações
          </Button>
        </div>

        <DangerZoneUser
          user={user}
          onDeactivate={handleDeactivate}
          onReactivate={handleReactivate}
          onTransferOwner={handleTransfer}
        />
      </div>
    </Modal>
  );
}
