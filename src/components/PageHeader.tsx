import { ChevronLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'

export function PageHeader({ title, eyebrow, subtitle, back, actions, className }: {
  title: ReactNode
  eyebrow?: ReactNode
  subtitle?: ReactNode
  back?: string | boolean
  actions?: ReactNode
  className?: string
}) {
  const navigate = useNavigate()
  return (
    <header className={cn('mb-6 animate-rise', className)}>
      {back && (
        <button
          onClick={() => (typeof back === 'string' ? navigate(back) : navigate(-1))}
          className="-ml-2 mb-3 inline-flex items-center gap-1 rounded-full py-1.5 pr-3 pl-1.5 text-[13px] font-semibold text-ink-soft transition hover:bg-sand/60 hover:text-forest"
        >
          <ChevronLeft className="size-4" /> Back
        </button>
      )}
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-1.5">{eyebrow}</p>}
          <h1 className="text-[30px] leading-[1.05] font-bold text-forest sm:text-[36px]">{title}</h1>
          {subtitle && <p className="mt-2 text-[14.5px] text-ink-soft">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </div>
    </header>
  )
}
