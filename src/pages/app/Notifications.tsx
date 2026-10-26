import { Banknote, Bell, CarFront, CheckCheck, Inbox, ShieldCheck, Sparkles, Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { markAllNotificationsRead, markNotificationRead } from '@/api'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Display'
import type { Notification } from '@/lib/types'
import { cn, timeAgo } from '@/lib/utils'
import { useMyNotifications } from '@/store/selectors'

const ICON: Record<Notification['kind'], { icon: typeof Bell; tone: string }> = {
  request: { icon: Inbox, tone: 'bg-clay-soft text-[#8f3b12]' },
  ride: { icon: CarFront, tone: 'bg-sprout-soft text-forest' },
  verification: { icon: ShieldCheck, tone: 'bg-forest text-sprout' },
  settlement: { icon: Banknote, tone: 'bg-amber-soft text-[#7a5310]' },
  review: { icon: Star, tone: 'bg-clay-soft text-clay' },
  system: { icon: Sparkles, tone: 'bg-sky-soft text-sky' },
}

export default function Notifications() {
  const items = useMyNotifications()
  const navigate = useNavigate()
  const unread = items.filter((n) => !n.read).length

  return (
    <div>
      <PageHeader
        title="Notifications"
        subtitle={unread ? `${unread} unread` : 'You\'re all caught up.'}
        actions={unread > 0 && <Button size="sm" variant="paper" icon={<CheckCheck className="size-4" />} onClick={markAllNotificationsRead}>Mark all read</Button>}
      />
      {items.length === 0 ? (
        <EmptyState icon={<Bell className="size-6" />} title="Nothing yet" body="Ride updates, requests and verification news will show up here." />
      ) : (
        <div className="card divide-y divide-sand overflow-hidden">
          {items.map((n) => {
            const { icon: Icon, tone } = ICON[n.kind]
            return (
              <button key={n.id} onClick={() => { markNotificationRead(n.id); if (n.link) navigate(n.link) }}
                className={cn('flex w-full items-start gap-3.5 p-4 text-left transition hover:bg-cream/50', !n.read && 'bg-sprout-soft/25')}>
                <span className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', tone)}><Icon className="size-[18px]" /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-[14px] font-bold">{n.title}</span>
                    <span className="shrink-0 text-[11.5px] text-ink-faint">{timeAgo(n.createdAt)}</span>
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-ink-soft">{n.body}</span>
                </span>
                {!n.read && <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-clay" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
