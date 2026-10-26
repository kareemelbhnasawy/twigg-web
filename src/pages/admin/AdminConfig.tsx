import { useState } from 'react'
import { updateConfig } from '@/api'
import { Button } from '@/components/ui/Button'
import { Field, Input, Toggle } from '@/components/ui/Form'
import { useAction } from '@/components/ui/Toast'
import { egp, estimateFuel } from '@/lib/fuel'
import { hubById } from '@/lib/geo'
import { NATIVE_FEATURES } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'
import { useConfig } from '@/store/selectors'
import { AdminHeader } from './shared'

const SAMPLES: [string, string][] = [['zayed', 'newcairo'], ['october', 'smart'], ['maadi', 'newcairo'], ['heliopolis', 'capital']]

export default function AdminConfig() {
  const config = useConfig()
  const [f, setF] = useState(config)
  const save = useAction(updateConfig, { success: 'Benchmarks saved — new estimates use these values' })
  const num = (v: string) => Math.max(0, Number(v.replace(/[^\d.]/g, '')) || 0)
  const valid = f.fuelPrice.gasoline > 0 && f.fuelPrice.diesel > 0 && f.consumption.gasoline > 0 && f.consumption.diesel > 0 && f.maxInvites >= 1

  return (
    <div>
      <AdminHeader title="Fuel & config" subtitle={`Admin-editable constants. Last updated ${timeAgo(config.updatedAt)}.`}
        actions={<Button disabled={!valid} loading={save.pending} onClick={() => save.run(f)}>Save changes</Button>} />

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-6">
          <section className="card space-y-4 p-5">
            <h2 className="text-lg font-semibold text-forest">Average fuel price</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Gasoline (EGP / litre)">{(id) => <Input id={id} inputMode="decimal" value={f.fuelPrice.gasoline} onChange={(e) => setF({ ...f, fuelPrice: { ...f.fuelPrice, gasoline: num(e.target.value) } })} />}</Field>
              <Field label="Diesel (EGP / litre)">{(id) => <Input id={id} inputMode="decimal" value={f.fuelPrice.diesel} onChange={(e) => setF({ ...f, fuelPrice: { ...f.fuelPrice, diesel: num(e.target.value) } })} />}</Field>
            </div>
          </section>
          <section className="card space-y-4 p-5">
            <h2 className="text-lg font-semibold text-forest">Average consumption</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Gasoline (km / litre)">{(id) => <Input id={id} inputMode="decimal" value={f.consumption.gasoline} onChange={(e) => setF({ ...f, consumption: { ...f.consumption, gasoline: num(e.target.value) } })} />}</Field>
              <Field label="Diesel (km / litre)">{(id) => <Input id={id} inputMode="decimal" value={f.consumption.diesel} onChange={(e) => setF({ ...f, consumption: { ...f.consumption, diesel: num(e.target.value) } })} />}</Field>
            </div>
            <p className="text-[12.5px] text-ink-soft">Hybrid and electric are placeholders until the native app.</p>
          </section>
          <section className="card space-y-4 p-5">
            <h2 className="text-lg font-semibold text-forest">Support & community</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Support phone">{(id) => <Input id={id} value={f.supportPhone} onChange={(e) => setF({ ...f, supportPhone: e.target.value })} />}</Field>
              <Field label="Support hours">{(id) => <Input id={id} value={f.supportHours} onChange={(e) => setF({ ...f, supportHours: e.target.value })} />}</Field>
              <Field label="Invites per member">{(id) => <Input id={id} inputMode="numeric" value={f.maxInvites} onChange={(e) => setF({ ...f, maxInvites: Math.round(num(e.target.value)) })} />}</Field>
              <Field label="Min. rides before reviews show">{(id) => <Input id={id} inputMode="numeric" value={f.reviewDisplayThreshold} onChange={(e) => setF({ ...f, reviewDisplayThreshold: Math.round(num(e.target.value)) })} />}</Field>
            </div>
            <Toggle checked={f.flags.publicReviewsAfterThreshold} onChange={(v) => setF({ ...f, flags: { ...f.flags, publicReviewsAfterThreshold: v } })}
              label="Hide reviews until ride threshold" description="Feature flag: reviews only display once a member has enough completed rides." />
          </section>
          <section className="card space-y-3 p-5">
            <h2 className="text-lg font-semibold text-forest">Native-only feature flags</h2>
            <p className="text-[12.5px] text-ink-soft">These only control placeholder messaging on the “Coming in the native app” page. Nothing here is implemented in the web beta.</p>
            {NATIVE_FEATURES.map((n) => (
              <Toggle key={n.key} checked={f.flags.nativeOnly[n.key] !== false}
                onChange={(v) => setF({ ...f, flags: { ...f.flags, nativeOnly: { ...f.flags.nativeOnly, [n.key]: v } } })}
                label={n.title} />
            ))}
          </section>
        </div>

        <aside className="lg:sticky lg:top-10 lg:self-start">
          <div className="rounded-[var(--radius-xl2)] bg-forest p-5 text-cream">
            <p className="font-mono text-[11px] tracking-[0.14em] text-sprout uppercase">Live preview · gasoline, 3 riders + host</p>
            <p className="mt-2 font-mono text-[12px] text-cream/60">(distance ÷ km/L) × EGP/L ÷ people</p>
            <div className="mt-4 divide-y divide-cream/10">
              {SAMPLES.map(([a, b]) => {
                const e = estimateFuel(f, { fromHubId: a, toHubId: b, fuelType: 'gasoline', passengers: 3, hostIncluded: true })
                return (
                  <div key={a + b} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <p className="text-[13.5px] font-bold">{hubById(a).name} → {hubById(b).name}</p>
                      <p className="text-[11.5px] text-cream/55">{e.distanceKm} km · total {egp(e.total)}</p>
                    </div>
                    <p className="font-display text-xl font-bold text-sprout">{egp(e.perPerson)}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
