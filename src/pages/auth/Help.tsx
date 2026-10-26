import { ChevronDown, Phone } from 'lucide-react'
import { AuthShell } from '@/components/AuthShell'
import { Button } from '@/components/ui/Button'
import { useConfig } from '@/store/selectors'

const FAQ = [
  ['I didn\'t receive the SMS code', 'Wait 30 seconds and tap "Resend code". Make sure you entered the number without the leading zero issue — we accept 010…, 011…, 012… and 015… numbers.'],
  ['I changed my mobile number', 'Call support from your old number if you still have it, or from your new one with your Instagram/Facebook handle ready. We\'ll verify and move your account manually.'],
  ['"No Twigg account uses this number"', 'Twigg is invite-only. If you haven\'t signed up yet, ask a member to send you an invite link or code.'],
  ['My invite says it\'s already used', 'Each invite works exactly once. Ask your friend to generate a new one from Profile → Invites (up to 5 per member).'],
  ['My account is suspended', 'Suspensions are manual and follow a review. Call support to understand next steps.'],
]

export default function Help() {
  const config = useConfig()
  return (
    <AuthShell back>
      <p className="eyebrow">Support</p>
      <h1 className="mt-2 text-[38px] leading-none font-bold text-forest">Unable to sign in?</h1>
      <p className="mt-3 text-[15px] text-ink-soft">Our beta support team handles every case by hand. For anything urgent, call us.</p>

      <a href={`tel:${config.supportPhone.replace(/\s/g, '')}`} className="mt-6 flex items-center gap-4 rounded-[var(--radius-xl2)] bg-forest p-5 text-cream transition hover:bg-forest-soft">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-sprout text-forest"><Phone className="size-5" /></span>
        <span>
          <span className="block font-display text-2xl font-bold tracking-tight">{config.supportPhone}</span>
          <span className="block text-[12.5px] text-cream/70">{config.supportHours}</span>
        </span>
      </a>

      <div className="mt-8 space-y-2">
        {FAQ.map(([q, a]) => (
          <details key={q} className="group rounded-2xl border border-sand bg-paper px-4 py-3.5 open:pb-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[14px] font-bold text-ink">
              {q}
              <ChevronDown className="size-4 shrink-0 text-ink-soft transition group-open:rotate-180" />
            </summary>
            <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{a}</p>
          </details>
        ))}
      </div>

      <div id="terms" className="mt-8 rounded-2xl bg-sand/50 p-4 text-[12.5px] leading-relaxed text-ink-soft">
        <p className="font-bold text-ink">Terms & Privacy (summary)</p>
        <p className="mt-1" id="privacy">
          Twigg is strictly a technology facilitator that helps members coordinate shared rides. Twigg does not process payments, does not track your location in the background,
          and does not store ID documents. Profiles are reviewed manually. Full terms will be published before public launch.
        </p>
      </div>

      <Button className="mt-8" variant="outline" size="lg" block to="/welcome">Back to sign in</Button>
    </AuthShell>
  )
}
