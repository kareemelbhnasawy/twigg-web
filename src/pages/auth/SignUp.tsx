import { ArrowRight, Camera, CarFront, Check, Ticket, UserRound } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  completeSignup, requestSignUpOtp, validateInvite, verifySignUpOtp, type SignupInput,
} from '@/api'
import { AuthShell } from '@/components/AuthShell'
import { OtpHint, OtpInput, PhoneInput, ResendTimer } from '@/components/auth-inputs'
import { Avatar, FacebookIcon, InstagramIcon } from '@/components/brand'
import { Button } from '@/components/ui/Button'
import { Callout, VerifiedBadge } from '@/components/ui/Display'
import { Checkbox, Field, Input, Segmented, Select } from '@/components/ui/Form'
import { toast, useAction } from '@/components/ui/Toast'
import type { FuelType, Role, SocialNetwork } from '@/lib/types'
import { ageFrom, cn, displayName, fileToAvatar, isValidEgyptMobile, prettyPhone, toDateInput } from '@/lib/utils'
import { useSession, useUser } from '@/store/selectors'

const STEPS = ['invite', 'phone', 'otp', 'about', 'social', 'role', 'finish'] as const
type Step = (typeof STEPS)[number]

const maxBirthdate = () => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - 18)
  return toDateInput(d)
}

