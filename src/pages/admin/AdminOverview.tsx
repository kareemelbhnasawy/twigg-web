import { ArrowRight } from 'lucide-react'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Avatar } from '@/components/brand'
import { Badge } from '@/components/ui/Display'
import { hubById } from '@/lib/geo'
import { displayName, timeAgo } from '@/lib/utils'
import { useDB } from '@/store/db'
import { useUsersMap } from '@/store/selectors'
import { AdminHeader, StatTile } from './shared'

export default function AdminOverview() {
  const users = useDB((s) => s.users)
  const rides = useDB((s) => s.rides)
  const incidents = useDB((s) => s.incidents)
  const reviews = useDB((s) => s.reviews)
  const config = useDB((s) => s.config)
  const byId = useUsersMap()

  const s = useMemo(() => {
    const settlements = rides.filter((r) => r.status === 'completed').flatMap((r) => r.settlements)
    return {
      queue: users.filter((u) => u.status === 'unverified'),
      verified: users.filter((u) => u.status === 'verified').length,
      active: rides.filter((r) => r.status === 'active'),
      upcoming: rides.filter((r) => ['pending', 'confirmed'].includes(r.status)).length,
      openIncidents: incidents.filter((i) => i.status !== 'resolved'),
      pendingReviews: reviews.filter((r) => r.status === 'pending').length,
      settled: settlements.filter((x) => x.status === 'settled').length,
      pendingSettle: settlements.filter((x) => x.status === 'pending').length,
    }
  }, [users, rides, incidents, reviews])
  const total = s.settled + s.pendingSettle

  return (
    <div>
      <AdminHeader title="Overview" subtitle={`${s.verified} verified members · ${s.upcoming} upcoming rides`} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile tone="clay" label="Verification queue" value={s.queue.length} sub="Awaiting manual review" />
        <StatTile tone="forest" label="Active rides" value={s.active.length} sub="On the road now" />
        <StatTile label="Open reports" value={s.openIncidents.length} sub="Need a human decision" />
        <StatTile label="Reviews to moderate" value={s.pendingReviews} sub="Pending approval" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <StatTile label="Settlement status" value={<>{s.settled}<span className="text-xl text-ink-faint"> / {total} settled</span></>} sub={`${s.pendingSettle} pending offline settlement`}>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-amber-soft">
            <div className="h-full bg-forest transition-all" style={{ width: total ? `${(s.settled / total) * 100}%` : 0 }} />
          </div>
          <div className="mt-2 flex justify-between text-[11.5px] font-semibold"><span className="text-forest">Settled</span><span className="text-[#7a5310]">Pending</span></div>
        </StatTile>
        <StatTile label="Fuel benchmarks" value={<span className="text-[26px]">{config.fuelPrice.gasoline} <span className="text-sm text-ink-faint">EGP/L gasoline</span></span>}
          sub={`Diesel ${config.fuelPrice.diesel} EGP/L · ${config.consumption.gasoline} / ${config.consumption.diesel} km/L · updated ${timeAgo(config.updatedAt)}`}>
          <Link to="/admin/config" className="mt-3 inline-flex items-center gap-1 text-[13px] font-bold text-forest hover:underline">Edit benchmarks <ArrowRight className="size-3.5" /></Link>
        </StatTile>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold text-forest">Verification queue</h2><Link to="/admin/verification" className="text-[13px] font-bold text-clay">Review all →</Link></div>
          <div className="card divide-y divide-sand">
            {s.queue.length === 0 && <p className="p-4 text-[13px] text-ink-soft">Queue is clear 🎉</p>}
            {s.queue.slice(0, 5).map((u) => (
              <div key={u.id} className="flex items-center gap-3 p-3.5">
                <Avatar user={u} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold">{u.firstName} {u.lastName}</p>
                  <p className="text-[12px] text-ink-soft">Invited by {displayName(byId.get(u.invitedBy ?? ''))} · {timeAgo(u.createdAt)}</p>
                </div>
                <Badge tone="amber">REVIEW</Badge>
              </div>
            ))}
          </div>
        </section>
        <section>
          <div className="mb-3 flex items-center justify-between"><h2 className="text-lg font-semibold text-forest">Active rides</h2><Link to="/admin/rides" className="text-[13px] font-bold text-clay">All rides →</Link></div>
          <div className="card divide-y divide-sand">
            {s.active.length === 0 && <p className="p-4 text-[13px] text-ink-soft">No rides on the road right now.</p>}
            {s.active.map((r) => (
              <div key={r.id} className="flex items-center gap-3 p-3.5">
                <span className="relative flex size-2.5"><span className="absolute inline-flex size-full animate-ping rounded-full bg-clay opacity-70" /><span className="relative size-2.5 rounded-full bg-clay" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-bold">{hubById(r.fromHubId).name} → {hubById(r.toHubId).name}</p>
                  <p className="text-[12px] text-ink-soft">Host {displayName(byId.get(r.hostId))} · started {r.startedAt && timeAgo(r.startedAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
