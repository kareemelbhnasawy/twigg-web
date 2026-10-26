import { Check, Clock, Copy, Link2, Lock, MapPin, Search, Sparkles, X } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { closeTripRequest, respondToOffer } from '@/api'
import { OfferModal } from '@/components/OfferModal'
import { PageHeader } from '@/components/PageHeader'
import { Avatar } from '@/components/brand'
import { RouteSummary, TimingBadge } from '@/components/rides'
import { Button } from '@/components/ui/Button'
import { Badge, Callout, EmptyState, SectionTitle, VerifiedBadge } from '@/components/ui/Display'
import { toast, useAction } from '@/components/ui/Toast'
import { hubById } from '@/lib/geo'
import { displayName, fmtDateTime, fmtDay, timeAgo } from '@/lib/utils'
import { useDB } from '@/store/db'
import { canHost, useMe, useUsersMap } from '@/store/selectors'

export function ShareLinkResolver() {
  const { token } = useParams()
  const trips = useDB((s) => s.tripRequests)
  const trip = trips.find((t) => t.shareToken === token)
  if (!trip) return <Navigate to="/app" replace />
  return <Navigate to={`/app/requests/${trip.id}`} replace />
}

const STATUS_TONE = { open: 'amber', matched: 'sprout', closed: 'muted' } as const

