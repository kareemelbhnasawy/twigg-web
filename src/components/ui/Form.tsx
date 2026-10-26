import { Check, ChevronDown } from 'lucide-react'
import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export const inputBase =
  'w-full rounded-2xl border-[1.5px] border-sand bg-paper px-4 text-[15px] text-ink placeholder:text-ink-faint/80 ' +
  'transition focus:border-forest focus:outline-none focus:ring-4 focus:ring-sprout/40 disabled:opacity-60'

export function Field({ label, hint, error, optional, children, className }: {
  label?: ReactNode
  hint?: ReactNode
  error?: string | null
  optional?: boolean
  children: (id: string) => ReactNode
  className?: string
}) {
  const id = useId()
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label htmlFor={id} className="flex items-baseline justify-between text-[13px] font-semibold text-ink">
          <span>{label}</span>
          {optional && <span className="font-mono text-[10px] uppercase tracking-wider text-ink-faint">Optional</span>}
        </label>
      )}
      {children(id)}
      {error ? (
        <p className="text-[12.5px] font-medium text-danger" role="alert">{error}</p>
      ) : hint ? (
        <p className="text-[12.5px] text-ink-soft">{hint}</p>
      ) : null}
    </div>
  )
}

export function Input({ className, prefix, ...rest }: Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> & { prefix?: ReactNode }) {
  if (prefix) {
    return (
      <div className={cn(inputBase, 'flex h-12 items-center gap-2 focus-within:border-forest focus-within:ring-4 focus-within:ring-sprout/40', className)}>
        <span className="shrink-0 text-ink-soft">{prefix}</span>
        <input className="h-full w-full bg-transparent outline-none placeholder:text-ink-faint/80" {...rest} />
      </div>
    )
  }
  return <input className={cn(inputBase, 'h-12', className)} {...rest} />
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputBase, 'min-h-24 resize-none py-3 leading-relaxed', className)} {...rest} />
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(inputBase, 'h-12 appearance-none pr-10', className)} {...rest}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
    </div>
  )
}

export function Segmented<T extends string>({ value, onChange, options, className, size = 'md' }: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: ReactNode; disabled?: boolean }[]
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div role="radiogroup" className={cn('flex rounded-full border border-sand bg-sand/50 p-1', className)}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          disabled={o.disabled}
          onClick={() => onChange(o.value)}
          className={cn(
            'flex-1 rounded-full px-3 font-semibold transition disabled:opacity-40',
            size === 'sm' ? 'h-8 text-[12.5px]' : 'h-10 text-[13.5px]',
            value === o.value ? 'bg-forest text-cream shadow-sm' : 'text-ink-soft hover:text-forest',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Chip({ selected, onClick, children, className, disabled }: {
  selected?: boolean
  onClick?: () => void
  children: ReactNode
  className?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-3.5 whitespace-nowrap text-[13px] font-semibold transition active:scale-95 disabled:opacity-40',
        selected ? 'border-forest bg-forest text-cream' : 'border-sand bg-paper text-ink-soft hover:border-sand-deep hover:text-ink',
        className,
      )}
    >
      {selected && <Check className="size-3.5" strokeWidth={3} />}
      {children}
    </button>
  )
}

export function Toggle({ checked, onChange, label, description, disabled }: {
  checked: boolean
  onChange: (v: boolean) => void
  label: ReactNode
  description?: ReactNode
  disabled?: boolean
}) {
  return (
    <label className={cn('flex cursor-pointer items-start justify-between gap-4', disabled && 'cursor-not-allowed opacity-60')}>
      <span>
        <span className="block text-[14px] font-semibold text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-[12.5px] text-ink-soft">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn('relative mt-0.5 h-7 w-12 shrink-0 rounded-full transition-colors', checked ? 'bg-forest' : 'bg-sand-deep/70')}
      >
        <span className={cn('absolute top-1 left-1 size-5 rounded-full bg-paper shadow transition-transform', checked && 'translate-x-5 bg-sprout')} />
      </button>
    </label>
  )
}

export function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-[13.5px] leading-snug text-ink-soft">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-[1.5px] transition',
          checked ? 'border-forest bg-forest text-sprout' : 'border-sand-deep bg-paper',
        )}
      >
        {checked && <Check className="size-3.5" strokeWidth={3.5} />}
      </button>
      <span>{children}</span>
    </label>
  )
}

export function Stepper({ value, onChange, min = 1, max = 4, label }: { value: number; onChange: (v: number) => void; min?: number; max?: number; label: string }) {
  return (
    <div className="flex h-12 items-center justify-between rounded-2xl border-[1.5px] border-sand bg-paper px-1.5">
      <button type="button" aria-label={`Fewer ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)}
        className="size-9 rounded-xl text-lg font-bold text-forest transition hover:bg-sand/60 disabled:opacity-30">−</button>
      <span className="font-display text-lg font-semibold tabular-nums">{value} <span className="text-sm font-medium text-ink-soft">{label}</span></span>
      <button type="button" aria-label={`More ${label}`} disabled={value >= max} onClick={() => onChange(value + 1)}
        className="size-9 rounded-xl text-lg font-bold text-forest transition hover:bg-sand/60 disabled:opacity-30">+</button>
    </div>
  )
}
