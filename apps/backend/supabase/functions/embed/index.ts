// ─────────────────────────────────────────────────────────────
// supabase/functions/embed/index.ts — Edge Function de embeddings
// ─────────────────────────────────────────────────────────────
// Genera el embedding de un texto usando el modelo gte-small
// (384 dimensiones) del runtime de Supabase. Debe ser el MISMO
// modelo con el que se indexó document_chunks.
//
// Deploy: supabase functions deploy embed
// Invocación desde el backend:
//   supabase.functions.invoke('embed', { body: { input } })
// ─────────────────────────────────────────────────────────────

import { serve } from 'https://deno.land/std@0.203.0/http/server.ts';

// gte-small produce vectores de 384 dimensiones.
const session = new Supabase.ai.Session('gte-small');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { input } = await req.json();

    if (typeof input !== 'string' || !input.trim()) {
      return json({ error: 'El campo "input" es requerido.' }, 400);
    }

    const embedding = await session.run(input, {
      mean_pool: true,
      normalize: true,
    });

    return json({ embedding });
  } catch (err) {
    return json({ error: (err as Error).message }, 500);
  }
});
