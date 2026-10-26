import type { ReactNode } from 'react'
import { ArrowRight, Clock, Fuel, Info, Lock, Luggage, MapPin, Navigation, Route as RouteIcon, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Avatar, TwigLine } from '@/components/brand'
import { Badge, StatusPill, VerifiedBadge } from '@/components/ui/Display'
import { Select, Toggle } from '@/components/ui/Form'
import { LUGGAGE_LABEL, PERSONALITY } from '@/lib/constants'
import { egp, estimateFuel, FUEL_LABEL } from '@/lib/fuel'
import { HUBS, hubById, routeDistanceKm, routeDurationMin, viaRoad } from '@/lib/geo'
import type { AppConfig, Car, PickupPoint, Ride, TripRequest, User } from '@/lib/types'
import { cn, displayName, fmtDay, fmtTime } from '@/lib/utils'

export function HubSelect({ value, onChange, placeholder, id, exclude }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  id?: string
  exclude?: string
}) {
  return (
    <Select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder}</option>
      {(['West', 'Central', 'East'] as const).map((area) => (
        <optgroup key={area} label={`${area} Cairo`}>
          {HUBS.filter((h) => h.area === area).map((h) => (
            <option key={h.id} value={h.id} disabled={h.id === exclude}>{h.name}</option>
          ))}
        </optgroup>
      ))}
    </Select>
  )
}

export function TimingBadge({ timing }: { timing: Ride['timing'] }) {
  return timing === 'sharp'
    ? <Badge tone="clay"><Clock className="size-3" strokeWidth={3} /> SHARP</Badge>
    : <Badge tone="sprout">± FLEXIBLE</Badge>
}

function SeatDots({ total, taken }: { total: number; taken: number }) {
  return (
    <span className="flex items-center gap-1" aria-label={`${total - taken} of ${total} seats free`}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={cn('h-2.5 w-4 rounded-full', i < taken ? 'bg-sand-deep' : 'bg-sprout ring-1 ring-forest/25')} />
      ))}
    </span>
  )
}

export function RideCard({ ride, host, car, taken, config, showStatus, highlight, className }: {
  ride: Ride
  host?: User
  car?: Car
  taken: number
  config: AppConfig
  showStatus?: boolean
  highlight?: ReactNode
  className?: string
}) {
  const from = hubById(ride.fromHubId)
  const to = hubById(ride.toHubId)
  const free = Math.max(0, ride.seats - taken)
  const est = car ? estimateFuel(config, { fromHubId: ride.fromHubId, toHubId: ride.toHubId, fuelType: car.fuelType, passengers: ride.seats, hostIncluded: ride.hostIncluded }) : null
  const personality = host?.personality && host.privacy.showPersonality ? PERSONALITY[host.personality] : null

  return (
    <Link
      to={`/app/rides/${ride.id}`}
      className={cn('card group block p-4 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)] sm:p-5', className)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[28px] leading-none font-bold tracking-tight text-forest tabular-nums">{fmtTime(ride.departAt)}</span>
          <span className="text-[13px] font-semibold text-ink-soft">{fmtDay(ride.departAt)}</span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          {ride.visibility === 'private' && <Badge tone="sky"><Lock className="size-3" strokeWidth={3} /> PRIVATE</Badge>}
          {showStatus ? <StatusPill status={ride.status} /> : <TimingBadge timing={ride.timing} />}
        </div>
      </div>

      <div className="mt-3 flex gap-3">
        <TwigLine />
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="truncate text-[15px] font-bold text-ink">{from.name}</p>
            {ride.meetingNote && <p className="truncate text-[12.5px] text-ink-soft">“{ride.meetingNote}”</p>}
          </div>
          <p className="truncate text-[15px] font-bold text-ink">{to.name}</p>
        </div>
      </div>

      {highlight && <div className="mt-3">{highlight}</div>}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-dashed border-sand pt-3.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar user={host} size="sm" />
          <div className="min-w-0">
            <p className="flex items-center gap-1 truncate text-[13.5px] font-bold text-ink">
              {displayName(host)} {host?.status === 'verified' && <VerifiedBadge />}
            </p>
            <p className="truncate text-[12px] text-ink-soft">
              {personality ? `${personality.emoji} ${personality.short}` : 'Host'}
              {car && ` · ${car.make} ${car.model}`}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <SeatDots total={ride.seats} taken={Math.min(taken, ride.seats)} />
          <span className="text-[12px] font-semibold text-ink-soft">
            {free === 0 ? 'Full' : `${free} seat${free > 1 ? 's' : ''} left`}
            {est?.supported && <span className="text-moss"> · ≈{egp(est.perPerson)}</span>}
          </span>
        </div>
      </div>
    </Link>
  )
}

export function TripRequestCard({ trip, passenger, action, className, to }: {
  trip: TripRequest
  passenger?: User
  action?: ReactNode
  className?: string
  to?: string
}) {
  const from = hubById(trip.fromHubId)
  const dest = hubById(trip.toHubId)
  const date = new Date(`${trip.date}T${trip.windowStart}`)
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Avatar user={passenger} size="sm" />
          <div>
            <p className="flex items-center gap-1 text-[13.5px] font-bold">{displayName(passenger)} {passenger?.status === 'verified' && <VerifiedBadge />}</p>
            <p className="text-[12px] text-ink-soft">Looking for {trip.seats} seat{trip.seats > 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="flex gap-1.5">
          {trip.visibility === 'private' && <Badge tone="sky"><Lock className="size-3" strokeWidth={3} /> PRIVATE</Badge>}
          <TimingBadge timing={trip.timing} />
        </div>
      </div>
      <div className="mt-3.5 flex items-center gap-2 text-[15px] font-bold">
        <span className="truncate">{from.name}</span>
        <ArrowRight className="size-4 shrink-0 text-clay" />
        <span className="truncate">{dest.name}</span>
      </div>
      <p className="mt-1 flex items-center gap-1.5 text-[13px] text-ink-soft">
        <Clock className="size-3.5" /> {fmtDay(date.toISOString())}, {trip.windowStart}–{trip.windowEnd}
      </p>
      {trip.preferences.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {trip.preferences.map((p) => <Badge key={p} tone="muted">{p}</Badge>)}
        </div>
      )}
      {action && <div className="mt-4">{action}</div>}
    </>
  )
  return to
    ? <Link to={to} className={cn('card block p-4 transition hover:-translate-y-0.5 sm:p-5', className)}>{body}</Link>
    : <div className={cn('card p-4 sm:p-5', className)}>{body}</div>
}

