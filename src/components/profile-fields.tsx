import { Camera } from 'lucide-react'
import { Avatar } from '@/components/brand'
import { Chip } from '@/components/ui/Form'
import { toast } from '@/components/ui/Toast'
import { INTEREST_TAGS, MUSIC_TAGS, PERSONALITY } from '@/lib/constants'
import type { Personality, User } from '@/lib/types'
import { cn, fileToAvatar } from '@/lib/utils'

export function PhotoPicker({ user, avatar, onChange }: { user: Pick<User, 'id' | 'firstName' | 'lastName'>; avatar?: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-5">
      <Avatar user={{ ...user, avatar }} size="xl" />
      <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-forest/80 px-5 text-sm font-semibold text-forest transition hover:bg-forest/5">
        <Camera className="size-4" /> {avatar ? 'Change photo' : 'Upload photo'}
        <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
          const f = e.target.files?.[0]
          if (!f) return
          try {
            onChange(await fileToAvatar(f))
          } catch {
            toast('Couldn\'t read that image', 'error')
          }
        }} />
      </label>
    </div>
  )
}

export function TagPicker({ options, value, onChange, max }: { options: string[]; value: string[]; onChange: (v: string[]) => void; max: number }) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((t) => {
          const on = value.includes(t)
          return (
            <Chip key={t} selected={on} disabled={!on && value.length >= max}
              onClick={() => onChange(on ? value.filter((x) => x !== t) : [...value, t])}>
              {t}
            </Chip>
          )
        })}
      </div>
      <p className="mt-2 text-[12px] text-ink-faint">{value.length}/{max} selected</p>
    </div>
  )
}

export const InterestPicker = (p: { value: string[]; onChange: (v: string[]) => void }) => <TagPicker options={INTEREST_TAGS} max={6} {...p} />
export const MusicPicker = (p: { value: string[]; onChange: (v: string[]) => void }) => <TagPicker options={MUSIC_TAGS} max={5} {...p} />

export function PersonalityPicker({ value, onChange }: { value: Personality | null; onChange: (v: Personality) => void }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-3">
      {(Object.keys(PERSONALITY) as Personality[]).map((k) => {
        const p = PERSONALITY[k]
        const on = value === k
        return (
          <button key={k} type="button" onClick={() => onChange(k)}
            className={cn('rounded-2xl border-[1.5px] p-4 text-left transition', on ? 'border-forest bg-forest text-cream' : 'border-sand bg-paper hover:border-sand-deep')}>
            <span className="text-2xl">{p.emoji}</span>
            <span className="mt-2 block text-[14px] font-bold">{p.label}</span>
            <span className={cn('block text-[12px]', on ? 'text-cream/70' : 'text-ink-soft')}>{p.blurb}</span>
          </button>
        )
      })}
    </div>
  )
}

export function profileCompleteness(u: User) {
  const checks = [
    { label: 'Profile photo', done: !!u.avatar },
    { label: 'Interests', done: u.interests.length >= 2 },
    { label: 'Music', done: u.music.length >= 1 },
    { label: 'Ride personality', done: !!u.personality },
    { label: 'Short bio', done: (u.bio?.trim().length ?? 0) >= 10 },
  ]
  return { checks, pct: Math.round((checks.filter((c) => c.done).length / checks.length) * 100) }
}

export function ProgressRing({ pct, size = 64 }: { pct: number; size?: number }) {
  const r = (size - 8) / 2
  const c = 2 * Math.PI * r
  return (
    <svg width={size} height={size} className="-rotate-90" aria-label={`${pct}% complete`}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-sand)" strokeWidth="6" fill="none" />
      <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--color-clay)" strokeWidth="6" fill="none" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
    </svg>
  )
}
