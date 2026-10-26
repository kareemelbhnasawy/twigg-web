import { CarFront, Gauge, LayoutDashboard, LogOut, MessageSquareWarning, Star, UserCheck, Users } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { adminSignIn, adminSignOut } from '@/api'
import { LogoMark } from '@/components/brand'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Form'
import { useAction } from '@/components/ui/Toast'
import { ADMIN_PASSCODE } from '@/data/seed'
import { cn } from '@/lib/utils'
import { useDB } from '@/store/db'
import { useSession } from '@/store/selectors'

export function AdminLayout() {
  const session = useSession()
  const users = useDB((s) => s.users)
  const incidents = useDB((s) => s.incidents)
  const reviews = useDB((s) => s.reviews)
  if (!session.admin) return <AdminLogin />

  const NAV = [
    { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
    { to: '/admin/verification', label: 'Verification', icon: UserCheck, count: users.filter((u) => u.status === 'unverified').length },
    { to: '/admin/rides', label: 'Rides & settlement', icon: CarFront },
    { to: '/admin/incidents', label: 'Safety reports', icon: MessageSquareWarning, count: incidents.filter((i) => i.status !== 'resolved').length },
    { to: '/admin/reviews', label: 'Review moderation', icon: Star, count: reviews.filter((r) => r.status === 'pending').length },
    { to: '/admin/users', label: 'Members', icon: Users },
    { to: '/admin/config', label: 'Fuel & config', icon: Gauge },
  ]

  return (
    <div className="min-h-dvh lg:flex">
      <aside className="sticky top-0 z-30 bg-ink text-cream lg:flex lg:h-dvh lg:w-[250px] lg:shrink-0 lg:flex-col lg:px-4 lg:py-6">
        <div className="flex items-center justify-between px-4 py-3 lg:px-2 lg:py-0">
          <Link to="/admin" className="flex items-center gap-2.5">
            <LogoMark className="size-8" />
            <span>
              <span className="block font-display text-lg leading-none font-extrabold tracking-tight">twigg</span>
              <span className="font-mono text-[10px] tracking-[0.16em] text-sprout uppercase">Admin</span>
            </span>
          </Link>
          <button onClick={adminSignOut} className="flex items-center gap-1.5 text-[12px] font-semibold text-cream/60 hover:text-cream lg:hidden"><LogOut className="size-4" /> Exit</button>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 scrollbar-none lg:mt-8 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end}
              className={({ isActive }) => cn('flex h-10 shrink-0 items-center gap-2.5 rounded-xl px-3 text-[13.5px] font-semibold transition',
                isActive ? 'bg-sprout text-forest' : 'text-cream/65 hover:bg-cream/10 hover:text-cream')}>
              <n.icon className="size-4" />
              <span className="flex-1 whitespace-nowrap">{n.label}</span>
              {!!n.count && <span className="rounded-full bg-clay px-1.5 text-[11px] font-bold text-white">{n.count}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto hidden space-y-2 lg:block">
          <p className="px-2 text-[11.5px] text-cream/40">Manual monitoring only. No automated enforcement in beta.</p>
          <button onClick={adminSignOut} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-cream/60 hover:bg-cream/10 hover:text-cream">
            <LogOut className="size-4" /> Sign out of admin
          </button>
        </div>
      </aside>
      <main className="mx-auto w-full max-w-[1100px] px-4 py-6 pb-24 sm:px-8 lg:py-10">
        <Outlet />
      </main>
    </div>
  )
}

function AdminLogin() {
  const [code, setCode] = useState('')
  const { run, pending, error } = useAction(adminSignIn)
  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink px-5">
      <form className="w-full max-w-sm rounded-[28px] bg-paper p-7" onSubmit={(e) => { e.preventDefault(); run(code) }}>
        <LogoMark className="size-12" />
        <h1 className="mt-5 text-[28px] font-bold text-forest">Twigg Admin</h1>
        <p className="mt-1 text-[13.5px] text-ink-soft">Verification, monitoring and fuel benchmarks.</p>
        <Field className="mt-6" label="Passcode" error={error} hint={`Demo passcode: ${ADMIN_PASSCODE}`}>
          {(id) => <Input id={id} type="password" autoFocus value={code} onChange={(e) => setCode(e.target.value)} />}
        </Field>
        <Button className="mt-5" type="submit" size="lg" block loading={pending}>Enter dashboard</Button>
        <Link to="/" className="mt-4 block text-center text-[13px] font-semibold text-ink-soft hover:text-forest">← Back to app</Link>
      </form>
    </div>
  )
}
