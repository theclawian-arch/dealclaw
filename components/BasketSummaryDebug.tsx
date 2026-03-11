import { SavedItem } from '@/lib/store'

// Simple debug component that shows prices directly in the UI
export default function BasketSummaryDebug({ items, selectedCategories }: {
  items: SavedItem[]
  selectedCategories: Set<string>
}) {
  const filteredItems = selectedCategories.size === 0 
    ? items 
    : items.filter(item => selectedCategories.has(item.category))

  const itemsWithPrice = filteredItems.filter(item => 
    item.price && 
    item.price.trim() !== '' && 
    item.price !== 'See website'
  )
  
  const itemsWithoutPrice = filteredItems.filter(item => 
    !item.price || 
    item.price.trim() === '' || 
    item.price === 'See website'
  )

  const total = itemsWithPrice.reduce((sum, item) => {
    const cleanPrice = item.price.replace(/[€\s€EUR$USD]/g, '').replace(',', '.').trim()
    const priceValue = parseFloat(cleanPrice.startsWith('.') ? `0${cleanPrice}` : cleanPrice)
    return sum + (isNaN(priceValue) ? 0 : priceValue)
  }, 0)

  const hasCategories = selectedCategories.size > 0
  const categoryNames = hasCategories ? 
    Array.from(selectedCategories).map(c => c.replace(/s$/, '')).join(', ') :
    'all categories'

  // Show all items visually in the component instead of console
  const debugItems = items.map(item => ({ title: item.title.slice(0, 30), price: item.price || '[none]', category: item.category }))

  if (items.length === 0) return null

  return (
    <div className="p-4 bg-white border-t border-b border-gray-100">
      <div className="max-w-lg mx-auto">
        {/* Debug display */}
        <div className="mb-3 p-2 bg-gray-50 rounded-md text-xs font-mono">
          <div className="text-xs text-gray-400 mb-2">Debug: All items ({items.length} total)</div>
          {debugItems.map((item, idx) => (
            <div key={idx} className="flex justify-between text-gray-600">
              <span>{item.title}</span>
              <span className="text-right">{item.price}</span>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-start mb-1">
          <span className="text-sm font-medium text-gray-800">
            {hasCategories ? `${categoryNames} total` : 'Basket total'}
          </span>
          <span className="text-base font-bold text-gray-900">
            €{total.toFixed(2)}
          </span>
        </div>
        
        {itemsWithoutPrice.length > 0 && (
          <p className="text-xs text-gray-500 mt-1">
            Note: this total excludes {itemsWithoutPrice.length} item{itemsWithoutPrice.length > 1 ? 's' : ''} that we could not get the price for
          </p>
        )}
        
        {hasCategories && (
          <p className="text-xs text-gray-400 mt-1">
            From {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} in {categoryNames}
          </p>
        )}
      </div>
    </div>
  )
}