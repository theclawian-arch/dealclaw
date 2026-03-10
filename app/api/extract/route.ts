import { NextRequest, NextResponse } from 'next/server'
import { getRetailerByDomain } from '@/lib/retailers'
import type { Category } from '@/lib/store'

async function classifyCategory(title: string): Promise<Category> {
  const t = title.toLowerCase()
  if (/shoe|sneaker|boot|sandal|heel|trainer|zapato|zapatilla|bota|sandalia/.test(t)) return 'shoes'
  if (/dress|vestido|falda|skirt/.test(t)) return 'dresses'
  if (/jacket|coat|blazer|chaqueta|abrigo|cazadora|parka|outerwear/.test(t)) return 'outerwear'
  if (/jean|pant|trouser|short|legging|pantalon|vaquero|bermuda/.test(t)) return 'bottoms'
  if (/bag|belt|scarf|hat|cap|gorra|bolso|cinturon|bufanda|accessori/.test(t)) return 'accessories'
  if (/sport|gym|running|yoga|training|fitness|atletismo/.test(t)) return 'sportswear'
  if (/shirt|tee|top|blouse|hoodie|sweatshirt|camiseta|blusa|sudadera|jersey/.test(t)) return 'tops'
  return 'other'
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    const retailer = getRetailerByDomain(url)

    // Fetch the page
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
      },
      signal: AbortSignal.timeout(8000),
    })
    const html = await res.text()

    // Extract Open Graph / meta tags (works on all retailers)
    const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1] ||
      html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i)?.[1] || ''

    const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1] ||
      html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i)?.[1] || ''

    // Price extraction — try common patterns
    const pricePatterns = [
      /"price":\s*"?([0-9]+[.,][0-9]{2})"?/i,
      /class="[^"]*price[^"]*"[^>]*>\s*€?\s*([0-9]+[.,][0-9]{2})/i,
      /<span[^>]*itemprop="price"[^>]*content="([^"]+)"/i,
      /data-price="([0-9]+[.,][0-9]{2})"/i,
    ]
    let price = ''
    for (const pattern of pricePatterns) {
      const match = html.match(pattern)
      if (match) { price = match[1]; break }
    }
    if (price && !price.includes('€')) price = `€${price}`

    const title = ogTitle.replace(/\s*[-|]\s*(Zara|Mango|Zalando|Pull&Bear|Bershka|H&M|Women'?Secret|Sprinter|Cortefiel).*$/i, '').trim()
    const category = await classifyCategory(title)

    return NextResponse.json({
      title: title || 'Unknown product',
      price: price || 'See website',
      image: ogImage || '',
      retailer: retailer?.name || new URL(url).hostname.replace('www.', ''),
      retailerId: retailer?.id || 'unknown',
      category,
    })
  } catch (err) {
    console.error('Extract error:', err)
    return NextResponse.json({ error: 'Failed to extract product info' }, { status: 500 })
  }
}
