import { Item } from '@/lib/store'

interface BasketSummaryProps {
  items: Item[]
  selectedCategories: Set<string>
}

export default function BasketSummary({ items, selectedCategories }: BasketSummaryProps) {
  const filteredItems = selectedCategories.size === 0 
    ? items 
    : items.filter(item => selectedCategories.has(item.category))

  const itemsWithPrice = filteredItems.filter(item => item.price && item.price !== 'See website')
  const itemsWithoutPrice = filteredItems.filter(item => !item.price || item.price === 'See website')

  const total = itemsWithPrice.reduce((sum, item) => {
    const price = item.price.replace(/[^\d.,]/g, '').replace(',', '.')
    return sum + (parseFloat(price) || 0)
  }, 0)

  const hasCategories = selectedCategories.size > 0
  const categoryNames = hasCategories ? 
    Array.from(selectedCategories).map(c => c.replace(/s$/, '')).join(', ') :
    'all categories'

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
        
        {hasCategories && (
          <p className="text-xs text-gray-400 mt-1">
            From {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} in {categoryNames}
          </p>
        )}
      </div>
    </div>
  )
}