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

// Extract product ID from Zara URL and use their API
async function extractZara(url: string) {
  const match = url.match(/-(p\d+)\.html/i)
  if (!match) return null
  const productId = match[1].replace('p', '')

  // Try Zara's internal product API
  const apiUrl = `https://www.zara.com/es/en/product/${productId}/extra-detail?ajax=true`
  try {
    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
        'Accept': 'application/json',
        'Referer': 'https://www.zara.com/',
      },
      signal: AbortSignal.timeout(8000),
    })
    if (res.ok) {
      const data = await res.json()
      if (data?.name) {
        const price = data.price ? `€${(data.price / 100).toFixed(2)}` : ''
        const image = data.media?.images?.[0]?.url || data.xmedia?.[0]?.path
          ? `https://static.zara.net/assets${data.xmedia?.[0]?.path}?w=600`
          : ''
        return { title: data.name, price, image }
      }
    }
  } catch { /* fall through */ }

  // Fallback: try the SEO sitemap / meta approach via Google cache
  return null
}

// Try to get Open Graph data via a proxy-friendly approach
async function extractViaOG(url: string) {
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
  }

  const res = await fetch(url, {
    headers,
    signal: AbortSignal.timeout(10000),
    redirect: 'follow',
  })

  if (!res.ok) return null
  const html = await res.text()

  const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1] ||
    html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i)?.[1] ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || ''

  const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)?.[1] ||
    html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i)?.[1] || ''

  const pricePatterns = [
    /"price":\s*"?([0-9]+[.,][0-9]{2})"?/i,
    /class="[^"]*price[^"]*"[^>]*>\s*€?\s*([0-9]+[.,][0-9]{2})/i,
    /<span[^>]*itemprop="price"[^>]*content="([^"]+)"/i,
    /data-price="([0-9]+[.,][0-9]{2})"/i,
    /"currentPrice":\s*([0-9]+\.?[0-9]*)/i,
    /"salePrice":\s*([0-9]+\.?[0-9]*)/i,
  ]
  let price = ''
  for (const pattern of pricePatterns) {
    const match = html.match(pattern)
    if (match) { price = match[1]; break }
  }
  if (price && !price.includes('€')) price = `€${price}`

  return { title: ogTitle, image: ogImage, price }
}

// Retailer-specific extractors
async function extractMango(url: string) {
  // Mango uses standard OG tags, but needs Accept header
  return extractViaOG(url)
}

async function extractZalando(url: string) {
  return extractViaOG(url)
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    const retailer = getRetailerByDomain(url)
    let extracted: { title: string; price: string; image: string } | null = null

    // Try retailer-specific extractors first
    if (retailer?.id === 'zara') {
      extracted = await extractZara(url)
    } else if (retailer?.id === 'mango') {
      extracted = await extractMango(url)
    } else if (retailer?.id === 'zalando') {
      extracted = await extractZalando(url)
    }

    // Fall back to generic OG extraction
    if (!extracted || !extracted.title) {
      extracted = await extractViaOG(url)
    }

    // Last resort: parse from URL slug
    if (!extracted || !extracted.title) {
      const slug = new URL(url).pathname.split('/').pop() || ''
      const titleFromSlug = slug
        .replace(/[-_]/g, ' ')
        .replace(/p\d+$/, '')
        .replace(/\.[^.]+$/, '')
        .trim()
      extracted = {
        title: titleFromSlug || 'Product from ' + (retailer?.name || new URL(url).hostname),
        price: 'See website',
        image: '',
      }
    }

    const title = extracted.title
      .replace(/\s*[-|]\s*(Zara|Mango|Zalando|Pull&Bear|Bershka|H&M|Women'?Secret|Sprinter|Cortefiel).*$/i, '')
      .trim()

    const category = await classifyCategory(title)

    return NextResponse.json({
      title: title || 'Unknown product',
      price: extracted.price || 'See website',
      image: extracted.image || '',
      retailer: retailer?.name || new URL(url).hostname.replace('www.', ''),
      retailerId: retailer?.id || 'unknown',
      category,
    })
  } catch (err) {
    console.error('Extract error:', err)
    return NextResponse.json({ error: 'Failed to extract product info' }, { status: 500 })
  }
}
