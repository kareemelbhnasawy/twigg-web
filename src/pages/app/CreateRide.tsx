import { CarFront, Globe, Lock, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createRide, deleteDraft, updateDraft, type RideInput } from '@/api'
import { VerifiedGate } from '@/layouts/guards'
import { PageHeader } from '@/components/PageHeader'
import { HubMapPicker } from '@/components/map/HubMapPicker'
import { FuelEstimateCard, HubSelect, PlateTag } from '@/components/rides'
import { Button } from '@/components/ui/Button'
import { Callout, EmptyState } from '@/components/ui/Display'
import { Field, Input, Segmented, Select, Stepper, Textarea } from '@/components/ui/Form'
import { useAction } from '@/components/ui/Toast'
import { LUGGAGE_LABEL } from '@/lib/constants'
import { FUEL_LABEL } from '@/lib/fuel'
import type { Luggage, Ride } from '@/lib/types'
import { cn, toDateInput, toTimeInput } from '@/lib/utils'
import { useConfig, useMe, useRide } from '@/store/selectors'

export default function CreateRide() {
  return (
    <VerifiedGate needsHost>
      <RideForm />
    </VerifiedGate>
  )
}

function defaultDeparture() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(8, 0, 0, 0)
  return d
}

function RideForm() {
  const me = useMe()!
  const config = useConfig()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { id } = useParams()
  const draft = useRide(id)
  const editing = !!draft && draft.status === 'draft' && draft.hostId === me.id

  const initial = useMemo(() => {
    const dep = draft ? new Date(draft.departAt) : defaultDeparture()
    return {
      carId: draft?.carId ?? me.cars[0]?.id ?? '',
      fromHubId: draft?.fromHubId ?? params.get('from') ?? '',
      toHubId: draft?.toHubId ?? params.get('to') ?? '',
      meetingNote: draft?.meetingNote ?? '',
      date: params.get('date') ?? toDateInput(dep),
      time: params.get('time') ?? toTimeInput(dep),
      timing: draft?.timing ?? ('flexible' as Ride['timing']),
      seats: draft?.seats ?? 3,
      luggage: draft?.luggage ?? ('small' as Luggage),
      notes: draft?.notes ?? '',
      visibility: draft?.visibility ?? ('public' as Ride['visibility']),
      hostIncluded: draft?.hostIncluded ?? true,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.id])
  const [f, setF] = useState(initial)
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))

  const car = me.cars.find((c) => c.id === f.carId)
  const maxSeats = car?.seats ?? 4

  const toInput = (): RideInput => ({
    carId: f.carId,
    fromHubId: f.fromHubId,
    toHubId: f.toHubId,
    meetingNote: f.meetingNote.trim(),
    departAt: new Date(`${f.date}T${f.time}`).toISOString(),
    timing: f.timing,
    seats: Math.min(f.seats, maxSeats),
    luggage: f.luggage,
    notes: f.notes.trim(),
    visibility: f.visibility,
    hostIncluded: f.hostIncluded,
  })

  const save = useAction(
    async (publish: boolean) => (editing ? updateDraft(draft!.id, toInput(), publish).then(() => draft!.id) : createRide(toInput(), publish).then((r) => r.id)),
    { onSuccess: (rideId) => navigate(`/app/rides/${rideId}`, { replace: true }) },
  )
  const remove = useAction(deleteDraft, { success: 'Draft deleted', onSuccess: () => navigate('/app/trips', { replace: true }) })

  const ready = f.carId && f.fromHubId && f.toHubId && f.date && f.time

  if (me.cars.length === 0) {
    return (
      <>
        <PageHeader back title="Offer a ride" />
        <EmptyState icon={<CarFront className="size-6" />} title="Add a car first" body="Each ride uses one of your cars. Add as many as you like — no verification needed."
          action={<Button to="/app/profile/cars" icon={<Plus className="size-4" />}>Add a car</Button>} />
      </>
    )
  }

  return (
    <div>
      <PageHeader back eyebrow={editing ? 'Draft' : 'Host'} title={editing ? 'Edit draft ride' : 'Offer a ride'} subtitle="Pick hubs from the list — it keeps matching dense in the beta." />

      <form className="space-y-7" onSubmit={(e) => { e.preventDefault(); save.run(true) }}>
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-forest">Car</h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {me.cars.map((c) => (
              <button type="button" key={c.id} onClick={() => { set('carId', c.id); set('seats', Math.min(f.seats, c.seats)) }}
                className={cn('flex items-center justify-between gap-3 rounded-2xl border-[1.5px] p-3.5 text-left transition',
                  f.carId === c.id ? 'border-forest bg-sprout-soft/50' : 'border-sand bg-paper hover:border-sand-deep')}>
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-bold">{c.make} {c.model}</span>
                  <span className="block text-[12px] text-ink-soft">{c.color} · {FUEL_LABEL[c.fuelType]} · {c.seats} seats</span>
                </span>
                <PlateTag plate={c.plate} />
              </button>
            ))}
            <Button type="button" variant="paper" to="/app/profile/cars" icon={<Plus className="size-4" />} className="h-auto min-h-16 rounded-2xl border-dashed">Add another car</Button>
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-forest">Route</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Start point">{(id) => <HubSelect id={id} value={f.fromHubId} onChange={(v) => set('fromHubId', v)} placeholder="Choose hub" exclude={f.toHubId} />}</Field>
            <Field label="Destination">{(id) => <HubSelect id={id} value={f.toHubId} onChange={(v) => set('toHubId', v)} placeholder="Choose hub" exclude={f.fromHubId} />}</Field>
          </div>
          <Field label="Meeting note" optional hint="Specific instructions, e.g. “Wait by the main gate”.">
            {(id) => <Input id={id} value={f.meetingNote} maxLength={120} placeholder="Wait by the main gate" onChange={(e) => set('meetingNote', e.target.value)} />}
          </Field>
          <HubMapPicker fromHubId={f.fromHubId} toHubId={f.toHubId} onFrom={(v) => set('fromHubId', v)} onTo={(v) => set('toHubId', v)} />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-forest">When</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">{(id) => <Input id={id} type="date" min={toDateInput(new Date())} value={f.date} onChange={(e) => set('date', e.target.value)} />}</Field>
            <Field label="Departure">{(id) => <Input id={id} type="time" step={300} value={f.time} onChange={(e) => set('time', e.target.value)} />}</Field>
          </div>
          <Field label="Timing" hint={f.timing === 'sharp' ? 'You leave on the dot — riders must be on time.' : 'A few minutes either way is fine.'}>
            {() => <Segmented value={f.timing} onChange={(v) => set('timing', v)} options={[{ value: 'flexible', label: '± Flexible' }, { value: 'sharp', label: '⏱ Sharp' }]} />}
          </Field>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-forest">Seats & comfort</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Seats available">{() => <Stepper value={Math.min(f.seats, maxSeats)} onChange={(v) => set('seats', v)} max={maxSeats} label="seats" />}</Field>
            <Field label="Luggage capacity">
              {(id) => (
                <Select id={id} value={f.luggage} onChange={(e) => set('luggage', e.target.value as Luggage)}>
                  {Object.entries(LUGGAGE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              )}
            </Field>
          </div>
          <Field label="Notes for riders" optional>
            {(id) => <Textarea id={id} value={f.notes} maxLength={280} placeholder="AC on, podcasts in the morning, no smoking…" onChange={(e) => set('notes', e.target.value)} />}
          </Field>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-forest">Visibility</h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {([
              ['public', <Globe key="g" className="size-5" />, 'Public', 'Listed in the rides feed for all verified passengers.'],
              ['private', <Lock key="l" className="size-5" />, 'Private', 'Hidden from the feed. Share by link; you review every request.'],
            ] as const).map(([v, icon, title, body]) => (
              <button type="button" key={v} onClick={() => set('visibility', v)}
                className={cn('flex gap-3 rounded-2xl border-[1.5px] p-4 text-left transition', f.visibility === v ? 'border-forest bg-forest text-cream' : 'border-sand bg-paper hover:border-sand-deep')}>
                <span className="mt-0.5">{icon}</span>
                <span>
                  <span className="block font-bold">{title}</span>
                  <span className={cn('block text-[12.5px]', f.visibility === v ? 'text-cream/75' : 'text-ink-soft')}>{body}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {f.fromHubId && f.toHubId && car && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-forest">Fuel split preview</h2>
            <FuelEstimateCard config={config} car={car} passengers={Math.min(f.seats, maxSeats)} editable
              ride={{ fromHubId: f.fromHubId, toHubId: f.toHubId, hostIncluded: f.hostIncluded }} onToggleHost={(v) => set('hostIncluded', v)} />
            <p className="text-[12px] text-ink-faint">Preview assumes every seat is filled. The final split updates as riders are accepted.</p>
          </section>
        )}

        {save.error && <Callout tone="danger">{save.error}</Callout>}

        <div className="sticky bottom-20 z-10 -mx-4 flex gap-3 border-t border-sand bg-cream/90 px-4 py-3 backdrop-blur lg:bottom-0">
          {editing && (
            <Button type="button" variant="ghost" className="text-danger" loading={remove.pending} onClick={() => remove.run(draft!.id)}>Delete</Button>
          )}
          <Button type="button" variant="paper" className="flex-1" disabled={!ready} loading={save.pending} onClick={() => save.run(false)}>
            Save draft
          </Button>
          <Button type="submit" variant="accent" className="flex-[1.6]" disabled={!ready} loading={save.pending}>Publish ride</Button>
        </div>
      </form>
    </div>
  )
}
