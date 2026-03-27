import type { PackingItem, PackingList, PackingStyle } from '@/lib/ai/packing'
import { branding } from '@/lib/branding'
import { buildWhatsAppShareUrl } from '@/lib/share/whatsapp'

type PackingShareInput = {
  tripTitle: string
  destination: string
  style: PackingStyle
  list: PackingList
}

const SECTION_ORDER: Array<keyof PackingList['sections']> = [
  'clothing',
  'outerwear',
  'footwear',
  'weather_specific',
  'essentials',
  'optional',
]

const SECTION_TITLES: Record<keyof PackingList['sections'], string> = {
  clothing: 'Clothing',
  outerwear: 'Outerwear',
  footwear: 'Footwear',
  weather_specific: 'Weather-specific',
  essentials: 'Essentials',
  optional: 'Optional',
}

function titleCaseStyle(style: PackingStyle): string {
  return style.charAt(0).toUpperCase() + style.slice(1)
}

function renderSectionItems(items: PackingItem[]): string[] {
  return items.slice(0, 5).map((item) => `- ${item.quantity} ${item.item}`)
}

function compactLines(lines: Array<string | null | undefined>): string {
  return lines
    .filter(Boolean)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function formatPackingForWhatsApp(input: PackingShareInput): string {
  const renderedSections = SECTION_ORDER.map((sectionKey) => {
    const items = input.list.sections[sectionKey]
    if (!items.length) return null

    const sectionLines = renderSectionItems(items)
    if (!sectionLines.length) return null

    return compactLines([
      SECTION_TITLES[sectionKey],
      ...sectionLines,
    ])
  }).filter((section): section is string => section !== null)

  return compactLines([
    `Trip packing list for ${input.destination || input.tripTitle}`,
    `Style: ${titleCaseStyle(input.style)}`,
    '',
    'Summary:',
    input.list.summary,
    '',
    renderedSections.join('\n\n'),
    '',
    `Generated from ${branding.appName} (Beta)`,
  ])
}

export function buildPackingWhatsAppShareUrl(input: PackingShareInput): string {
  return buildWhatsAppShareUrl(formatPackingForWhatsApp(input))
}
