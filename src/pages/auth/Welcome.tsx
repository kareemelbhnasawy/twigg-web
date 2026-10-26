import { ArrowRight, Fuel, ShieldCheck, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AuthShell, RouteTicker } from '@/components/AuthShell'
import { Button } from '@/components/ui/Button'

const PILLARS = [
  { icon: <Users className="size-4" />, text: 'Invite-only — every member is vouched for' },
  { icon: <ShieldCheck className="size-4" />, text: 'Manually verified by the Twigg team' },
  { icon: <Fuel className="size-4" />, text: 'Fair fuel split, settled offline' },
]

export default function Welcome() {
  return (
    <AuthShell>
      <div className="animate-rise">
        <p className="eyebrow">Cairo · Closed beta</p>
        <h1 className="mt-3 text-[44px] leading-[0.98] font-bold text-forest sm:text-[52px]">
          Your commute,<br />shared with people <span className="relative whitespace-nowrap text-clay">
            you trust.
            <svg viewBox="0 0 200 12" className="absolute -bottom-1.5 left-0 w-full" aria-hidden>
              <path d="M2 9 C 50 2, 120 2, 198 7" stroke="var(--color-sprout)" strokeWidth="4" fill="none" strokeLinecap="round" />
            </svg>
          </span>
        </h1>
        <p className="mt-5 text-[15.5px] leading-relaxed text-ink-soft">
          Twigg matches verified commuters heading the same way — Zayed to New Cairo, October to Smart Village, and beyond. Split fuel, skip the stress.
        </p>
        <ul className="mt-6 space-y-2.5">
          {PILLARS.map((p) => (
            <li key={p.text} className="flex items-center gap-3 text-[14px] font-semibold text-ink">
              <span className="flex size-8 items-center justify-center rounded-full bg-sprout-soft text-forest">{p.icon}</span>
              {p.text}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-9 space-y-3 animate-rise [animation-delay:120ms]">
        <Button to="/signin" size="lg" block iconRight={<ArrowRight className="size-5" />}>Sign in</Button>
        <Button to="/signup" size="lg" variant="outline" block>I have an invite — Sign up</Button>
        <p className="pt-2 text-center">
          <Link to="/help" className="text-[13px] font-semibold text-ink-soft underline-offset-2 hover:text-forest hover:underline">
            Unable to sign in?
          </Link>
        </p>
      </div>

      <div className="mt-10 lg:hidden"><RouteTicker /></div>
    </AuthShell>
  )
}
