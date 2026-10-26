import { Smartphone } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/Display'
import { NATIVE_FEATURES } from '@/lib/constants'
import { useConfig } from '@/store/selectors'

// Placeholder messaging only. Each entry is gated by a native-only feature flag so
// none of these become accidental implementation scope in the web beta.
export default function ComingNative() {
  const config = useConfig()
  const features = NATIVE_FEATURES.filter((f) => config.flags.nativeOnly[f.key] !== false)
  return (
    <div>
      <PageHeader back eyebrow="Roadmap" title="Coming in the native app" subtitle="These need a native app to do right. They are intentionally not part of the web beta." />
      <section className="relative mb-6 overflow-hidden rounded-[28px] bg-forest p-6 text-cream">
        <div className="twig-pattern absolute inset-0 opacity-60" />
        <div className="relative flex items-center gap-4">
          <span className="flex size-14 items-center justify-center rounded-2xl bg-sprout text-forest"><Smartphone className="size-7" /></span>
          <div>
            <p className="font-display text-xl font-bold">Twigg for iOS & Android</p>
            <p className="text-[13px] text-cream/70">We'll let beta members know first.</p>
          </div>
        </div>
      </section>
      <div className="grid gap-3 sm:grid-cols-2">
        {features.map((f) => (
          <div key={f.key} className="card p-5 opacity-90">
            <div className="flex items-start justify-between gap-3">
              <p className="text-[15px] font-bold">{f.title}</p>
              <Badge tone="sky">NATIVE</Badge>
            </div>
            <p className="mt-1 text-[13px] text-ink-soft">{f.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
