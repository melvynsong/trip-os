export type StoryScope = 'day' | 'place'

export type StoryTone =
  | 'warm_personal'
  | 'fun_casual'
  | 'reflective'
  | 'travel_journal'
  | 'family_memory'
  | 'food_focused'

export type StoryLength = 'short' | 'medium' | 'long'

export type DayStoryFocus =
  | 'overall_day'
  | 'food_highlights'
  | 'family_moments'
  | 'cultural_highlights'
  | 'shopping_highlights'

export type PlaceStoryTypeOption =
  | 'short_memory'
  | 'caption'
  | 'reflection'
  | 'food_note'

export type SavedStoryType =
  | 'day_summary'
  | 'place_story'
  | 'restaurant_story'
  | 'activity_story'
  | 'caption'
  | 'food_note'

export const STORY_TONE_OPTIONS: Array<{ value: StoryTone; label: string }> = [
  { value: 'warm_personal', label: 'Warm and personal' },
  { value: 'fun_casual', label: 'Fun and casual' },
  { value: 'reflective', label: 'Reflective' },
  { value: 'travel_journal', label: 'Travel journal' },
  { value: 'family_memory', label: 'Family memory' },
  { value: 'food_focused', label: 'Food-focused' },
]

export const STORY_LENGTH_OPTIONS: Array<{ value: StoryLength; label: string }> = [
  { value: 'short', label: 'Short' },
  { value: 'medium', label: 'Medium' },
  { value: 'long', label: 'Long' },
]

export const DAY_STORY_FOCUS_OPTIONS: Array<{
  value: DayStoryFocus
  label: string
}> = [
  { value: 'overall_day', label: 'Overall day' },
  { value: 'food_highlights', label: 'Food highlights' },
  { value: 'family_moments', label: 'Family moments' },
  { value: 'cultural_highlights', label: 'Cultural highlights' },
  { value: 'shopping_highlights', label: 'Shopping highlights' },
]

export const PLACE_STORY_TYPE_OPTIONS: Array<{
  value: PlaceStoryTypeOption
  label: string
}> = [
  { value: 'short_memory', label: 'Short memory' },
  { value: 'caption', label: 'Caption' },
  { value: 'reflection', label: 'Reflection' },
  { value: 'food_note', label: 'Food note' },
]

export const TONE_LABEL: Record<StoryTone, string> = Object.fromEntries(
  STORY_TONE_OPTIONS.map((item) => [item.value, item.label])
) as Record<StoryTone, string>

export const LENGTH_LABEL: Record<StoryLength, string> = Object.fromEntries(
  STORY_LENGTH_OPTIONS.map((item) => [item.value, item.label])
) as Record<StoryLength, string>

export const DAY_FOCUS_LABEL: Record<DayStoryFocus, string> = Object.fromEntries(
  DAY_STORY_FOCUS_OPTIONS.map((item) => [item.value, item.label])
) as Record<DayStoryFocus, string>

export const PLACE_TYPE_LABEL: Record<PlaceStoryTypeOption, string> = Object.fromEntries(
  PLACE_STORY_TYPE_OPTIONS.map((item) => [item.value, item.label])
) as Record<PlaceStoryTypeOption, string>
