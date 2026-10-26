import { CarFront } from 'lucide-react'
import { useMemo } from 'react'
import { offerRide } from '@/api'
import { Button } from '@/components/ui/Button'
import { Badge, EmptyState } from '@/components/ui/Display'
import { Modal } from '@/components/ui/Overlay'
import { useAction } from '@/components/ui/Toast'
import { hubById } from '@/lib/geo'
import type { TripRequest } from '@/lib/types'
import { fmtDateTime } from '@/lib/utils'
import { useDB } from '@/store/db'
import { seatsTaken, useMe } from '@/store/selectors'

// Host picks one of their upcoming rides to offer to a passenger's trip request.
export function OfferModal({ trip, onClose }: { trip: TripRequest | null; onClose: () => void }) {
  const me = useMe()!
  const rides = useDB((s) => s.rides)
  const seatRequests = useDB((s) => s.seatRequests)
  const offer = useAction(offerRide, { success: 'Offer sent — we\'ll let you know when they reply', onSuccess: onClose })
  const mine = useMemo(() => rides.filter((r) =>
    r.hostId === me.id && ['pending', 'confirmed'].includes(r.status) && new Date(r.departAt).getTime() > Date.now()), [rides, me.id])

  const prefill = trip ? `/app/rides/new?from=${trip.fromHubId}&to=${trip.toHubId}&date=${trip.date}&time=${trip.windowStart}` : ''

  return (
    <Modal open={!!trip} onClose={onClose} title="Offer a seat"
      subtitle={trip ? `${hubById(trip.fromHubId).name} → ${hubById(trip.toHubId).name}, ${trip.windowStart}–${trip.windowEnd}` : undefined}>
      {trip && (mine.length === 0 ? (
        <EmptyState icon={<CarFront className="size-6" />} title="No upcoming rides" body="Create a ride for this route and we'll prefill the details." action={<Button to={prefill}>Create matching ride</Button>} />
      ) : (
        <div className="space-y-2.5">
          <p className="text-[13px] text-ink-soft">Choose which of your rides to offer:</p>
          {mine.map((r) => {
            const free = r.seats - seatsTaken({ seatRequests }, r.id)
            const routeMatch = r.fromHubId === trip.fromHubId && r.toHubId === trip.toHubId
            return (
              <button key={r.id} disabled={free < trip.seats || offer.pending} onClick={() => offer.run(trip.id, r.id)}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border-[1.5px] border-sand bg-paper p-4 text-left transition hover:border-forest disabled:opacity-40">
                <span>
                  <span className="block text-[14px] font-bold">{hubById(r.fromHubId).name} → {hubById(r.toHubId).name}</span>
                  <span className="block text-[12.5px] text-ink-soft">{fmtDateTime(r.departAt)} · {free} free</span>
                </span>
                {routeMatch ? <Badge tone="sprout">Same route</Badge> : <Badge>Different route</Badge>}
              </button>
            )
          })}
          <Button variant="ghost" block to={prefill} className="mt-2">Or create a new matching ride</Button>
        </div>
      ))}
    </Modal>
  )
}
