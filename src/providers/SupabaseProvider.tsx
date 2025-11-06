import React, { createContext, useContext, ReactNode } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { Database } from '@/types/database.types';

const SupabaseContext = createContext<SupabaseClient<Database> | null>(null);

export const SupabaseProvider = ({ children }: { children: ReactNode }) => {
  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
};

export const useSupabase = () => {
  const context = useContext(SupabaseContext);
  // Não lançar erro aqui permite que a aplicação tenha um modo de demonstração
  // quando o cliente não pode ser inicializado.
  // Componentes que dependem criticamente do Supabase devem verificar o valor.
  return context;
};
