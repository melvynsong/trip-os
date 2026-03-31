import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest, { params }) {
  try {
    const { tripId } = params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }
    const { data: packingList, error } = await supabase
      .from('packing_lists')
      .select('*')
      .eq('trip_id', tripId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    if (error || !packingList) {
      return NextResponse.json({ error: 'Packing list not found.' }, { status: 404 })
    }
    return NextResponse.json({ packingList })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }) {
  try {
    const { tripId } = params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 })
    }
    const body = await request.json()
    const { packingStyle, weather, generatedContent } = body
    if (!packingStyle || !generatedContent) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }
    // Save packing list
    const { data, error } = await supabase
      .from('packing_lists')
      .insert([
        {
          trip_id: tripId,
          packing_style: packingStyle,
          generated_content: generatedContent,
        },
      ])
      .select()
      .single()
    if (error || !data) {
      return NextResponse.json({ error: 'Failed to save packing list.' }, { status: 500 })
    }
    return NextResponse.json({ packingList: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error.'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
