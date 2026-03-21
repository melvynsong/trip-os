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
import SegmentedControl from '@/app/components/ui/SegmentedControl'

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
      <SegmentedControl
        label="Tone"
        value={tone}
        onChange={(v) => onToneChange(v as StoryTone)}
        options={STORY_TONE_OPTIONS}
      />

      <SegmentedControl
        label="Length"
        value={length}
        onChange={(v) => onLengthChange(v as StoryLength)}
        options={STORY_LENGTH_OPTIONS}
      />

      {scope === 'day' ? (
        <SegmentedControl
          label="Focus"
          value={dayFocus}
          onChange={(v) => onDayFocusChange(v as DayStoryFocus)}
          options={DAY_STORY_FOCUS_OPTIONS}
        />
      ) : (
        <SegmentedControl
          label="Type"
          value={placeStoryType}
          onChange={(v) => onPlaceStoryTypeChange(v as PlaceStoryTypeOption)}
          options={PLACE_STORY_TYPE_OPTIONS}
        />
      )}
    </div>
  )
}
