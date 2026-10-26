import { ArrowDownUp, CarFront, Map as MapIcon, MapPinned, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { HubMapPicker } from '@/components/map/HubMapPicker'
import { OfferModal } from '@/components/OfferModal'
import { HubSelect, RideCard, TimingBadge, TripRequestCard } from '@/components/rides'
import { Button } from '@/components/ui/Button'
import { Badge, EmptyState, SectionTitle } from '@/components/ui/Display'
import { Chip, Segmented } from '@/components/ui/Form'
import { hubById } from '@/lib/geo'
import type { Ride, Timing, TripRequest } from '@/lib/types'
import { cn, fmtDateTime, fmtTime, toDateInput } from '@/lib/utils'
import { useDB } from '@/store/db'
import { canHost, seatsTaken, useConfig, useMe, useUsersMap } from '@/store/selectors'

type DateFilter = 'any' | 'today' | 'tomorrow' | 'custom'

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return { ar: 'Sabah el-kheir', en: 'Good morning' }
  if (h < 18) return { ar: 'Ahlan', en: 'Good afternoon' }
  return { ar: 'Masa el-kheir', en: 'Good evening' }
}

export default function Home() {
  const me = useMe()!
  const rides = useDB((s) => s.rides)
  const seatRequests = useDB((s) => s.seatRequests)
  const tripRequests = useDB((s) => s.tripRequests)
  const users = useUsersMap()
  const config = useConfig()

  const [tab, setTab] = useState<'rides' | 'requests'>('rides')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [dateFilter, setDateFilter] = useState<DateFilter>('any')
  const [customDate, setCustomDate] = useState(toDateInput(new Date()))
  const [seats, setSeats] = useState(1)
  const [timing, setTiming] = useState<'any' | Timing>('any')
  const [showFilters, setShowFilters] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [offerFor, setOfferFor] = useState<TripRequest | null>(null)

  const targetDate = useMemo(() => {
    if (dateFilter === 'any') return null
    if (dateFilter === 'custom') return customDate
    const d = new Date()
    if (dateFilter === 'tomorrow') d.setDate(d.getDate() + 1)
    return toDateInput(d)
  }, [dateFilter, customDate])

  const nextRide = useMemo(() => {
    const mine = rides.filter((r) =>
      ['confirmed', 'active'].includes(r.status) &&
      (r.hostId === me.id || seatRequests.some((s) => s.rideId === r.id && s.passengerId === me.id && s.status === 'accepted')))
    return mine.sort((a, b) => a.departAt.localeCompare(b.departAt))[0]
  }, [rides, seatRequests, me.id])

  const feed = useMemo(() => {
    const now = Date.now() - 30 * 60_000
    return rides
      .filter((r) => r.visibility === 'public' && ['pending', 'confirmed'].includes(r.status) && r.hostId !== me.id)
      .filter((r) => !seatRequests.some((s) => s.rideId === r.id && s.passengerId === me.id && s.status === 'accepted'))
      .filter((r) => new Date(r.departAt).getTime() > now)
      .filter((r) => (!from || r.fromHubId === from) && (!to || r.toHubId === to))
      .filter((r) => !targetDate || toDateInput(new Date(r.departAt)) === targetDate)
      .filter((r) => timing === 'any' || r.timing === timing)
      .map((r) => ({ ride: r, taken: seatsTaken({ seatRequests }, r.id) }))
      .filter(({ ride, taken }) => ride.seats - taken >= seats)
      .sort((a, b) => a.ride.departAt.localeCompare(b.ride.departAt))
  }, [rides, seatRequests, me.id, from, to, targetDate, timing, seats])

  const requestFeed = useMemo(() => {
    const today = toDateInput(new Date())
    return tripRequests
      .filter((t) => t.status === 'open' && t.visibility === 'public' && t.passengerId !== me.id && t.date >= today)
      .filter((t) => (!from || t.fromHubId === from) && (!to || t.toHubId === to))
      .filter((t) => !targetDate || t.date === targetDate)
      .filter((t) => timing === 'any' || t.timing === timing)
      .filter((t) => t.seats >= 1 && t.seats <= Math.max(seats, 4))
      .sort((a, b) => `${a.date}${a.windowStart}`.localeCompare(`${b.date}${b.windowStart}`))
  }, [tripRequests, me.id, from, to, targetDate, timing, seats])

  const g = greeting()
  const activeFilters = [from, to, dateFilter !== 'any', seats > 1, timing !== 'any'].filter(Boolean).length
  const showRequestsTab = me.role === 'carpooler'

  return (
    <div>
      <header className="mb-6 animate-rise">
        <p className="eyebrow">{g.en}</p>
        <h1 className="mt-1 text-[34px] leading-[1.02] font-bold text-forest sm:text-[40px]">
          {g.ar}, <span className="text-clay">{me.displayName || me.firstName}</span>
        </h1>
      </header>

      {nextRide && <NextRideBanner ride={nextRide} hostName={users.get(nextRide.hostId)?.firstName ?? ''} isHost={nextRide.hostId === me.id} />}

      {/* Search */}
      <section className="card relative mb-6 p-4 animate-rise [animation-delay:60ms] sm:p-5">
        <div className="grid grid-cols-[1fr_auto] items-center gap-2 sm:grid-cols-[1fr_auto_1fr]">
          <HubSelect value={from} onChange={setFrom} placeholder="From — any hub" exclude={to} />
          <button
            onClick={() => { setFrom(to); setTo(from) }}
            aria-label="Swap start and destination"
            className="row-span-2 flex size-10 items-center justify-center rounded-full bg-sand/60 text-forest transition hover:rotate-180 hover:bg-sand sm:row-span-1"
          >
            <ArrowDownUp className="size-4 sm:rotate-90" />
          </button>
          <HubSelect value={to} onChange={setTo} placeholder="To — any destination" exclude={from} />
        </div>

        <div className="mt-3 flex items-center gap-2 overflow-x-auto scrollbar-none">
          {(['any', 'today', 'tomorrow'] as const).map((d) => (
            <Chip key={d} selected={dateFilter === d} onClick={() => setDateFilter(d)}>
              {d === 'any' ? 'Any day' : d[0].toUpperCase() + d.slice(1)}
            </Chip>
          ))}
          <label className={cn('relative inline-flex h-9 shrink-0 cursor-pointer items-center rounded-full border-[1.5px] px-3.5 text-[13px] font-semibold',
            dateFilter === 'custom' ? 'border-forest bg-forest text-cream' : 'border-sand bg-paper text-ink-soft')}>
            {dateFilter === 'custom' ? new Date(customDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'Pick date'}
            <input type="date" aria-label="Pick a date" className="absolute inset-0 opacity-0" min={toDateInput(new Date())} value={customDate}
              onChange={(e) => { setCustomDate(e.target.value); setDateFilter('custom') }} />
          </label>
          <span className="flex-1" />
          <button
            onClick={() => setShowMap((v) => !v)}
            aria-pressed={showMap}
            className={cn('inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold transition',
              showMap ? 'bg-forest text-cream' : 'bg-sand/60 text-forest hover:bg-sand')}
          >
            <MapIcon className="size-4" /> Map
          </button>
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={cn('inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-bold transition',
              showFilters ? 'bg-forest text-cream' : 'bg-sand/60 text-forest hover:bg-sand')}
          >
            <SlidersHorizontal className="size-4" /> Filters{activeFilters > 0 && ` · ${activeFilters}`}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {showFilters && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="mt-4 grid gap-4 border-t border-dashed border-sand pt-4 sm:grid-cols-2">
                <div>
                  <p className="mb-2 text-[12.5px] font-semibold text-ink-soft">Seats needed</p>
                  <Segmented<string> size="sm" value={String(seats)} onChange={(v) => setSeats(Number(v))}
                    options={[1, 2, 3, 4].map((n) => ({ value: String(n), label: `${n}` }))} />
                </div>
                <div>
                  <p className="mb-2 text-[12.5px] font-semibold text-ink-soft">Timing preference</p>
                  <Segmented size="sm" value={timing} onChange={setTiming}
                    options={[{ value: 'any', label: 'Any' }, { value: 'flexible', label: 'Flexible' }, { value: 'sharp', label: 'Sharp' }]} />
                </div>
              </div>
              {activeFilters > 0 && (
                <button className="mt-3 inline-flex items-center gap-1 text-[12.5px] font-bold text-clay"
                  onClick={() => { setFrom(''); setTo(''); setDateFilter('any'); setSeats(1); setTiming('any') }}>
                  <X className="size-3.5" /> Clear all filters
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {showMap && (
          <HubMapPicker className="mt-4 animate-rise" fromHubId={from} toHubId={to} onFrom={setFrom} onTo={setTo} />
        )}
      </section>

      {showRequestsTab && (
        <Segmented className="mb-5" value={tab} onChange={setTab}
          options={[{ value: 'rides', label: 'Rides to join' }, { value: 'requests', label: `Trip requests · ${requestFeed.length}` }]} />
      )}

      {tab === 'rides' || !showRequestsTab ? (
        <section>
          <SectionTitle action={<span className="text-[12.5px] font-semibold text-ink-soft">{feed.length} found</span>}>
            {from || to ? `${from ? hubById(from).name : 'Anywhere'} → ${to ? hubById(to).name : 'anywhere'}` : 'Upcoming rides'}
          </SectionTitle>
          {feed.length === 0 ? (
            <EmptyState
              icon={<MapPinned className="size-6" />}
              title="No rides match yet"
              body="Post a trip request and verified hosts heading your way can offer you a seat."
              action={<Button to="/app/requests/new" disabled={me.status !== 'verified'}>Request a trip</Button>}
            />
          ) : (
            <div className="space-y-3.5">
              {feed.map(({ ride, taken }, i) => {
                const host = users.get(ride.hostId)
                return (
                  <div key={ride.id} className="animate-rise" style={{ animationDelay: `${Math.min(i, 6) * 50}ms` }}>
                    <RideCard ride={ride} host={host} car={host?.cars.find((c) => c.id === ride.carId)} taken={taken} config={config} />
                  </div>
                )
              })}
            </div>
          )}
          <p className="mt-6 text-center text-[12.5px] text-ink-faint">Private rides aren't listed — hosts share them by link.</p>
        </section>
      ) : (
        <section>
          <SectionTitle action={<Button size="sm" variant="ghost" to="/app/rides/new" icon={<CarFront className="size-4" />}>New ride</Button>}>
            Riders looking for seats
          </SectionTitle>
          {requestFeed.length === 0 ? (
            <EmptyState icon={<Search className="size-6" />} title="No open requests" body="When passengers post trips that match these filters, they'll show up here." />
          ) : (
            <div className="space-y-3.5">
              {requestFeed.map((t) => (
                <TripRequestCard key={t.id} trip={t} passenger={users.get(t.passengerId)} action={
                  <Button size="sm" variant="sprout" disabled={!canHost(me)} onClick={() => setOfferFor(t)} icon={<Sparkles className="size-4" />}>
                    Offer a seat
                  </Button>
                } />
              ))}
            </div>
          )}
        </section>
      )}

      <OfferModal trip={offerFor} onClose={() => setOfferFor(null)} />
    </div>
  )
}

function NextRideBanner({ ride, hostName, isHost }: { ride: Ride; hostName: string; isHost: boolean }) {
  const mins = Math.round((new Date(ride.departAt).getTime() - Date.now()) / 60000)
  const countdown = ride.status === 'active' ? 'On the road now' : mins <= 0 ? 'Departing now' : mins < 60 ? `In ${mins} min` : mins < 60 * 24 ? `In ${Math.round(mins / 60)} h` : fmtDateTime(ride.departAt)
  return (
    <Link to={`/app/rides/${ride.id}`} className="relative mb-6 block overflow-hidden rounded-[var(--radius-xl2)] bg-forest p-5 text-cream shadow-[var(--shadow-lift)] animate-rise">
      <div className="twig-pattern absolute inset-0 opacity-70" />
      <div className="relative flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[11px] tracking-[0.14em] text-sprout uppercase">{ride.status === 'active' ? '● Ride active' : 'Your next ride'}</p>
          <p className="mt-2 line-clamp-2 font-display text-[22px] leading-tight font-bold">
            {hubById(ride.fromHubId).name} → {hubById(ride.toHubId).name}
          </p>
          <p className="mt-1 text-[13px] text-cream/70">
            {fmtTime(ride.departAt)} · {isHost ? 'You\'re hosting' : `with ${hostName}`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <Badge tone={ride.status === 'active' ? 'clay' : 'sprout'}>{countdown}</Badge>
          <div className="mt-2 flex justify-end"><TimingBadge timing={ride.timing} /></div>
        </div>
      </div>
    </Link>
  )
}