export default function TripRequestDetail() {
  const { id } = useParams()
  const me = useMe()!
  const users = useUsersMap()
  const trips = useDB((s) => s.tripRequests)
  const rides = useDB((s) => s.rides)
  const seatRequests = useDB((s) => s.seatRequests)
  const trip = trips.find((t) => t.id === id)
  const [offerOpen, setOfferOpen] = useState(false)

  const respond = useAction(respondToOffer)
  const close = useAction(closeTripRequest, { success: 'Request closed' })

  const linked = useMemo(() => seatRequests
    .filter((r) => r.tripRequestId === id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [seatRequests, id])

  if (!trip) return <EmptyState icon={<Search className="size-6" />} title="Request not found" action={<Button to="/app">Back home</Button>} />

  const owner = users.get(trip.passengerId)
  const isOwner = trip.passengerId === me.id
  const shareUrl = `${location.origin}/r/${trip.shareToken}`

  return (
    <div>
      <PageHeader
        back
        eyebrow={`Trip request · ${fmtDay(new Date(`${trip.date}T${trip.windowStart}`).toISOString())}`}
        title={<>{hubById(trip.fromHubId).name} <span className="text-clay">→</span> {hubById(trip.toHubId).name}</>}
      />
      <div className="-mt-3 mb-6 flex flex-wrap gap-2">
        <Badge tone={STATUS_TONE[trip.status]} dot>{trip.status.toUpperCase()}</Badge>
        <TimingBadge timing={trip.timing} />
        {trip.visibility === 'private' && <Badge tone="sky"><Lock className="size-3" strokeWidth={3} /> PRIVATE</Badge>}
      </div>

      <div className="card mb-6 p-5">
        <div className="flex items-center gap-3">
          <Avatar user={owner} size="md" verified={owner?.status === 'verified'} />
          <div>
            <p className="flex items-center gap-1 font-bold">{isOwner ? 'Your request' : displayName(owner)} {!isOwner && owner?.status === 'verified' && <VerifiedBadge />}</p>
            <p className="text-[12.5px] text-ink-soft">Posted {timeAgo(trip.createdAt)}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Fact icon={<Clock className="size-4" />} label="Window" value={`${trip.windowStart} – ${trip.windowEnd}`} />
          <Fact icon={<Check className="size-4" />} label="Seats" value={`${trip.seats}`} />
          <Fact icon={<MapPin className="size-4" />} label="Meeting note" value={trip.meetingNote || '—'} />
        </div>
        {trip.preferences.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">{trip.preferences.map((p) => <Badge key={p}>{p}</Badge>)}</div>
        )}
        {trip.notes && <p className="mt-4 rounded-xl bg-cream px-3.5 py-2.5 text-[13.5px] text-ink-soft">“{trip.notes}”</p>}
      </div>

      <div className="mb-6"><RouteSummary fromHubId={trip.fromHubId} toHubId={trip.toHubId} /></div>

      {isOwner ? (
        <>
          <section className="mb-6">
            <SectionTitle>Share link</SectionTitle>
            <div className="flex items-center gap-2 rounded-2xl border border-sand bg-paper p-2 pl-4">
              <Link2 className="size-4 shrink-0 text-ink-faint" />
              <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-ink-soft">{shareUrl}</span>
              <Button size="sm" variant="sprout" icon={<Copy className="size-3.5" />}
                onClick={() => navigator.clipboard.writeText(shareUrl).then(() => toast('Link copied'), () => toast('Copy failed', 'error'))}>Copy</Button>
            </div>
            <p className="mt-2 text-[12.5px] text-ink-soft">
              {trip.visibility === 'private' ? 'This request is private — only people with the link (and a targeted host) can see it.' : 'Your request is also listed in the hosts\' feed.'}
            </p>
          </section>

          <section className="mb-6">
            <SectionTitle>Offers & requests</SectionTitle>
            {linked.length === 0 ? (
              <EmptyState icon={<Sparkles className="size-6" />} title="No offers yet" body="Hosts heading your way will offer seats here. We'll notify you." />
            ) : (
              <div className="space-y-3">
                {linked.map((r) => {
                  const ride = rides.find((x) => x.id === r.rideId)
                  const host = ride ? users.get(ride.hostId) : undefined
                  if (!ride) return null
                  return (
                    <div key={r.id} className="card p-4">
                      <Link to={`/app/rides/${ride.id}`} className="flex items-center gap-3">
                        <Avatar user={host} size="md" verified />
                        <div className="min-w-0 flex-1">
                          <p className="font-bold">{displayName(host)}</p>
                          <p className="truncate text-[12.5px] text-ink-soft">{hubById(ride.fromHubId).name} → {hubById(ride.toHubId).name} · {fmtDateTime(ride.departAt)}</p>
                        </div>
                        <Badge tone={r.status === 'accepted' ? 'sprout' : r.status === 'pending' ? 'amber' : 'muted'}>
                          {r.source === 'offer' ? (r.status === 'pending' ? 'NEW OFFER' : r.status.toUpperCase()) : `REQUEST ${r.status.toUpperCase()}`}
                        </Badge>
                      </Link>
                      {r.source === 'offer' && r.status === 'pending' && (
                        <div className="mt-4 flex gap-2.5">
                          <Button variant="paper" size="sm" icon={<X className="size-4" />} loading={respond.pending} onClick={() => respond.run(r.id, false)}>Decline</Button>
                          <Button size="sm" className="flex-1" icon={<Check className="size-4" />} loading={respond.pending} onClick={() => respond.run(r.id, true)}>Accept seat</Button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </section>

          {trip.status !== 'closed' && (
            <Button variant="ghost" className="text-danger" loading={close.pending} onClick={() => close.run(trip.id)}>Close this request</Button>
          )}
        </>
      ) : (
        <>
          {canHost(me) ? (
            <Button variant="accent" size="lg" block icon={<Sparkles className="size-5" />} disabled={trip.status !== 'open'} onClick={() => setOfferOpen(true)}>
              Offer a seat
            </Button>
          ) : (
            <Callout tone="muted">Only verified Carpoolers can offer seats on trip requests.</Callout>
          )}
          <OfferModal trip={offerOpen ? trip : null} onClose={() => setOfferOpen(false)} />
        </>
      )}
    </div>
  )
}

function Fact({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-cream px-3.5 py-3">
      <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-faint">{icon}{label}</p>
      <p className="mt-1 text-[13.5px] font-bold">{value}</p>
    </div>
  )
}
