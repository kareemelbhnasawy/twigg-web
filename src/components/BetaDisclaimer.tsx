import { Banknote, Eye, Scale, ShieldCheck } from 'lucide-react'
import { acceptBetaDisclaimer } from '@/api'
import { LogoMark } from '@/components/brand'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Overlay'
import { useAction } from '@/components/ui/Toast'
import { useMe } from '@/store/selectors'

export const BETA_POINTS = [
  { icon: <Banknote className="size-5" />, title: 'No in-app payments', body: 'Twigg shows a fuel estimate only. You settle the fuel share offline — cash or transfer.' },
  { icon: <Eye className="size-5" />, title: 'No background tracking', body: 'We never track your location in the background. Nothing runs when the app is closed.' },
  { icon: <ShieldCheck className="size-5" />, title: 'Manual monitoring', body: 'Real people verify every member and review every report. Responses aren\'t instant.' },
  { icon: <Scale className="size-5" />, title: 'No automatic penalties or compensation', body: 'Cancellations are allowed. There are no automated fines, refunds or make-goods in beta.' },
]

// Unskippable (no close / no backdrop dismiss) but calm — shown once after first sign-in.
export function BetaDisclaimer() {
  const me = useMe()
  const { run, pending } = useAction(acceptBetaDisclaimer)
  const open = !!me && !me.betaAcceptedAt
  return (
    <Modal
      open={open}
      dismissible={false}
      title={
        <span className="flex items-center gap-3">
          <LogoMark className="size-9" />
          <span>Welcome to the Twigg beta</span>
        </span>
      }
      subtitle="A few honest notes before you ride."
      footer={
        <Button block size="lg" loading={pending} onClick={() => run()}>
          Agree & Continue
        </Button>
      }
    >
      <ul className="space-y-4">
        {BETA_POINTS.map((p) => (
          <li key={p.title} className="flex gap-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sprout-soft text-forest">{p.icon}</span>
            <span>
              <span className="block text-[14.5px] font-bold text-ink">{p.title}</span>
              <span className="block text-[13px] leading-snug text-ink-soft">{p.body}</span>
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-5 text-[12px] text-ink-faint">Twigg is strictly a technology facilitator. You can re-read these anytime in Settings → Beta Terms.</p>
    </Modal>
  )
}
