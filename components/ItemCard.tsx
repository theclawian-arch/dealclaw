'use client'

import { SavedItem } from '@/lib/store'
import { deleteItem } from '@/lib/store'

interface Props {
  item: SavedItem
  onDelete: (id: string) => void
  selected: boolean
  onToggleSelect: (id: string) => void
}

export default function ItemCard({ item, onDelete, selected, onToggleSelect }: Props) {
  return (
    <div
      className={`relative bg-white rounded-2xl overflow-hidden shadow-sm border-2 transition-all ${
        selected ? 'border-gray-900' : 'border-transparent'
      }`}
    >
      {/* Select checkbox */}
      <button
        onClick={() => onToggleSelect(item.id)}
        className={`absolute top-2 left-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          selected ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-300'
        }`}
      >
        {selected && <span className="text-white text-xs">✓</span>}
      </button>

      {/* Delete button */}
      <button
        onClick={() => { deleteItem(item.id); onDelete(item.id) }}
        className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 text-xs"
      >
        ×
      </button>

      {/* Image */}
      <a href={item.url} target="_blank" rel="noopener noreferrer">
        <div className="aspect-[3/4] bg-gray-100 overflow-hidden">
          {item.image ? (
            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">👕</div>
          )}
        </div>
      </a>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs text-gray-400 mb-0.5">{item.retailer}</p>
        <p className="text-sm font-medium text-gray-900 leading-tight line-clamp-2">{item.title}</p>
        <p className="text-sm font-bold text-gray-900 mt-1">{item.price}</p>
      </div>
    </div>
  )
}
