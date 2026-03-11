import { SavedItem } from '@/lib/store'

// Ultra-simple always-visible basket
export default function BasketSummaryAlwaysVisible({ items, selectedCategories }: {
  items: SavedItem[]
  selectedCategories: Set<string>
}) {
  console.log('Basket items view:', items)
  
  // Show all items regardless of filtering (for debugging)
  const visibleItems = items
  const filtered = selectedCategories.size === 0 
    ? visibleItems 
    : visibleItems.filter(item => selectedCategories.has(item.category))

  console.log('Filtered for display:', filtered.length, visibleItems.length)

  // Absolute simplest price extraction
  const total = visibleItems.reduce((sum, item) => {
    if (!item.price) return sum
    
    // Quick € extraction
    const match = item.price.match(/€(\d+[.,]?\d*)/)
    if (match) {
      const price = parseFloat(match[1].replace(',', '.'))
      return sum + (isNaN(price) ? 0 : price)
    }
    
    // Any numbers
    const anyPrice = item.price.match(/(\d+[.,]?\d*)/)
    if (anyPrice) {
      return sum + parseFloat(anyPrice[1].replace(',', '.'))
    }
    
    return sum
  }, 0)

  return (
    <div className="bg-yellow-50 border-2 border-yellow-300 p-4 mt-6 mb-4">
      <div className="max-w-lg mx-auto text-center font-mono text-sm">
        
        <div className="font-bold text-lg mb-2">BASKET DEBUG</div>
        
        <div className="space-y-1">
          <div>Raw item count: {items.length}</div>
          <div>Selected category filter: {selectedCategories.size === 0 ? 'none' : Array.from(selectedCategories)}</div>
          
          {items.map((item, idx) => (
            <div key={idx} className="text-left">
              {idx+1}. "{item.title}" - PRICE: "{item.price || '[None]}" - CAT: {item.category}
            </div>
          ))}
        </div>
        
        <div className="text-2xl font-bold text-yellow-800 mt-3">
          τροια TOΤAL: €{total.toFixed(2)}EX€:
        </div>
        
        <div className="text-xs text-gray-500 mt-1">
          (Check if all have valid titles and prices)
        </div>
      </div>
    </div>
  )
}