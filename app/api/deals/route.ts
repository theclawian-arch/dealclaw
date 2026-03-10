import { NextRequest, NextResponse } from 'next/server'
import { RETAILERS } from '@/lib/retailers'

interface Deal {
  type: 'shipping' | 'promo' | 'newuser' | 'cashback'
  label: string
  description: string
  url: string
  ease: number // 1=easiest, 3=hardest
}

interface RetailerInput {
  id: string
  name: string   // display name or domain for unknown retailers
  url?: string   // homepage URL for unknown retailers
}

async function searchPromoCodes(retailerName: string, siteUrl?: string): Promise<{ codes: string[], sourceUrl: string }> {
  const apiKey = process.env.BRAVE_API_KEY
  if (!apiKey) return { codes: [], sourceUrl: siteUrl || '#' }

  try {
    // Search in both Spanish and English for broader coverage
    const query = encodeURIComponent(`"${retailerName}" promo code discount coupon 2026`)
    const res = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${query}&count=5`,
      {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': apiKey,
        },
        signal: AbortSignal.timeout(5000),
      }
    )
    if (!res.ok) return { codes: [], sourceUrl: siteUrl || '#' }
    const data = await res.json()
    const results = data.web?.results || []
    const snippets: string[] = results.map((r: { description: string }) => r.description)
    const sourceUrl = results[0]?.url || siteUrl || '#'

    // Extract code-like patterns (all caps, 5-15 chars, alphanumeric)
    const codes: string[] = []
    for (const snippet of snippets) {
      const matches = snippet.match(/\b([A-Z][A-Z0-9]{4,14})\b/g) || []
      codes.push(...matches.filter((c: string) =>
        c.length >= 5 && c.length <= 15 &&
        // Filter out common false positives
        !['HTTPS', 'EMAIL', 'CLICK', 'LOGIN', 'VALID', 'TERMS', 'APPLY'].includes(c)
      ))
    }
    return { codes: [...new Set(codes)].slice(0, 3), sourceUrl }
  } catch {
    return { codes: [], sourceUrl: siteUrl || '#' }
  }
}

async function getDealsForKnownRetailer(id: string): Promise<Deal[]> {
  const retailer = RETAILERS.find(r => r.id === id)
  if (!retailer) return []

  const deals: Deal[] = []

  // Shipping
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
  const { codes, sourceUrl } = await searchPromoCodes(retailer.name, retailer.promoUrl)
  if (codes.length > 0) {
    deals.push({
      type: 'promo',
      label: '🏷️ Promo Codes',
      description: `Codes to try at checkout (unverified): ${codes.join(', ')}`,
      url: sourceUrl,
      ease: 2,
    })
  }

  return deals.sort((a, b) => a.ease - b.ease)
}

async function getDealsForUnknownRetailer(name: string, siteUrl?: string): Promise<Deal[]> {
  const deals: Deal[] = []

  // Generic promo code search
  const { codes, sourceUrl } = await searchPromoCodes(name, siteUrl)
  if (codes.length > 0) {
    deals.push({
      type: 'promo',
      label: '🏷️ Promo Codes Found',
      description: `Codes to try at checkout (unverified): ${codes.join(', ')}`,
      url: sourceUrl,
      ease: 1,
    })
  }

  // Generic newsletter hint — most retailers offer a welcome discount
  deals.push({
    type: 'newuser',
    label: '📧 Newsletter Discount',
    description: `Many retailers offer 10–15% off your first order when you sign up. Check ${name}'s website footer for a signup offer.`,
    url: siteUrl || '#',
    ease: 2,
  })

  return deals
}

export async function POST(req: NextRequest) {
  try {
    const { retailers } = await req.json() as { retailers: RetailerInput[] }
    if (!retailers?.length) return NextResponse.json({ results: {} })

    const unique = retailers.filter((r, i, arr) =>
      arr.findIndex(x => x.id === r.id) === i
    )

    const results: Record<string, Deal[]> = {}

    await Promise.all(unique.map(async (r) => {
      const isKnown = RETAILERS.some(kr => kr.id === r.id)
      results[r.id] = isKnown
        ? await getDealsForKnownRetailer(r.id)
        : await getDealsForUnknownRetailer(r.name, r.url)
    }))

    return NextResponse.json({ results })
  } catch (err) {
    console.error('Deals error:', err)
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 })
  }
}