export function FuelEstimateCard({ config, ride, car, passengers, editable, onToggleHost }: {
  config: AppConfig
  ride: Pick<Ride, 'fromHubId' | 'toHubId' | 'hostIncluded'>
  car?: Car
  passengers: number
  editable?: boolean
  onToggleHost?: (v: boolean) => void
}) {
  if (!car) return null
  const est = estimateFuel(config, { fromHubId: ride.fromHubId, toHubId: ride.toHubId, fuelType: car.fuelType, passengers, hostIncluded: ride.hostIncluded })
  return (
    <div className="overflow-hidden rounded-[var(--radius-xl2)] border border-sand bg-paper">
      <div className="flex items-start justify-between gap-3 p-5">
        <div>
          <p className="eyebrow flex items-center gap-1.5"><Fuel className="size-3.5" /> Fuel estimate</p>
          {est.supported ? (
            <>
              <p className="mt-2 font-display text-[34px] leading-none font-bold text-forest tabular-nums">
                {egp(est.perPerson)}
                <span className="ml-1 text-base font-semibold text-ink-soft">/ person</span>
              </p>
              <p className="mt-1.5 text-[12.5px] text-ink-soft">
                Total {egp(est.total)} split between {est.participants} {est.participants === 1 ? 'person' : 'people'}
              </p>
            </>
          ) : (
            <p className="mt-2 text-[14px] font-semibold text-ink-soft">
              {FUEL_LABEL[car.fuelType]} estimates arrive with the native app.
            </p>
          )}
        </div>
        <div className="shrink-0 rounded-2xl bg-cream px-3 py-2 text-right font-mono text-[11px] leading-relaxed text-ink-soft">
          <div>{est.distanceKm} km</div>
          {est.supported && <><div>÷ {est.consumption} km/L</div><div>× {est.price.toFixed(2)} EGP/L</div></>}
        </div>
      </div>
      {editable && est.supported && (
        <div className="border-t border-sand px-5 py-3.5">
          <Toggle
            checked={ride.hostIncluded}
            onChange={(v) => onToggleHost?.(v)}
            label="Include me (host) in the split"
            description="Turn off to split only between riders."
          />
        </div>
      )}
      <div className="flex items-center gap-2 bg-amber-soft px-5 py-3 text-[12.5px] font-semibold text-[#6d4a0c]">
        <Info className="size-4 shrink-0" />
        Estimate only. Twigg does not process payments. Settle offline.
      </div>
    </div>
  )
}

