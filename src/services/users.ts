// src/services/users.ts
// Serviço de convites via Edge Function `invite-user`
// Padrões: uma única instância autenticada do Supabase; logs temporários; erros normalizados.

import { supabase } from "@/lib/supabase";
import { callRpc } from '@/lib/api';

type InviteInput = {
  email: string;
  role: string; // slug: OWNER | ADMIN | FINANCE | OPS | READONLY | ...
};

export type InviteResult =
  | { ok: true; action: "invited"; message: string; data: any }
  | { ok: true; action: "linked"; message: string; data: any };

function normalizeError(e: unknown) {
  // Mantém formato legível no console e para toasts
  if (typeof e === "string") return { message: e };
  if (e && typeof e === "object" && "message" in e) {
    const err = e as { message?: string };
    return { message: err.message ?? "UNKNOWN_ERROR" };
  }
  try {
    return { message: JSON.stringify(e) };
  } catch {
    return { message: "UNKNOWN_ERROR" };
  }
}

/**
 * Envia convite ou vincula usuário existente à empresa corrente.
 * - `action = "invited"`: email de convite disparado pela Edge Function
 * - `action = "linked"` : usuário já existia no auth; vínculo criado/atualizado sem enviar email
 */
export async function inviteUser(input: InviteInput): Promise<InviteResult> {
  console.log("[SERVICE][INVITE_USER] request:", input);

  const { data, error } = await supabase.functions.invoke("invite-user", {
    body: { email: input.email, role: input.role },
  });

  if (error) {
    // Erros de transporte da Edge Function (CORS, rede, etc.)
    console.error("[SERVICE][INVITE_USER] transport error:", error);
    throw Object.assign(new Error("Falha ao contatar a função de convite."), {
      cause: error,
    });
  }

  // A função server sempre retorna JSON com ok/erro
  if (!data?.ok) {
    console.error("[SERVICE][INVITE_USER] rpc/app error:", data);
    const reason =
      data?.error ??
      data?.details ??
      "Convite não pôde ser processado. Tente novamente.";
    throw new Error(String(reason));
  }

  // Sucesso
  const action = (data.action as "invited" | "linked") ?? "linked";
  const result: InviteResult =
    action === "invited"
      ? {
          ok: true,
          action: "invited",
          message: `Convite enviado para ${input.email}.`,
          data,
        }
      : {
          ok: true,
          action: "linked",
          message: `Usuário vinculado à empresa.`,
          data,
        };

  console.log("[SERVICE][INVITE_USER] success:", result);
  return result;
}

export async function deletePendingInvitation(userId: string): Promise<void> {
  try {
    await callRpc('delete_pending_invitation', { p_user_id: userId });
  } catch (error: any) {
    console.error('[SERVICE][DELETE_INVITE]', error);
    throw new Error(error.message || 'Erro ao excluir o convite.');
  }
}
