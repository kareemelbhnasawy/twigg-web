import { CarFront, ChevronRight, Hourglass, LifeBuoy, LogOut, Pencil, Settings, Ticket } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { setRole, signOut } from '@/api'
import { ComfortSection, ProfileCard } from '@/components/ProfileCard'
import { Callout } from '@/components/ui/Display'
import { Segmented } from '@/components/ui/Form'
import { useAction } from '@/components/ui/Toast'
import { displayName } from '@/lib/utils'
import { useDB } from '@/store/db'
import { useConfig, useMe, useStats, useUser } from '@/store/selectors'

export default function Profile() {
  const me = useMe()!
  const config = useConfig()
  const stats = useStats(me.id)
  const inviter = useUser(me.invitedBy)
  const invites = useDB((s) => s.invites)
  const navigate = useNavigate()
  const myInvites = invites.filter((i) => i.inviterId === me.id).length
  const roleAct = useAction(setRole, { success: 'Role updated' })

  return (
    <div className="space-y-6">
      <ProfileCard user={me} self rides={stats.rides} rating={stats.rating} showRating={stats.rides >= config.reviewDisplayThreshold}
        inviterName={inviter ? displayName(inviter) : undefined}
        actions={<Link to="/app/profile/edit" aria-label="Edit profile" className="absolute top-0 right-0 flex size-10 items-center justify-center rounded-full bg-cream/10 text-cream hover:bg-cream/20 sm:static"><Pencil className="size-4" /></Link>} />

      {me.status === 'unverified' && (
        <Callout tone="amber" icon={<Hourglass className="size-5" />} title="Under review" action={<Link to="/app/waiting-room" className="text-[13px] font-bold underline">Open the waiting room</Link>}>
          You can browse and set up your profile. Joining and hosting unlock after verification.
        </Callout>
      )}

      <section className="card p-5">
        <p className="eyebrow mb-3">Your role</p>
        <Segmented value={me.role} onChange={(v) => roleAct.run(v)}
          options={[{ value: 'passenger', label: '🙋 Passenger' }, { value: 'carpooler', label: '🚗 Carpooler', disabled: !me.hasLicense }]} />
        <p className="mt-2.5 text-[12.5px] text-ink-soft">
          {me.role === 'carpooler' ? 'You can host rides and join rides.' : 'You can join rides.'}
          {!me.hasLicense && ' Carpooler needs a valid driving license — update it in Edit profile.'}
        </p>
      </section>

      <ComfortSection user={me} self />

      <nav className="card divide-y divide-sand overflow-hidden">
        <Row to="/app/profile/edit" icon={<Pencil className="size-[18px]" />} label="Edit profile & privacy" />
        <Row to="/app/profile/cars" icon={<CarFront className="size-[18px]" />} label="My cars" meta={`${me.cars.length}`} />
        <Row to="/app/profile/invites" icon={<Ticket className="size-[18px]" />} label="Invite friends" meta={`${myInvites}/${config.maxInvites} used`} />
        <Row to="/app/support" icon={<LifeBuoy className="size-[18px]" />} label="Support & safety" />
        <Row to="/app/settings" icon={<Settings className="size-[18px]" />} label="Settings & beta terms" />
        <button onClick={() => { signOut(); navigate('/welcome') }} className="flex w-full items-center gap-3.5 px-5 py-4 text-left text-[14.5px] font-semibold text-danger hover:bg-danger-soft/40">
          <LogOut className="size-[18px]" /> Sign out
        </button>
      </nav>
    </div>
  )
}

function Row({ to, icon, label, meta }: { to: string; icon: ReactNode; label: string; meta?: string }) {
  return (
    <Link to={to} className="flex items-center gap-3.5 px-5 py-4 text-[14.5px] font-semibold transition hover:bg-cream/50">
      <span className="text-forest">{icon}</span>
      <span className="flex-1">{label}</span>
      {meta && <span className="text-[12.5px] font-semibold text-ink-faint">{meta}</span>}
      <ChevronRight className="size-4 text-ink-faint" />
    </Link>
  )
}
