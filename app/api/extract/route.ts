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

// Clean up title — strip retailer suffix
function cleanTitle(title: string): string {
  return title
    .replace(/\s*[-|]\s*(Zara|Mango|Zalando|Pull&Bear|Bershka|H&M|Women'?Secret|Sprinter|Cortefiel).*$/i, '')
    .replace(/\s*\|\s*.*$/, '')
    .trim()
}

// Title from URL slug as last resort
function titleFromSlug(url: string, retailerName: string): string {
  try {
    const slug = new URL(url).pathname.split('/').pop() || ''
    const title = slug
      .replace(/\.[^.]+$/, '')
      .replace(/-p\d+$/, '')
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim()
    return title || `Product from ${retailerName}`
  } catch {
    return `Product from ${retailerName}`
  }
}

// Method 1: Try Jina Reader API (free, bypasses bot protection, returns clean JSON)
async function extractViaJina(url: string) {
  try {
    const res = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        'Accept': 'application/json',
        'X-Return-Format': 'json',
        'X-With-Images-Summary': 'true',
      },
      signal: AbortSignal.timeout(12000),
    })
    if (!res.ok) return null
    const data = await res.json()

    const title = data.data?.title || data.title || ''
    const description = data.data?.content || data.content || ''

    // Extract image from images array if available
    const images = data.data?.images || {}
    const firstImage = Object.values(images)[0] as string || ''

    // Extract price from description
    const pricePatterns = [
      /€\s*([0-9]+[.,][0-9]{2})/,
      /([0-9]+[.,][0-9]{2})\s*€/,
      /precio[^0-9]*([0-9]+[.,][0-9]{2})/i,
      /price[^0-9]*([0-9]+[.,][0-9]{2})/i,
    ]
    let price = ''
    for (const pattern of pricePatterns) {
      const match = description.match(pattern)
      if (match) { price = `€${match[1]}`; break }
    }

    if (!title) return null
    return { title: cleanTitle(title), price, image: firstImage }
  } catch {
    return null
  }
}

// Method 2: Standard OG via Googlebot UA
async function extractViaOG(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
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
    ]
    let price = ''
    for (const pattern of pricePatterns) {
      const match = html.match(pattern)
      if (match) { price = `€${match[1]}`; break }
    }

    if (!ogTitle) return null
    return { title: cleanTitle(ogTitle), price, image: ogImage }
  } catch {
    return null
  }
}

// Method 3: Zara internal API (tries multiple endpoint formats)
async function extractZaraAPI(url: string) {
  const productMatch = url.match(/-p(\d+)\.html/i) || url.match(/\/p(\d+)/)
  if (!productMatch) return null
  const productId = productMatch[1]

  // Also grab the color reference (v1 param) for better image lookup
  const colorId = new URL(url).searchParams.get('v1') || ''

  const endpoints = [
    `https://www.zara.com/es/en/product/${productId}/extra-detail?ajax=true${colorId ? `&v1=${colorId}` : ''}`,
    `https://www.zara.com/es/en/product/${productId}/extra-detail?ajax=true`,
  ]

  for (const apiUrl of endpoints) {
    try {
      const res = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          'Accept': 'application/json, text/plain, */*',
          'Accept-Language': 'en-GB,en;q=0.9',
          'Referer': 'https://www.zara.com/',
          'Origin': 'https://www.zara.com',
        },
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) continue
      const text = await res.text()
      if (!text || text.startsWith('<!')) continue
      const data = JSON.parse(text)
      if (!data?.name) continue

      const price = data.price ? `€${(data.price / 100).toFixed(2)}` :
        data.displayPrice ? `€${data.displayPrice}` : ''

      // Try multiple image path patterns
      let image = ''
      const media = data.xmedia || data.media?.images || data.colorInfo?.[0]?.xmedia || []
      const firstMedia = Array.isArray(media) ? media[0] : null
      if (firstMedia?.url) {
        image = firstMedia.url.startsWith('http') ? firstMedia.url :
          `https://static.zara.net/assets${firstMedia.url}?w=600`
      } else if (firstMedia?.path) {
        image = `https://static.zara.net/assets${firstMedia.path}?w=600`
      }

      return { title: data.name, price, image }
    } catch { continue }
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    const retailer = getRetailerByDomain(url)
    let extracted: { title: string; price: string; image: string } | null = null

    // Try methods in order of reliability per retailer
    if (retailer?.id === 'zara') {
      extracted = await extractZaraAPI(url)
    }

    // Cider: extract from URL params (no scraping needed!)
    if (!extracted?.title && url.includes('shopcider.com')) {
      try {
        const u = new URL(url)
        const bt = u.searchParams.get('businessTracking')
        if (bt) {
          const decoded = JSON.parse(Buffer.from(bt, 'base64').toString('utf-8'))
          const price = decoded.salePrice ? `€${decoded.salePrice}` : ''
          const imgFile = decoded.skcFirstImg || ''
          const image = imgFile
            ? `https://img.shopcider.com/product/${imgFile}?imageView2/2/w/600`
            : ''
          const slug = u.pathname.split('/').pop() || ''
          const title = slug
            .replace(/-\d+$/, '')
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (c: string) => c.toUpperCase())
            .trim()
          if (title) extracted = { title, price, image }
        }
      } catch { /* fall through */ }
    }

    // Jina reader — works on most bot-protected sites
    if (!extracted?.title) {
      extracted = await extractViaJina(url)
    }

    // Standard OG extraction
    if (!extracted?.title) {
      extracted = await extractViaOG(url)
    }

    // Last resort: slug
    if (!extracted?.title) {
      extracted = {
        title: titleFromSlug(url, retailer?.name || new URL(url).hostname),
        price: 'See website',
        image: '',
      }
    }

    const category = await classifyCategory(extracted.title)

    return NextResponse.json({
      title: extracted.title || 'Unknown product',
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
