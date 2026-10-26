import { ChevronRight, FileText, Info, LifeBuoy, LogOut, Rocket, Shield, UserCog } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from '@/api'
import { PageHeader } from '@/components/PageHeader'
import { useMe } from '@/store/selectors'

export default function Settings() {
  const me = useMe()!
  const navigate = useNavigate()
  return (
    <div>
      <PageHeader back title="Settings" />
      <div className="space-y-6">
        <Group title="Account">
          <Row to="/app/profile/edit" icon={<UserCog className="size-[18px]" />} label="Profile & privacy" sub="Name, social profile, what others can see" />
          <Row to="/app/profile/cars" icon={<Shield className="size-[18px]" />} label="Cars" sub={`${me.cars.length} saved`} />
        </Group>
        <Group title="Beta">
          <Row to="/app/settings/beta-terms" icon={<FileText className="size-[18px]" />} label="Beta Terms / Disclosures"
            sub={me.betaAcceptedAt ? `Accepted ${new Date(me.betaAcceptedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}` : 'Not accepted yet'} />
          <Row to="/app/settings/native" icon={<Rocket className="size-[18px]" />} label="Coming in the native app" sub="Live tracking, payments, SOS and more" />
        </Group>
        <Group title="Help">
          <Row to="/app/support" icon={<LifeBuoy className="size-[18px]" />} label="Support & safety" sub="Call us or log an incident" />
          <div className="flex items-center gap-3.5 px-5 py-4 text-[13px] text-ink-soft"><Info className="size-[18px] text-forest" /> Twigg Beta · web v0.9 (mock data)</div>
        </Group>
        <button onClick={() => { signOut(); navigate('/welcome') }}
          className="card flex w-full items-center gap-3.5 px-5 py-4 text-left text-[14.5px] font-semibold text-danger hover:bg-danger-soft/40">
          <LogOut className="size-[18px]" /> Sign out
        </button>
      </div>
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <p className="eyebrow mb-2 px-1">{title}</p>
      <div className="card divide-y divide-sand overflow-hidden">{children}</div>
    </section>
  )
}

function Row({ to, icon, label, sub }: { to: string; icon: ReactNode; label: string; sub?: string }) {
  return (
    <Link to={to} className="flex items-center gap-3.5 px-5 py-4 transition hover:bg-cream/50">
      <span className="text-forest">{icon}</span>
      <span className="flex-1">
        <span className="block text-[14.5px] font-semibold">{label}</span>
        {sub && <span className="block text-[12.5px] text-ink-soft">{sub}</span>}
      </span>
      <ChevronRight className="size-4 text-ink-faint" />
    </Link>
  )
}
