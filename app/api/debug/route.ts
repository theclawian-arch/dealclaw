import { NextRequest, NextResponse } from 'next/server'

// Simple diagnostic endpoint to debug what extraction actually returns
export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    // Simulate the extraction and collect metadata
    const retailer = require('./../lib/retailers').RETAILERS.find(r => r.url.includes(new URL(url).hostname.replace('www.', '')))
    
    // Run current extraction mock
    let extracted = { title: '', price: '', image: '', provider: 'unknown' }
    
    if (url.includes('shopcider.com')) {
      // You can also add real diagnostics here later
      extracted.provider = 'cider'
      // Simulate what our Cider extraction returns now
      extracted.title = 'Cotton Sweetheart Ditsy Floral Lace Up Ruffled Maxi Dress For Daily Casual'
      extracted.price = '€75.00'
      extracted.image = ''
    } else if (url.includes('zara.com')) {
      extracted.provider = 'zara'
      extracted.title = 'Slim Fit Jeans'
      extracted.price = ''
      extracted.image = ''
    }

    return NextResponse.json({
      url,
      hostname: new URL(url).hostname,
      retailerId: retailer?.id || 'unknown',
      debug: {
        title: extracted.title,
        priceFormat: extracted.price,
        priceEmpty: !extracted.price.trim(),
        imageUrls: extracted.image,
      },
      suggestions: extracted.price.trim() ? [] : ['No price extracted'],
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to extract data' }, { status: 500 })
  }
}