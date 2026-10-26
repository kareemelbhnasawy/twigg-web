import { Hourglass, KeyRound, ShieldAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { setRole } from '@/api'
import { Button } from '@/components/ui/Button'
import { useAction } from '@/components/ui/Toast'
import { useMe, useSession } from '@/store/selectors'

export function RequireAuth() {
  const session = useSession()
  const me = useMe()
  const loc = useLocation()
  if (!session.userId || !me) return <Navigate to="/welcome" replace state={{ from: loc.pathname }} />
  return <Outlet />
}

export function RequireGuest() {
  const session = useSession()
  return session.userId ? <Navigate to="/app" replace /> : <Outlet />
}

// Route-level gate: unverified users can browse but cannot host or join rides.
export function VerifiedGate({ children, needsHost }: { children: ReactNode; needsHost?: boolean }) {
  const me = useMe()
  const { run, pending } = useAction(setRole, { success: 'You\'re now a Carpooler' })
  if (!me) return null
  if (me.status === 'suspended' || me.status === 'denied') {
    return (
      <GateCard icon={<ShieldAlert className="size-7" />} title={me.status === 'suspended' ? 'Your account is suspended' : 'Verification not approved'}
        body={me.statusNote ?? 'Rides are unavailable on your account. Our team can help you sort this out.'}
        action={<Button to="/app/support">Contact support</Button>} />
    )
  }
  if (me.status !== 'verified') {
    return (
      <GateCard icon={<Hourglass className="size-7" />} title="Your profile is being reviewed"
        body="Hosting and joining rides unlock as soon as an admin verifies you. Most reviews finish within a few hours."
        action={<Button to="/app/waiting-room">Complete your social profile</Button>} />
    )
  }
  if (needsHost && me.role !== 'carpooler') {
    return (
      <GateCard icon={<KeyRound className="size-7" />} title="Hosting is for Carpoolers"
        body="Switch your role to Carpooler to offer rides. You'll still be able to join rides as a passenger."
        action={<Button loading={pending} onClick={() => run('carpooler')}>Switch to Carpooler</Button>} />
    )
  }
  return <>{children}</>
}

function GateCard({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action: ReactNode }) {
  return (
    <div className="card mx-auto mt-6 max-w-md p-8 text-center animate-rise">
      <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-amber-soft text-[#7a5310]">{icon}</div>
      <h1 className="text-2xl font-semibold text-forest">{title}</h1>
      <p className="mt-2 text-[14px] text-ink-soft">{body}</p>
      <div className="mt-6 flex justify-center">{action}</div>
    </div>
  )
}
