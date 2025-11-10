// supabase/functions/invite-user/index.ts
// SD + search_path não se aplicam aqui (Deno). Foco: CORS correto para browser.
// Esta versão só demonstra o esqueleto de CORS; mantenha/integre sua lógica atual dentro do bloco POST.

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const ALLOWED_ORIGINS = new Set<string>([
  "https://revosystem--w7cs-dualite.netlify.app",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

function buildCors(origin: string | null) {
  // Se a origin estiver na lista, retorna ela; caso contrário, não libera
  const allowOrigin =
    origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://revosystem--w7cs-dualite.netlify.app";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    // Inclui os headers que o supabase-js envia
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Max-Age": "86400",
  };
}

serve(async (req: Request) => {
  const origin = req.headers.get("origin");
  const cors = buildCors(origin);

  // 1) Preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: cors });
  }

  // 2) Somente POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ ok: false, error: "METHOD_NOT_ALLOWED" }),
      {
        status: 405,
        headers: { ...cors, "Content-Type": "application/json" },
      },
    );
  }

  try {
    // ====== SUA LÓGICA ATUAL DE CONVITE AQUI ======
    // Exemplo mínimo só para teste de transporte:
    const payload = await req.json().catch(() => ({}));
    // TODO: validar RBAC via JWT, chamar Admin API via SERVICE_ROLE (executado como Edge Function), etc.

    return new Response(JSON.stringify({ ok: true, echo: payload }), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[invite-user] error:", err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: "UNEXPECTED_ERROR",
        detail: err instanceof Error ? err.message : String(err),
      }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
