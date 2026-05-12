import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // ── 1. Verify passcode ────────────────────────────────────────────────────
  const passcode = req.headers.get('x-figma-passcode')
  if (passcode !== Deno.env.get('FIGMA_WEBHOOK_PASSCODE')) {
    return new Response('Unauthorized', { status: 401 })
  }

  // ── 2. Parse payload ──────────────────────────────────────────────────────
  let payload: Record<string, unknown>
  try {
    payload = await req.json()
  } catch {
    return new Response('Bad Request', { status: 400 })
  }

  const { event_type, file_key, file_name, triggered_by, comment } = payload as {
    event_type: string
    file_key: string
    file_name: string
    triggered_by?: { id: string; handle: string }
    comment?: {
      id: string
      message: string
      user: { id: string; handle: string }
      created_at: string
      resolved_at: string | null
      client_meta?: { node_id?: string }
    }
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // ── 3. Build a human-readable summary ────────────────────────────────────
  const actor = event_type === 'FILE_COMMENT'
    ? comment?.user?.handle
    : triggered_by?.handle ?? 'a collaborator'

  const summary = event_type === 'FILE_COMMENT'
    ? `${actor} commented on ${file_name}: "${comment?.message?.slice(0, 80)}"`
    : `${actor} updated ${file_name}`

  // ── 4. Log raw event ──────────────────────────────────────────────────────
  const { error: logError } = await supabase
    .from('project_events')
    .insert({ source: 'figma', event_type, payload, summary })

  if (logError) {
    console.error('Failed to log event:', logError.message)
    return new Response('Internal Server Error', { status: 500 })
  }

  // ── 5. Update project status ──────────────────────────────────────────────
  const { error: statusError } = await supabase
    .from('project_status')
    .update({
      last_figma_activity: new Date().toISOString(),
      figma_file_name: file_name,
      updated_at: new Date().toISOString(),
    })
    .eq('phase_number', 1)

  if (statusError) {
    console.error('Failed to update project status:', statusError.message)
    // Non-fatal — event is already logged; continue
  }

  // ── 6. Event-specific side effects ───────────────────────────────────────
  if (event_type === 'FILE_UPDATE') {
    const { error: entryError } = await supabase
      .from('case_study_entries')
      .insert({
        type: 'design_note',
        title: `Design update — ${file_name}`,
        body: `Figma file updated by ${actor}`,
        status: 'draft',
        source: 'figma',
        metadata: { file_key, file_name, triggered_by },
      })

    if (entryError) {
      console.error('Failed to insert case study entry:', entryError.message)
    }
  }

  if (event_type === 'FILE_COMMENT' && comment) {
    const { error: commentError } = await supabase
      .from('design_comments')
      .insert({
        figma_comment_id: comment.id,
        file_key,
        file_name,
        message: comment.message,
        author_handle: comment.user.handle,
        author_id: comment.user.id,
        node_id: comment.client_meta?.node_id ?? null,
        resolved: comment.resolved_at !== null,
        commented_at: comment.created_at,
      })

    if (commentError) {
      console.error('Failed to insert design comment:', commentError.message)
    }
  }

  return new Response('ok', { status: 200 })
})
