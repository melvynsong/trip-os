
import type { PackingList } from '@/types/packing-list'

export function normalizePackingList(data: any, days_count: number): PackingList {
    if (!data || !Array.isArray(data.categories)) throw new Error('Invalid format')
    const categories = data.categories
      .map((cat: any) => {
        if (!cat.name || !Array.isArray(cat.items)) return null
        const seen = new Set()
        const items = cat.items
          .filter((item: any) => item.name && typeof item.quantity === 'number')
          .map((item: any) => ({
            name: String(item.name).trim(),
            quantity: Math.max(1, Math.min(Number(item.quantity), days_count * 2)),
            notes: item.notes ? String(item.notes) : null,
          }))
          .filter((item: any) => {
            if (seen.has(item.name.toLowerCase())) return false
            seen.add(item.name.toLowerCase())
            return true
          })
        return items.length ? { name: cat.name, items } : null
      })
      .filter(Boolean)

    const minCats = ['clothing', 'essentials', 'documents']
    minCats.forEach(cat => {
      if (!categories.find((c: any) => c.name.toLowerCase() === cat)) {
        categories.push({ name: cat.charAt(0).toUpperCase() + cat.slice(1), items: [] })
      }
    })

    return { categories } as PackingList
  }
