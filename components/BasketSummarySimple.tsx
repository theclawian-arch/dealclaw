import { SavedItem } from '@/lib/store'

// Always-visible basket summary that calculates properly
export default function BasketSummaryVisible({ items, selectedCategories }: {
  items: SavedItem[]
  selectedCategories: Set<string>
}) {
  const workingItems = items
  const filteredItems = selectedCategories.size === 0 
    ? workingItems 
    : workingItems.filter(item => selectedCategories.has(item.category))

  const itemsWithPrice = workingItems.filter(item => 
    item.price && 
    item.price.trim() !== '' && 
    item.price !== 'Price on site' &&
    item.price !== 'See website' &&
    /€\d+/.test(item.price)
  )

  const total = workingItems.reduce((sum, item) => {
    try {
      const match = item.price.match(/€([\d\.,]+)/)
      if (match) {
        const price = parseFloat(match[1].replace(',', '.'))
        return sum + (isNaN(price) ? 0 : price)
      }
    } catch {}
    return sum
  }, 0)

  const categoryNames = selectedCategories.size > 0 ? 
    Array.from(selectedCategories).join(', ') :
    'all items'

  return (
    <div className="p-4 bg-white border-t border-b border-gray-100 mb-4">
      <div className="max-w-lg mx-auto">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-800">
            {categoryNames} total
          </span>
          <span className="text-lg font-bold text-gray-900">
            €{total.toFixed(2)}
          </span>
        </div>
        
        <div className="text-xs text-gray-500 mt-1">
          {total > 0 && <span>Calculating from {itemsWithPrice.length} of {workingItems.length} items</span>}
          {total === 0 && <span>Total: €0.00 (No prices found)</span>}
        </div>
      </div>
    </div>
  )
}