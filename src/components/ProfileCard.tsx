import { CalendarDays, Mail } from 'lucide-react'
import type { ReactNode } from 'react'
import { Avatar, FacebookIcon, InstagramIcon } from '@/components/brand'
import { Badge, VerifiedBadge } from '@/components/ui/Display'
import { PERSONALITY } from '@/lib/constants'
import type { User } from '@/lib/types'
import { displayName, fullName } from '@/lib/utils'

// Shared header for own profile (self = true shows everything) and public profiles (privacy applied).
export function ProfileCard({ user, self, rides, rating, showRating, inviterName, actions }: {
  user: User
  self?: boolean
  rides: number
  rating: { avg: number; count: number } | null
  showRating: boolean
  inviterName?: string
  actions?: ReactNode
}) {
  const statusBadge = {
    verified: <Badge tone="sprout"><VerifiedBadge /> VERIFIED</Badge>,
    unverified: <Badge tone="amber">IN REVIEW</Badge>,
    denied: <Badge tone="danger">NOT APPROVED</Badge>,
    suspended: <Badge tone="danger">SUSPENDED</Badge>,
  }[user.status]
  const socialUrl = user.social.network === 'instagram' ? `https://instagram.com/${user.social.handle}` : `https://facebook.com/${user.social.handle}`

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-forest p-6 text-cream animate-rise sm:p-7">
      <div className="twig-pattern absolute inset-0 opacity-50" />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
        <Avatar user={user} size="xl" verified={user.status === 'verified'} className="self-start" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">{statusBadge}<Badge tone="muted" className="bg-cream/15 text-cream capitalize">{user.role}</Badge></div>
          <h1 className="mt-2 text-[30px] leading-tight font-bold">{self ? fullName(user) : displayName(user)}</h1>
          {self && user.displayName && <p className="text-[13px] text-cream/60">Shown to others as “{user.displayName}”</p>}
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-cream/75">
            <a href={socialUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-sprout">
              {user.social.network === 'instagram' ? <InstagramIcon className="size-4" /> : <FacebookIcon className="size-4" />}@{user.social.handle}
            </a>
            {(self || user.privacy.showEmail) && user.email && <span className="inline-flex items-center gap-1.5"><Mail className="size-3.5" />{user.email}</span>}
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />Joined {new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}</span>
          </div>
        </div>
        {actions}
      </div>
      <div className="relative mt-6 grid grid-cols-3 gap-2 border-t border-cream/15 pt-5 text-center">
        <div><p className="font-display text-2xl font-bold tabular-nums">{rides}</p><p className="text-[11.5px] text-cream/60">Rides</p></div>
        <div>
          {showRating && rating ? (
            <><p className="font-display text-2xl font-bold tabular-nums">{rating.avg.toFixed(1)}<span className="text-base text-sprout">★</span></p><p className="text-[11.5px] text-cream/60">{rating.count} reviews</p></>
          ) : (
            <><p className="font-display text-2xl font-bold">—</p><p className="text-[11.5px] text-cream/60">{rides < 3 ? 'Too new to rate' : 'No reviews'}</p></>
          )}
        </div>
        <div><p className="truncate font-display text-[17px] leading-8 font-bold">{inviterName ?? '—'}</p><p className="text-[11.5px] text-cream/60">Invited by</p></div>
      </div>
    </section>
  )
}

export function ComfortSection({ user, self }: { user: User; self?: boolean }) {
  const showPersonality = self || user.privacy.showPersonality
  const showMusic = self || user.privacy.showMusic
  const hasAny = user.bio || (showPersonality && user.personality) || user.interests.length || (showMusic && user.music.length)
  if (!hasAny) return null
  return (
    <section className="card space-y-5 p-5">
      {user.bio && <p className="text-[15px] leading-relaxed text-ink">“{user.bio}”</p>}
      {showPersonality && user.personality && (
        <div>
          <p className="eyebrow mb-2">Ride personality</p>
          <p className="inline-flex items-center gap-2 rounded-full bg-sprout-soft px-3.5 py-1.5 text-[13.5px] font-bold text-forest">
            {PERSONALITY[user.personality].emoji} {PERSONALITY[user.personality].label}
          </p>
        </div>
      )}
      {user.interests.length > 0 && (
        <div>
          <p className="eyebrow mb-2">Interests</p>
          <div className="flex flex-wrap gap-1.5">{user.interests.map((i) => <Badge key={i} className="h-7 px-3 text-[12.5px]">{i}</Badge>)}</div>
        </div>
      )}
      {showMusic && user.music.length > 0 && (
        <div>
          <p className="eyebrow mb-2">Music in the car</p>
          <div className="flex flex-wrap gap-1.5">{user.music.map((m) => <Badge key={m} tone="clay" className="h-7 px-3 text-[12.5px]">♪ {m}</Badge>)}</div>
        </div>
      )}
    </section>
  )
}

