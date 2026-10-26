import {
  Ban, Car, Check, CheckCheck, Clock, Flag, Hourglass, MapPin, MessageCircle, Pencil, Share2, ShieldCheck, Star, UserCheck, X,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  completeRide, confirmRide, respondToOffer, respondToRequest, selectPickup, setHostIncluded, updateDraft, withdrawRequest,
} from '@/api'
import { PageHeader } from '@/components/PageHeader'
import { Avatar } from '@/components/brand'
import {
  CancelRideModal, RatingLine, ReportModal, RequestSeatModal, ReviewModal, SafetyChecklistModal, SettleModal,
} from '@/components/ride-modals'
import { FuelEstimateCard, PlateTag, RideFacts, RouteSummary, TimingBadge } from '@/components/rides'
import { Button } from '@/components/ui/Button'
import { Badge, Callout, EmptyState, SectionTitle, StatusPill, VerifiedBadge } from '@/components/ui/Display'
import { toast, useAction } from '@/components/ui/Toast'
import { INCIDENT_LABEL, PERSONALITY } from '@/lib/constants'
import { egp, estimateFuel } from '@/lib/fuel'
import { hubById } from '@/lib/geo'
import type { IncidentCategory, Ride, SeatRequest, User } from '@/lib/types'
import { cn, displayName, fmtDateTime, fmtTime, timeAgo } from '@/lib/utils'
import { useDB } from '@/store/db'
import { canUseRides, ratingFor, useConfig, useMe, useRide, useRideRequests, useUsersMap } from '@/store/selectors'

const LIFECYCLE: Ride['status'][] = ['pending', 'confirmed', 'active', 'completed']

