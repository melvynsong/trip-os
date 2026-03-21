import { ActivityType } from '@/types/trip'

export function getEmoji(type: ActivityType | string) {
  switch (type) {
    case 'food':
      return '🍜'
    case 'attraction':
      return '📍'
    case 'shopping':
      return '🛍️'
    case 'transport':
      return '🚗'
    case 'hotel':
      return '🏨'
    case 'note':
      return '📝'
    default:
      return '📌'
  }
}
