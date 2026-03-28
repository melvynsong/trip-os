import { describe, expect, it } from 'vitest'
import { transformItineraryDayActivities, type ItineraryActivity } from './itinerary-transform'

function makeActivity(partial: Partial<ItineraryActivity> & Pick<ItineraryActivity, 'id' | 'day_id' | 'title' | 'type'>): ItineraryActivity {
  return {
    id: partial.id,
    day_id: partial.day_id,
    title: partial.title,
    type: partial.type,
    activity_time: partial.activity_time ?? null,
    notes: partial.notes ?? null,
    sort_order: partial.sort_order ?? 0,
    place_id: partial.place_id ?? null,
    created_at: partial.created_at ?? null,
    places: partial.places ?? null,
  }
}

describe('transformItineraryDayActivities', () => {
  it('groups related flight records into one timeline item and preserves chronological flow', () => {
    const activities: ItineraryActivity[] = [
      makeActivity({
        id: 'a1',
        day_id: 'd1',
        title: 'Breakfast at hotel',
        type: 'food',
        activity_time: '08:00',
        created_at: '2026-03-28T00:00:00.000Z',
      }),
      makeActivity({
        id: 'a2',
        day_id: 'd1',
        title: 'Flight departs',
        type: 'transport',
        activity_time: '10:15',
        notes: 'Singapore Airlines SQ 321 SIN → NRT Terminal 1',
        created_at: '2026-03-28T00:01:00.000Z',
      }),
      makeActivity({
        id: 'a3',
        day_id: 'd1',
        title: 'Flight arrives',
        type: 'transport',
        activity_time: '18:20',
        notes: 'Singapore Airlines SQ321 SIN → NRT',
        created_at: '2026-03-28T00:02:00.000Z',
      }),
      makeActivity({
        id: 'a4',
        day_id: 'd1',
        title: 'Dinner nearby',
        type: 'food',
        activity_time: '20:00',
        created_at: '2026-03-28T00:03:00.000Z',
      }),
    ]

    const { orderedItems, sections } = transformItineraryDayActivities(activities)

    expect(orderedItems).toHaveLength(3)
    expect(orderedItems[1]?.kind).toBe('flight')

    if (orderedItems[1]?.kind === 'flight') {
      expect(orderedItems[1].group.departure?.id).toBe('a2')
      expect(orderedItems[1].group.arrival?.id).toBe('a3')
      expect(orderedItems[1].group.meta?.flightNumber).toBe('SQ 321')
      expect(orderedItems[1].group.meta?.route).toBe('SIN → NRT')
    }

    expect(sections.map((section) => section.key)).toEqual(['morning', 'evening'])
    expect(sections.find((section) => section.key === 'morning')?.items.length).toBe(2)
  })

  it('keeps untimed items after timed items using stable source order', () => {
    const activities: ItineraryActivity[] = [
      makeActivity({
        id: 'b1',
        day_id: 'd2',
        title: 'Untimed note one',
        type: 'note',
        created_at: '2026-03-28T00:00:00.000Z',
      }),
      makeActivity({
        id: 'b2',
        day_id: 'd2',
        title: 'Morning walk',
        type: 'attraction',
        activity_time: '09:00',
        created_at: '2026-03-28T00:01:00.000Z',
      }),
      makeActivity({
        id: 'b3',
        day_id: 'd2',
        title: 'Untimed note two',
        type: 'note',
        created_at: '2026-03-28T00:02:00.000Z',
      }),
    ]

    const { orderedItems, sections } = transformItineraryDayActivities(activities)

    const orderedIds = orderedItems.map((item) => (item.kind === 'activity' ? item.activity.id : 'flight'))
    expect(orderedIds).toEqual(['b2', 'b1', 'b3'])

    expect(sections.find((section) => section.key === 'morning')?.items.length).toBe(1)
    expect(sections.find((section) => section.key === 'flexible')?.items.length).toBe(2)
  })
})
