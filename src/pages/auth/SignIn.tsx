import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { requestSignInOtp, verifySignInOtp } from '@/api'
import { AuthShell } from '@/components/AuthShell'
import { OtpHint, OtpInput, PhoneInput, ResendTimer } from '@/components/auth-inputs'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Form'
import { useAction } from '@/components/ui/Toast'
import { isValidEgyptMobile, prettyPhone } from '@/lib/utils'

export default function SignIn() {
  const [phone, setPhone] = useState('')
  const [sentTo, setSentTo] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const navigate = useNavigate()
  const from = (useLocation().state as { from?: string } | null)?.from

  const send = useAction(requestSignInOtp, { onSuccess: (r) => setSentTo(r.phone) })
  const verify = useAction(verifySignInOtp, { onSuccess: () => navigate(from ?? '/app', { replace: true }) })
  const phoneOk = isValidEgyptMobile(phone)

  if (!sentTo) {
    return (
      <AuthShell back="/welcome">
        <h1 className="text-[38px] leading-none font-bold text-forest">Welcome back</h1>
        <p className="mt-3 text-[15px] text-ink-soft">Enter the mobile number linked to your Twigg account. We'll text you a 6-digit code.</p>
        <form className="mt-8 space-y-5" onSubmit={(e) => { e.preventDefault(); if (phoneOk) send.run(phone) }}>
          <Field label="Mobile number" error={send.error} hint="Egyptian mobile numbers only during the beta.">
            {(id) => <PhoneInput id={id} value={phone} onChange={(v) => { setPhone(v); send.setError(null) }} autoFocus />}
          </Field>
          <Button type="submit" size="lg" block disabled={!phoneOk} loading={send.pending} iconRight={<ArrowRight className="size-5" />}>
            Send code
          </Button>
        </form>
        <div className="mt-8 flex items-center justify-between text-[13px]">
          <Link to="/signup" className="font-semibold text-forest hover:underline">Have an invite? Sign up</Link>
          <Link to="/help" className="font-semibold text-ink-soft hover:underline">Unable to sign in?</Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <button onClick={() => { setSentTo(null); setCode('') }} className="mb-6 self-start text-[13px] font-semibold text-ink-soft hover:text-forest">← Change number</button>
      <h1 className="text-[38px] leading-none font-bold text-forest">Check your SMS</h1>
      <p className="mt-3 text-[15px] text-ink-soft">We sent a code to <span className="font-bold text-ink">{prettyPhone(sentTo)}</span>.</p>
      <form className="mt-8 space-y-5" onSubmit={(e) => { e.preventDefault(); if (code.length === 6) verify.run(code) }}>
        <OtpInput value={code} onChange={(v) => { setCode(v); verify.setError(null) }} error={!!verify.error} />
        {verify.error && <p className="text-[13px] font-medium text-danger">{verify.error}</p>}
        <OtpHint />
        <Button type="submit" size="lg" block disabled={code.length < 6} loading={verify.pending}>Verify & sign in</Button>
        <div className="text-center"><ResendTimer onResend={() => send.run(phone)} /></div>
      </form>
    </AuthShell>
  )
}
