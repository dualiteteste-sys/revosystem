import * as React from "react";
import { z } from "zod";
import { Loader2, UserPlus } from "lucide-react";
import { inviteUser } from "@/services/users";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import Input from "@/components/ui/forms/Input";
import Select from "@/components/ui/forms/Select";
import { useToast } from "@/contexts/ToastProvider";
import { EmpresaUser } from "./types";

const schema = z.object({
  email: z.string().email({ message: "Formato de e-mail inválido." }),
  role: z.string().min(1, { message: "Selecione um papel." }),
});

type Props = {
  onClose: () => void;
  onOptimisticInsert?: (row: EmpresaUser) => void;
};

export function InviteUserDialog({ onClose, onOptimisticInsert }: Props) {
  const { addToast } = useToast();
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState("READONLY");
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{ email?: string; role?: string }>({});

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = schema.safeParse({ email, role });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        email: fieldErrors.email?.[0],
        role: fieldErrors.role?.[0],
      });
      return;
    }

    setLoading(true);
    try {
      const res = await inviteUser(email, role);

      if (!res.ok) {
        addToast(res.error ?? "Erro desconhecido ao convidar usuário.", "error", "Falha no Convite");
        return;
      }

      addToast(`Convite enviado com sucesso para ${res.email}.`, "success", "Convite Enviado");

      if (res.linkResult?.user_id && onOptimisticInsert) {
        onOptimisticInsert({
          user_id: res.linkResult.user_id,
          email: res.email,
          name: null,
          role: res.role as any,
          status: "PENDING",
          invited_at: new Date().toISOString(),
        });
      }

      onClose();
    } catch (err: any) {
      addToast(err?.message ?? String(err), "error", "Erro Inesperado");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 pt-4">
      <Input
        label="E-mail"
        id="email"
        type="email"
        placeholder="email@empresa.com"
        autoComplete="off"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />

      <div>
        <Select label="Papel" id="role" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="READONLY">Leitura</option>
          <option value="OPS">Operações</option>
          <option value="FINANCE">Financeiro</option>
          <option value="ADMIN">Admin</option>
          <option value="OWNER">Owner</option>
        </Select>
        {errors.role && <p className="text-sm text-red-600 mt-1">{errors.role}</p>}
      </div>

      <div className="flex gap-2 justify-end pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          aria-label="Cancelar convite"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          className={cn(loading && "opacity-90")}
          disabled={loading}
          aria-label="Confirmar envio do convite"
        >
          {loading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</>) : "Enviar convite"}
        </Button>
      </div>
    </form>
  );
}
