import type { PackingList, PackingListCategory, PackingListItem } from '@/types/packing-list'
import type { PackingStyle } from '@/lib/ai/packing'
import { branding } from '@/lib/branding'
import { buildWhatsAppShareUrl } from '@/lib/share/whatsapp'

type PackingShareInput = {
  tripTitle: string
  destination: string
  style: string
  list: PackingList
}

const CATEGORY_ORDER = [
  'Clothing',
  'Outerwear',
  'Footwear',
  'Weather-specific',
  'Essentials',
  'Optional',
]

function titleCaseStyle(style: PackingStyle): string {
  return style.charAt(0).toUpperCase() + style.slice(1)
}

function renderCategoryItems(items: PackingListItem[]): string[] {
  return items.slice(0, 5).map((item) => `- ${item.quantity} ${item.name}`)
}

function compactLines(lines: Array<string | null | undefined>): string {
  return lines
    .filter(Boolean)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function formatPackingForWhatsApp(input: PackingShareInput): string {
  const renderedCategories = CATEGORY_ORDER.map((categoryName) => {
    const cat = input.list.categories.find((c) => c.category === categoryName)
    if (!cat || !cat.items.length) return null
    const categoryLines = renderCategoryItems(cat.items)
    if (!categoryLines.length) return null
    return compactLines([
      categoryName,
      ...categoryLines,
    ])
  }).filter((section): section is string => section !== null)

  return compactLines([
    `Trip packing list for ${input.destination || input.tripTitle}`,
    `Style: ${input.style}`,
    '',
    renderedCategories.join('\n\n'),
    '',
    `Generated from ${branding.appName} (Beta)`,
  ])
}

export function buildPackingWhatsAppShareUrl(input: PackingShareInput): string {
  return buildWhatsAppShareUrl(formatPackingForWhatsApp(input))
}