export function RouteSummary({ fromHubId, toHubId, pickup }: { fromHubId: string; toHubId: string; pickup?: PickupPoint | null }) {
  const km = routeDistanceKm(fromHubId, toHubId)
  const min = routeDurationMin(km)
  const from = hubById(fromHubId)
  const to = hubById(toHubId)
  return (
    <div className="relative overflow-hidden rounded-[var(--radius-xl2)] bg-forest p-5 text-cream">
      <div className="twig-pattern pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[11px] tracking-[0.14em] text-sprout uppercase">Route summary</p>
          <p className="text-[11.5px] text-cream/60">Host controls the final route</p>
        </div>
        <svg viewBox="0 0 320 70" className="mt-3 h-[70px] w-full" aria-hidden>
          <path d="M14 52 C 80 52, 90 18, 160 22 S 250 50, 306 18" fill="none" stroke="var(--color-sprout)" strokeWidth="3" strokeLinecap="round"
            strokeDasharray="400" strokeDashoffset="400" className="animate-grow" />
          <path d="M96 30 C 92 20 98 12 108 10 C 108 20 102 28 96 30 Z" fill="var(--color-moss)" />
          <path d="M228 40 C 236 34 246 36 250 44 C 242 48 232 46 228 40 Z" fill="var(--color-moss)" />
          <circle cx="14" cy="52" r="7" fill="var(--color-forest)" stroke="var(--color-cream)" strokeWidth="3" />
          {pickup && <circle cx="62" cy="44" r="5" fill="var(--color-sprout)" />}
          <circle cx="306" cy="18" r="8" fill="var(--color-clay)" />
        </svg>
        <div className="mt-1 flex justify-between gap-4 text-[13px] font-bold">
          <span className="truncate">{from.name}</span>
          <span className="truncate text-right">{to.name}</span>
        </div>
        {pickup && (
          <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-sprout">
            <MapPin className="size-3.5" /> Pickup: {pickup.name}
          </p>
        )}
        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-cream/15 pt-3.5 text-center">
          <div><p className="font-display text-xl font-bold tabular-nums">{km}<span className="text-sm font-medium text-cream/60"> km</span></p></div>
          <div><p className="font-display text-xl font-bold tabular-nums">~{min}<span className="text-sm font-medium text-cream/60"> min</span></p></div>
          <div className="flex items-center justify-center gap-1 text-[11.5px] leading-tight text-cream/75"><Navigation className="size-3.5 shrink-0" />{viaRoad(fromHubId, toHubId).replace('via ', '')}</div>
        </div>
      </div>
    </div>
  )
}

export function RideFacts({ ride, car, free }: { ride: Ride; car?: Car; free: number }) {
  const items = [
    { icon: <Users className="size-4" />, label: 'Seats', value: `${free} of ${ride.seats} free` },
    { icon: <Luggage className="size-4" />, label: 'Luggage', value: LUGGAGE_LABEL[ride.luggage] },
    { icon: <RouteIcon className="size-4" />, label: 'Car', value: car ? `${car.color} ${car.make} ${car.model}` : '—' },
    { icon: <Fuel className="size-4" />, label: 'Fuel', value: car ? FUEL_LABEL[car.fuelType] : '—' },
  ]
  return (
    <div className="grid grid-cols-2 gap-2.5">
      {items.map((i) => (
        <div key={i.label} className="rounded-2xl border border-sand bg-paper px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-[11.5px] font-semibold text-ink-faint">{i.icon}{i.label}</p>
          <p className="mt-1 text-[13.5px] leading-snug font-bold text-ink">{i.value}</p>
        </div>
      ))}
    </div>
  )
}

export function PlateTag({ plate, className }: { plate: string; className?: string }) {
  // Egyptian plates: Arabic letters + digits on a blue-topped plate.
  return (
    <span className={cn('inline-flex flex-col overflow-hidden rounded-md border-[1.5px] border-ink/70 bg-white text-center leading-none', className)}>
      <span className="bg-[#2f63b8] px-2 py-[2px] text-[7px] font-bold tracking-widest text-white">EGYPT مصر</span>
      <span className="px-2 py-1 text-[13px] font-bold tracking-wide text-ink" dir="rtl">{plate}</span>
    </span>
  )
}
