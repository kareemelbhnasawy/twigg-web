import { Check, History, Inbox, Route, Send, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { respondToRequest } from '@/api'
import { PageHeader } from '@/components/PageHeader'
import { Avatar } from '@/components/brand'
import { RideCard, TripRequestCard } from '@/components/rides'
import { Button } from '@/components/ui/Button'
import { Badge, EmptyState, SectionTitle } from '@/components/ui/Display'
import { useAction } from '@/components/ui/Toast'
import { hubById } from '@/lib/geo'
import type { Ride } from '@/lib/types'
import { cn, displayName, fmtDateTime, timeAgo } from '@/lib/utils'
import { useDB } from '@/store/db'
import { seatsTaken, useConfig, useMe, useUsersMap } from '@/store/selectors'

type Tab = 'upcoming' | 'requests' | 'inbox' | 'history'

export default function MyTrips() {
  const me = useMe()!
  const config = useConfig()
  const users = useUsersMap()
  const rides = useDB((s) => s.rides)
  const seatRequests = useDB((s) => s.seatRequests)
  const tripRequests = useDB((s) => s.tripRequests)
  const [params, setParams] = useSearchParams()
  const isHost = me.role === 'carpooler'
  const [tab, setTabState] = useState<Tab>((params.get('tab') as Tab) || 'upcoming')
  const setTab = (t: Tab) => { setTabState(t); setParams({ tab: t }, { replace: true }) }
  const respond = useAction(respondToRequest)

  const data = useMemo(() => {
    const riding = new Set(seatRequests.filter((r) => r.passengerId === me.id && r.status === 'accepted').map((r) => r.rideId))
    const involved = rides.filter((r) => r.hostId === me.id || riding.has(r.id))
    const upcoming = involved
      .filter((r) => ['draft', 'pending', 'confirmed', 'active'].includes(r.status))
      .sort((a, b) => (a.status === 'active' ? -1 : b.status === 'active' ? 1 : a.departAt.localeCompare(b.departAt)))
    const history = involved
      .filter((r) => ['completed', 'cancelled'].includes(r.status))
      .sort((a, b) => b.departAt.localeCompare(a.departAt))
    const outgoing = seatRequests
      .filter((r) => r.passengerId === me.id && r.status !== 'accepted')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const myTrips = tripRequests.filter((t) => t.passengerId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    const myRideIds = new Set(rides.filter((r) => r.hostId === me.id && ['pending', 'confirmed'].includes(r.status)).map((r) => r.id))
    const inbox = seatRequests
      .filter((r) => myRideIds.has(r.rideId) && r.status === 'pending' && r.source === 'request')
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return { upcoming, history, outgoing, myTrips, inbox }
  }, [rides, seatRequests, tripRequests, me.id])

  const tabs: { key: Tab; label: string; icon: typeof Route; count?: number }[] = [
    { key: 'upcoming', label: 'Upcoming', icon: Route, count: data.upcoming.length },
    { key: 'requests', label: 'My requests', icon: Send },
    ...(isHost ? [{ key: 'inbox' as Tab, label: 'Inbox', icon: Inbox, count: data.inbox.length }] : []),
    { key: 'history', label: 'History', icon: History },
  ]

  const card = (r: Ride) => {
    const host = users.get(r.hostId)
    const settlement = r.status === 'completed'
      ? (r.hostId === me.id ? r.settlements : r.settlements.filter((s) => s.passengerId === me.id))
      : []
    const pendingSettle = settlement.filter((s) => s.status === 'pending').length
    return (
      <RideCard key={r.id} ride={r} host={host} car={host?.cars.find((c) => c.id === r.carId)} taken={seatsTaken({ seatRequests }, r.id)} config={config} showStatus
        highlight={
          <div className="flex flex-wrap gap-1.5">
            {r.hostId === me.id ? <Badge tone="forest">HOSTING</Badge> : <Badge tone="sprout">RIDING</Badge>}
            {r.status === 'completed' && settlement.length > 0 && (
              pendingSettle ? <Badge tone="amber">SETTLEMENT PENDING{settlement.length > 1 ? ` · ${pendingSettle}` : ''}</Badge> : <Badge tone="sprout"><Check className="size-3" strokeWidth={3} /> SETTLED</Badge>
            )}
            {r.hostId === me.id && r.status === 'pending' && (() => {
              const n = seatRequests.filter((s) => s.rideId === r.id && s.status === 'pending' && s.source === 'request').length
              return n > 0 ? <Badge tone="clay">{n} NEW REQUEST{n > 1 ? 'S' : ''}</Badge> : null
            })()}
          </div>
        } />
    )
  }

  return (
    <div>
      <PageHeader title="My trips" subtitle="Rides you host or join, your requests, and your history." />

      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 scrollbar-none">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={cn('flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[13.5px] font-bold transition',
              tab === t.key ? 'bg-forest text-cream' : 'border border-sand bg-paper text-ink-soft hover:text-forest')}>
            <t.icon className="size-4" /> {t.label}
            {!!t.count && <span className={cn('rounded-full px-1.5 text-[11px]', tab === t.key ? 'bg-sprout text-forest' : 'bg-sand text-ink-soft')}>{t.count}</span>}
          </button>
        ))}
      </div>

      {tab === 'upcoming' && (
        data.upcoming.length ? <div className="space-y-3.5">{data.upcoming.map(card)}</div> : (
          <EmptyState icon={<Route className="size-6" />} title="No upcoming rides" body="Join a ride from the feed or post a trip request." action={<Button to="/app">Browse rides</Button>} />
        )
      )}

      {tab === 'requests' && (
        <div className="space-y-8">
          <section>
            <SectionTitle>Seat requests you sent</SectionTitle>
            {data.outgoing.length === 0 ? <p className="text-[13.5px] text-ink-soft">Nothing pending.</p> : (
              <div className="card divide-y divide-sand">
                {data.outgoing.map((r) => {
                  const ride = rides.find((x) => x.id === r.rideId)
                  if (!ride) return null
                  const host = users.get(ride.hostId)
                  const tone = r.status === 'pending' ? 'amber' : r.status === 'rejected' ? 'danger' : 'muted'
                  const label = r.source === 'offer' && r.status === 'pending' ? 'OFFER — RESPOND' : r.status === 'rejected' ? 'DECLINED' : r.status.toUpperCase()
                  return (
                    <Link key={r.id} to={`/app/rides/${ride.id}`} className="flex items-center gap-3 p-4 hover:bg-cream/40">
                      <Avatar user={host} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14px] font-bold">{hubById(ride.fromHubId).name} → {hubById(ride.toHubId).name}</p>
                        <p className="text-[12px] text-ink-soft">{displayName(host)} · {fmtDateTime(ride.departAt)} · {timeAgo(r.createdAt)}</p>
                      </div>
                      <Badge tone={tone}>{label}</Badge>
                    </Link>
                  )
                })}
              </div>
            )}
          </section>
          <section>
            <SectionTitle action={<Button size="sm" variant="ghost" to="/app/requests/new" disabled={me.status !== 'verified'}>+ New</Button>}>Your trip requests</SectionTitle>
            {data.myTrips.length === 0 ? <p className="text-[13.5px] text-ink-soft">You haven't posted any trip requests.</p> : (
              <div className="space-y-3">
                {data.myTrips.map((t) => (
                  <TripRequestCard key={t.id} trip={t} passenger={me} to={`/app/requests/${t.id}`}
                    action={<Badge tone={t.status === 'open' ? 'amber' : t.status === 'matched' ? 'sprout' : 'muted'} dot>{t.status.toUpperCase()}</Badge>} />
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {tab === 'inbox' && (
        data.inbox.length === 0 ? (
          <EmptyState icon={<Inbox className="size-6" />} title="Inbox zero" body="New seat requests for your rides will land here." />
        ) : (
          <div className="card divide-y divide-sand">
            {data.inbox.map((r) => {
              const ride = rides.find((x) => x.id === r.rideId)!
              const u = users.get(r.passengerId)
              return (
                <div key={r.id} className="flex items-start gap-3 p-4">
                  <Link to={`/app/users/${r.passengerId}`}><Avatar user={u} size="md" verified={u?.status === 'verified'} /></Link>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14.5px] font-bold">{displayName(u)} <span className="font-medium text-ink-soft">· {r.seats} seat{r.seats > 1 ? 's' : ''}</span></p>
                    <Link to={`/app/rides/${ride.id}`} className="text-[12.5px] text-ink-soft hover:underline">
                      {hubById(ride.fromHubId).name} → {hubById(ride.toHubId).name} · {fmtDateTime(ride.departAt)}
                    </Link>
                    {r.message && <p className="mt-1.5 rounded-xl bg-cream px-3 py-2 text-[13px] text-ink-soft">“{r.message}”</p>}
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button aria-label="Decline" disabled={respond.pending} onClick={() => respond.run(r.id, false)}
                      className="flex size-10 items-center justify-center rounded-full border border-sand bg-paper text-danger hover:bg-danger-soft"><X className="size-4" /></button>
                    <button aria-label="Accept" disabled={respond.pending} onClick={() => respond.run(r.id, true)}
                      className="flex size-10 items-center justify-center rounded-full bg-forest text-sprout hover:bg-forest-soft"><Check className="size-4" strokeWidth={3} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        )
      )}

      {tab === 'history' && (
        data.history.length ? <div className="space-y-3.5">{data.history.map(card)}</div> : (
          <EmptyState icon={<History className="size-6" />} title="No past rides yet" body="Completed and cancelled rides show up here with their settlement status." />
        )
      )}
    </div>
  )
}
