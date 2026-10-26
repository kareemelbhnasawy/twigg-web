import { Banknote, Check, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  cancelRide, confirmStart, markSettled, reportIncident, requestSeat, submitReview,
} from '@/api'
import { Avatar } from '@/components/brand'
import { Button } from '@/components/ui/Button'
import { Callout, Stars } from '@/components/ui/Display'
import { Checkbox, Chip, Field, Input, Stepper, Textarea } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Overlay'
import { useAction } from '@/components/ui/Toast'
import { INCIDENT_LABEL, REVIEW_TAGS, SAFETY_CHECKLIST } from '@/lib/constants'
import { egp } from '@/lib/fuel'
import type { IncidentCategory, SettlementMethod, User } from '@/lib/types'
import { cn, displayName } from '@/lib/utils'

export function RequestSeatModal({ open, onClose, rideId, maxSeats, perSeat, hostName, isPrivate }: {
  open: boolean
  onClose: () => void
  rideId: string
  maxSeats: number
  perSeat: number | null
  hostName: string
  isPrivate: boolean
}) {
  const [seats, setSeats] = useState(1)
  const [message, setMessage] = useState('')
  const { run, pending } = useAction(requestSeat, { success: `Request sent to ${hostName}`, onSuccess: onClose })
  return (
    <Modal open={open} onClose={onClose} title="Request a seat" subtitle={isPrivate ? `${hostName} reviews every request on private rides.` : `${hostName} will accept or decline your request.`}
      footer={<Button block size="lg" loading={pending} onClick={() => run(rideId, seats, message)}>Send request</Button>}>
      <div className="space-y-4">
        <Field label="Seats">{() => <Stepper value={seats} onChange={setSeats} max={Math.max(1, maxSeats)} label={seats === 1 ? 'seat' : 'seats'} />}</Field>
        <Field label="Message to host" optional>
          {(id) => <Textarea id={id} value={message} maxLength={200} onChange={(e) => setMessage(e.target.value)} placeholder="Hi! I can be at the pickup 5 min early." />}
        </Field>
        {perSeat !== null && (
          <div className="flex items-center justify-between rounded-2xl bg-cream px-4 py-3">
            <span className="text-[13px] font-semibold text-ink-soft">Your estimated fuel share</span>
            <span className="font-display text-xl font-bold text-forest">≈ {egp(perSeat * seats)}</span>
          </div>
        )}
        <p className="text-[12px] font-semibold text-[#6d4a0c]">Estimate only. Twigg does not process payments. Settle offline.</p>
      </div>
    </Modal>
  )
}

export function SafetyChecklistModal({ open, onClose, rideId, onConfirmed }: { open: boolean; onClose: () => void; rideId: string; onConfirmed?: () => void }) {
  const [checked, setChecked] = useState<string[]>([])
  useEffect(() => { if (open) setChecked([]) }, [open])
  const { run, pending } = useAction(confirmStart, { success: 'You confirmed — waiting for everyone else', onSuccess: () => { onClose(); onConfirmed?.() } })
  const all = checked.length === SAFETY_CHECKLIST.length
  return (
    <Modal open={open} onClose={onClose}
      title={<span className="flex items-center gap-2"><ShieldCheck className="size-6 text-moss" /> Pre-ride checklist</span>}
      subtitle="Take ten seconds before you go. Every rider confirms before the ride starts."
      footer={<Button block size="lg" variant="accent" disabled={!all} loading={pending} onClick={() => run(rideId)}>Confirm & start ride</Button>}>
      <div className="space-y-2.5">
        {SAFETY_CHECKLIST.map((item) => {
          const on = checked.includes(item.id)
          return (
            <button key={item.id} type="button" onClick={() => setChecked(on ? checked.filter((x) => x !== item.id) : [...checked, item.id])}
              className={cn('flex w-full items-start gap-3 rounded-2xl border-[1.5px] p-4 text-left transition', on ? 'border-forest bg-sprout-soft/60' : 'border-sand bg-paper')}>
              <span className={cn('mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition', on ? 'border-forest bg-forest text-sprout' : 'border-sand-deep')}>
                {on && <Check className="size-3.5" strokeWidth={3.5} />}
              </span>
              <span>
                <span className="block text-[14.5px] font-bold">{item.label}</span>
                <span className="block text-[12.5px] text-ink-soft">{item.hint}</span>
              </span>
            </button>
          )
        })}
      </div>
      <p className="mt-4 text-[12px] text-ink-faint">Something feels off? Don't start the ride — use “Report a problem” or call support.</p>
    </Modal>
  )
}

