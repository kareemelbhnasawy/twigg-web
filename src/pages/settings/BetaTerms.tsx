import { BETA_POINTS } from '@/components/BetaDisclaimer'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/Display'
import { useMe } from '@/store/selectors'

const SCOPE = [
  ['Payments', 'Offline settlement status only', 'In-app payments, wallet, transaction processing'],
  ['Tracking', 'No background tracking', 'Background tracking, wake-lock loops, background sync'],
  ['Verification', 'Manual admin approval', 'Automated identity verification decisioning'],
  ['Monitoring', 'Manual admin review', 'Automated penalties, automatic compensation'],
  ['Fuel', 'Estimate and split display', 'Payment collection or financial settlement automation'],
  ['Safety', 'Incident forms and manual moderation', 'Automated suspension or enforcement'],
]

export default function BetaTerms() {
  const me = useMe()!
  return (
    <div>
      <PageHeader back eyebrow="Settings" title="Beta Terms & Disclosures" subtitle="What Twigg does — and deliberately doesn't do — during the beta." />

      {me.betaAcceptedAt && (
        <p className="mb-6 inline-flex items-center gap-2 rounded-full bg-sprout-soft px-3.5 py-1.5 text-[12.5px] font-semibold text-forest">
          ✓ You agreed on {new Date(me.betaAcceptedAt).toLocaleString('en-GB', { dateStyle: 'long', timeStyle: 'short' })}
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {BETA_POINTS.map((p) => (
          <div key={p.title} className="card p-5">
            <span className="flex size-10 items-center justify-center rounded-xl bg-sprout-soft text-forest">{p.icon}</span>
            <p className="mt-3 text-[15px] font-bold">{p.title}</p>
            <p className="mt-1 text-[13px] leading-snug text-ink-soft">{p.body}</p>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold text-forest">Beta scope</h2>
        <div className="card overflow-hidden">
          <div className="grid grid-cols-[0.8fr_1fr_1fr] gap-3 border-b border-sand bg-cream/60 px-4 py-2.5 text-[11.5px] font-bold tracking-wide text-ink-faint uppercase">
            <span>Area</span><span>In beta</span><span>Not in beta</span>
          </div>
          {SCOPE.map(([area, inScope, out]) => (
            <div key={area} className="grid grid-cols-[0.8fr_1fr_1fr] gap-3 border-b border-sand px-4 py-3 text-[13px] last:border-0">
              <span className="font-bold">{area}</span>
              <span className="text-forest">{inScope}</span>
              <span className="text-ink-faint line-through decoration-ink-faint/40">{out}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 space-y-3 text-[13.5px] leading-relaxed text-ink-soft">
        <h2 className="text-lg font-semibold text-forest">Plain-language terms</h2>
        <p><Badge tone="forest" className="mr-1.5">1</Badge>Twigg is strictly a technology facilitator. Hosts and riders arrange rides between themselves.</p>
        <p><Badge tone="forest" className="mr-1.5">2</Badge>Fuel estimates are guidance only, based on admin-set benchmarks. Settle any amount offline, by mutual agreement.</p>
        <p><Badge tone="forest" className="mr-1.5">3</Badge>Membership is invite-only and reviewed by hand. We don't collect or store ID documents.</p>
        <p><Badge tone="forest" className="mr-1.5">4</Badge>Reports are reviewed manually. Any suspension is a human decision, never automatic.</p>
      </section>
    </div>
  )
}
