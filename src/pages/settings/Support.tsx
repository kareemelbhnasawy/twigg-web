import { Clock, Phone } from 'lucide-react'
import { useMemo } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { ReportForm } from '@/components/ride-modals'
import { Badge, SectionTitle } from '@/components/ui/Display'
import { INCIDENT_LABEL } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'
import { useDB } from '@/store/db'
import { useConfig, useMe } from '@/store/selectors'

const STATUS_TONE = { open: 'amber', reviewing: 'sky', resolved: 'sprout' } as const

export default function Support() {
  const me = useMe()!
  const config = useConfig()
  const incidents = useDB((s) => s.incidents)
  const mine = useMemo(() => incidents.filter((i) => i.reporterId === me.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [incidents, me.id])

  return (
    <div>
      <PageHeader eyebrow="Support & safety" title="We're here to help" />

      <a href={`tel:${config.supportPhone.replace(/\s/g, '')}`} className="relative mb-3 flex items-center gap-4 overflow-hidden rounded-[28px] bg-forest p-6 text-cream transition hover:bg-forest-soft">
        <div className="twig-pattern absolute inset-0 opacity-50" />
        <span className="relative flex size-14 shrink-0 items-center justify-center rounded-2xl bg-sprout text-forest"><Phone className="size-6" /></span>
        <span className="relative">
          <span className="block text-[12px] font-semibold text-sprout">Twigg support line</span>
          <span className="block font-display text-[28px] leading-tight font-bold tracking-tight">{config.supportPhone}</span>
          <span className="flex items-center gap-1.5 text-[12.5px] text-cream/70"><Clock className="size-3.5" />{config.supportHours}</span>
        </span>
      </a>
      <p className="mb-8 px-1 text-[13px] font-semibold text-[#6d4a0c]">Manual response; use phone number in urgent cases.</p>

      <section className="card mb-8 p-5">
        <SectionTitle>Log an incident</SectionTitle>
        <p className="-mt-1.5 mb-4 text-[13px] text-ink-soft">For a specific ride, it's faster to report from the ride page. Every report is reviewed by a person.</p>
        <ReportForm />
      </section>

      <section>
        <SectionTitle>Your reports</SectionTitle>
        {mine.length === 0 ? <p className="text-[13.5px] text-ink-soft">You haven't filed any reports.</p> : (
          <div className="card divide-y divide-sand">
            {mine.map((i) => (
              <div key={i.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[14px] font-bold">{INCIDENT_LABEL[i.category].label}</p>
                  <Badge tone={STATUS_TONE[i.status]} dot>{i.status.toUpperCase()}</Badge>
                </div>
                <p className="mt-1 line-clamp-2 text-[13px] text-ink-soft">{i.description}</p>
                <p className="mt-1.5 text-[11.5px] text-ink-faint">Filed {timeAgo(i.createdAt)}{i.actions.length > 0 && ` · ${i.actions.length} update${i.actions.length > 1 ? 's' : ''} from the team`}</p>
                {i.actions.length > 0 && <p className="mt-2 rounded-xl bg-cream px-3 py-2 text-[12.5px] text-ink-soft">Latest: {i.actions[i.actions.length - 1].text}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
