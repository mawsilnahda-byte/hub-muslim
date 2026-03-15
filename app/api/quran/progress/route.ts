import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { surah_id, ayah_id, ayah_number, completed } = body

  if (!surah_id || !ayah_number) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { error } = await supabase.from('reading_progress').upsert({
    user_id: user.id,
    surah_id,
    last_ayah_id: ayah_id,
    last_ayah_number: ayah_number,
    completed: completed || false,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,surah_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Update streak
  await supabase.rpc('update_reading_streak', { p_user_id: user.id })

  return NextResponse.json({ success: true })
}
