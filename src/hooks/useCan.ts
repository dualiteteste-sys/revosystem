// src/hooks/useCan.ts
// STUB: This is a placeholder for a real permission system.
// For now, it allows all actions to unblock UI development.
// The real authorization will happen on the backend (RLS/RPCs).

type Module = 'usuarios' | 'produtos' | 'financeiro';
type Action = 'view' | 'create' | 'update' | 'delete' | 'manage';

export function useCan(module: Module, action: Action): boolean {
  console.log(`[AUTH][useCan] Checking permission: ${action} on ${module}. Returning true (stub).`);
  // In a real app, this would check the user's role and permissions.
  // e.g., const { user } = useAuth(); check(user.role, module, action);
  return true;
}