export function SettleModal({ open, onClose, rideId, passenger, suggested, isHost }: {
  open: boolean
  onClose: () => void
  rideId: string
  passenger?: User
  suggested: number | null
  isHost: boolean
}) {
  const [method, setMethod] = useState<SettlementMethod | null>(null)
  const [amount, setAmount] = useState(suggested ? String(Math.round(suggested)) : '')
  const [note, setNote] = useState('')
  useEffect(() => {
    if (open) {
      setMethod(null)
      setAmount(suggested ? String(Math.round(suggested)) : '')
      setNote('')
    }
  }, [open, suggested])
  const { run, pending } = useAction(markSettled, { success: 'Marked as settled', onSuccess: onClose })
  if (!passenger) return null
  return (
    <Modal open={open} onClose={onClose}
      title={<span className="flex items-center gap-2"><Banknote className="size-6 text-moss" /> Mark as settled</span>}
      subtitle={isHost ? `Confirm ${displayName(passenger)} paid their fuel share.` : 'Confirm you paid your fuel share to the host.'}
      footer={
        <Button block size="lg" loading={pending}
          onClick={() => run(rideId, passenger.id, { method: method ?? undefined, amount: amount ? Number(amount) : undefined, note: note.trim() || undefined })}>
          Mark as settled
        </Button>
      }>
      <div className="space-y-4">
        <Field label="How settled" optional>
          {() => (
            <div className="flex gap-2">
              {(['cash', 'transfer', 'other'] as const).map((m) => (
                <Chip key={m} selected={method === m} onClick={() => setMethod(method === m ? null : m)}>
                  {m === 'cash' ? '💵 Cash' : m === 'transfer' ? '📲 Transfer' : 'Other'}
                </Chip>
              ))}
            </div>
          )}
        </Field>
        <Field label="Amount paid" optional hint={suggested ? `Estimate was ≈ ${egp(suggested)}.` : undefined}>
          {(id) => <Input id={id} inputMode="numeric" prefix="EGP" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, '').slice(0, 5))} />}
        </Field>
        <Field label="Note" optional>
          {(id) => <Input id={id} value={note} maxLength={80} placeholder="InstaPay, Vodafone Cash…" onChange={(e) => setNote(e.target.value)} />}
        </Field>
        <Callout tone="muted">This only records the status — Twigg never moves money.</Callout>
      </div>
    </Modal>
  )
}

export function ReviewModal({ open, onClose, rideId, about }: { open: boolean; onClose: () => void; rideId: string; about?: User }) {
  const [rating, setRating] = useState(0)
  const [tag, setTag] = useState<string | undefined>()
  const [comment, setComment] = useState('')
  useEffect(() => { if (open) { setRating(0); setTag(undefined); setComment('') } }, [open])
  const { run, pending } = useAction(submitReview, { success: 'Thanks! Your review is pending moderation.', onSuccess: onClose })
  if (!about) return null
  return (
    <Modal open={open} onClose={onClose} title={`Rate your ride with ${displayName(about)}`} subtitle="Reviews are moderated before they appear on profiles."
      footer={<Button block size="lg" disabled={!rating} loading={pending} onClick={() => run(rideId, about.id, rating, tag, comment)}>Submit review</Button>}>
      <div className="flex flex-col items-center">
        <Avatar user={about} size="lg" />
        <div className="mt-4 flex gap-1.5" role="radiogroup" aria-label="Rating">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)}
              className="transition active:scale-90">
              <svg viewBox="0 0 24 24" className={cn('size-10 transition', n <= rating ? 'fill-clay text-clay' : 'fill-none text-sand-deep')} stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
                <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" />
              </svg>
            </button>
          ))}
        </div>
        <p className="mt-1 h-5 text-[13px] font-semibold text-ink-soft">{['', 'Not great', 'Could be better', 'Good', 'Great', 'Excellent!'][rating]}</p>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        {REVIEW_TAGS.map((t) => <Chip key={t} selected={tag === t} onClick={() => setTag(tag === t ? undefined : t)}>{t}</Chip>)}
      </div>
      <Textarea className="mt-4" aria-label="Comment" value={comment} maxLength={240} onChange={(e) => setComment(e.target.value)} placeholder="Optional comment" />
    </Modal>
  )
}