export default function SignUp() {
  const session = useSession()
  const draft = session.signup
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const initialStep: Step = draft?.phoneVerified ? 'about' : draft?.phone ? 'otp' : draft ? 'phone' : 'invite'
  const [step, setStep] = useState<Step>(initialStep)
  const index = STEPS.indexOf(step)

  // Form state for the profile steps
  const [code, setCode] = useState(params.get('code') ?? draft?.inviteCode ?? '')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [form, setForm] = useState({
    firstName: '', lastName: '', displayName: '', birthdate: '', email: '',
    network: 'instagram' as SocialNetwork, handle: '', hasLicense: null as boolean | null, role: 'passenger' as Role,
    avatar: undefined as string | undefined, terms: false,
    car: { make: '', model: '', color: '', plate: '', fuelType: 'gasoline' as FuelType, seats: 4 },
  })
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  const inviter = useUser(draft?.inviterId)

  const invite = useAction(validateInvite, { onSuccess: () => setStep('phone') })
  const sendOtp = useAction(requestSignUpOtp, { onSuccess: () => setStep('otp') })
  const verifyOtp = useAction(verifySignUpOtp, { onSuccess: () => setStep('about') })
  const finish = useAction(completeSignup, {
    onSuccess: () => {
      toast('Account created — welcome to Twigg!')
      navigate('/app/waiting-room', { replace: true })
    },
  })

  // Deep link: /signup?code=XYZ validates immediately.
  useEffect(() => {
    if (params.get('code') && !draft) invite.run(params.get('code')!)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const age = form.birthdate ? ageFrom(form.birthdate) : null
  const aboutErrors = useMemo(() => ({
    firstName: form.firstName.trim().length < 2 ? 'Required' : null,
    lastName: form.lastName.trim().length < 2 ? 'Required' : null,
    birthdate: !form.birthdate ? 'Required' : age !== null && age < 18 ? 'You must be 18 or older to join Twigg.' : null,
    email: form.email && !/^\S+@\S+\.\S+$/.test(form.email) ? 'That email doesn\'t look right.' : null,
  }), [form, age])
  const aboutOk = !Object.values(aboutErrors).some(Boolean)
  const handleOk = /^[a-zA-Z0-9._-]{3,40}$/.test(form.handle.replace(/^@/, ''))
  const socialOk = handleOk && form.hasLicense !== null
  const carOk = form.role === 'passenger' || (form.car.make && form.car.model && form.car.plate.trim().length >= 4)
  const roleOk = form.role === 'passenger' || (form.hasLicense && carOk)

  const submit = () => {
    const input: SignupInput = {
      firstName: form.firstName,
      lastName: form.lastName,
      displayName: form.displayName,
      birthdate: form.birthdate,
      email: form.email,
      social: { network: form.network, handle: form.handle.replace(/^@/, '') },
      hasLicense: !!form.hasLicense,
      role: form.role,
      avatar: form.avatar,
      car: form.role === 'carpooler' ? form.car : undefined,
    }
    finish.run(input)
  }

  const back = () => {
    if (step === 'otp') setStep('phone')
    else if (index > 3) setStep(STEPS[index - 1])
    else navigate('/welcome')
  }

  return (
    <AuthShell aside={<SignupAside />}>
      <div className="mb-8 flex items-center gap-3">
        <button onClick={back} className="text-[13px] font-semibold text-ink-soft hover:text-forest">← Back</button>
        <div className="flex flex-1 gap-1.5">
          {STEPS.map((s, i) => (
            <span key={s} className={cn('h-1.5 flex-1 rounded-full transition-colors duration-500', i <= index ? 'bg-forest' : 'bg-sand')} />
          ))}
        </div>
        <span className="font-mono text-[11px] text-ink-faint">{index + 1}/{STEPS.length}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.22 }}>
          {step === 'invite' && (
            <StepFrame icon={<Ticket className="size-5" />} title="Got an invite?" body="Twigg is invite-only. Enter the code a member shared with you, or open their invite link.">
              <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); invite.run(code) }}>
                <Field label="Invite code" error={invite.error} hint="Looks like TW-XXXXXX. Try TW-CAIRO1 for the demo.">
                  {(id) => (
                    <Input id={id} autoFocus value={code} placeholder="TW-" className="font-mono text-lg tracking-widest uppercase"
                      onChange={(e) => { setCode(e.target.value.toUpperCase()); invite.setError(null) }} />
                  )}
                </Field>
                <Button type="submit" size="lg" block disabled={code.trim().length < 6} loading={invite.pending} iconRight={<ArrowRight className="size-5" />}>
                  Check invite
                </Button>
                <p className="text-center text-[13px] text-ink-soft">Already a member? <Link to="/signin" className="font-bold text-forest">Sign in</Link></p>
              </form>
            </StepFrame>
          )}

          {step === 'phone' && (
            <StepFrame title="Your mobile number" body="You'll use it to sign in. We never show it to other members.">
              {inviter && <InviterCard name={displayName(inviter)} user={inviter} code={draft?.inviteCode} />}
              <form className="mt-6 space-y-5" onSubmit={(e) => { e.preventDefault(); sendOtp.run(phone) }}>
                <Field label="Mobile number" error={sendOtp.error}>
                  {(id) => <PhoneInput id={id} value={phone} onChange={(v) => { setPhone(v); sendOtp.setError(null) }} autoFocus />}
                </Field>
                <Button type="submit" size="lg" block disabled={!isValidEgyptMobile(phone)} loading={sendOtp.pending}>Send code</Button>
              </form>
            </StepFrame>
          )}

          {step === 'otp' && (
            <StepFrame title="Enter the code" body={<>Sent to <b className="text-ink">{draft?.phone ? prettyPhone(draft.phone) : 'your phone'}</b>.</>}>
              <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); verifyOtp.run(otp) }}>
                <OtpInput value={otp} onChange={(v) => { setOtp(v); verifyOtp.setError(null) }} error={!!verifyOtp.error} />
                {verifyOtp.error && <p className="text-[13px] font-medium text-danger">{verifyOtp.error}</p>}
                <OtpHint />
                <Button type="submit" size="lg" block disabled={otp.length < 6} loading={verifyOtp.pending}>Verify number</Button>
                <div className="text-center"><ResendTimer onResend={() => draft?.phone && sendOtp.run(draft.phone)} /></div>
              </form>
            </StepFrame>
          )}

          {step === 'about' && (
            <StepFrame icon={<UserRound className="size-5" />} title="About you" body="Use your real name — it's how riders recognise you at pickup.">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First name" error={form.firstName && aboutErrors.firstName}>
                    {(id) => <Input id={id} autoFocus autoComplete="given-name" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} />}
                  </Field>
                  <Field label="Last name" error={form.lastName && aboutErrors.lastName}>
                    {(id) => <Input id={id} autoComplete="family-name" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} />}
                  </Field>
                </div>
                <Field label="Display name" optional hint="A nickname shown instead of your full name.">
                  {(id) => <Input id={id} value={form.displayName} placeholder={form.firstName || 'e.g. Nono'} onChange={(e) => set('displayName', e.target.value)} />}
                </Field>
                <Field label="Birthdate" error={form.birthdate ? aboutErrors.birthdate : null}>
                  {(id) => <Input id={id} type="date" max={maxBirthdate()} value={form.birthdate} onChange={(e) => set('birthdate', e.target.value)} />}
                </Field>
                <Field label="Email" optional error={aboutErrors.email}>
                  {(id) => <Input id={id} type="email" autoComplete="email" value={form.email} placeholder="you@example.com" onChange={(e) => set('email', e.target.value)} />}
                </Field>
                <Button size="lg" block disabled={!aboutOk} onClick={() => setStep('social')}>Continue</Button>
              </div>
            </StepFrame>
          )}

          {step === 'social' && (
            <StepFrame title="Social verification" body="No ID uploads, ever. The circle verifies you through who invited you and your social profile.">
              <div className="space-y-5">
                <Field label="Social profile">
                  {() => (
                    <div className="space-y-2.5">
                      <Segmented
                        value={form.network}
                        onChange={(v) => set('network', v)}
                        options={[
                          { value: 'instagram', label: <span className="flex items-center justify-center gap-1.5"><InstagramIcon className="size-4" /> Instagram</span> },
                          { value: 'facebook', label: <span className="flex items-center justify-center gap-1.5"><FacebookIcon className="size-4" /> Facebook</span> },
                        ]}
                      />
                      <Input
                        aria-label="Profile handle"
                        prefix={form.network === 'instagram' ? 'instagram.com/' : 'facebook.com/'}
                        value={form.handle}
                        placeholder="your.handle"
                        onChange={(e) => set('handle', e.target.value.trim())}
                      />
                      {form.handle && !handleOk && <p className="text-[12.5px] font-medium text-danger">Use letters, numbers, dots or underscores.</p>}
                    </div>
                  )}
                </Field>
                <Field label="Do you hold a valid personal driving license?" hint="Required to host rides as a Carpooler. Just a yes/no — no photos.">
                  {() => (
                    <Segmented<'yes' | 'no' | ''>
                      value={form.hasLicense === null ? '' : form.hasLicense ? 'yes' : 'no'}
                      onChange={(v) => set('hasLicense', v === 'yes')}
                      options={[{ value: 'yes', label: 'Yes, I do' }, { value: 'no', label: 'No' }]}
                    />
                  )}
                </Field>
                <Callout tone="sky" title="Why we ask">
                  An admin checks that your profile is real and that someone in the circle vouches for you. We don't store ID documents.
                </Callout>
                <Button size="lg" block disabled={!socialOk} onClick={() => { if (!form.hasLicense) set('role', 'passenger'); setStep('role') }}>Continue</Button>
              </div>
            </StepFrame>
          )}

          {step === 'role' && (
            <StepFrame title="How will you ride?" body="You can switch roles later from your profile.">
              <div className="grid gap-3">
                <RoleCard selected={form.role === 'passenger'} onClick={() => set('role', 'passenger')} emoji="🙋" title="Passenger" body="Join rides hosted by verified members." />
                <RoleCard selected={form.role === 'carpooler'} disabled={!form.hasLicense} onClick={() => set('role', 'carpooler')} emoji="🚗"
                  title="Carpooler" body={form.hasLicense ? 'Host rides and join rides too.' : 'Requires a valid driving license.'} />
              </div>
              {form.role === 'carpooler' && (
                <div className="mt-5 space-y-3 rounded-[var(--radius-xl2)] border border-sand bg-paper p-4">
                  <p className="flex items-center gap-2 text-[14px] font-bold"><CarFront className="size-4" /> Your first car</p>
                  <p className="-mt-1.5 text-[12.5px] text-ink-soft">You can add more cars anytime — no verification needed.</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Input placeholder="Make (Hyundai)" aria-label="Car make" value={form.car.make} onChange={(e) => set('car', { ...form.car, make: e.target.value })} />
                    <Input placeholder="Model (Elantra)" aria-label="Car model" value={form.car.model} onChange={(e) => set('car', { ...form.car, model: e.target.value })} />
                    <Input placeholder="Color" aria-label="Car color" value={form.car.color} onChange={(e) => set('car', { ...form.car, color: e.target.value })} />
                    <Input placeholder="Plate (ق ه ط 4821)" aria-label="Plate number" dir="auto" value={form.car.plate} onChange={(e) => set('car', { ...form.car, plate: e.target.value })} />
                  </div>
                  <Select aria-label="Fuel type" value={form.car.fuelType} onChange={(e) => set('car', { ...form.car, fuelType: e.target.value as FuelType })}>
                    <option value="gasoline">Gasoline</option>
                    <option value="diesel">Diesel</option>
                    <option value="hybrid">Hybrid (estimates coming in native app)</option>
                    <option value="electric">Electric (estimates coming in native app)</option>
                  </Select>
                </div>
              )}
              <Button className="mt-6" size="lg" block disabled={!roleOk} onClick={() => setStep('finish')}>Continue</Button>
            </StepFrame>
          )}

          {step === 'finish' && (
            <StepFrame title="Last touch" body="A clear photo helps riders recognise you at pickup.">
              <div className="flex items-center gap-5">
                <Avatar user={{ id: 'new', firstName: form.firstName || '?', lastName: form.lastName || '?', avatar: form.avatar }} size="xl" />
                <label className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border-[1.5px] border-forest/80 px-5 text-sm font-semibold text-forest transition hover:bg-forest/5">
                  <Camera className="size-4" /> {form.avatar ? 'Change photo' : 'Upload photo'}
                  <input type="file" accept="image/*" className="sr-only" onChange={async (e) => {
                    const f = e.target.files?.[0]
                    if (f) set('avatar', await fileToAvatar(f).catch(() => { toast('Couldn\'t read that image', 'error'); return undefined }))
                  }} />
                </label>
              </div>
              {!form.avatar && <p className="mt-2 text-[12.5px] text-ink-soft">You can also add it in the waiting room.</p>}
              <div className="mt-7 space-y-3 rounded-[var(--radius-xl2)] border border-sand bg-paper p-4">
                <Checkbox checked={form.terms} onChange={(v) => set('terms', v)}>
                  I accept the <Link to="/help#terms" className="font-bold text-forest underline">Terms & Conditions</Link> and{' '}
                  <Link to="/help#privacy" className="font-bold text-forest underline">Privacy Policy</Link>, and understand Twigg is a technology facilitator only.
                </Checkbox>
              </div>
              <Button className="mt-6" size="lg" variant="accent" block disabled={!form.terms} loading={finish.pending} onClick={submit}>
                Create my account
              </Button>
            </StepFrame>
          )}
        </motion.div>
      </AnimatePresence>
    </AuthShell>
  )
}

