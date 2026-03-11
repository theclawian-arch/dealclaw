import { SavedItem } from '@/lib/store'

interface BasketSummaryProps {
  items: SavedItem[]
  selectedCategories: Set<string>
}

export default function BasketSummary({ items, selectedCategories }: BasketSummaryProps) {
  // Handle all items including price extraction
  const workingItems = items.filter(item => item.title && item.title !== 'Product')
  
  const filteredItems = selectedCategories.size === 0 
    ? workingItems 
    : workingItems.filter(item => selectedCategories.has(item.category))

  const itemsWithPrice = filteredItems.filter(item => 
    item.price && 
    item.price.trim() !== '' && 
    item.price !== 'Price on site' &&
    item.price !== 'See website'
  )
  
  const itemsWithoutPrice = filteredItems.filter(item => 
    !item.price || 
    item.price.trim() === '' || 
    item.price === 'Price on site' ||
    item.price === 'See website'
  )

  const total = itemsWithPrice.reduce((sum, item) => {
    try {
      const cleanPrice = String(item.price || '')
        .replace(/[^0-9,.]/g, '')  // Keep only numbers, dots, commas
        .replace(',', '.')         // Handle European comma decimal
        .trim()

      const priceValue = parseFloat(cleanPrice)
      return sum + (isNaN(priceValue) ? 0 : priceValue)
    } catch {
      return sum
    }
  }, 0)

  const hasCategories = selectedCategories.size > 0
  const categoryNames = hasCategories ? 
    Array.from(selectedCategories).join(', ').replace(/([a-z])([A-Z])/g, '$1 $2') :
    'all categories'

  // Don't show if we have no valid items to total
  if (workingItems.length === 0) return null
  if (selectedCategories.size > 0 && filteredItems.length === 0) return null

  return (
    <div className="p-4 bg-white border-t border-b border-gray-100">
      <div className="max-w-lg mx-auto">
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
        
        {!hasCategories && itemsWithoutPrice.length === 0 && itemsWithPrice.length === 0 && (
          <p className="text-xs text-gray-500 mt-1">
            No items with prices to calculate
          </p>
        )}
      </div>
    </div>
  )
}