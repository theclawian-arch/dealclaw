import { SavedItem } from '@/lib/store'

interface BasketSummaryDebugProps {
  items: SavedItem[]
  selectedCategories: Set<string>
}

export default function BasketSummaryDebug({ items, selectedCategories }: BasketSummaryDebugProps) {
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

  // Debug: show raw price values for every item
  console.log('🦞 Basket Summary Debug:')
  console.log('All items:', items.map(i => ({ title: i.title.slice(0, 20), price: i.price, category: i.category, retailer: i.retailer })))
  console.log('Filtered items:', filteredItems.map(i => ({ title: i.title.slice(0, 20), price: i.price, category: i.category })))
  console.log('Items with price:', itemsWithPrice.map(i => ({ title: i.title.slice(0, 20), price: i.price })))
  console.log('Items without price:', itemsWithoutPrice.map(i => ({ title: i.title.slice(0, 20), price: i.price })))

  const total = itemsWithPrice.reduce((sum, item) => {
    console.log(`Processing item: ${item.title} - raw price: "${item.price}"`)
    
    // Handle currency symbols, spaces, and various formats
    const cleanPrice = item.price
      .replace(/[€\s€EUR$USD]/g, '')  // Remove currency symbols
      .replace(/,/g, '.')              // Handle comma as decimal separator
      .trim()
    
    console.log(`Cleaned price: "${cleanPrice}"`)
    
    const priceValue = parseFloat(cleanPrice.startsWith('.') ? `0${cleanPrice}` : cleanPrice)
    const parsedValue = isNaN(priceValue) ? 0 : priceValue
    console.log(`Parsed value: ${parsedValue}`)
    
    return sum + parsedValue
  }, 0)

  console.log('🦞 Final total:', total)

  const hasCategories = selectedCategories.size > 0
  const categoryNames = hasCategories ? 
    Array.from(selectedCategories).map(c => c.replace(/s$/, '')).join(', ') :
    'all categories'

  return (
    <div className="p-4 bg-white border-t border-b border-gray-100">
      <div className="max-w-lg mx-auto">
        {items.length > 0 && (
          <div className="text-xs text-gray-400 mb-2 font-mono">
            Debug: {items.length} items total
          </div>
        )}
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
m          </p>
        )}
      </div>
    </div>
  )
}