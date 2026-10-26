import { ArrowRight, TicketX } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError, validateInvite } from '@/api'
import { AuthShell } from '@/components/AuthShell'
import { Avatar } from '@/components/brand'
import { Button } from '@/components/ui/Button'
import { Skeleton, VerifiedBadge } from '@/components/ui/Display'
import type { User } from '@/lib/types'
import { displayName } from '@/lib/utils'

// Handles invite-link tokens: /invite/TW-XXXXXX
export default function InviteLanding() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState<{ inviter?: User; error?: string }>({})

  useEffect(() => {
    validateInvite(code)
      .then((r) => setState({ inviter: r.inviter }))
      .catch((e) => setState({ error: e instanceof ApiError ? e.message : 'Something went wrong.' }))
  }, [code])

  return (
    <AuthShell back="/welcome">
      {!state.inviter && !state.error && (
        <div className="space-y-4">
          <Skeleton className="size-20 rounded-full" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-full" />
        </div>
      )}

      {state.error && (
        <div className="animate-rise">
          <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-danger-soft text-danger"><TicketX className="size-7" /></div>
          <h1 className="text-[34px] leading-none font-bold text-forest">This invite can't be used</h1>
          <p className="mt-3 text-[15px] text-ink-soft">{state.error}</p>
          <div className="mt-8 space-y-3">
            <Button size="lg" block onClick={() => navigate('/signup')}>Enter a code manually</Button>
            <Button size="lg" block variant="ghost" to="/help">Get help</Button>
          </div>
        </div>
      )}

      {state.inviter && (
        <div className="animate-rise">
          <div className="relative w-fit">
            <Avatar user={state.inviter} size="xl" />
            <span className="absolute -right-3 -bottom-1 rounded-full bg-clay px-2.5 py-1 font-mono text-[11px] font-bold text-white">INVITE</span>
          </div>
          <h1 className="mt-6 text-[38px] leading-[1.02] font-bold text-forest">
            {displayName(state.inviter)} invited you to Twigg
          </h1>
          <p className="mt-3 flex items-center gap-1.5 text-[15px] text-ink-soft">
            <VerifiedBadge /> Verified member · invite <span className="font-mono font-semibold text-ink">{code.toUpperCase()}</span>
          </p>
          <p className="mt-5 text-[15px] leading-relaxed text-ink-soft">
            Twigg is a private circle of commuters sharing rides across Cairo. Your invite reserves your spot — finish signing up to join the review queue.
          </p>
          <Button className="mt-8" size="lg" block onClick={() => navigate('/signup')} iconRight={<ArrowRight className="size-5" />}>
            Accept invite
          </Button>
        </div>
      )}
    </AuthShell>
  )
}
