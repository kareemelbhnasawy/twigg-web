import { Check, ExternalLink, UserCheck, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { setUserStatus } from '@/api'
import { Avatar, FacebookIcon, InstagramIcon } from '@/components/brand'
import { Button } from '@/components/ui/Button'
import { Badge, EmptyState } from '@/components/ui/Display'
import { Field, Textarea } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Overlay'
import { useAction } from '@/components/ui/Toast'
import { PERSONALITY } from '@/lib/constants'
import type { User } from '@/lib/types'
import { ageFrom, displayName, prettyPhone, timeAgo } from '@/lib/utils'
import { useDB } from '@/store/db'
import { completedRideCount, useUsersMap } from '@/store/selectors'
import { AdminHeader } from './shared'

export default function AdminVerification() {
  const users = useDB((s) => s.users)
  const rides = useDB((s) => s.rides)
  const seatRequests = useDB((s) => s.seatRequests)
  const byId = useUsersMap()
  const queue = useMemo(() => users.filter((u) => u.status === 'unverified').sort((a, b) => a.createdAt.localeCompare(b.createdAt)), [users])
  const [deny, setDeny] = useState<User | null>(null)
  const [note, setNote] = useState('')
  const act = useAction(setUserStatus)

  return (
    <div>
      <AdminHeader title="Verification queue" subtitle="Social verification: check who vouched for them and that their social profile is real. No ID documents are collected." />
      {queue.length === 0 ? (
        <EmptyState icon={<UserCheck className="size-6" />} title="Queue is clear" body="New sign-ups will appear here for manual review." />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {queue.map((u) => {
            const inviter = byId.get(u.invitedBy ?? '')
            const inviterRides = inviter ? completedRideCount({ rides, seatRequests, users }, inviter.id) : 0
            const socialUrl = u.social.network === 'instagram' ? `https://instagram.com/${u.social.handle}` : `https://facebook.com/${u.social.handle}`
            return (
              <article key={u.id} className="card flex flex-col p-5">
                <div className="flex items-start gap-4">
                  <Avatar user={u} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[17px] font-bold">{u.firstName} {u.lastName}{u.displayName && <span className="font-medium text-ink-soft"> “{u.displayName}”</span>}</p>
                    <p className="text-[12.5px] text-ink-soft">{ageFrom(u.birthdate)} yrs · {prettyPhone(u.phone)} · signed up {timeAgo(u.createdAt)}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <Badge tone="muted" className="capitalize">{u.role}</Badge>
                      <Badge tone={u.hasLicense ? 'sprout' : 'muted'}>{u.hasLicense ? 'HAS LICENSE' : 'NO LICENSE'}</Badge>
                      {u.cars.length > 0 && <Badge tone="sky">{u.cars.length} CAR{u.cars.length > 1 ? 'S' : ''}</Badge>}
                      {!u.avatar && <Badge tone="amber">NO PHOTO</Badge>}
                    </div>
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-2.5 text-[13px]">
                  <div className="rounded-xl bg-cream p-3">
                    <dt className="text-[11px] font-bold tracking-wide text-ink-faint uppercase">Invited by</dt>
                    <dd className="mt-1 flex items-center gap-2 font-bold">
                      <Avatar user={inviter} size="xs" /> {displayName(inviter)}
                    </dd>
                    <dd className="mt-0.5 text-[11.5px] text-ink-soft">{inviter?.status} · {inviterRides} rides · code {u.inviteCodeUsed}</dd>
                  </div>
                  <div className="rounded-xl bg-cream p-3">
                    <dt className="text-[11px] font-bold tracking-wide text-ink-faint uppercase">Social profile</dt>
                    <dd className="mt-1">
                      <a href={socialUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-bold text-forest hover:underline">
                        {u.social.network === 'instagram' ? <InstagramIcon className="size-4" /> : <FacebookIcon className="size-4" />}@{u.social.handle}<ExternalLink className="size-3" />
                      </a>
                    </dd>
                    <dd className="mt-0.5 text-[11.5px] text-ink-soft">Open and check it looks genuine</dd>
                  </div>
                </dl>

                {(u.personality || u.interests.length > 0 || u.bio) && (
                  <p className="mt-3 text-[12.5px] text-ink-soft">
                    {u.personality && `${PERSONALITY[u.personality].emoji} ${PERSONALITY[u.personality].short} · `}{u.interests.join(', ')}{u.bio && ` · “${u.bio}”`}
                  </p>
                )}

                <div className="mt-5 flex gap-2.5 pt-1">
                  <Button variant="paper" className="flex-1 text-danger" icon={<X className="size-4" />} onClick={() => { setDeny(u); setNote('') }}>Deny</Button>
                  <Button className="flex-[1.5]" icon={<Check className="size-4" />} loading={act.pending} onClick={() => act.run(u.id, 'verified')}>Approve</Button>
                </div>
              </article>
            )
          })}
        </div>
      )}

      <Modal open={!!deny} onClose={() => setDeny(null)} title={`Deny ${deny?.firstName}?`} subtitle="They'll be notified and can contact support."
        footer={<Button variant="danger" block loading={act.pending} onClick={async () => { await act.run(deny!.id, 'denied', note); setDeny(null) }}>Deny verification</Button>}>
        <Field label="Note to member" optional>{(id) => <Textarea id={id} value={note} onChange={(e) => setNote(e.target.value)} placeholder="We couldn't confirm your social profile…" />}</Field>
      </Modal>
    </div>
  )
}
