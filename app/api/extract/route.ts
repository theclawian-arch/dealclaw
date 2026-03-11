import { NextRequest, NextResponse } from 'next/server'

const STORAGE_KEY = 'dealclaw_items'

function cleanTitle(title: string): string {
  return title
    .replace(/\s*-\s*Office/gi, '')
    .replace(/\s*ZARA\s*/gi, '')
    .replace(/^SPRINT\s+/gi, '')
    .replace(/\|.*$/g, '')
    .trim() || 'Product'
}

// Function to clean price strings
function cleanPrice(priceStr: string): string {
  if (!priceStr) return ''
  
  // Find just the number parts
  const match = priceStr.match(/[\d,\.]+/)
  if (!match) return ''
  
  const clean = match[0]
    .replace(',', '.')  // handle comma decimals
    .replace(/^\./, '0.')  // handle .99 as 0.99
  
  const value = parseFloat(clean)
  return isNaN(value) ? '' : `€${value.toFixed(2)}`
}

// Cider extraction via desktop site's meta tags
async function extractCider(url: string) {
  try {
    const desktopUrl = url.replace('m.shopcider.com', 'www.shopcider.com')
    
    const res = await fetch(desktopUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)' },
      signal: AbortSignal.timeout(10000),
    })
    
    if (!res.ok) return null
    const html = await res.text()

    const title = html.match(/og:description"\s*content="([^"]*)/i)?.[1] ||
                 html.match(/<h1[^>]*>([^<]*)/i)?.[1] ||
                 'Cider Product'

    // Try data attributes first
    let rawPrice = html.match(/"salePrice":\s*"([^"]*)/i)?.[1] ||
                  html.match(/"price":\s*"([^"]*)/i)?.[1] ||
                  html.match(/data-price="([^"]*)/i)?.[1] ||
                  ''

    const price = rawPrice ? cleanPrice(rawPrice) : ''
    
    const image = html.match(/og:image"\s*content="([^"]*)/i)?.[1] || ''

    return {
      title: cleanTitle(title),
      price: price || 'Price on site',
      image,
    }
  } catch {
    return null
  }
}

// Zara extraction (kept working version)
async function extractZaraAPI(url: string) {
  const productMatch = url.match(/-p(\d+)\.html/i) || url.match(/\/p(\d+)/)
  if (!productMatch) return null
  const productId = productMatch[1]

  const endpoints = [
    `https://www.zara.com/es/en/product/${productId}/extra-detail?ajax=true`,
    `https://www.zara.com/es/en/product/${productId}/extra-detail?ajax=true`,
  ]

  for (const apiUrl of endpoints) {
    try {
      const res = await fetch(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      })
      
      if (!res.ok) continue
      const data = await res.json()
      if (!data?.name) continue

      const price = data.price ? `€${(data.price / 100).toFixed(2)}` : ''
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

// Standard OG extraction
async function extractViaOG(url: string) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      },
      signal: AbortSignal.timeout(10000),
    })
    
    if (!res.ok) return null
    const html = await res.text()

    const ogTitle = html.match(/og:title"\s*content="([^"]*)/i)?.[1] ||
                   html.match(/<title[^>]*>([^<]*)/i)?.[1] || ''

    const ogImage = html.match(/og:image"\s*content="([^"]*)/i)?.[1] ||
                   html.match(/<meta[^>]*content="([^"]*)"[^>]*og:image/i)?.[1] || ''

    const priceText = html.match(/og:price"\s*content="([^"]*)/i)?.[1] ||
                     html.match(/"price":\s*"([^"]*)/i)?.[1] ||
                     html.match(/class="[^"]*price[^"]*"[^>]*>\s*€?\s*([\d,\.]+)/i)?.[1] ||
                     ''

    const price = priceText ? cleanPrice(priceText) : null

    const title = cleanTitle(ogTitle)
    return { title, price: price || '', image: ogImage }
  } catch {
    return null
  }
}

// Cleanup function for saving
function cleanSavedItem(item: any): SavedItem {
  return {
    ...item,
    title: cleanTitle(item.title),
    price: cleanPrice(item.price),
    category: item.category || 'other',
  }
}

const retireCategories = ["shoes", "tops", "bottoms", "dresses", "outerwear", "accessories", "sportswear", "other"]

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    const retailer = getRetailerByDomain(url)
    let extracted: { title: string; price: string; image: string } | null = null

    // New optimized extraction order
    if (url.includes('shopcider.com')) {
      extracted = await extractCider(url)
    } else if (url.includes('zara.com')) {
      extracted = await extractZaraAPI(url)
    } else if (retailer?.id === 'zara') {
      extracted = await extractZaraAPI(url)
    }

    // General fallback
    if (!extracted?.title && !url.includes('zara.com')) {
      extracted = await extractViaOG(url)
    }

    if (!extracted) {
      // Last resort from URL slug
      const slug = new URL(url).pathname.split('/').pop() || new URL(url).hostname
      const title = slug.replace(/-\d+$/, '').replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim()
      extracted = { title, price: 'Price on site', image: '' }
    }

    const category = await classifyCategory(extracted.title)

    return NextResponse.json({
      ...cleanSavedItem(extracted),
      category,
    })
  } catch (error) {
    console.error('Extract error:', error)
    return NextResponse.json({ error: 'Failed to extract data' }, { status: 500 })
  }
}

// Simple utility functions
function classifyCategory(title: string): string {
  const titleLower = title.toLowerCase()
  
  if (titleLower.includes('dress') || titleLower.includes('gown')) return 'dresses'
  if (titleLower.includes('shoe') || titleLower.includes('boot') || titleLower.includes('sneaker')) return 'shoes'
  if (titleLower.includes('top') || titleLower.includes('blouse') || titleLower.includes('shirt')) return 'tops'
  if (titleLower.includes('pant') || titleLower.includes('jean') || titleLower.includes('skirt')) return 'bottoms'
  if (titleLower.includes('coat') || titleLower.includes('jacket') || titleLower.includes('cardigan')) return 'outerwear'
  if (titleLower.includes('bag') || titleLower.includes('belt') || titleLower.includes('jewelry')) return 'accessories'
  if (titleLower.includes('sport') || titleLower.includes('gym') || titleLower.includes('fitness')) return 'sportswear'
  return 'other' 
}

function getRetailerByDomain(url: string) {
  const hostname = new URL(url).hostname.replace('www.', '').replace('m.', '')
  return require('./../lib/retailers').RETAILERS.find(r => r.url.includes(hostname)) || null
}

export type { SavedItem }