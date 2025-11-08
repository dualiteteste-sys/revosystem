import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/forms/Input';
import Select from '@/components/ui/forms/Select';
import { UserRole } from './types';
import { useToast } from '@/contexts/ToastProvider';
import { useSupabase } from '@/providers/SupabaseProvider';
import { Loader2 } from 'lucide-react';

type Props = {
  open: boolean;
  onClose: () => void;
  onInvited: (email: string, role: UserRole) => void;
};

const roleOptions: { value: UserRole, label: string }[] = [
  { value: 'ADMIN', label: 'Admin' },
  { value: 'FINANCE', label: 'Financeiro' },
  { value: 'OPS', label: 'Operações' },
  { value: 'READONLY', label: 'Somente Leitura' },
];

export function InviteUserDialog({ open, onClose, onInvited }: Props) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<UserRole>('ADMIN');
  const [loading, setLoading] = useState(false);
  const { addToast } = useToast();
  const supabase = useSupabase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes('@')) {
      addToast('Por favor, insira um e-mail válido.', 'error');
      return;
    }
    setLoading(true);
    console.log('[FORM] InviteUserDialog submit', { email, role });

    try {
      if (!supabase) { // Modo Demo
        console.warn('[RPC] invite_user_to_current_empresa (DEMO)');
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        console.log('[RPC] invite_user_to_current_empresa', { p_email: email, p_role: role });
        const { error } = await supabase.rpc('invite_user_to_current_empresa', { p_email: email, p_role: role });
        if (error) throw error;
      }
      addToast(`Convite enviado para ${email}`, 'success');
      onInvited(email, role);
      onClose();
      setEmail('');
      setRole('ADMIN');
    } catch (err: any) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convidar Novo Usuário</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <Input
            label="Email do usuário"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colega@suaempresa.com"
            required
          />
          <Select
            label="Papel inicial"
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
          >
            {roleOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
          </Select>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enviar Convite
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