export function CancelRideModal({ open, onClose, rideId }: { open: boolean; onClose: () => void; rideId: string }) {
  const [reason, setReason] = useState('')
  const { run, pending } = useAction(cancelRide, { success: 'Ride cancelled', onSuccess: onClose })
  return (
    <Modal open={open} onClose={onClose} title="Cancel this ride?" subtitle="Riders are notified right away. There are no penalties in the beta — but a heads-up helps."
      footer={
        <div className="flex gap-3">
          <Button variant="paper" className="flex-1" onClick={onClose}>Keep ride</Button>
          <Button variant="danger" className="flex-1" loading={pending} onClick={() => run(rideId, reason)}>Cancel ride</Button>
        </div>
      }>
      <Field label="Reason" optional>{(id) => <Textarea id={id} value={reason} maxLength={160} onChange={(e) => setReason(e.target.value)} placeholder="Car trouble, plans changed…" />}</Field>
    </Modal>
  )
}

export function ReportForm({ rideId, aboutUserId, people, initialCategory, onDone }: {
  rideId?: string
  aboutUserId?: string
  people?: User[]
  initialCategory?: IncidentCategory
  onDone?: () => void
}) {
  const [category, setCategory] = useState<IncidentCategory | null>(initialCategory ?? null)
  const [about, setAbout] = useState(aboutUserId ?? '')
  const [description, setDescription] = useState('')
  const [contactBack, setContactBack] = useState(true)
  const { run, pending, error } = useAction(reportIncident, {
    success: 'Report received. Our team reviews every report manually.',
    onSuccess: () => { setDescription(''); setCategory(null); onDone?.() },
  })
  const cats = (rideId ? ['unsafe_vehicle', 'ride_discomfort', 'behavior'] : ['unsafe_vehicle', 'ride_discomfort', 'behavior', 'other']) as IncidentCategory[]
  return (
    <form className="space-y-4" onSubmit={(e) => {
      e.preventDefault()
      if (category) run({ category, description, rideId, aboutUserId: about || undefined, contactBack })
    }}>
      <div className="grid gap-2">
        {cats.map((c) => (
          <button type="button" key={c} onClick={() => setCategory(c)}
            className={cn('flex items-center justify-between gap-3 rounded-2xl border-[1.5px] px-4 py-3 text-left transition', category === c ? 'border-clay bg-clay-soft/50' : 'border-sand bg-paper hover:border-sand-deep')}>
            <span>
              <span className="block text-[14px] font-bold">{INCIDENT_LABEL[c].label}</span>
              <span className="block text-[12px] text-ink-soft">{INCIDENT_LABEL[c].hint}</span>
            </span>
            <span className={cn('size-5 shrink-0 rounded-full border-2', category === c ? 'border-clay bg-clay ring-2 ring-paper ring-inset' : 'border-sand-deep')} />
          </button>
        ))}
      </div>
      {people && people.length > 0 && (
        <Field label="About" optional>
          {() => (
            <div className="flex flex-wrap gap-2">
              {people.map((p) => (
                <Chip key={p.id} selected={about === p.id} onClick={() => setAbout(about === p.id ? '' : p.id)}>{displayName(p)}</Chip>
              ))}
            </div>
          )}
        </Field>
      )}
      <Field label="What happened?" error={error}>
        {(id) => <Textarea id={id} value={description} maxLength={600} onChange={(e) => setDescription(e.target.value)} placeholder="Share as much detail as you're comfortable with." />}
      </Field>
      <Checkbox checked={contactBack} onChange={setContactBack}>The support team can call me about this report.</Checkbox>
      <Button type="submit" variant="accent" block size="lg" disabled={!category || description.trim().length < 10} loading={pending}>Submit report</Button>
    </form>
  )
}

export function ReportModal({ open, onClose, ...rest }: { open: boolean; onClose: () => void } & Omit<Parameters<typeof ReportForm>[0], 'onDone'>) {
  return (
    <Modal open={open} onClose={onClose} title="Report a problem" subtitle="Reports go to a real person on the Twigg team. Urgent? Call support.">
      <ReportForm {...rest} onDone={onClose} />
    </Modal>
  )
}

export function RatingLine({ avg, count }: { avg: number; count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-soft">
      <Stars value={avg} size={12} /> {avg.toFixed(1)} · {count}
    </span>
  )
}
