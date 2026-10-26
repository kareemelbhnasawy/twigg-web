import { Check, Hourglass, PartyPopper } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { updateProfile } from '@/api'
import {
  InterestPicker, MusicPicker, PersonalityPicker, PhotoPicker, profileCompleteness, ProgressRing,
} from '@/components/profile-fields'
import { Button } from '@/components/ui/Button'
import { Callout } from '@/components/ui/Display'
import { Textarea } from '@/components/ui/Form'
import { useAction } from '@/components/ui/Toast'
import type { User } from '@/lib/types'
import { cn, displayName, timeAgo } from '@/lib/utils'
import { useMe, useUser } from '@/store/selectors'

export default function WaitingRoom() {
  const me = useMe()!
  const inviter = useUser(me.invitedBy)
  const [f, setF] = useState({ avatar: me.avatar, interests: me.interests, music: me.music, personality: me.personality, bio: me.bio ?? '' })
  const save = useAction(updateProfile, { success: 'Social profile saved' })
  const preview: User = { ...me, ...f }
  const { checks, pct } = profileCompleteness(preview)
  const verified = me.status === 'verified'

  return (
    <div>
      <section className={cn('relative mb-8 overflow-hidden rounded-[28px] p-6 sm:p-8 animate-rise', verified ? 'bg-forest text-cream' : 'bg-amber-soft text-[#5b3d09]')}>
        <div className="twig-pattern absolute inset-0 opacity-40" />
        <div className="relative">
          <span className={cn('inline-flex size-12 items-center justify-center rounded-2xl', verified ? 'bg-sprout text-forest' : 'bg-paper/70')}>
            {verified ? <PartyPopper className="size-6" /> : <Hourglass className="size-6 animate-[spin_3s_ease-in-out_infinite]" />}
          </span>
          <h1 className="mt-4 text-[30px] leading-[1.05] font-bold sm:text-[36px]">
            {verified ? 'You\'re in the circle!' : 'Your profile is being reviewed by the circle!'}
          </h1>
          <p className={cn('mt-2 max-w-lg text-[15px]', verified ? 'text-cream/75' : 'opacity-80')}>
            {verified
              ? 'An admin verified your profile. You can now join and host rides — and invite up to 5 friends.'
              : 'While you wait, complete your social bio so matches know your vibe.'}
          </p>
          {verified && <Button className="mt-5" variant="sprout" to="/app">Find a ride</Button>}
        </div>
      </section>

      {/* Verification timeline */}
      <ol className="mb-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
        {[
          { label: 'Invited', sub: inviter ? `by ${displayName(inviter)}` : '—', done: true },
          { label: 'Account created', sub: timeAgo(me.createdAt), done: true },
          { label: 'Admin review', sub: verified ? 'Approved' : 'Usually a few hours', done: verified, current: !verified },
          { label: 'Verified', sub: verified ? 'Badge unlocked' : 'Rides unlock', done: verified },
        ].map((s) => (
          <li key={s.label} className={cn('flex items-center gap-3 rounded-2xl border p-3', s.current ? 'border-clay bg-clay-soft/40' : 'border-sand bg-paper')}>
            <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-full', s.done ? 'bg-forest text-sprout' : s.current ? 'bg-clay text-white' : 'bg-sand text-ink-faint')}>
              {s.done ? <Check className="size-4" strokeWidth={3} /> : <Hourglass className="size-3.5" />}
            </span>
            <span className="min-w-0">
              <span className="block text-[13.5px] font-bold">{s.label}</span>
              <span className="block truncate text-[11.5px] text-ink-soft">{s.sub}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="card mb-6 flex items-center gap-4 p-5">
        <div className="relative">
          <ProgressRing pct={pct} />
          <span className="absolute inset-0 flex items-center justify-center font-display text-sm font-bold">{pct}%</span>
        </div>
        <div className="flex-1">
          <p className="font-display text-lg font-bold text-forest">Social profile</p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1">
            {checks.map((c) => (
              <span key={c.label} className={cn('text-[12px] font-semibold', c.done ? 'text-moss' : 'text-ink-faint')}>{c.done ? '✓' : '○'} {c.label}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <Section title="Profile picture" hint="A clear, friendly face photo. Riders use it to recognise you at pickup.">
          <PhotoPicker user={me} avatar={f.avatar} onChange={(v) => setF({ ...f, avatar: v })} />
        </Section>
        <Section title="Ride personality" hint="This is about comfort, not matchmaking.">
          <PersonalityPicker value={f.personality} onChange={(v) => setF({ ...f, personality: v })} />
        </Section>
        <Section title="Interests" hint="Pick up to 6 — great for small talk (or knowing when not to).">
          <InterestPicker value={f.interests} onChange={(v) => setF({ ...f, interests: v })} />
        </Section>
        <Section title="Music in the car" hint="Pick up to 5.">
          <MusicPicker value={f.music} onChange={(v) => setF({ ...f, music: v })} />
        </Section>
        <Section title="Short bio">
          <Textarea aria-label="Bio" value={f.bio} maxLength={160} placeholder="Engineer commuting Zayed → Smart Village. Always on time, always with coffee." onChange={(e) => setF({ ...f, bio: e.target.value })} />
          <p className="mt-1 text-right text-[11.5px] text-ink-faint">{f.bio.length}/160</p>
        </Section>
        <Callout tone="sky">You can control who sees your music and personality in Profile → Privacy.</Callout>
      </div>

      <div className="sticky bottom-20 z-10 -mx-4 mt-8 border-t border-sand bg-cream/90 px-4 py-3 backdrop-blur lg:bottom-0">
        <Button size="lg" block loading={save.pending} onClick={() => save.run({ ...f, bio: f.bio.trim() || undefined })}>Save social profile</Button>
      </div>
    </div>
  )
}

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-forest">{title}</h2>
      {hint && <p className="mt-0.5 mb-3 text-[13px] text-ink-soft">{hint}</p>}
      {!hint && <div className="mb-3" />}
      {children}
    </section>
  )
}
