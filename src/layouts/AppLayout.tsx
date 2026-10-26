import { Bell, CarFront, Hourglass, House, LifeBuoy, Plus, Route, Search, Settings, User } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { BetaDisclaimer } from '@/components/BetaDisclaimer'
import { Avatar, Logo } from '@/components/brand'
import { Modal } from '@/components/ui/Overlay'
import { cn, displayName } from '@/lib/utils'
import { useMe, useMyNotifications } from '@/store/selectors'

const NAV = [
  { to: '/app', label: 'Home', icon: House, end: true },
  { to: '/app/trips', label: 'My trips', icon: Route },
  { to: '/app/notifications', label: 'Alerts', icon: Bell },
  { to: '/app/profile', label: 'Profile', icon: User },
]

export function AppLayout() {
  const me = useMe()
  const unread = useMyNotifications().filter((n) => !n.read).length
  const [createOpen, setCreateOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => { window.scrollTo(0, 0) }, [pathname])

  if (!me) return null

  return (
    <div className="min-h-dvh lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-[260px] shrink-0 flex-col border-r border-sand/80 bg-paper/60 px-5 py-6 backdrop-blur lg:flex">
        <Link to="/app"><Logo /></Link>
        <button
          onClick={() => setCreateOpen(true)}
          className="mt-8 flex h-12 items-center justify-center gap-2 rounded-full bg-clay font-semibold text-white shadow-[0_8px_20px_-10px_rgba(227,116,60,0.9)] transition hover:brightness-105 active:scale-[0.98]"
        >
          <Plus className="size-5" strokeWidth={2.5} /> New ride or request
        </button>
        <nav className="mt-6 space-y-1">
          {NAV.map((n) => (
            <SideLink key={n.to} to={n.to} end={n.end} icon={<n.icon className="size-[18px]" />} badge={n.to.endsWith('notifications') ? unread : 0}>
              {n.label === 'Alerts' ? 'Notifications' : n.label}
            </SideLink>
          ))}
          <SideLink to="/app/support" icon={<LifeBuoy className="size-[18px]" />}>Support & safety</SideLink>
          <SideLink to="/app/settings" icon={<Settings className="size-[18px]" />}>Settings</SideLink>
        </nav>
        <Link to="/app/profile" className="mt-auto flex items-center gap-3 rounded-2xl border border-sand bg-paper p-3 transition hover:border-sand-deep">
          <Avatar user={me} size="sm" verified={me.status === 'verified'} />
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-bold">{displayName(me)}</p>
            <p className="text-[12px] text-ink-soft capitalize">{me.role} · {me.status === 'verified' ? 'Verified' : me.status === 'unverified' ? 'In review' : me.status}</p>
          </div>
        </Link>
      </aside>

      <div className="min-w-0 flex-1">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-sand/70 bg-cream/85 px-4 backdrop-blur-md lg:hidden">
          <Link to="/app"><Logo /></Link>
          <div className="flex items-center gap-1">
            <Link to="/app/support" aria-label="Support" className="flex size-10 items-center justify-center rounded-full text-forest hover:bg-forest/5">
              <LifeBuoy className="size-5" />
            </Link>
            <Link to="/app/profile" aria-label="Profile">
              <Avatar user={me} size="sm" verified={me.status === 'verified'} />
            </Link>
          </div>
        </header>

        {me.status === 'unverified' && pathname !== '/app/waiting-room' && <ReviewBanner />}

        <main className="mx-auto w-full max-w-[720px] px-4 pt-6 pb-32 sm:px-6 lg:pt-10 lg:pb-16">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-sand bg-paper/95 pb-safe backdrop-blur-md lg:hidden">
        <div className="mx-auto grid h-16 max-w-md grid-cols-5 items-center">
          {NAV.slice(0, 2).map((n) => <TabLink key={n.to} {...n} />)}
          <div className="flex justify-center">
            <button
              onClick={() => setCreateOpen(true)}
              aria-label="New ride or request"
              className="-mt-7 flex size-14 items-center justify-center rounded-full bg-clay text-white shadow-[0_10px_24px_-8px_rgba(227,116,60,0.9)] ring-4 ring-cream transition active:scale-95"
            >
              <Plus className="size-7" strokeWidth={2.5} />
            </button>
          </div>
          {NAV.slice(2).map((n) => <TabLink key={n.to} {...n} badge={n.to.endsWith('notifications') ? unread : 0} />)}
        </div>
      </nav>

      <CreateSheet open={createOpen} onClose={() => setCreateOpen(false)} />
      <BetaDisclaimer />
    </div>
  )
}

