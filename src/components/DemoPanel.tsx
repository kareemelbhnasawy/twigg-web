import { FlaskConical, RotateCcw, ShieldCheck, X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { demoSignInAs, notify } from '@/api'
import { Avatar } from '@/components/brand'
import { toast } from '@/components/ui/Toast'
import { ADMIN_PASSCODE, DEMO_OTP, PERSONAS } from '@/data/seed'
import { cn, displayName, nowISO } from '@/lib/utils'
import { patch, resetDB, updateIn } from '@/store/db'
import { useMe, useUser } from '@/store/selectors'

// Floating helper for exploring the mocked beta: switch personas, self-approve, jump to admin.
// Not part of the product — remove when the backend lands.
export function DemoPanel() {
  const [open, setOpen] = useState(false)
  const me = useMe()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const nour = useUser(PERSONAS.passenger)
  const omar = useUser(PERSONAS.carpooler)
  const mostafa = useUser('u_mostafa')
  const inApp = pathname.startsWith('/app')

  const signInAs = (id: string) => {
    demoSignInAs(id)
    setOpen(false)
    navigate('/app')
    toast('Switched persona')
  }

  const approveMe = () => {
    if (!me) return
    patch('users', (l) => updateIn(l, me.id, (u) => ({ ...u, status: 'verified', verifiedAt: nowISO() })))
    notify(me.id, 'verification', 'You\'re verified ✓', 'Welcome to the circle! You can now join and host rides, and invite up to 5 friends.', '/app')
    toast('Approved — you\'re verified')
  }

  const openAdmin = () => {
    patch('session', (s) => ({ ...s, admin: true }))
    setOpen(false)
    navigate('/admin')
  }

  return (
    <div className={cn('fixed z-40 lg:top-auto lg:right-5 lg:bottom-5', inApp ? 'top-3 right-[100px]' : 'right-3 bottom-4')}>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.97 }}
            className={cn('absolute w-[300px] rounded-3xl border border-forest/20 bg-ink p-4 text-cream shadow-[var(--shadow-lift)]',
              'lg:top-auto lg:right-0 lg:bottom-14', inApp ? 'top-12 -right-[88px]' : 'right-0 bottom-14')}
          >
            <div className="flex items-center justify-between">
              <p className="font-mono text-[11px] tracking-[0.14em] text-sprout uppercase">Demo controls</p>
              <button onClick={() => setOpen(false)} aria-label="Close demo panel" className="rounded-full p-1 text-cream/60 hover:text-cream"><X className="size-4" /></button>
            </div>

            <p className="mt-3 text-[11.5px] font-semibold text-cream/50">Sign in as</p>
            <div className="mt-1.5 space-y-1">
              {[
                { u: nour, tag: 'Verified passenger' },
                { u: omar, tag: 'Verified carpooler' },
                { u: mostafa, tag: 'Unverified · waiting room' },
              ].map(({ u, tag }) => u && (
                <button key={u.id} onClick={() => signInAs(u.id)}
                  className={cn('flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left transition hover:bg-cream/10', me?.id === u.id && 'bg-cream/10')}>
                  <Avatar user={u} size="xs" />
                  <span className="flex-1 text-[13px] font-semibold">{displayName(u)}</span>
                  <span className="text-[10.5px] text-cream/50">{tag}</span>
                </button>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button onClick={approveMe} disabled={!me || me.status === 'verified'}
                className="flex items-center justify-center gap-1.5 rounded-xl bg-sprout px-2 py-2 text-[12px] font-bold text-forest disabled:opacity-30">
                <ShieldCheck className="size-3.5" /> Approve me
              </button>
              <button onClick={openAdmin} className="rounded-xl bg-cream/10 px-2 py-2 text-[12px] font-bold hover:bg-cream/15">
                Admin dashboard
              </button>
            </div>

            <dl className="mt-3 space-y-1 rounded-xl bg-cream/5 p-3 font-mono text-[11px] text-cream/70">
              <div className="flex justify-between"><dt>OTP code</dt><dd className="text-sprout">{DEMO_OTP}</dd></div>
              <div className="flex justify-between"><dt>Invite code</dt><dd className="text-sprout">TW-CAIRO1</dd></div>
              <div className="flex justify-between"><dt>Admin passcode</dt><dd className="text-sprout">{ADMIN_PASSCODE}</dd></div>
              <div className="flex justify-between"><dt>Sign-in phones</dt><dd className="text-sprout">01001234567</dd></div>
            </dl>

            <button
              onClick={() => {
                resetDB()
                setOpen(false)
                navigate('/welcome')
                toast('Demo data reset', 'info')
              }}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-cream/15 py-2 text-[12px] font-semibold text-cream/70 hover:text-cream"
            >
              <RotateCcw className="size-3.5" /> Reset demo data
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 items-center gap-1.5 rounded-full bg-ink/90 px-3.5 text-[12px] font-bold text-sprout shadow-lg backdrop-blur transition hover:bg-ink"
        aria-expanded={open}
      >
        <FlaskConical className="size-4" /> <span className="hidden lg:inline">Demo</span>
      </button>
    </div>
  )
}
