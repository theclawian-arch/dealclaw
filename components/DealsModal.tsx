'use client'

import { useEffect, useState } from 'react'
import { RETAILERS } from '@/lib/retailers'

interface Deal {
  type: string
  label: string
  description: string
  url: string
  ease: number
}

interface Props {
  retailerIds: string[]
  onClose: () => void
}

export default function DealsModal({ retailerIds, onClose }: Props) {
  const [deals, setDeals] = useState<Record<string, Deal[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ retailerIds }),
    })
      .then(r => r.json())
      .then(data => { setDeals(data.results || {}); setLoading(false) })
      .catch(() => setLoading(false))
  }, [retailerIds])

  const uniqueIds = [...new Set(retailerIds)]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white w-full max-w-lg rounded-t-3xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-gray-200 rounded-full" />
        </div>

        <div className="px-5 pb-8 pt-2">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Help me get these for less</h2>
          <p className="text-sm text-gray-500 mb-5">Ways to save, sorted by easiest first</p>

          {loading ? (
            <div className="text-center py-10">
              <div className="text-3xl animate-pulse mb-3">🔍</div>
              <p className="text-gray-500 text-sm">Finding deals...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {uniqueIds.map(id => {
                const retailer = RETAILERS.find(r => r.id === id)
                const retailerDeals = deals[id] || []
                if (!retailer) return null

                return (
                  <div key={id}>
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {retailer.logo} {retailer.name}
                    </h3>
                    {retailerDeals.length === 0 ? (
                      <p className="text-sm text-gray-400">No deals found right now.</p>
                    ) : (
                      <ul className="space-y-2">
                        {retailerDeals.map((deal, i) => (
                          <li key={i} className="flex items-start gap-3 text-sm">
                            <span className="shrink-0 mt-0.5">{deal.label.split(' ')[0]}</span>
                            <div className="flex-1">
                              <span className="text-gray-700">{deal.description}</span>
                              {' '}
                              <a
                                href={deal.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline shrink-0"
                              >
                                View →
                              </a>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <button
            onClick={onClose}
            className="mt-8 w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
