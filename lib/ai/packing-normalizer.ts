import { PackingList } from "@/types/packing-list";

export function normalizePackingList(data: any): PackingList {
  if (!data || !Array.isArray(data.categories)) {
    throw new Error("Invalid packing list format");
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
