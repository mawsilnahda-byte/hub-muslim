import { NextRequest, NextResponse } from 'next/server'
import { searchQuran } from '@/lib/api/quran'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const locale = searchParams.get('locale') || 'fr'
  const limit = parseInt(searchParams.get('limit') || '20')

  if (!query || query.trim().length < 2) {
    return NextResponse.json({ results: [] })
  }

  try {
    const results = await searchQuran(query.trim(), locale, limit)
    return NextResponse.json({ results })
  } catch (err) {
    console.error('Search error:', err)
    return NextResponse.json({ results: [], error: 'Search failed' }, { status: 500 })
  }
}
