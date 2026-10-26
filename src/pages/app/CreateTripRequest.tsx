import { Globe, Lock } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createTripRequest } from '@/api'
import { PageHeader } from '@/components/PageHeader'
import { HubMapPicker } from '@/components/map/HubMapPicker'
import { HubSelect } from '@/components/rides'
import { Button } from '@/components/ui/Button'
import { Callout } from '@/components/ui/Display'
import { Chip, Field, Input, Segmented, Select, Stepper, Textarea } from '@/components/ui/Form'
import { useAction } from '@/components/ui/Toast'
import { VerifiedGate } from '@/layouts/guards'
import { TRIP_PREFERENCES } from '@/lib/constants'
import { hubById } from '@/lib/geo'
import type { Timing, Visibility } from '@/lib/types'
import { cn, displayName, fmtDateTime, toDateInput } from '@/lib/utils'
import { useDB } from '@/store/db'
import { seatsTaken, useMe, useUsersMap } from '@/store/selectors'

export default function CreateTripRequest() {
  return (
    <VerifiedGate>
      <TripForm />
    </VerifiedGate>
  )
}

function TripForm() {
  const me = useMe()!
  const navigate = useNavigate()
  const rides = useDB((s) => s.rides)
  const seatRequests = useDB((s) => s.seatRequests)
  const users = useUsersMap()
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)

  const [f, setF] = useState({
    fromHubId: '', toHubId: '', meetingNote: '', date: toDateInput(tomorrow), windowStart: '07:30', windowEnd: '08:30',
    timing: 'flexible' as Timing, seats: 1, preferences: [] as string[], notes: '', visibility: 'public' as Visibility, targetRideId: '',
  })
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))

  // Private requests may target a specific upcoming ride (including private rides) on the same route.
  const targetable = useMemo(() => rides.filter((r) =>
    r.hostId !== me.id && ['pending', 'confirmed'].includes(r.status) && new Date(r.departAt).getTime() > Date.now() &&
    (!f.fromHubId || r.fromHubId === f.fromHubId) && (!f.toHubId || r.toHubId === f.toHubId) &&
    r.seats - seatsTaken({ seatRequests }, r.id) >= f.seats), [rides, seatRequests, me.id, f.fromHubId, f.toHubId, f.seats])

  const submit = useAction(createTripRequest, {
    success: 'Trip request posted',
    onSuccess: (t) => navigate(`/app/requests/${t.id}`, { replace: true }),
  })

  const ready = f.fromHubId && f.toHubId && f.date && f.windowStart && f.windowEnd

  return (
    <div>
      <PageHeader back eyebrow="Passenger" title="Request a trip" subtitle="Tell the circle where you're headed. Hosts with matching rides can offer you a seat." />
      <form className="space-y-7" onSubmit={(e) => {
        e.preventDefault()
        const { targetRideId, ...rest } = f
        submit.run({ ...rest, targetRideId: f.visibility === 'private' && targetRideId ? targetRideId : undefined })
      }}>
        <section className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="From">{(id) => <HubSelect id={id} value={f.fromHubId} onChange={(v) => set('fromHubId', v)} placeholder="Choose hub" exclude={f.toHubId} />}</Field>
            <Field label="Destination">{(id) => <HubSelect id={id} value={f.toHubId} onChange={(v) => set('toHubId', v)} placeholder="Choose hub" exclude={f.fromHubId} />}</Field>
          </div>
          <HubMapPicker fromHubId={f.fromHubId} toHubId={f.toHubId} onFrom={(v) => set('fromHubId', v)} onTo={(v) => set('toHubId', v)} />
          <Field label="Meeting note" optional>
            {(id) => <Input id={id} value={f.meetingNote} maxLength={120} placeholder="I can walk to Arkan Plaza" onChange={(e) => set('meetingNote', e.target.value)} />}
          </Field>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-forest">Preferred time window</h2>
          <Field label="Date">{(id) => <Input id={id} type="date" min={toDateInput(new Date())} value={f.date} onChange={(e) => set('date', e.target.value)} />}</Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Earliest">{(id) => <Input id={id} type="time" step={300} value={f.windowStart} onChange={(e) => set('windowStart', e.target.value)} />}</Field>
            <Field label="Latest" error={f.windowEnd <= f.windowStart ? 'Must be after earliest' : null}>
              {(id) => <Input id={id} type="time" step={300} value={f.windowEnd} onChange={(e) => set('windowEnd', e.target.value)} />}
            </Field>
          </div>
          <Field label="Timing">{() => <Segmented value={f.timing} onChange={(v) => set('timing', v)} options={[{ value: 'flexible', label: '± Flexible' }, { value: 'sharp', label: '⏱ Sharp' }]} />}</Field>
          <Field label="Seats needed">{() => <Stepper value={f.seats} onChange={(v) => set('seats', v)} max={4} label={f.seats === 1 ? 'seat' : 'seats'} />}</Field>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-forest">Preferences <span className="text-sm font-medium text-ink-faint">(optional)</span></h2>
          <div className="flex flex-wrap gap-2">
            {TRIP_PREFERENCES.map((p) => (
              <Chip key={p} selected={f.preferences.includes(p)}
                onClick={() => set('preferences', f.preferences.includes(p) ? f.preferences.filter((x) => x !== p) : [...f.preferences, p])}>
                {p}
              </Chip>
            ))}
          </div>
          <Textarea aria-label="Notes" value={f.notes} maxLength={280} placeholder="Anything hosts should know?" onChange={(e) => set('notes', e.target.value)} />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-forest">Visibility</h2>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {([
              ['public', <Globe key="g" className="size-5" />, 'Public', 'Visible to all verified hosts in the requests feed.'],
              ['private', <Lock key="l" className="size-5" />, 'Private', 'Hidden from the feed. Target a specific ride or share by link.'],
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
          {f.visibility === 'private' && (
            <Field label="Target a specific ride" optional hint={targetable.length ? 'The host gets your request directly.' : 'No upcoming rides on this route — you can still share the link.'}>
              {(id) => (
                <Select id={id} value={f.targetRideId} onChange={(e) => set('targetRideId', e.target.value)}>
                  <option value="">Don't target — share by link</option>
                  {targetable.map((r) => (
                    <option key={r.id} value={r.id}>
                      {displayName(users.get(r.hostId))} · {hubById(r.fromHubId).name} → {hubById(r.toHubId).name} · {fmtDateTime(r.departAt)}{r.visibility === 'private' ? ' 🔒' : ''}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}
        </section>

        {submit.error && <Callout tone="danger">{submit.error}</Callout>}

        <div className="sticky bottom-20 z-10 -mx-4 border-t border-sand bg-cream/90 px-4 py-3 backdrop-blur lg:bottom-0">
          <Button type="submit" variant="accent" size="lg" block disabled={!ready || f.windowEnd <= f.windowStart} loading={submit.pending}>
            Post trip request
          </Button>
        </div>
      </form>
    </div>
  )
}
