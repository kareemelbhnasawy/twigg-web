import { Copy, Link2, Plus, Ticket, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { createInvite, revokeInvite } from '@/api'
import { PageHeader } from '@/components/PageHeader'
import { Avatar } from '@/components/brand'
import { Button } from '@/components/ui/Button'
import { Badge, Callout, EmptyState } from '@/components/ui/Display'
import { Field, Input } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Overlay'
import { toast, useAction } from '@/components/ui/Toast'
import { cn, displayName, timeAgo } from '@/lib/utils'
import { useDB } from '@/store/db'
import { useConfig, useMe, useUsersMap } from '@/store/selectors'

const copy = (text: string, label: string) => navigator.clipboard.writeText(text).then(() => toast(`${label} copied`), () => toast('Copy failed', 'error'))

export default function Invites() {
  const me = useMe()!
  const config = useConfig()
  const users = useUsersMap()
  const all = useDB((s) => s.invites)
  const invites = useMemo(() => all.filter((i) => i.inviterId === me.id), [all, me.id])
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const create = useAction(createInvite, { success: 'Invite created', onSuccess: () => { setOpen(false); setNote('') } })
  const revoke = useAction(revokeInvite, { success: 'Invite revoked' })
  const left = config.maxInvites - invites.length
  const verified = me.status === 'verified'

  return (
    <div>
      <PageHeader back="/app/profile" title="Invite friends" subtitle="Twigg grows through people you trust. You vouch for everyone you invite." />

      <section className="relative mb-6 overflow-hidden rounded-[28px] bg-clay p-6 text-white">
        <div className="twig-pattern absolute inset-0 opacity-60" />
        <div className="relative flex items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[11px] tracking-[0.14em] uppercase opacity-80">Invites left</p>
            <p className="mt-1 font-display text-[56px] leading-none font-bold">{Math.max(0, left)}<span className="text-2xl opacity-70">/{config.maxInvites}</span></p>
          </div>
          <div className="flex gap-1.5 pb-2">
            {Array.from({ length: config.maxInvites }).map((_, i) => (
              <span key={i} className={cn('h-8 w-3 rounded-full', i < invites.length ? 'bg-white/35' : 'bg-white')} />
            ))}
          </div>
        </div>
      </section>

      {!verified ? (
        <Callout tone="amber" title="Invites unlock after verification">Once an admin verifies you, you can invite up to {config.maxInvites} people.</Callout>
      ) : (
        <Button className="mb-6" size="lg" block disabled={left <= 0} icon={<Plus className="size-5" />} onClick={() => setOpen(true)}>
          {left > 0 ? 'Create an invite' : 'All invites used'}
        </Button>
      )}

      {invites.length === 0 ? (
        <EmptyState icon={<Ticket className="size-6" />} title="No invites yet" body="Each invite has a unique code and link that works once." />
      ) : (
        <div className="mt-6 space-y-3">
          {invites.map((i) => {
            const used = i.usedBy ? users.get(i.usedBy) : undefined
            const link = `${location.origin}/invite/${i.code}`
            return (
              <div key={i.code} className="card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-lg font-semibold tracking-wider text-forest">{i.code}</p>
                    <p className="text-[12.5px] text-ink-soft">{i.note ? `${i.note} · ` : ''}created {timeAgo(i.createdAt)}</p>
                  </div>
                  {i.usedBy ? <Badge tone="sprout">USED</Badge> : <Badge tone="amber">OPEN</Badge>}
                </div>
                {used ? (
                  <div className="mt-3 flex items-center gap-2.5 rounded-xl bg-cream px-3 py-2">
                    <Avatar user={used} size="xs" />
                    <span className="text-[13px] font-semibold">{displayName(used)} joined {i.usedAt && timeAgo(i.usedAt)}</span>
                    <span className="ml-auto text-[11.5px] font-semibold text-ink-soft capitalize">{used.status === 'unverified' ? 'In review' : used.status}</span>
                  </div>
                ) : (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button size="sm" variant="sprout" icon={<Link2 className="size-3.5" />} onClick={() => copy(link, 'Invite link')}>Copy link</Button>
                    <Button size="sm" variant="paper" icon={<Copy className="size-3.5" />} onClick={() => copy(i.code, 'Code')}>Copy code</Button>
                    <Button size="sm" variant="ghost" className="ml-auto text-ink-soft" icon={<Trash2 className="size-3.5" />} loading={revoke.pending} onClick={() => revoke.run(i.code)}>Revoke</Button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="New invite" subtitle="Only invite people you'd happily share a car with."
        footer={<Button block size="lg" loading={create.pending} onClick={() => create.run(note)}>Generate invite</Button>}>
        <Field label="Who is it for?" optional hint="A private note — only you see it.">
          {(id) => <Input id={id} value={note} maxLength={40} placeholder="e.g. Salma from work" onChange={(e) => setNote(e.target.value)} />}
        </Field>
      </Modal>
    </div>
  )
}
