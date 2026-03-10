export type Category =
  | 'shoes'
  | 'tops'
  | 'bottoms'
  | 'dresses'
  | 'outerwear'
  | 'accessories'
  | 'sportswear'
  | 'other'

export interface SavedItem {
  id: string
  url: string
  title: string
  price: string
  image: string
  retailer: string
  retailerId: string
  category: Category
  savedAt: string
}

const STORAGE_KEY = 'dealclaw_items'

export function getItems(): SavedItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveItem(item: SavedItem): void {
  const items = getItems()
  const existing = items.findIndex(i => i.url === item.url)
  if (existing >= 0) {
    items[existing] = item
  } else {
    items.unshift(item)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function deleteItem(id: string): void {
  const items = getItems().filter(i => i.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function getCategories(): Category[] {
  return ['shoes', 'tops', 'bottoms', 'dresses', 'outerwear', 'accessories', 'sportswear', 'other']
}

export const CATEGORY_LABELS: Record<Category, string> = {
  shoes: '👟 Shoes',
  tops: '👕 Tops',
  bottoms: '👖 Bottoms',
  dresses: '👗 Dresses',
  outerwear: '🧥 Outerwear',
  accessories: '👜 Accessories',
  sportswear: '🏃 Sportswear',
  other: '📦 Other',
}
