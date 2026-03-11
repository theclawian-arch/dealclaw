import { SavedItem } from '@/lib/store'

interface BasketSummaryProps {
  items: SavedItem[]
  selectedCategories: Set<string>
}

export default function BasketSummary({ items, selectedCategories }: BasketSummaryProps) {
  const workingItems = items.filter(item => item.title && item.title !== 'Product')
  const filteredItems = selectedCategories.size === 0 
    ? workingItems 
    : workingItems.filter(item => selectedCategories.has(item.category))

  const itemsWithPrice = filteredItems.filter(item => {
    const hasPrice = item.price && item.price.trim() && 
      !item.price.includes('Price on site') && 
      !item.price.includes('See website')
    const hasNumber = /[\d,]/.test(item.price || '')
    return hasPrice && hasNumber
  })

  const itemsWithoutPrice = filteredItems.filter(item => 
    !item.price || !item.price.trim() || 
    item.price.includes('Price on site') || 
    item.price.includes('See website') ||
    !/[\d,]/.test(item.price || '')
  )

  const total = itemsWithPrice.reduce((sum, item) => {
    try {
      const cleanPrice = String(item.price || '')
        .replace(/[^0-9\.,-]/g, '')  // Keep numbers, dots, commas, hyphens
        .replace(',', '.')
        .trim()

      const priceValue = parseFloat(cleanPrice)
      return sum + (isNaN(priceValue) || priceValue < 0 ? 0 : priceValue)
    } catch {
      return sum
    }
  }, 0)

  const hasCategories = selectedCategories.size > 0
  const categoryNames = hasCategories ? 
    Array.from(selectedCategories).join(', ') :
    'all categories'



  return (
    <div className="p-4 bg-white border-t border-b border-gray-100 mb-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-800">
              {hasCategories ? `${categoryNames} subtotal` : 'Basket total'}
            </span>
            <span className="text-lg font-bold text-gray-900">
              €{total.toFixed(2)}
            </span>
          </div>

          <div className="text-xs text-gray-500 space-y-1">
            {workingItems.map(item => (
              <div key={item.id} className="flex justify-between">
                <span className="truncate max-w-44" title={item.title}>{item.title.slice(0, 35)}...</span>
                <span className="text-right"> {item.price || '[No price]'}</span>
              </div>
            ))}
          </div>

          <div className="mt-2 pt-2 border-t border-gray-200 text-xs">
            <span className={`font-semibold ${itemsWithPrice.length > 0 ? 'text-green-600' : 'text-gray-500'}`}>
              Calculating from {itemsWithPrice.length} priced items
            </span>
            {itemsWithoutPrice.length > 0 && (
              <span className="text-gray-500 ml-1">
                (ignoring {itemsWithoutPrice.length} without prices)
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}