function StepFrame({ icon, title, body, children }: { icon?: ReactNode; title: string; body: ReactNode; children: ReactNode }) {
  return (
    <div>
      {icon && <div className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-sprout-soft text-forest">{icon}</div>}
      <h1 className="text-[34px] leading-none font-bold text-forest">{title}</h1>
      <p className="mt-3 mb-7 text-[14.5px] text-ink-soft">{body}</p>
      {children}
    </div>
  )
}

export function InviterCard({ name, user, code }: { name: string; user: Parameters<typeof Avatar>[0]['user']; code?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-sprout bg-sprout-soft/60 p-3.5">
      <Avatar user={user} size="md" verified />
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold text-moss">Invited by</p>
        <p className="flex items-center gap-1 text-[15px] font-bold text-forest">{name} <VerifiedBadge /></p>
      </div>
      {code && <span className="font-mono text-[12px] font-semibold text-forest/70">{code}</span>}
    </div>
  )
}

function RoleCard({ selected, onClick, emoji, title, body, disabled }: { selected: boolean; onClick: () => void; emoji: string; title: string; body: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex items-center gap-4 rounded-[var(--radius-xl2)] border-[1.5px] p-4 text-left transition disabled:opacity-45',
        selected ? 'border-forest bg-forest text-cream' : 'border-sand bg-paper hover:border-sand-deep',
      )}
    >
      <span className="text-3xl">{emoji}</span>
      <span className="flex-1">
        <span className="block font-display text-lg font-bold">{title}</span>
        <span className={cn('block text-[13px]', selected ? 'text-cream/75' : 'text-ink-soft')}>{body}</span>
      </span>
      <span className={cn('flex size-6 items-center justify-center rounded-full border-2', selected ? 'border-sprout bg-sprout text-forest' : 'border-sand-deep')}>
        {selected && <Check className="size-4" strokeWidth={3} />}
      </span>
    </button>
  )
}

function SignupAside() {
  return (
    <>
      <p className="font-mono text-[11px] tracking-[0.16em] text-sprout uppercase">How the circle works</p>
      <ol className="mt-6 max-w-md space-y-6">
        {[
          ['Someone vouches for you', 'Every member joins through a personal invite. Each verified member can invite up to 5 people.'],
          ['A human reviews your profile', 'We check your social profile and who invited you. No ID scans, nothing stored.'],
          ['Ride with your kind of people', 'Quiet or chatty, Amr Diab or podcasts — comfort tags help you ride with the right crowd.'],
        ].map(([t, b], i) => (
          <li key={t} className="flex gap-4">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sprout font-display font-bold text-forest">{i + 1}</span>
            <span>
              <span className="block font-display text-xl font-semibold text-cream">{t}</span>
              <span className="mt-1 block text-[14px] text-cream/65">{b}</span>
            </span>
          </li>
        ))}
      </ol>
    </>
  )
}
