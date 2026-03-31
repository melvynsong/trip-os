import { PackingList } from "@/types/packing-list";

export function normalizePackingList(data: any): PackingList {
  if (!data || !Array.isArray(data.categories)) {
      throw new Error('Invalid format')
  }
  return {
    categories: data.categories.map((cat: any) => ({
      category: String(cat.category),
      items: Array.isArray(cat.items)
        ? cat.items.map((item: any) => ({
            name: String(item.name),
            quantity: Number(item.quantity),
            notes: item.notes ? String(item.notes) : undefined,
          }))
        : [],
    })),
  };
  }

  export function normalizePackingList(data: any, days_count: number): PackingListOutput {
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
          .filter(item => {
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

    return { categories }
  }
