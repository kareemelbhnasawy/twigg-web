import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function AdminHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[30px] leading-tight font-bold text-forest">{title}</h1>
        {subtitle && <p className="mt-1 text-[14px] text-ink-soft">{subtitle}</p>}
      </div>
      {actions}
    </header>
  )
}

export function StatTile({ label, value, sub, tone = 'paper', children }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'paper' | 'forest' | 'clay'; children?: ReactNode }) {
  return (
    <div className={cn('rounded-[var(--radius-xl2)] p-5',
      tone === 'forest' ? 'bg-forest text-cream' : tone === 'clay' ? 'bg-clay text-white' : 'card')}>
      <p className={cn('font-mono text-[11px] tracking-[0.12em] uppercase', tone === 'paper' ? 'text-ink-faint' : 'opacity-70')}>{label}</p>
      <p className="mt-2 font-display text-[38px] leading-none font-bold tabular-nums">{value}</p>
      {sub && <p className={cn('mt-1.5 text-[12.5px]', tone === 'paper' ? 'text-ink-soft' : 'opacity-75')}>{sub}</p>}
      {children}
    </div>
  )
}

export function Table({ head, children }: { head: ReactNode[]; children: ReactNode }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-[13px]">
        <thead>
          <tr className="border-b border-sand bg-cream/60">
            {head.map((h, i) => <th key={i} className="px-4 py-3 text-[11px] font-bold tracking-wider text-ink-faint uppercase">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-sand">{children}</tbody>
      </table>
    </div>
  )
}
