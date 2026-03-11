import { useState } from 'react'
import { useStore } from '@/lib/store'
import { categories, CATEGORY_LABELS } from '@/lib/retailers'
import ItemCard from '@/components/ItemCard'
import DealsModal from '@/components/DealsModal'
import BasketSummary from '@/components/BasketSummary'

export default function HomePage() {
  const [items, setItems] = useStore('items', [])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [showDeals, setShowDeals] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set())

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

  // Filter items based on selected categories
  const filteredItems = selectedCategories.size === 0 
    ? items 
    : items.filter(item => selectedCategories.has(item.category))

  // Categories that actually have items
  const categoriesWithItems = categories.filter(c =>
    items.some(i => i.category === c)
  )

  // Toggle category selection
  function toggleCategory(category: string) {
    setSelectedCategories(prev => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

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

        {/* Category selection */}
        {categoriesWithItems.length > 0 && (
          <div className="max-w-lg mx-auto px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setSelectedCategories(new Set())}
              className={`shrink-0 text-sm px-3 py-1.5 rounded-full font-medium transition-all ${
                selectedCategories.size === 0
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              All ({items.length})
            </button>
            {categoriesWithItems.map(c => (
              <button
                key={c}
                onClick={() => toggleCategory(c)}
                className={`shrink-0 text-sm px-3 py-1.5 rounded-full font-medium transition-all ${
                  selectedCategories.has(c)
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

        {/* Basket summary for filtered items */}
        {items.length > 0 && (
          <BasketSummary 
            items={items} 
            selectedCategories={selectedCategories} 
          />
        )}

        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🦞</div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-500 text-sm mb-6">
              Add items from any fashion site and we'll find the best deals for you
            </p>
            <a
              href="/share"
              className="inline-block bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-xl"
            >
              Start adding items
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {filteredItems.map(item => (
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
          items={selectedItems}
          onClose={() => setShowDeals(false)}
        />
      )}
    </div>
  )
}