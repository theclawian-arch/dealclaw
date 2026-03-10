'use client'

import { useEffect, useState } from 'react'
import { getItems, getCategories, CATEGORY_LABELS, deleteItem } from '@/lib/store'
import type { SavedItem, Category } from '@/lib/store'
import ItemCard from '@/components/ItemCard'
import DealsModal from '@/components/DealsModal'

export default function Home() {
  const [items, setItems] = useState<SavedItem[]>([])
  const [activeCategory, setActiveCategory] = useState<Category | 'all'>('all')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showDeals, setShowDeals] = useState(false)

  useEffect(() => {
    setItems(getItems())
  }, [])

  const categories = getCategories()
  const filtered = activeCategory === 'all' ? items : items.filter(i => i.category === activeCategory)

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleDelete(id: string) {
    setItems(prev => prev.filter(i => i.id !== id))
    setSelected(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  const selectedItems = items.filter(i => selected.has(i.id))
  const selectedRetailerIds = [...new Set(selectedItems.map(i => i.retailerId))]

  const categoriesWithItems = categories.filter(c =>
    items.some(i => i.category === c)
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🦞</span>
            <h1 className="text-xl font-bold text-gray-900">DealClaw</h1>
          </div>
          <a
            href="/share"
            className="bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-xl"
          >
            + Add item
          </a>
        </div>

        {/* Category tabs */}
        {categoriesWithItems.length > 0 && (
          <div className="max-w-lg mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveCategory('all')}
              className={`shrink-0 text-sm px-3 py-1.5 rounded-full font-medium transition-all ${
                activeCategory === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              All ({items.length})
            </button>
            {categoriesWithItems.map(c => (
              <button
                key={c}
                onClick={() => setActiveCategory(c)}
                className={`shrink-0 text-sm px-3 py-1.5 rounded-full font-medium transition-all ${
                  activeCategory === c
                    ? 'bg-gray-900 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {CATEGORY_LABELS[c]} ({items.filter(i => i.category === c).length})
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="max-w-lg mx-auto px-4 py-4">
        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🦞</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 text-sm mb-6">
              Save items from Zara, Mango, Zalando and more.<br />
              Browse any retailer and tap "+ Add item" to save.
            </p>
            <a
              href="/share"
              className="inline-block bg-gray-900 text-white text-sm font-semibold px-6 py-3 rounded-xl"
            >
              Save your first item
            </a>
          </div>
        ) : (
          <>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <p>No items in this category</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filtered.map(item => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onDelete={handleDelete}
                    selected={selected.has(item.id)}
                    onToggleSelect={toggleSelect}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Deals CTA — shows when items are selected */}
      {selected.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-white border-t border-gray-100">
          <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
            <p className="text-sm text-gray-600">
              {selected.size} item{selected.size > 1 ? 's' : ''} selected
            </p>
            <button
              onClick={() => setShowDeals(true)}
              className="bg-gray-900 text-white text-sm font-semibold px-5 py-3 rounded-xl flex items-center gap-2"
            >
              💰 Help me get these for less
            </button>
          </div>
        </div>
      )}

      {/* Deals modal */}
      {showDeals && (
        <DealsModal
          retailerIds={selectedRetailerIds}
          onClose={() => setShowDeals(false)}
        />
      )}
    </div>
  )
}
