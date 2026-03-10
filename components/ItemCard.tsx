'use client'

import { SavedItem, deleteItem } from '@/lib/store'
import { RETAILERS } from '@/lib/retailers'

interface Props {
  item: SavedItem
  onDelete: (id: string) => void
  selected: boolean
  onToggleSelect: (id: string) => void
}

export default function ItemCard({ item, onDelete, selected, onToggleSelect }: Props) {
  const retailerConfig = RETAILERS.find(r => r.id === item.retailerId)
  const brandColor = retailerConfig?.color || '#111827'
  const brandTextColor = retailerConfig?.textColor || '#ffffff'

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
        className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 text-xs shadow-sm"
      >
        ×
      </button>

      {/* Image or branded placeholder */}
      <a href={item.url} target="_blank" rel="noopener noreferrer">
        <div className="aspect-[3/4] overflow-hidden">
          {item.image ? (
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                // If image fails to load, show placeholder
                const target = e.currentTarget
                target.style.display = 'none'
                const placeholder = target.nextElementSibling as HTMLElement
                if (placeholder) placeholder.style.display = 'flex'
              }}
            />
          ) : null}
          {/* Branded placeholder — shown when no image or image fails */}
          <div
            className={`w-full h-full flex-col items-center justify-center gap-2 ${item.image ? 'hidden' : 'flex'}`}
            style={{ backgroundColor: brandColor }}
          >
            <span
              className="text-2xl font-bold tracking-widest uppercase"
              style={{ color: brandTextColor }}
            >
              {item.retailer}
            </span>
            <span
              className="text-xs opacity-60"
              style={{ color: brandTextColor }}
            >
              Tap to view
            </span>
          </div>
        </div>
      </a>

      {/* Info */}
      <div className="p-3">
        <p className="text-xs text-gray-400 mb-0.5">{item.retailer}</p>
        <p className="text-sm font-medium text-gray-900 leading-tight line-clamp-2">{item.title}</p>
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm font-bold text-gray-900">
            {item.price && item.price !== 'See website' ? item.price : (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 font-normal underline"
              >
                See price →
              </a>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
