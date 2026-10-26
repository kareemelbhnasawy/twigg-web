import { useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/Form'
import { DEMO_OTP } from '@/data/seed'
import { cn } from '@/lib/utils'

export function PhoneInput({ value, onChange, id, autoFocus }: { value: string; onChange: (v: string) => void; id?: string; autoFocus?: boolean }) {
  return (
    <Input
      id={id}
      autoFocus={autoFocus}
      type="tel"
      inputMode="tel"
      autoComplete="tel-national"
      placeholder="10 1234 5678"
      prefix={<span className="flex items-center gap-1.5 border-r border-sand pr-2.5 font-semibold text-ink">🇪🇬 +20</span>}
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/[^\d\s]/g, '').slice(0, 13))}
    />
  )
}

export function OtpInput({ value, onChange, error }: { value: string; onChange: (v: string) => void; error?: boolean }) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const digits = Array.from({ length: 6 }, (_, i) => value[i] ?? '')

  useEffect(() => { refs.current[0]?.focus() }, [])

  const set = (i: number, d: string) => {
    const next = (value.slice(0, i) + d + value.slice(i + 1)).slice(0, 6)
    onChange(next.replace(/\D/g, ''))
  }

  return (
    <div className="flex justify-between gap-2" onPaste={(e) => {
      const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
      if (text) {
        e.preventDefault()
        onChange(text)
        refs.current[Math.min(text.length, 5)]?.focus()
      }
    }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el }}
          aria-label={`Digit ${i + 1}`}
          inputMode="numeric"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={d}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, '').slice(-1)
            if (!v) return
            set(i, v)
            refs.current[i + 1]?.focus()
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace') {
              e.preventDefault()
              if (d) set(i, '')
              else if (i > 0) {
                onChange(value.slice(0, i - 1) + value.slice(i))
                refs.current[i - 1]?.focus()
              }
            }
            if (e.key === 'ArrowLeft') refs.current[i - 1]?.focus()
            if (e.key === 'ArrowRight') refs.current[i + 1]?.focus()
          }}
          className={cn(
            'h-14 w-full min-w-0 rounded-2xl border-[1.5px] bg-paper text-center font-display text-2xl font-bold text-forest transition',
            'focus:border-forest focus:ring-4 focus:ring-sprout/40 focus:outline-none',
            error ? 'border-danger' : d ? 'border-forest/60' : 'border-sand',
          )}
        />
      ))}
    </div>
  )
}

export function OtpHint() {
  return (
    <p className="rounded-xl bg-sky-soft px-3.5 py-2.5 text-[12.5px] text-sky">
      <span className="font-bold">Beta demo:</span> SMS is mocked. Use code <span className="font-mono font-bold tracking-widest">{DEMO_OTP}</span>
    </p>
  )
}

export function ResendTimer({ onResend }: { onResend: () => void }) {
  const [left, setLeft] = useState(30)
  useEffect(() => {
    if (left <= 0) return
    const t = setTimeout(() => setLeft((l) => l - 1), 1000)
    return () => clearTimeout(t)
  }, [left])
  return left > 0 ? (
    <p className="text-[13px] text-ink-soft">Resend code in <span className="font-mono font-semibold tabular-nums">0:{String(left).padStart(2, '0')}</span></p>
  ) : (
    <button className="text-[13px] font-bold text-forest underline underline-offset-2" onClick={() => { onResend(); setLeft(30) }}>
      Resend code
    </button>
  )
}
