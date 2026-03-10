import { NextRequest, NextResponse } from 'next/server'
import { RETAILERS } from '@/lib/retailers'

interface Deal {
  type: 'shipping' | 'promo' | 'newuser' | 'cashback'
  label: string
  description: string
  url: string
  ease: number // 1=easiest, 3=hardest
}

async function fetchPromoCodes(retailerName: string): Promise<string[]> {
  // Search for promo codes using Brave API if configured
  const apiKey = process.env.BRAVE_API_KEY
  if (!apiKey) return []

  try {
    const query = encodeURIComponent(`${retailerName} código descuento cupón 2026 España`)
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${query}&count=3&search_lang=es`,
      {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': apiKey,
        },
        signal: AbortSignal.timeout(5000),
      }
    )
    if (!res.ok) return []
    const data = await res.json()
    const snippets: string[] = data.web?.results?.map((r: { description: string }) => r.description) || []

    // Extract code-like patterns from snippets
    const codePattern = /\b([A-Z0-9]{4,15})\b/g
    const codes: string[] = []
    for (const snippet of snippets) {
      const matches = snippet.match(codePattern) || []
      codes.push(...matches.filter((c: string) => c.length >= 5 && c.length <= 12))
    }
    return [...new Set(codes)].slice(0, 2)
  } catch {
    return []
  }
}

export async function POST(req: NextRequest) {
  try {
    const { retailerIds } = await req.json() as { retailerIds: string[] }
    const uniqueIds = [...new Set(retailerIds)]

    const results: Record<string, Deal[]> = {}

    await Promise.all(uniqueIds.map(async (id) => {
      const retailer = RETAILERS.find(r => r.id === id)
      if (!retailer) return

      const deals: Deal[] = []

      // Shipping deal
      if (retailer.shippingThreshold !== null) {
        deals.push({
          type: 'shipping',
          label: '🚚 Free Shipping',
          description: retailer.shippingFree,
          url: retailer.shippingUrl,
          ease: 1,
        })
      }

      // New user offer
      if (retailer.newUserOffer && retailer.newUserSignupUrl) {
        deals.push({
          type: 'newuser',
          label: '🎁 New Customer Offer',
          description: retailer.newUserOffer,
          url: retailer.newUserSignupUrl,
          ease: 2,
        })
      }

      // Live promo codes
      const codes = await fetchPromoCodes(retailer.name)
      if (codes.length > 0) {
        deals.push({
          type: 'promo',
          label: '🏷️ Promo Codes',
          description: `Codes to try at checkout (unverified): ${codes.join(', ')}`,
          url: retailer.promoUrl,
          ease: 2,
        })
      }

      // Sort by ease
      results[id] = deals.sort((a, b) => a.ease - b.ease)
    }))

    return NextResponse.json({ results })
  } catch (err) {
    console.error('Deals error:', err)
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 })
  }
}
