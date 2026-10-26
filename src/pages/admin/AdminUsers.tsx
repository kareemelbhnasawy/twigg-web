import { useMemo, useState } from 'react'
import { setUserStatus } from '@/api'
import { Avatar } from '@/components/brand'
import { Badge } from '@/components/ui/Display'
import { Input, Segmented } from '@/components/ui/Form'
import { useAction } from '@/components/ui/Toast'
import type { VerificationStatus } from '@/lib/types'
import { displayName, prettyPhone, timeAgo } from '@/lib/utils'
import { useDB } from '@/store/db'
import { useUsersMap } from '@/store/selectors'
import { AdminHeader, Table } from './shared'

const TONE = { verified: 'sprout', unverified: 'amber', denied: 'muted', suspended: 'danger' } as const

export default function AdminUsers() {
  const users = useDB((s) => s.users)
  const invites = useDB((s) => s.invites)
  const byId = useUsersMap()
  const [filter, setFilter] = useState<'all' | VerificationStatus>('all')
  const [q, setQ] = useState('')
  const act = useAction(setUserStatus, { success: 'Member updated' })

  const list = useMemo(() => users
    .filter((u) => u.id !== 'u_founder')
    .filter((u) => filter === 'all' || u.status === filter)
    .filter((u) => !q || `${u.firstName} ${u.lastName} ${u.phone} ${u.social.handle}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [users, filter, q])

  return (
    <div>
      <AdminHeader title="Members" subtitle="Suspension is manual only — there is no automated enforcement in beta." />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <Input className="sm:max-w-xs" placeholder="Search name, phone, handle" value={q} onChange={(e) => setQ(e.target.value)} />
        <Segmented size="sm" className="sm:w-[440px]" value={filter} onChange={setFilter} options={[
          { value: 'all', label: 'All' }, { value: 'verified', label: 'Verified' }, { value: 'unverified', label: 'In review' },
          { value: 'suspended', label: 'Suspended' }, { value: 'denied', label: 'Denied' },
        ]} />
      </div>
      <Table head={['Member', 'Status', 'Role', 'Invited by', 'Invites', 'Joined', '']}>
        {list.map((u) => (
          <tr key={u.id} className="hover:bg-cream/40">
            <td className="px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Avatar user={u} size="xs" />
                <div>
                  <p className="font-bold">{u.firstName} {u.lastName}</p>
                  <p className="text-[11.5px] text-ink-faint">{prettyPhone(u.phone)} · @{u.social.handle}</p>
                </div>
              </div>
            </td>
            <td className="px-4 py-3"><Badge tone={TONE[u.status]}>{u.status.toUpperCase()}</Badge></td>
            <td className="px-4 py-3 capitalize">{u.role}</td>
            <td className="px-4 py-3">{displayName(byId.get(u.invitedBy ?? ''))}</td>
            <td className="px-4 py-3 tabular-nums">{invites.filter((i) => i.inviterId === u.id).length}</td>
            <td className="px-4 py-3 text-ink-soft">{timeAgo(u.createdAt)}</td>
            <td className="px-4 py-3 text-right">
              {u.status === 'suspended' || u.status === 'denied' ? (
                <button disabled={act.pending} onClick={() => act.run(u.id, 'verified')} className="font-bold text-forest hover:underline">Reinstate</button>
              ) : u.status === 'verified' ? (
                <button disabled={act.pending} onClick={() => act.run(u.id, 'suspended', 'Suspended after manual review.')} className="font-bold text-danger hover:underline">Suspend</button>
              ) : (
                <button disabled={act.pending} onClick={() => act.run(u.id, 'verified')} className="font-bold text-forest hover:underline">Approve</button>
              )}
            </td>
          </tr>
        ))}
      </Table>
    </div>
  )
}
