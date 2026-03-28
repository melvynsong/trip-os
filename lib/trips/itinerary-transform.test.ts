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
    created_at: partial.created_at ?? '2026-01-01T00:00:00.000Z',
    places: partial.places ?? null,
  }
}

describe('transformItineraryDayActivities', () => {
  it('emits two separate flight_card items for departure and arrival, preserving chronological flow', () => {
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

    // Should emit: breakfast, flight departure, flight arrival, dinner
    expect(orderedItems).toHaveLength(4)
    expect(orderedItems[0]?.kind).toBe('activity')
    expect(orderedItems[1]?.kind).toBe('flight_card')
    expect(orderedItems[2]?.kind).toBe('flight_card')
    expect(orderedItems[3]?.kind).toBe('activity')

    // Check departure card
    if (orderedItems[1]?.kind === 'flight_card') {
      expect(orderedItems[1].activity.id).toBe('a2')
      expect(orderedItems[1].role).toBe('departure')
      expect(orderedItems[1].meta.flightNumber).toBe('SQ 321')
      expect(orderedItems[1].meta.route).toBe('SIN → NRT')
    }
    // Check arrival card
    if (orderedItems[2]?.kind === 'flight_card') {
      expect(orderedItems[2].activity.id).toBe('a3')
      expect(orderedItems[2].role).toBe('arrival')
      expect(orderedItems[2].meta.flightNumber).toBe('SQ 321')
      expect(orderedItems[2].meta.route).toBe('SIN → NRT')
    }

    expect(sections.map((section) => section.key)).toEqual(['morning', 'evening'])
    expect(sections.find((section) => section.key === 'morning')?.items.length).toBe(2)
    expect(sections.find((section) => section.key === 'evening')?.items.length).toBe(2)
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
