import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/brand'

const ROUTES = [
  ['Sheikh Zayed', 'New Cairo'],
  ['6th of October', 'Smart Village'],
  ['Maadi', 'New Cairo'],
  ['Heliopolis', 'New Capital'],
  ['El Rehab', 'Downtown'],
  ['Mohandessin', 'Smart Village'],
]

export function RouteTicker({ dark = false }: { dark?: boolean }) {
  const items = [...ROUTES, ...ROUTES]
  return (
    <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
      <div className="flex w-max animate-[ticker_32s_linear_infinite] gap-2.5">
        {items.map(([a, b], i) => (
          <span key={i} className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-semibold whitespace-nowrap ${dark ? 'bg-cream/10 text-cream' : 'border border-sand bg-paper text-ink-soft'}`}>
            {a} <span className="text-clay">→</span> {b}
          </span>
        ))}
      </div>
      <style>{'@keyframes ticker { to { transform: translateX(-50%); } }'}</style>
    </div>
  )
}

// Split layout on desktop: brand story on the left, form on the right. Single column on phones.
export function AuthShell({ children, back, aside }: { children: ReactNode; back?: string | boolean; aside?: ReactNode }) {
  const navigate = useNavigate()
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-forest p-12 text-cream lg:flex lg:flex-col">
        <div className="twig-pattern absolute inset-0 opacity-80" />
        <div className="absolute -right-24 -bottom-24 size-[420px] rounded-full bg-sprout/10 blur-3xl" />
        <Link to="/welcome" className="relative"><Logo light /></Link>
        <div className="relative mt-auto">
          {aside ?? (
            <>
              <p className="font-mono text-[11px] tracking-[0.16em] text-sprout uppercase">Invite-only · Cairo beta</p>
              <h2 className="mt-4 max-w-md text-[52px] leading-[0.98] font-bold text-cream">
                Same road.<br />Same circle.<br /><span className="text-sprout italic">Half the fuel.</span>
              </h2>
              <p className="mt-5 max-w-sm text-[15px] text-cream/70">
                Twigg connects verified commuters who already know someone in common — so every shared ride starts with trust.
              </p>
            </>
          )}
        </div>
        <div className="relative mt-10"><RouteTicker dark /></div>
      </aside>
      <main className="flex min-h-dvh flex-col px-5 py-6 sm:px-10 lg:py-10">
        <div className="flex h-10 items-center justify-between">
          {back ? (
            <button
              onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
              className="-ml-2 inline-flex items-center gap-1 rounded-full py-1.5 pr-3 pl-1.5 text-[13px] font-semibold text-ink-soft hover:bg-sand/60"
            >
              <ChevronLeft className="size-4" /> Back
            </button>
          ) : <span />}
          <Link to="/welcome" className="lg:hidden"><Logo /></Link>
        </div>
        <div className="mx-auto flex w-full max-w-[420px] flex-1 flex-col justify-center py-8">{children}</div>
      </main>
    </div>
  )
}
