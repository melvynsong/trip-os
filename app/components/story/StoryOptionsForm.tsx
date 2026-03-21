'use client'

import {
  DAY_STORY_FOCUS_OPTIONS,
  PLACE_STORY_TYPE_OPTIONS,
  STORY_LENGTH_OPTIONS,
  STORY_TONE_OPTIONS,
  type DayStoryFocus,
  type PlaceStoryTypeOption,
  type StoryLength,
  type StoryScope,
  type StoryTone,
} from '@/lib/story/types'

type StoryOptionsFormProps = {
  scope: StoryScope
  tone: StoryTone
  length: StoryLength
  dayFocus: DayStoryFocus
  placeStoryType: PlaceStoryTypeOption
  onToneChange: (tone: StoryTone) => void
  onLengthChange: (length: StoryLength) => void
  onDayFocusChange: (focus: DayStoryFocus) => void
  onPlaceStoryTypeChange: (value: PlaceStoryTypeOption) => void
}

export default function StoryOptionsForm({
  scope,
  tone,
  length,
  dayFocus,
  placeStoryType,
  onToneChange,
  onLengthChange,
  onDayFocusChange,
  onPlaceStoryTypeChange,
}: StoryOptionsFormProps) {
  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Tone
        </label>
        <select
          value={tone}
          onChange={(e) => onToneChange(e.target.value as StoryTone)}
          className="w-full rounded-xl border px-3 py-2 text-sm"
        >
          {STORY_TONE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
          Length
        </label>
        <select
          value={length}
          onChange={(e) => onLengthChange(e.target.value as StoryLength)}
          className="w-full rounded-xl border px-3 py-2 text-sm"
        >
          {STORY_LENGTH_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {scope === 'day' ? (
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Focus
          </label>
          <select
            value={dayFocus}
            onChange={(e) => onDayFocusChange(e.target.value as DayStoryFocus)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          >
            {DAY_STORY_FOCUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
            Type
          </label>
          <select
            value={placeStoryType}
            onChange={(e) => onPlaceStoryTypeChange(e.target.value as PlaceStoryTypeOption)}
            className="w-full rounded-xl border px-3 py-2 text-sm"
          >
            {PLACE_STORY_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
