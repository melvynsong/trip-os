import ClickableCard from '@/app/components/ui/ClickableCard'

type Trip = {
  id: string
  title: string
  destination: string
  start_date: string
  end_date: string
}

type TripCardProps = {
  trip: Trip
}

export default function TripCard({ trip }: TripCardProps) {
  return (
    <ClickableCard href={`/trips/${trip.id}`} className="p-5">
      <div className="mb-2 text-xl font-semibold">{trip.title}</div>
      <div className="text-sm text-gray-600">{trip.destination}</div>
      <div className="mt-3 text-sm text-gray-500">
        {trip.start_date} → {trip.end_date}
      </div>
    </ClickableCard>
  )
}
