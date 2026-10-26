import { Check, Star, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { moderateReview } from '@/api'
import { Avatar } from '@/components/brand'
import { Badge, EmptyState, Stars } from '@/components/ui/Display'
import { Segmented } from '@/components/ui/Form'
import { useAction } from '@/components/ui/Toast'
import type { Review } from '@/lib/types'
import { displayName, timeAgo } from '@/lib/utils'
import { useDB } from '@/store/db'
import { useUsersMap } from '@/store/selectors'
import { AdminHeader } from './shared'

const TONE = { pending: 'amber', approved: 'sprout', rejected: 'danger' } as const

export default function AdminReviews() {
  const reviews = useDB((s) => s.reviews)
  const byId = useUsersMap()
  const [filter, setFilter] = useState<Review['status']>('pending')
  const act = useAction(moderateReview)
  const list = useMemo(() => reviews.filter((r) => r.status === filter).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [reviews, filter])

  return (
    <div>
      <AdminHeader title="Review moderation" subtitle="Reviews stay hidden until approved. Public display also waits for the minimum ride threshold." />
      <Segmented size="sm" className="mb-5 max-w-sm" value={filter} onChange={setFilter}
        options={[{ value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'rejected', label: 'Rejected' }]} />
      {list.length === 0 ? <EmptyState icon={<Star className="size-6" />} title={`No ${filter} reviews`} /> : (
        <div className="grid gap-3 md:grid-cols-2">
          {list.map((r) => {
            const from = byId.get(r.fromId)
            const to = byId.get(r.toId)
            return (
              <article key={r.id} className="card p-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-[13px]">
                    <Avatar user={from} size="xs" /> <b>{displayName(from)}</b> <span className="text-ink-faint">→</span> <Avatar user={to} size="xs" /> <b>{displayName(to)}</b>
                  </div>
                  <Badge tone={TONE[r.status]}>{r.status.toUpperCase()}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-2"><Stars value={r.rating} size={16} />{r.tag && <Badge tone="muted">{r.tag}</Badge>}</div>
                {r.comment && <p className="mt-2 text-[14px] text-ink-soft">“{r.comment}”</p>}
                <p className="mt-2 text-[11.5px] text-ink-faint">{timeAgo(r.createdAt)}</p>
                {r.status === 'pending' && (
                  <div className="mt-4 flex gap-2">
                    <button disabled={act.pending} onClick={() => act.run(r.id, 'rejected')} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full border border-sand text-[13px] font-bold text-danger hover:bg-danger-soft"><X className="size-4" /> Reject</button>
                    <button disabled={act.pending} onClick={() => act.run(r.id, 'approved')} className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-full bg-forest text-[13px] font-bold text-cream hover:bg-forest-soft"><Check className="size-4" /> Approve</button>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
