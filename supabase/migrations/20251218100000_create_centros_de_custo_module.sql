-- =============================================================================
-- Migration: Módulo de Centro de Custos
-- Description: Cria a tabela, RLS, índices e RPCs para o módulo de
--              Centro de Custos, seguindo os padrões de segurança do projeto.
-- =============================================================================

-- 01) Enum de status (idempotente)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_centro_custo') THEN
    CREATE TYPE public.status_centro_custo AS ENUM ('ativo', 'inativo');
  END IF;
END$$;

-- 02) Tabela principal (idempotente)
CREATE TABLE IF NOT EXISTS public.centros_de_custo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  codigo TEXT,
  status public.status_centro_custo NOT NULL DEFAULT 'ativo',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_centros_de_custo_empresa_nome UNIQUE (empresa_id, nome),
  CONSTRAINT uq_centros_de_custo_empresa_codigo UNIQUE (empresa_id, codigo)
);

-- 03) Trigger updated_at (idempotente)
DROP TRIGGER IF EXISTS on_centros_de_custo_updated ON public.centros_de_custo;
CREATE TRIGGER on_centros_de_custo_updated
  BEFORE UPDATE ON public.centros_de_custo
  FOR EACH ROW EXECUTE PROCEDURE public.tg_set_updated_at();

-- 04) Índices essenciais (idempotentes)
CREATE INDEX IF NOT EXISTS idx_centros_de_custo_empresa_id ON public.centros_de_custo (empresa_id);
CREATE INDEX IF NOT EXISTS idx_centros_de_custo_status ON public.centros_de_custo (status);

-- 05) RLS por operação (idempotente)
ALTER TABLE public.centros_de_custo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.centros_de_custo FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS centros_de_custo_select_policy ON public.centros_de_custo;
CREATE POLICY centros_de_custo_select_policy ON public.centros_de_custo
  FOR SELECT TO authenticated
  USING (empresa_id = public.current_empresa_id());

DROP POLICY IF EXISTS centros_de_custo_insert_policy ON public.centros_de_custo;
CREATE POLICY centros_de_custo_insert_policy ON public.centros_de_custo
  FOR INSERT TO authenticated
  WITH CHECK (empresa_id = public.current_empresa_id());

DROP POLICY IF EXISTS centros_de_custo_update_policy ON public.centros_de_custo;
CREATE POLICY centros_de_custo_update_policy ON public.centros_de_custo
  FOR UPDATE TO authenticated
  USING (empresa_id = public.current_empresa_id())
  WITH CHECK (empresa_id = public.current_empresa_id());

DROP POLICY IF EXISTS centros_de_custo_delete_policy ON public.centros_de_custo;
CREATE POLICY centros_de_custo_delete_policy ON public.centros_de_custo
  FOR DELETE TO authenticated
  USING (empresa_id = public.current_empresa_id());

-- ==========================================
-- 06) RPCs seguras (SD + search_path + grants)
-- ==========================================

-- Contagem
CREATE OR REPLACE FUNCTION public.count_centros_de_custo(
  p_q TEXT DEFAULT NULL,
  p_status public.status_centro_custo DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN (
    SELECT count(*)
    FROM public.centros_de_custo c
    WHERE c.empresa_id = public.current_empresa_id()
      AND (p_status IS NULL OR c.status = p_status)
      AND (p_q IS NULL OR (
        c.nome ILIKE '%'||p_q||'%' OR
        c.codigo ILIKE '%'||p_q||'%'
      ))
  );
END;
$$;
REVOKE ALL ON FUNCTION public.count_centros_de_custo(TEXT, public.status_centro_custo) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.count_centros_de_custo(TEXT, public.status_centro_custo) TO authenticated;

-- Listagem
CREATE OR REPLACE FUNCTION public.list_centros_de_custo(
  p_limit INT DEFAULT 20,
  p_offset INT DEFAULT 0,
  p_q TEXT DEFAULT NULL,
  p_status public.status_centro_custo DEFAULT NULL,
  p_order_by TEXT DEFAULT 'nome',
  p_order_dir TEXT DEFAULT 'asc'
)
RETURNS TABLE (
  id UUID,
  nome TEXT,
  codigo TEXT,
  status public.status_centro_custo
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.nome,
    c.codigo,
    c.status
  FROM public.centros_de_custo c
  WHERE c.empresa_id = public.current_empresa_id()
    AND (p_status IS NULL OR c.status = p_status)
    AND (p_q IS NULL OR (
      c.nome ILIKE '%'||p_q||'%' OR
      c.codigo ILIKE '%'||p_q||'%'
    ))
  ORDER BY
    CASE WHEN p_order_by='nome' AND p_order_dir='asc' THEN c.nome END ASC,
    CASE WHEN p_order_by='nome' AND p_order_dir='desc' THEN c.nome END DESC,
    CASE WHEN p_order_by='codigo' AND p_order_dir='asc' THEN c.codigo END ASC,
    CASE WHEN p_order_by='codigo' AND p_order_dir='desc' THEN c.codigo END DESC,
    c.created_at DESC
  LIMIT GREATEST(p_limit, 1)
  OFFSET GREATEST(p_offset, 0);
END;
$$;
REVOKE ALL ON FUNCTION public.list_centros_de_custo(INT, INT, TEXT, public.status_centro_custo, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.list_centros_de_custo(INT, INT, TEXT, public.status_centro_custo, TEXT, TEXT) TO authenticated;

-- Detalhe
CREATE OR REPLACE FUNCTION public.get_centro_de_custo_details(p_id UUID)
RETURNS public.centros_de_custo
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  rec public.centros_de_custo;
BEGIN
  SELECT * INTO rec
  FROM public.centros_de_custo
  WHERE id = p_id AND empresa_id = public.current_empresa_id();
  RETURN rec;
END;
$$;
REVOKE ALL ON FUNCTION public.get_centro_de_custo_details(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_centro_de_custo_details(UUID) TO authenticated;

-- Create/Update
CREATE OR REPLACE FUNCTION public.create_update_centro_de_custo(p_payload JSONB)
RETURNS public.centros_de_custo
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_id UUID := NULLIF(p_payload->>'id', '')::UUID;
  rec public.centros_de_custo;
BEGIN
  IF v_id IS NULL THEN
    INSERT INTO public.centros_de_custo (
      empresa_id, nome, codigo, status
    ) VALUES (
      public.current_empresa_id(),
      p_payload->>'nome',
      p_payload->>'codigo',
      COALESCE((p_payload->>'status')::public.status_centro_custo, 'ativo')
    )
    RETURNING * INTO rec;
  ELSE
    UPDATE public.centros_de_custo SET
      nome = p_payload->>'nome',
      codigo = p_payload->>'codigo',
      status = COALESCE((p_payload->>'status')::public.status_centro_custo, 'ativo')
    WHERE id = v_id AND empresa_id = public.current_empresa_id()
    RETURNING * INTO rec;
  END IF;
  RETURN rec;
END;
$$;
REVOKE ALL ON FUNCTION public.create_update_centro_de_custo(JSONB) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_update_centro_de_custo(JSONB) TO authenticated;

-- Delete
CREATE OR REPLACE FUNCTION public.delete_centro_de_custo(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  DELETE FROM public.centros_de_custo
  WHERE id = p_id AND empresa_id = public.current_empresa_id();
END;
$$;
REVOKE ALL ON FUNCTION public.delete_centro_de_custo(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_centro_de_custo(UUID) TO authenticated;

-- PostgREST: recarregar schema
SELECT pg_notify('pgrst', 'reload schema');