export default function RideDetail() {
  const { id } = useParams()
  const ride = useRide(id)
  const me = useMe()!
  const users = useUsersMap()
  const config = useConfig()
  const requests = useRideRequests(id)
  const reviews = useDB((s) => s.reviews)

  const [modal, setModal] = useState<null | 'request' | 'checklist' | 'cancel' | 'report' | { settle: string } | { review: string }>(null)
  const [reportCat, setReportCat] = useState<IncidentCategory | undefined>()

  const respond = useAction(respondToRequest)
  const offerResp = useAction(respondToOffer)
  const withdraw = useAction(withdrawRequest, { success: 'Your seat was released' })
  const pickupAct = useAction(selectPickup)
  const confirm = useAction(confirmRide, { success: 'Ride confirmed — riders notified' })
  const complete = useAction(completeRide, { success: 'Ride completed. Time to settle up!' })
  const hostSplit = useAction(setHostIncluded)
  const publish = useAction(async (r: Ride) => updateDraft(r.id, {
    carId: r.carId, fromHubId: r.fromHubId, toHubId: r.toHubId, meetingNote: r.meetingNote, departAt: r.departAt, timing: r.timing,
    seats: r.seats, luggage: r.luggage, notes: r.notes, visibility: r.visibility, hostIncluded: r.hostIncluded,
  }, true), { success: 'Ride published' })

  const derived = useMemo(() => {
    if (!ride) return null
    const accepted = requests.filter((r) => r.status === 'accepted')
    const pending = requests.filter((r) => r.status === 'pending')
    const taken = accepted.reduce((n, r) => n + r.seats, 0)
    const mine = requests.filter((r) => r.passengerId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]
    return { accepted, pending, taken, free: Math.max(0, ride.seats - taken), mine }
  }, [ride, requests, me.id])

  if (!ride || !derived) {
    return <EmptyState icon={<Car className="size-6" />} title="Ride not found" body="It may have been deleted or the link is wrong." action={<Button to="/app">Back home</Button>} />
  }

  const host = users.get(ride.hostId)
  const car = host?.cars.find((c) => c.id === ride.carId)
  const isHost = ride.hostId === me.id
  const isRider = derived.accepted.some((r) => r.passengerId === me.id)
  const participants = [host, ...derived.accepted.map((r) => users.get(r.passengerId))].filter(Boolean) as User[]
  const pickup = ride.pickupOptions.find((p) => p.id === ride.pickupId) ?? null
  const est = car ? estimateFuel(config, { fromHubId: ride.fromHubId, toHubId: ride.toHubId, fuelType: car.fuelType, passengers: Math.max(1, derived.taken), hostIncluded: ride.hostIncluded }) : null
  const perSeat = est?.supported ? est.perPerson : null
  const hostRating = host ? ratingFor({ reviews }, host.id) : null
  const myReviewed = (toId: string) => reviews.some((r) => r.rideId === ride.id && r.fromId === me.id && r.toId === toId)
  const iConfirmedStart = ride.startConfirmations.includes(me.id)

  const share = async () => {
    const url = `${location.origin}/app/rides/${ride.id}`
    try {
      if (navigator.share) await navigator.share({ title: 'Twigg ride', url })
      else {
        await navigator.clipboard.writeText(url)
        toast('Ride link copied')
      }
    } catch { /* user dismissed share sheet */ }
  }

  const openReport = (cat?: IncidentCategory) => { setReportCat(cat); setModal('report') }

  return (
    <div>
      <PageHeader
        back
        eyebrow={`${fmtDateTime(ride.departAt)}`}
        title={<>{hubById(ride.fromHubId).name} <span className="text-clay">→</span> {hubById(ride.toHubId).name}</>}
        actions={<button onClick={share} aria-label="Share ride" className="flex size-10 items-center justify-center rounded-full border border-sand bg-paper text-forest hover:border-sand-deep"><Share2 className="size-4" /></button>}
      />

      <div className="-mt-3 mb-6 flex flex-wrap items-center gap-2">
        <StatusPill status={ride.status} />
        <TimingBadge timing={ride.timing} />
        {ride.visibility === 'private' && <Badge tone="sky">PRIVATE</Badge>}
        {isHost && <Badge tone="forest">YOU'RE HOSTING</Badge>}
        {isRider && <Badge tone="sprout">YOU'RE RIDING</Badge>}
      </div>

      {ride.status !== 'draft' && ride.status !== 'cancelled' && <Lifecycle status={ride.status} />}

      {ride.status === 'cancelled' && (
        <Callout tone="danger" icon={<Ban className="size-5" />} title="This ride was cancelled" className="mb-6">
          {ride.cancelReason ? `“${ride.cancelReason}”` : 'No reason given.'} {ride.cancelledAt && `· ${timeAgo(ride.cancelledAt)}`}
        </Callout>
      )}

      {/* ——— Action dock ——— */}
      <div className="mb-8 space-y-4">
        {isHost ? (
          <HostDock
            ride={ride}
            accepted={derived.accepted}
            pending={derived.pending}
            users={users}
            free={derived.free}
            onRespond={(rid, ok) => respond.run(rid, ok)}
            responding={respond.pending}
            onPickup={(pid) => pickupAct.run(ride.id, pid)}
            onConfirm={() => confirm.run(ride.id)}
            confirming={confirm.pending}
            onStart={() => setModal('checklist')}
            onComplete={() => complete.run(ride.id)}
            completing={complete.pending}
            onCancel={() => setModal('cancel')}
            onPublish={() => publish.run(ride)}
            publishing={publish.pending}
            iConfirmedStart={iConfirmedStart}
            pickupBusy={pickupAct.pending}
          />
        ) : (
          <RiderDock
            ride={ride}
            me={me}
            mine={derived.mine}
            free={derived.free}
            hostName={displayName(host)}
            perSeat={perSeat}
            pickupName={pickup?.name}
            iConfirmedStart={iConfirmedStart}
            onRequest={() => setModal('request')}
            onWithdraw={(rid) => withdraw.run(rid)}
            withdrawing={withdraw.pending}
            onOffer={(rid, ok) => offerResp.run(rid, ok)}
            offerBusy={offerResp.pending}
            onStart={() => setModal('checklist')}
            onComplete={() => complete.run(ride.id)}
            completing={complete.pending}
          />
        )}

        {(ride.status === 'confirmed' || ride.status === 'active') && (isHost || isRider) && (
          <StartConfirmations participants={participants} confirmed={ride.startConfirmations} status={ride.status} />
        )}

        {ride.status === 'completed' && (isHost || isRider) && (
          <SettlementPanel
            ride={ride}
            me={me}
            users={users}
            isHost={isHost}
            perSeat={perSeat}
            seatsOf={(pid) => derived.accepted.find((r) => r.passengerId === pid)?.seats ?? 1}
            onSettle={(pid) => setModal({ settle: pid })}
            onReview={(uid) => setModal({ review: uid })}
            reviewed={myReviewed}
          />
        )}
      </div>

      {/* ——— Host ——— */}
      {host && (
        <Link to={isHost ? '/app/profile' : `/app/users/${host.id}`} className="card mb-6 flex items-center gap-4 p-4 transition hover:border-sand-deep">
          <Avatar user={host} size="lg" verified={host.status === 'verified'} />
          <div className="min-w-0 flex-1">
            <p className="eyebrow">Host</p>
            <p className="flex items-center gap-1 text-[17px] font-bold">{displayName(host)} {host.status === 'verified' && <VerifiedBadge />}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              {hostRating && config.flags.publicReviewsAfterThreshold && (host.priorRides ?? 0) >= config.reviewDisplayThreshold && <RatingLine {...hostRating} />}
              {host.personality && host.privacy.showPersonality && (
                <span className="text-[12.5px] font-semibold text-ink-soft">{PERSONALITY[host.personality].emoji} {PERSONALITY[host.personality].label}</span>
              )}
            </div>
          </div>
          {car && <PlateTag plate={car.plate} className="hidden sm:inline-flex" />}
        </Link>
      )}

      <div className="space-y-6">
        <RouteSummary fromHubId={ride.fromHubId} toHubId={ride.toHubId} pickup={pickup} />

        {(ride.meetingNote || ride.notes) && (
          <div className="card space-y-3 p-5">
            {ride.meetingNote && (
              <p className="flex gap-2.5 text-[14px]"><MapPin className="mt-0.5 size-4 shrink-0 text-clay" /><span><b>Meeting note:</b> {ride.meetingNote}</span></p>
            )}
            {ride.notes && (
              <p className="flex gap-2.5 text-[14px]"><MessageCircle className="mt-0.5 size-4 shrink-0 text-moss" /><span>{ride.notes}</span></p>
            )}
          </div>
        )}

        <RideFacts ride={ride} car={car} free={derived.free} />

        <FuelEstimateCard
          config={config}
          car={car}
          passengers={Math.max(1, derived.taken)}
          ride={ride}
          editable={isHost && ['draft', 'pending', 'confirmed'].includes(ride.status)}
          onToggleHost={(v) => hostSplit.run(ride.id, v)}
        />

        {participants.length > 1 && (
          <section>
            <SectionTitle>Who's riding</SectionTitle>
            <div className="card divide-y divide-sand">
              {participants.map((p) => (
                <Link key={p.id} to={p.id === me.id ? '/app/profile' : `/app/users/${p.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-cream/50">
                  <Avatar user={p} size="sm" verified={p.status === 'verified'} />
                  <span className="flex-1 text-[14px] font-bold">{displayName(p)}{p.id === me.id && <span className="font-medium text-ink-soft"> (you)</span>}</span>
                  {p.id === ride.hostId ? <Badge tone="forest">HOST</Badge> : p.personality && p.privacy.showPersonality && <span className="text-[12px] text-ink-soft">{PERSONALITY[p.personality].emoji} {PERSONALITY[p.personality].short}</span>}
                </Link>
              ))}
            </div>
          </section>
        )}

        {!isHost && ride.status !== 'draft' && (
          <section>
            <SectionTitle>Something wrong?</SectionTitle>
            <div className="grid gap-2 sm:grid-cols-3">
              {(['unsafe_vehicle', 'ride_discomfort', 'behavior'] as const).map((c) => (
                <button key={c} onClick={() => openReport(c)} className="flex items-center gap-2 rounded-2xl border border-sand bg-paper px-3.5 py-3 text-left text-[13px] font-bold text-ink transition hover:border-clay hover:text-clay">
                  <Flag className="size-4 shrink-0" /> {INCIDENT_LABEL[c].label}
                </button>
              ))}
            </div>
          </section>
        )}
        {isHost && ride.status !== 'draft' && (
          <button onClick={() => openReport()} className="flex items-center gap-2 text-[13px] font-bold text-ink-soft hover:text-clay">
            <Flag className="size-4" /> Report a problem with a rider
          </button>
        )}
      </div>

      {/* ——— Modals ——— */}
      <RequestSeatModal open={modal === 'request'} onClose={() => setModal(null)} rideId={ride.id} maxSeats={derived.free} perSeat={perSeat}
        hostName={displayName(host)} isPrivate={ride.visibility === 'private'} />
      <SafetyChecklistModal open={modal === 'checklist'} onClose={() => setModal(null)} rideId={ride.id} />
      <CancelRideModal open={modal === 'cancel'} onClose={() => setModal(null)} rideId={ride.id} />
      <ReportModal open={modal === 'report'} onClose={() => setModal(null)} rideId={ride.id} initialCategory={reportCat}
        aboutUserId={isHost ? undefined : ride.hostId} people={participants.filter((p) => p.id !== me.id)} />
      <SettleModal
        open={typeof modal === 'object' && !!modal && 'settle' in modal}
        onClose={() => setModal(null)}
        rideId={ride.id}
        passenger={typeof modal === 'object' && modal && 'settle' in modal ? users.get(modal.settle) : undefined}
        suggested={perSeat !== null && typeof modal === 'object' && modal && 'settle' in modal
          ? perSeat * (derived.accepted.find((r) => r.passengerId === modal.settle)?.seats ?? 1) : null}
        isHost={isHost}
      />
      <ReviewModal
        open={typeof modal === 'object' && !!modal && 'review' in modal}
        onClose={() => setModal(null)}
        rideId={ride.id}
        about={typeof modal === 'object' && modal && 'review' in modal ? users.get(modal.review) : undefined}
      />
    </div>
  )
}

function Lifecycle({ status }: { status: Ride['status'] }) {
  const idx = LIFECYCLE.indexOf(status)
  return (
    <div className="mb-6 flex items-center">
      {LIFECYCLE.map((s, i) => (
        <div key={s} className={cn('flex items-center', i < LIFECYCLE.length - 1 && 'flex-1')}>
          <div className="flex flex-col items-center gap-1.5">
            <span className={cn('flex size-7 items-center justify-center rounded-full border-2 transition',
              i < idx ? 'border-forest bg-forest text-sprout' : i === idx ? 'border-clay bg-clay text-white ring-4 ring-clay/20' : 'border-sand-deep bg-paper')}>
              {i < idx ? <Check className="size-3.5" strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-current" />}
            </span>
            <span className={cn('text-[11px] font-bold capitalize', i <= idx ? 'text-forest' : 'text-ink-faint')}>{s}</span>
          </div>
          {i < LIFECYCLE.length - 1 && <span className={cn('mx-1 mb-5 h-[3px] flex-1 rounded-full', i < idx ? 'bg-forest' : 'bg-sand')} />}
        </div>
      ))}
    </div>
  )
}

function DockCard({ tone = 'paper', children }: { tone?: 'paper' | 'forest' | 'sprout' | 'amber'; children: ReactNode }) {
  const tones = {
    paper: 'card',
    forest: 'rounded-[var(--radius-xl2)] bg-forest text-cream shadow-[var(--shadow-lift)]',
    sprout: 'rounded-[var(--radius-xl2)] bg-sprout-soft border border-sprout',
    amber: 'rounded-[var(--radius-xl2)] bg-amber-soft',
  }
  return <div className={cn('p-5 animate-rise', tones[tone])}>{children}</div>
}

function HostDock(p: {
  ride: Ride
  accepted: SeatRequest[]
  pending: SeatRequest[]
  users: Map<string, User>
  free: number
  onRespond: (id: string, ok: boolean) => void
  responding: boolean
  onPickup: (id: string) => void
  pickupBusy: boolean
  onConfirm: () => void
  confirming: boolean
  onStart: () => void
  onComplete: () => void
  completing: boolean
  onCancel: () => void
  onPublish: () => void
  publishing: boolean
  iConfirmedStart: boolean
}) {
  const { ride } = p
  if (ride.status === 'draft') {
    return (
      <DockCard tone="amber">
        <p className="font-display text-lg font-bold text-[#6d4a0c]">This ride is a draft</p>
        <p className="mt-1 text-[13.5px] text-[#6d4a0c]/80">Only you can see it. Publish to start receiving requests.</p>
        <div className="mt-4 flex gap-2.5">
          <Button variant="paper" to={`/app/rides/${ride.id}/edit`} icon={<Pencil className="size-4" />}>Edit</Button>
          <Button variant="accent" className="flex-1" loading={p.publishing} onClick={p.onPublish}>Publish ride</Button>
        </div>
      </DockCard>
    )
  }

  return (
    <>
      {['pending', 'confirmed'].includes(ride.status) && (
        <section>
          <SectionTitle action={<span className="text-[12.5px] font-semibold text-ink-soft">{p.free} seat{p.free === 1 ? '' : 's'} free</span>}>
            Seat requests {p.pending.length > 0 && <Badge tone="clay" className="ml-1 align-middle">{p.pending.length} NEW</Badge>}
          </SectionTitle>
          {p.pending.length === 0 && p.accepted.length === 0 ? (
            <EmptyState icon={<Hourglass className="size-6" />} title="No requests yet" body={ride.visibility === 'private' ? 'Share your ride link with people you\'d like to ride with.' : 'Your ride is live in the feed. Requests will appear here.'} />
          ) : (
            <div className="card divide-y divide-sand">
              {[...p.pending, ...p.accepted].map((r) => {
                const u = p.users.get(r.passengerId)
                return (
                  <div key={r.id} className="flex items-start gap-3 p-4">
                    <Link to={`/app/users/${r.passengerId}`}><Avatar user={u} size="md" verified={u?.status === 'verified'} /></Link>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14.5px] font-bold">{displayName(u)} <span className="font-medium text-ink-soft">· {r.seats} seat{r.seats > 1 ? 's' : ''}</span></p>
                      <p className="text-[12px] text-ink-faint">{r.source === 'offer' ? 'You offered this seat' : 'Requested'} {timeAgo(r.createdAt)}</p>
                      {r.message && <p className="mt-1.5 rounded-xl bg-cream px-3 py-2 text-[13px] text-ink-soft">“{r.message}”</p>}
                    </div>
                    {r.status === 'pending' && r.source === 'request' ? (
                      <div className="flex shrink-0 gap-1.5">
                        <button aria-label="Decline" disabled={p.responding} onClick={() => p.onRespond(r.id, false)}
                          className="flex size-10 items-center justify-center rounded-full border border-sand bg-paper text-danger transition hover:bg-danger-soft"><X className="size-4" /></button>
                        <button aria-label="Accept" disabled={p.responding || r.seats > p.free} onClick={() => p.onRespond(r.id, true)}
                          className="flex size-10 items-center justify-center rounded-full bg-forest text-sprout transition hover:bg-forest-soft disabled:opacity-40"><Check className="size-4" strokeWidth={3} /></button>
                      </div>
                    ) : r.status === 'pending' ? <Badge tone="amber">AWAITING REPLY</Badge> : <Badge tone="sprout"><UserCheck className="size-3" /> ACCEPTED</Badge>}
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {['pending', 'confirmed'].includes(ride.status) && p.accepted.length > 0 && (
        <section>
          <SectionTitle>{ride.status === 'pending' ? 'Choose the pickup point' : 'Pickup point'}</SectionTitle>
          <p className="-mt-1.5 mb-3 text-[13px] text-ink-soft">Suggested by how close each spot sits to your route. You choose the final one.</p>
          <div className="space-y-2">
            {ride.pickupOptions.map((opt, i) => (
              <button key={opt.id} disabled={p.pickupBusy} onClick={() => p.onPickup(opt.id)}
                className={cn('flex w-full items-center gap-3 rounded-2xl border-[1.5px] p-3.5 text-left transition',
                  ride.pickupId === opt.id ? 'border-forest bg-sprout-soft/60' : 'border-sand bg-paper hover:border-sand-deep')}>
                <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full font-display text-sm font-bold',
                  ride.pickupId === opt.id ? 'bg-forest text-sprout' : 'bg-sand/70 text-ink-soft')}>{i + 1}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-bold">{opt.name}</span>
                  <span className="block text-[12px] text-ink-soft">{opt.offRouteKm} km off route · +{opt.detourMin} min detour</span>
                </span>
                {i === 0 && <Badge tone="sprout">BEST FIT</Badge>}
              </button>
            ))}
          </div>
        </section>
      )}

      {ride.status === 'pending' && (
        <DockCard tone="forest">
          <p className="font-display text-lg font-bold">Ready to lock it in?</p>
          <p className="mt-1 text-[13px] text-cream/70">
            {p.accepted.length === 0 ? 'Accept at least one rider first.' : !ride.pickupId ? 'Choose a pickup point above.' : 'Riders will get the pickup point and time.'}
          </p>
          <div className="mt-4 flex gap-2.5">
            <Button variant="ghost" className="text-cream hover:bg-cream/10" onClick={p.onCancel}>Cancel ride</Button>
            <Button variant="sprout" className="flex-1" disabled={!p.accepted.length || !ride.pickupId} loading={p.confirming} onClick={p.onConfirm}>Confirm ride</Button>
          </div>
        </DockCard>
      )}

      {ride.status === 'confirmed' && (
        <DockCard tone="forest">
          <p className="font-display text-lg font-bold">{p.iConfirmedStart ? 'Waiting for riders to confirm…' : `Departure at ${fmtTime(ride.departAt)}`}</p>
          <p className="mt-1 text-[13px] text-cream/70">Everyone confirms “Start ride” after the safety checklist. The ride goes active once all confirm.</p>
          <div className="mt-4 flex gap-2.5">
            <Button variant="ghost" className="text-cream hover:bg-cream/10" onClick={p.onCancel}>Cancel</Button>
            <Button variant="accent" className="flex-1" disabled={p.iConfirmedStart} onClick={p.onStart} icon={<ShieldCheck className="size-4" />}>
              {p.iConfirmedStart ? 'You confirmed' : 'Start ride'}
            </Button>
          </div>
        </DockCard>
      )}

      {ride.status === 'active' && <ActiveDock onComplete={p.onComplete} completing={p.completing} />}
    </>
  )
}

function ActiveDock({ onComplete, completing }: { onComplete: () => void; completing: boolean }) {
  return (
    <DockCard tone="forest">
      <div className="flex items-center gap-3">
        <span className="relative flex size-3"><span className="absolute inline-flex size-full animate-ping rounded-full bg-clay opacity-75" /><span className="relative inline-flex size-3 rounded-full bg-clay" /></span>
        <p className="font-display text-lg font-bold">Ride in progress</p>
      </div>
      <p className="mt-1 text-[13px] text-cream/70">Seatbelts on. Twigg doesn't track you in the background — if anything feels wrong, call support.</p>
      <Button className="mt-4" variant="sprout" block loading={completing} onClick={onComplete} icon={<CheckCheck className="size-4" />}>We've arrived — end ride</Button>
    </DockCard>
  )
}

function RiderDock(p: {
  ride: Ride
  me: User
  mine?: SeatRequest
  free: number
  hostName: string
  perSeat: number | null
  pickupName?: string
  iConfirmedStart: boolean
  onRequest: () => void
  onWithdraw: (id: string) => void
  withdrawing: boolean
  onOffer: (id: string, ok: boolean) => void
  offerBusy: boolean
  onStart: () => void
  onComplete: () => void
  completing: boolean
}) {
  const { ride, mine } = p
  const open = ['pending', 'confirmed'].includes(ride.status)
  const departed = new Date(ride.departAt).getTime() < Date.now() - 30 * 60_000

  if (mine?.status === 'accepted') {
    if (ride.status === 'pending') {
      return (
        <DockCard tone="sprout">
          <p className="flex items-center gap-2 font-display text-lg font-bold text-forest"><UserCheck className="size-5" /> You're in!</p>
          <p className="mt-1 text-[13.5px] text-forest/75">{p.hostName} accepted your request and will confirm the pickup point soon.</p>
          <Button className="mt-4" size="sm" variant="ghost" loading={p.withdrawing} onClick={() => p.onWithdraw(mine.id)}>Cancel my seat</Button>
        </DockCard>
      )
    }
    if (ride.status === 'confirmed') {
      return (
        <DockCard tone="forest">
          <p className="font-mono text-[11px] tracking-[0.14em] text-sprout uppercase">Confirmed · {fmtTime(ride.departAt)}</p>
          <p className="mt-2 flex items-start gap-2 font-display text-xl leading-tight font-bold"><MapPin className="mt-1 size-5 shrink-0 text-sprout" />{p.pickupName}</p>
          {ride.meetingNote && <p className="mt-1 pl-7 text-[13px] text-cream/70">“{ride.meetingNote}”</p>}
          <div className="mt-5 flex gap-2.5">
            <Button variant="ghost" className="text-cream hover:bg-cream/10" loading={p.withdrawing} onClick={() => p.onWithdraw(mine.id)}>Cancel seat</Button>
            <Button variant="accent" className="flex-1" disabled={p.iConfirmedStart} onClick={p.onStart} icon={<ShieldCheck className="size-4" />}>
              {p.iConfirmedStart ? 'Waiting for others…' : 'Start ride'}
            </Button>
          </div>
        </DockCard>
      )
    }
    if (ride.status === 'active') return <ActiveDock onComplete={p.onComplete} completing={p.completing} />
    return null
  }

  if (mine?.status === 'pending' && mine.source === 'offer') {
    return (
      <DockCard tone="sprout">
        <p className="font-display text-lg font-bold text-forest">{p.hostName} offered you a seat</p>
        <p className="mt-1 text-[13.5px] text-forest/75">This ride matches your trip request. Accept to join.</p>
        <div className="mt-4 flex gap-2.5">
          <Button variant="paper" loading={p.offerBusy} onClick={() => p.onOffer(mine.id, false)}>Decline</Button>
          <Button className="flex-1" loading={p.offerBusy} onClick={() => p.onOffer(mine.id, true)}>Accept seat</Button>
        </div>
      </DockCard>
    )
  }

  if (mine?.status === 'pending') {
    return (
      <DockCard tone="amber">
        <p className="flex items-center gap-2 font-display text-lg font-bold text-[#6d4a0c]"><Hourglass className="size-5" /> Request sent</p>
        <p className="mt-1 text-[13.5px] text-[#6d4a0c]/80">Waiting for {p.hostName} to respond. We'll notify you.</p>
        <Button className="mt-4" size="sm" variant="paper" loading={p.withdrawing} onClick={() => p.onWithdraw(mine.id)}>Withdraw request</Button>
      </DockCard>
    )
  }

  if (!open || departed) return null

  if (!canUseRides(p.me)) {
    return (
      <DockCard tone="amber">
        <p className="flex items-center gap-2 font-display text-lg font-bold text-[#6d4a0c]"><Hourglass className="size-5" /> Joining unlocks after verification</p>
        <p className="mt-1 text-[13.5px] text-[#6d4a0c]/80">An admin is reviewing your profile. Meanwhile, finish your social bio so hosts know your vibe.</p>
        <div className="mt-4 flex gap-2.5">
          <Button disabled className="flex-1">Request a seat</Button>
          <Button variant="paper" to="/app/waiting-room">Finish bio</Button>
        </div>
      </DockCard>
    )
  }

  return (
    <DockCard>
      <div className="flex items-center justify-between gap-4">
        <div>
          {p.perSeat !== null ? (
            <>
              <p className="font-display text-[28px] leading-none font-bold text-forest">≈ {egp(p.perSeat)}</p>
              <p className="mt-1 text-[12.5px] text-ink-soft">Estimated fuel share · settle offline</p>
            </>
          ) : <p className="text-[14px] font-semibold text-ink-soft">Fuel share agreed with host</p>}
        </div>
        <Button variant="accent" size="lg" disabled={p.free === 0} onClick={p.onRequest}>
          {p.free === 0 ? 'Ride full' : 'Request seat'}
        </Button>
      </div>
      {(mine?.status === 'rejected' || mine?.status === 'withdrawn') && (
        <p className="mt-3 text-[12.5px] text-ink-soft">Your previous request was {mine.status === 'rejected' ? 'declined' : 'withdrawn'}. You can request again.</p>
      )}
    </DockCard>
  )
}

function StartConfirmations({ participants, confirmed, status }: { participants: User[]; confirmed: string[]; status: Ride['status'] }) {
  return (
    <div className="card p-4">
      <p className="eyebrow mb-3">{status === 'active' ? 'Everyone confirmed' : `Start confirmations · ${confirmed.length}/${participants.length}`}</p>
      <div className="flex flex-wrap gap-3">
        {participants.map((u) => {
          const ok = confirmed.includes(u.id)
          return (
            <span key={u.id} className="flex items-center gap-2">
              <span className="relative">
                <Avatar user={u} size="sm" className={cn(!ok && 'opacity-50 grayscale')} />
                <span className={cn('absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full ring-2 ring-paper', ok ? 'bg-forest text-sprout' : 'bg-sand text-ink-faint')}>
                  {ok ? <Check className="size-2.5" strokeWidth={4} /> : <Clock className="size-2.5" />}
                </span>
              </span>
              <span className="text-[12.5px] font-semibold">{u.firstName}</span>
            </span>
          )
        })}
      </div>
    </div>
  )
}

function SettlementPanel({ ride, me, users, isHost, perSeat, seatsOf, onSettle, onReview, reviewed }: {
  ride: Ride
  me: User
  users: Map<string, User>
  isHost: boolean
  perSeat: number | null
  seatsOf: (pid: string) => number
  onSettle: (pid: string) => void
  onReview: (uid: string) => void
  reviewed: (uid: string) => boolean
}) {
  const rows = isHost ? ride.settlements : ride.settlements.filter((s) => s.passengerId === me.id)
  const reviewTargets = isHost ? ride.settlements.map((s) => s.passengerId) : [ride.hostId]
  return (
    <>
      <section>
        <SectionTitle>Fuel settlement</SectionTitle>
        <div className="card divide-y divide-sand">
          {rows.map((s) => {
            const u = users.get(s.passengerId)
            const owed = perSeat !== null ? perSeat * seatsOf(s.passengerId) : null
            return (
              <div key={s.passengerId} className="flex items-center gap-3 p-4">
                <Avatar user={u} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-bold">{isHost ? displayName(u) : 'Your share'}{owed !== null && <span className="font-medium text-ink-soft"> · ≈ {egp(owed)}</span>}</p>
                  {s.status === 'settled' ? (
                    <p className="text-[12px] text-ink-soft">
                      {s.method ? `${s.method[0].toUpperCase()}${s.method.slice(1)}` : 'Settled'}{s.amount ? ` · EGP ${s.amount}` : ''}{s.note ? ` · ${s.note}` : ''}
                      {s.settledAt && ` · ${timeAgo(s.settledAt)}`}
                    </p>
                  ) : <p className="text-[12px] text-ink-soft">Settle offline, then mark it here.</p>}
                </div>
                {s.status === 'settled'
                  ? <Badge tone="sprout"><Check className="size-3" strokeWidth={3} /> SETTLED</Badge>
                  : <Button size="sm" onClick={() => onSettle(s.passengerId)}>Mark as settled</Button>}
              </div>
            )
          })}
        </div>
        <p className="mt-2 text-[12px] font-semibold text-[#6d4a0c]">Estimate only. Twigg does not process payments. Settle offline.</p>
      </section>

      <section>
        <SectionTitle>Reviews</SectionTitle>
        <div className="flex flex-wrap gap-2.5">
          {reviewTargets.map((uid) => {
            const u = users.get(uid)
            const done = reviewed(uid)
            return (
              <button key={uid} disabled={done} onClick={() => onReview(uid)}
                className="flex items-center gap-2.5 rounded-full border border-sand bg-paper py-1.5 pr-4 pl-1.5 text-[13px] font-bold transition hover:border-clay disabled:opacity-60">
                <Avatar user={u} size="xs" />
                {done ? <>Reviewed <Check className="size-3.5 text-moss" /></> : <>Rate {u?.firstName} <Star className="size-3.5 text-clay" /></>}
              </button>
            )
          })}
        </div>
      </section>
    </>
  )
}
