import { useMemo, useState } from 'react'
import { Badge, StatusPill } from '@/components/ui/Display'
import { Segmented } from '@/components/ui/Form'
import { hubById } from '@/lib/geo'
import type { RideStatus } from '@/lib/types'
import { displayName, fmtDateTime } from '@/lib/utils'
import { useDB } from '@/store/db'
import { acceptedRequests, useUsersMap } from '@/store/selectors'
import { AdminHeader, StatTile, Table } from './shared'

const minutesSince = (iso?: string) => (iso ? Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000)) : 0)

export default function AdminRides() {
  const rides = useDB((s) => s.rides)
  const seatRequests = useDB((s) => s.seatRequests)
  const byId = useUsersMap()
  const [filter, setFilter] = useState<'all' | RideStatus>('all')

  const counts = useMemo(() => {
    const c: Partial<Record<RideStatus, number>> = {}
    rides.forEach((r) => { c[r.status] = (c[r.status] ?? 0) + 1 })
    const settlements = rides.filter((r) => r.status === 'completed').flatMap((r) => r.settlements)
    return { ...c, settled: settlements.filter((s) => s.status === 'settled').length, pendingSettle: settlements.filter((s) => s.status === 'pending').length }
  }, [rides])

  const list = useMemo(() => rides
    .filter((r) => filter === 'all' || r.status === filter)
    .sort((a, b) => b.departAt.localeCompare(a.departAt)), [rides, filter])

  return (
    <div>
      <AdminHeader title="Rides & settlement" subtitle="Settlement is a status layer only — Twigg never processes payments." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatTile tone="forest" label="Active now" value={counts.active ?? 0} />
        <StatTile label="Settled" value={counts.settled} sub="Completed-ride shares" />
        <StatTile tone="clay" label="Pending settlement" value={counts.pendingSettle} sub="Awaiting offline payment" />
      </div>
      <Segmented size="sm" className="mb-4 max-w-2xl" value={filter} onChange={setFilter} options={[
        { value: 'all', label: 'All' }, { value: 'pending', label: 'Pending' }, { value: 'confirmed', label: 'Confirmed' },
        { value: 'active', label: 'Active' }, { value: 'completed', label: 'Completed' }, { value: 'cancelled', label: 'Cancelled' },
      ]} />
      <Table head={['Route', 'Host', 'Departure', 'Status', 'Riders', 'Duration', 'Settlement']}>
        {list.map((r) => {
          const riders = acceptedRequests({ seatRequests }, r.id)
          const settled = r.settlements.filter((s) => s.status === 'settled').length
          return (
            <tr key={r.id} className="hover:bg-cream/40">
              <td className="px-4 py-3 font-bold">{hubById(r.fromHubId).name} → {hubById(r.toHubId).name}</td>
              <td className="px-4 py-3">{displayName(byId.get(r.hostId))}</td>
              <td className="px-4 py-3 whitespace-nowrap text-ink-soft">{fmtDateTime(r.departAt)}</td>
              <td className="px-4 py-3"><StatusPill status={r.status} /></td>
              <td className="px-4 py-3 tabular-nums">{riders.length}/{r.seats}</td>
              <td className="px-4 py-3 tabular-nums text-ink-soft">{r.status === 'active' ? `${minutesSince(r.startedAt)} min` : '—'}</td>
              <td className="px-4 py-3">
                {r.status !== 'completed' ? <span className="text-ink-faint">—</span>
                  : r.settlements.length === 0 ? <span className="text-ink-faint">No riders</span>
                  : settled === r.settlements.length ? <Badge tone="sprout">SETTLED</Badge>
                  : <Badge tone="amber">{settled}/{r.settlements.length} SETTLED</Badge>}
              </td>
            </tr>
          )
        })}
      </Table>
    </div>
  )
}
