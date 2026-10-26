import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateProfile } from '@/api'
import { PageHeader } from '@/components/PageHeader'
import { FacebookIcon, InstagramIcon } from '@/components/brand'
import { InterestPicker, MusicPicker, PersonalityPicker, PhotoPicker } from '@/components/profile-fields'
import { Button } from '@/components/ui/Button'
import { Field, Input, Segmented, Textarea, Toggle } from '@/components/ui/Form'
import { useAction } from '@/components/ui/Toast'
import { prettyPhone } from '@/lib/utils'
import { useMe } from '@/store/selectors'

export default function EditProfile() {
  const me = useMe()!
  const navigate = useNavigate()
  const [f, setF] = useState({
    firstName: me.firstName, lastName: me.lastName, displayName: me.displayName ?? '', email: me.email ?? '',
    social: me.social, hasLicense: me.hasLicense, avatar: me.avatar, bio: me.bio ?? '',
    personality: me.personality, interests: me.interests, music: me.music, privacy: me.privacy,
  })
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }))
  const save = useAction(updateProfile, { success: 'Profile saved', onSuccess: () => navigate('/app/profile') })
  const ok = f.firstName.trim().length >= 2 && f.lastName.trim().length >= 2 && (!f.email || /^\S+@\S+\.\S+$/.test(f.email)) && f.social.handle.length >= 3

  return (
    <div>
      <PageHeader back="/app/profile" title="Edit profile" />
      <div className="space-y-8">
        <PhotoPicker user={me} avatar={f.avatar} onChange={(v) => set('avatar', v)} />

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-forest">Basics</h2>
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name">{(id) => <Input id={id} value={f.firstName} onChange={(e) => set('firstName', e.target.value)} />}</Field>
            <Field label="Last name">{(id) => <Input id={id} value={f.lastName} onChange={(e) => set('lastName', e.target.value)} />}</Field>
          </div>
          <Field label="Display name" optional>{(id) => <Input id={id} value={f.displayName} onChange={(e) => set('displayName', e.target.value)} />}</Field>
          <Field label="Email" optional>{(id) => <Input id={id} type="email" value={f.email} onChange={(e) => set('email', e.target.value)} />}</Field>
          <Field label="Mobile number" hint="Contact support to change your number.">{(id) => <Input id={id} value={prettyPhone(me.phone)} disabled />}</Field>
          <Field label="Social profile">
            {() => (
              <div className="space-y-2.5">
                <Segmented value={f.social.network} onChange={(v) => set('social', { ...f.social, network: v })} options={[
                  { value: 'instagram', label: <span className="flex items-center justify-center gap-1.5"><InstagramIcon className="size-4" /> Instagram</span> },
                  { value: 'facebook', label: <span className="flex items-center justify-center gap-1.5"><FacebookIcon className="size-4" /> Facebook</span> },
                ]} />
                <Input aria-label="Handle" prefix="@" value={f.social.handle} onChange={(e) => set('social', { ...f.social, handle: e.target.value.trim().replace(/^@/, '') })} />
              </div>
            )}
          </Field>
          <Toggle checked={f.hasLicense} onChange={(v) => set('hasLicense', v)} label="I hold a valid personal driving license" description="Required for the Carpooler role." />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-forest">Comfort profile</h2>
          <Field label="Bio" optional>{(id) => <Textarea id={id} value={f.bio} maxLength={160} onChange={(e) => set('bio', e.target.value)} />}</Field>
          <Field label="Ride personality">{() => <PersonalityPicker value={f.personality} onChange={(v) => set('personality', v)} />}</Field>
          <Field label="Interests">{() => <InterestPicker value={f.interests} onChange={(v) => set('interests', v)} />}</Field>
          <Field label="Music">{() => <MusicPicker value={f.music} onChange={(v) => set('music', v)} />}</Field>
        </section>

        <section className="card space-y-5 p-5">
          <div>
            <h2 className="text-lg font-semibold text-forest">Privacy</h2>
            <p className="text-[13px] text-ink-soft">Choose what other verified members can see on your profile.</p>
          </div>
          <Toggle checked={f.privacy.showEmail} onChange={(v) => set('privacy', { ...f.privacy, showEmail: v })} label="Show my email" />
          <Toggle checked={f.privacy.showMusic} onChange={(v) => set('privacy', { ...f.privacy, showMusic: v })} label="Show my music preferences" />
          <Toggle checked={f.privacy.showPersonality} onChange={(v) => set('privacy', { ...f.privacy, showPersonality: v })} label="Show my ride personality" />
        </section>
      </div>

      <div className="sticky bottom-20 z-10 -mx-4 mt-8 border-t border-sand bg-cream/90 px-4 py-3 backdrop-blur lg:bottom-0">
        <Button size="lg" block disabled={!ok} loading={save.pending} onClick={() => save.run({
          ...f,
          firstName: f.firstName.trim(), lastName: f.lastName.trim(),
          displayName: f.displayName.trim() || undefined, email: f.email.trim() || undefined, bio: f.bio.trim() || undefined,
        })}>Save changes</Button>
      </div>
    </div>
  )
}
