import { Phone, ShieldAlert } from 'lucide-react'
import { useMemo, useState } from 'react'
import { logIncidentAction, setUserStatus } from '@/api'
import { Avatar } from '@/components/brand'
import { Button } from '@/components/ui/Button'
import { Badge, EmptyState } from '@/components/ui/Display'
import { Input, Segmented } from '@/components/ui/Form'
import { useAction } from '@/components/ui/Toast'
import { INCIDENT_LABEL } from '@/lib/constants'
import { hubById } from '@/lib/geo'
import type { Incident } from '@/lib/types'
import { displayName, prettyPhone, timeAgo } from '@/lib/utils'
import { useDB } from '@/store/db'
import { useUsersMap } from '@/store/selectors'
import { AdminHeader } from './shared'

const TONE = { open: 'clay', reviewing: 'sky', resolved: 'sprout' } as const

export default function AdminIncidents() {
  const incidents = useDB((s) => s.incidents)
  const [filter, setFilter] = useState<'active' | 'resolved'>('active')
  const list = useMemo(() => incidents
    .filter((i) => (filter === 'active' ? i.status !== 'resolved' : i.status === 'resolved'))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [incidents, filter])

  return (
    <div>
      <AdminHeader title="Safety reports" subtitle="Review each report by hand and record what you did. Suspensions are manual." />
      <Segmented size="sm" className="mb-5 max-w-xs" value={filter} onChange={setFilter} options={[{ value: 'active', label: 'Open & reviewing' }, { value: 'resolved', label: 'Resolved' }]} />
      {list.length === 0 ? <EmptyState icon={<ShieldAlert className="size-6" />} title="Nothing here" body="Reports filed by members appear in this list." /> : (
        <div className="space-y-4">{list.map((i) => <IncidentCard key={i.id} incident={i} />)}</div>
      )}
    </div>
  )
}

function IncidentCard({ incident: i }: { incident: Incident }) {
  const byId = useUsersMap()
  const rides = useDB((s) => s.rides)
  const [text, setText] = useState('')
  const log = useAction(logIncidentAction, { success: 'Action recorded', onSuccess: () => setText('') })
  const suspend = useAction(setUserStatus, { success: 'Member suspended' })
  const reporter = byId.get(i.reporterId)
  const about = i.aboutUserId ? byId.get(i.aboutUserId) : undefined
  const ride = i.rideId ? rides.find((r) => r.id === i.rideId) : undefined

  return (
    <article className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={TONE[i.status]} dot>{i.status.toUpperCase()}</Badge>
            <span className="text-[15px] font-bold">{INCIDENT_LABEL[i.category].label}</span>
          </div>
          <p className="mt-1 text-[12.5px] text-ink-soft">
            Filed {timeAgo(i.createdAt)} by {displayName(reporter)}
            {ride && ` · ride ${hubById(ride.fromHubId).name} → ${hubById(ride.toHubId).name}`}
          </p>
        </div>
        {i.contactBack && reporter && (
          <a href={`tel:${reporter.phone}`} className="inline-flex items-center gap-1.5 rounded-full bg-sprout-soft px-3 py-1.5 text-[12.5px] font-bold text-forest">
            <Phone className="size-3.5" /> Call back {prettyPhone(reporter.phone)}
          </a>
        )}
      </div>

      <p className="mt-3 rounded-xl bg-cream px-4 py-3 text-[14px]">{i.description}</p>

      {about && (
        <div className="mt-3 flex items-center gap-2.5">
          <Avatar user={about} size="xs" />
          <span className="text-[13px]"><b>About:</b> {about.firstName} {about.lastName} <span className="text-ink-faint">({about.status})</span></span>
          {about.status !== 'suspended' && (
            <Button size="sm" variant="ghost" className="ml-auto text-danger" loading={suspend.pending}
              onClick={() => suspend.run(about.id, 'suspended', 'Suspended following a safety report review.').then(() => logIncidentAction(i.id, `Suspended ${about.firstName} ${about.lastName}.`))}>
              Suspend member
            </Button>
          )}
        </div>
      )}

      {i.actions.length > 0 && (
        <ol className="mt-4 space-y-2 border-l-2 border-sand pl-4">
          {i.actions.map((a, idx) => (
            <li key={idx} className="text-[13px]"><span className="text-ink-faint">{timeAgo(a.at)} · </span>{a.text}</li>
          ))}
        </ol>
      )}

      {i.status !== 'resolved' && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input className="h-11 flex-1" placeholder="Record a manual action (e.g. called host, warned rider)…" value={text} onChange={(e) => setText(e.target.value)} />
          <div className="flex gap-2">
            <Button variant="paper" disabled={!text.trim()} loading={log.pending} onClick={() => log.run(i.id, text)}>Log</Button>
            <Button loading={log.pending} onClick={() => log.run(i.id, text || 'Marked resolved.', 'resolved')}>Resolve</Button>
          </div>
        </div>
      )}
    </article>
  )
}