function SideLink({ to, end, icon, children, badge = 0 }: { to: string; end?: boolean; icon: ReactNode; children: ReactNode; badge?: number }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) => cn(
        'flex h-11 items-center gap-3 rounded-xl px-3.5 text-[14px] font-semibold transition',
        isActive ? 'bg-forest text-cream' : 'text-ink-soft hover:bg-sand/50 hover:text-forest',
      )}
    >
      {icon}
      <span className="flex-1">{children}</span>
      {badge > 0 && <span className="rounded-full bg-clay px-2 py-0.5 text-[11px] font-bold text-white">{badge}</span>}
    </NavLink>
  )
}

function TabLink({ to, label, icon: Icon, end, badge = 0 }: { to: string; label: string; icon: typeof House; end?: boolean; badge?: number }) {
  return (
    <NavLink to={to} end={end} className="flex flex-col items-center gap-0.5">
      {({ isActive }) => (
        <>
          <span className={cn('relative flex h-8 w-14 items-center justify-center rounded-full transition', isActive && 'bg-sprout-soft')}>
            <Icon className={cn('size-[21px]', isActive ? 'text-forest' : 'text-ink-faint')} strokeWidth={isActive ? 2.4 : 2} />
            {badge > 0 && <span className="absolute top-0 right-2.5 size-2.5 rounded-full bg-clay ring-2 ring-paper" />}
          </span>
          <span className={cn('text-[10.5px] font-bold', isActive ? 'text-forest' : 'text-ink-faint')}>{label}</span>
        </>
      )}
    </NavLink>
  )
}

function ReviewBanner() {
  return (
    <Link to="/app/waiting-room" className="flex items-center gap-3 bg-amber-soft px-4 py-3 text-[13px] font-semibold text-[#6d4a0c] sm:px-6">
      <Hourglass className="size-4 shrink-0 animate-[spin_3s_ease-in-out_infinite]" />
      <span className="flex-1">Your profile is being reviewed by the circle. Rides unlock once you're verified.</span>
      <span className="shrink-0 underline underline-offset-2">Finish bio</span>
    </Link>
  )
}

function CreateSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const me = useMe()
  const navigate = useNavigate()
  if (!me) return null
  const verified = me.status === 'verified'
  const go = (to: string) => {
    onClose()
    navigate(to)
  }
  return (
    <Modal open={open} onClose={onClose} title="Where to?" subtitle={verified ? 'Offer seats in your car or ask the circle for a ride.' : undefined}>
      {!verified && (
        <p className="mb-4 flex items-center gap-2 rounded-xl bg-amber-soft px-3.5 py-2.5 text-[13px] font-semibold text-[#6d4a0c]">
          <Hourglass className="size-4" /> Available once your profile is verified.
        </p>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <SheetOption
          disabled={!verified}
          onClick={() => go('/app/rides/new')}
          icon={<CarFront className="size-6" />}
          title="Offer a ride"
          body={me.role === 'carpooler' ? 'Host a ride and fill your empty seats.' : 'Switch to Carpooler to host.'}
          tone="bg-forest text-cream"
        />
        <SheetOption
          disabled={!verified}
          onClick={() => go('/app/requests/new')}
          icon={<Search className="size-6" />}
          title="Request a trip"
          body="Post where you're going and let hosts offer seats."
          tone="bg-sprout text-forest"
        />
      </div>
    </Modal>
  )
}

function SheetOption({ icon, title, body, onClick, tone, disabled }: { icon: ReactNode; title: string; body: string; onClick: () => void; tone: string; disabled?: boolean }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={cn('group flex flex-col items-start rounded-3xl p-5 text-left transition active:scale-[0.98] disabled:opacity-40', tone)}
    >
      <span className="mb-8 transition group-hover:-rotate-6">{icon}</span>
      <span className="font-display text-xl font-bold">{title}</span>
      <span className="mt-1 text-[13px] opacity-80">{body}</span>
    </button>
  )
}

