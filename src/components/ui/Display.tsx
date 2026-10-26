import { BadgeCheck, Star } from 'lucide-react'
import type { ReactNode } from 'react'
import { RIDE_STATUS } from '@/lib/constants'
import type { RideStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

export type Tone = 'muted' | 'amber' | 'sprout' | 'clay' | 'forest' | 'danger' | 'sky'

const tones: Record<Tone, string> = {
  muted: 'bg-sand/70 text-ink-soft',
  amber: 'bg-amber-soft text-[#7a5310]',
  sprout: 'bg-sprout-soft text-forest',
  clay: 'bg-clay-soft text-[#8f3b12]',
  forest: 'bg-forest text-sprout',
  danger: 'bg-danger-soft text-danger',
  sky: 'bg-sky-soft text-sky',
}

export function Badge({ tone = 'muted', children, className, dot }: { tone?: Tone; children: ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn('inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-[11.5px] font-bold tracking-wide', tones[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  )
}

export function StatusPill({ status }: { status: RideStatus }) {
  const s = RIDE_STATUS[status]
  return (
    <Badge tone={s.tone} dot className={status === 'active' ? 'animate-pulse' : undefined}>
      {s.label.toUpperCase()}
    </Badge>
  )
}

export function VerifiedBadge({ className, label = false }: { className?: string; label?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-moss', className)} title="Verified by the Twigg circle">
      <BadgeCheck className="size-[1.05em] fill-sprout text-forest" strokeWidth={2.2} />
      {label && <span className="text-[12px] font-bold">Verified</span>}
    </span>
  )
}

export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value.toFixed(1)} out of 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} style={{ width: size, height: size }} className={i <= Math.round(value) ? 'fill-clay text-clay' : 'text-sand-deep'} />
      ))}
    </span>
  )
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: string; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-[var(--radius-xl2)] border-[1.5px] border-dashed border-sand-deep/70 px-6 py-10 text-center">
      {icon && <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-sprout-soft text-forest">{icon}</div>}
      <h3 className="text-lg font-semibold text-forest">{title}</h3>
      {body && <p className="mt-1 max-w-sm text-[13.5px] text-ink-soft">{body}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function Callout({ tone = 'amber', icon, title, children, action, className }: {
  tone?: Tone
  icon?: ReactNode
  title?: ReactNode
  children?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('flex gap-3 rounded-2xl p-4', tones[tone], className)}>
      {icon && <div className="mt-0.5 shrink-0">{icon}</div>}
      <div className="min-w-0 flex-1 text-[13.5px] leading-snug">
        {title && <p className="font-bold">{title}</p>}
        {children && <div className={cn(title && 'mt-0.5', 'opacity-90')}>{children}</div>}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </div>
  )
}

export function SectionTitle({ children, action, className }: { children: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cn('mb-3 flex items-end justify-between gap-3', className)}>
      <h2 className="text-[19px] font-semibold text-forest">{children}</h2>
      {action}
    </div>
  )
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div>
      <p className="eyebrow">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-forest tabular-nums">{value}</p>
      {sub && <p className="text-[12px] text-ink-soft">{sub}</p>}
    </div>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-xl bg-sand/70', className)} />
}
