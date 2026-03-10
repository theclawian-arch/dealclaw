'use client'

import { Suspense } from 'react'
import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { saveItem } from '@/lib/store'
import type { SavedItem, Category } from '@/lib/store'

function ShareContent() {
  const params = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'manual'>('loading')
  const [product, setProduct] = useState<Partial<SavedItem> | null>(null)
  const [manualUrl, setManualUrl] = useState('')

  const url = params.get('url') || params.get('text') || ''

  useEffect(() => {
    if (!url) { setStatus('manual'); return }
    extractAndSave(url)
  }, [url])

  async function extractAndSave(targetUrl: string) {
    setStatus('loading')
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      const item: SavedItem = {
        id: crypto.randomUUID(),
        url: targetUrl,
        title: data.title,
        price: data.price,
        image: data.image,
        retailer: data.retailer,
        retailerId: data.retailerId,
        category: data.category as Category,
        savedAt: new Date().toISOString(),
      }
      setProduct(item)
      saveItem(item)
      setStatus('success')
      setTimeout(() => router.push('/'), 1500)
    } catch {
      setStatus('error')
    }
  }

  if (status === 'loading') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <div className="text-4xl mb-4 animate-pulse">🦞</div>
        <p className="text-gray-600 font-medium">Saving item...</p>
      </div>
    </div>
  )

  if (status === 'success') return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <div className="text-4xl mb-4">✅</div>
        <p className="text-gray-800 font-semibold text-lg">Saved!</p>
        <p className="text-gray-500 text-sm mt-1 truncate max-w-xs">{product?.title}</p>
        <p className="text-gray-400 text-sm">Returning to wishlist...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-sm p-6 w-full max-w-sm">
        <div className="text-3xl mb-3">🦞</div>
        <h1 className="text-lg font-bold text-gray-900 mb-1">Save an item</h1>
        <p className="text-sm text-gray-500 mb-4">Paste a product URL to save it to your wishlist</p>
        <input
          type="url"
          placeholder="https://www.zara.com/..."
          value={manualUrl}
          onChange={e => setManualUrl(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 mb-3"
        />
        {status === 'error' && (
          <p className="text-red-500 text-sm mb-3">Couldn't extract product info. Try again or paste a different URL.</p>
        )}
        <button
          onClick={() => extractAndSave(manualUrl)}
          disabled={!manualUrl}
          className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-40"
        >
          Save to Wishlist
        </button>
      </div>
    </div>
  )
}

export default function SharePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="text-4xl mb-4 animate-pulse">🦞</div>
        </div>
      </div>
    }>
      <ShareContent />
    </Suspense>
  )
}
