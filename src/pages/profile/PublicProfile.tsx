import { Flag, UserX } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { ComfortSection, ProfileCard } from '@/components/ProfileCard'
import { Avatar } from '@/components/brand'
import { ReportModal } from '@/components/ride-modals'
import { Badge, EmptyState, SectionTitle, Stars } from '@/components/ui/Display'
import { displayName, timeAgo } from '@/lib/utils'
import { useDB } from '@/store/db'
import { useConfig, useMe, useStats, useUser, useUsersMap } from '@/store/selectors'

export default function PublicProfile() {
  const { id } = useParams()
  const me = useMe()!
  const user = useUser(id)
  const users = useUsersMap()
  const config = useConfig()
  const stats = useStats(id)
  const inviter = useUser(user?.invitedBy)
  const allReviews = useDB((s) => s.reviews)
  const [report, setReport] = useState(false)
  const reviews = useMemo(() => allReviews.filter((r) => r.toId === id && r.status === 'approved').sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [allReviews, id])

  if (id === me.id) return <Navigate to="/app/profile" replace />
  if (!user) return <EmptyState icon={<UserX className="size-6" />} title="Member not found" />

  // Feature flag: reviews stay hidden until the member reaches the minimum ride count.
  const showReviews = !config.flags.publicReviewsAfterThreshold || stats.rides >= config.reviewDisplayThreshold

  return (
    <div className="space-y-6">
      <ProfileCard user={user} rides={stats.rides} rating={stats.rating} showRating={showReviews} inviterName={inviter ? displayName(inviter) : undefined} />
      <ComfortSection user={user} />

      <section>
        <SectionTitle>Reviews</SectionTitle>
        {!showReviews ? (
          <p className="rounded-2xl bg-sand/50 px-4 py-3 text-[13px] text-ink-soft">Reviews appear after {config.reviewDisplayThreshold} completed rides.</p>
        ) : reviews.length === 0 ? (
          <p className="text-[13.5px] text-ink-soft">No reviews yet.</p>
        ) : (
          <div className="card divide-y divide-sand">
            {reviews.map((r) => {
              const from = users.get(r.fromId)
              return (
                <div key={r.id} className="flex gap-3 p-4">
                  <Avatar user={from} size="sm" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <Stars value={r.rating} />
                      <span className="text-[11.5px] text-ink-faint">{timeAgo(r.createdAt)}</span>
                    </div>
                    {r.tag && <Badge className="mt-1.5" tone="sprout">{r.tag}</Badge>}
                    {r.comment && <p className="mt-1.5 text-[13.5px] text-ink-soft">{r.comment}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <button onClick={() => setReport(true)} className="flex items-center gap-2 text-[13px] font-bold text-ink-soft hover:text-clay">
        <Flag className="size-4" /> Report {user.firstName}
      </button>
      <ReportModal open={report} onClose={() => setReport(false)} aboutUserId={user.id} />
    </div>
  )
}
