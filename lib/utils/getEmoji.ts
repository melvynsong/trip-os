import { ActivityType } from '@/types/trip'

type EmojiContext = {
  title?: string | null
  notes?: string | null
}

function isLikelyFlight(context?: EmojiContext) {
  if (!context) return false
  const text = `${context.title || ''} ${context.notes || ''}`.toLowerCase()
  if (!text.trim()) return false
  return /(flight|airport|airline|boarding|gate|terminal|departs?|arrives?|takeoff|landing|iata)/.test(text)
}

export function getEmoji(type: ActivityType | string, context?: EmojiContext) {
  switch (type) {
    case 'food':
      return '🍜'
    case 'attraction':
      return '📍'
    case 'shopping':
      return '🛍️'
    case 'transport':
      if (isLikelyFlight(context)) {
        return '✈️'
      }
      return '🚗'
    case 'hotel':
      return '🏨'
    case 'note':
      return '📝'
    default:
      return '📌'
  }
}
