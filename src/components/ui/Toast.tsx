import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useRef, useState } from 'react'
import { create } from 'zustand'
import { ApiError } from '@/api'
import { uid } from '@/lib/utils'

type ToastKind = 'success' | 'error' | 'info'
interface ToastItem { id: string; kind: ToastKind; text: string }

const useToasts = create<{ items: ToastItem[] }>(() => ({ items: [] }))

export function toast(text: string, kind: ToastKind = 'success') {
  const id = uid()
  useToasts.setState((s) => ({ items: [...s.items.slice(-2), { id, kind, text }] }))
  setTimeout(() => useToasts.setState((s) => ({ items: s.items.filter((t) => t.id !== id) })), kind === 'error' ? 4800 : 3200)
}

const icons = {
  success: <CircleCheck className="size-5 text-sprout" />,
  error: <CircleAlert className="size-5 text-clay" />,
  info: <Info className="size-5 text-sky-soft" />,
}

export function Toaster() {
  const items = useToasts((s) => s.items)
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4" aria-live="polite">
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.96 }}
            className="pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl bg-forest px-4 py-3 text-[13.5px] font-medium text-cream shadow-[var(--shadow-lift)]"
          >
            {icons[t.kind]}
            <span>{t.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// Wraps an async API call with loading + error state; errors surface as toasts.
export function useAction<A extends unknown[], R>(fn: (...args: A) => Promise<R>, opts?: { success?: string; onSuccess?: (r: R) => void }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const optsRef = useRef(opts)
  optsRef.current = opts
  const run = useCallback(
    async (...args: A): Promise<R | undefined> => {
      setPending(true)
      setError(null)
      try {
        const r = await fn(...args)
        if (optsRef.current?.success) toast(optsRef.current.success)
        optsRef.current?.onSuccess?.(r)
        return r
      } catch (e) {
        const msg = e instanceof ApiError ? e.message : 'Something went wrong. Please try again.'
        setError(msg)
        toast(msg, 'error')
        if (!(e instanceof ApiError)) console.error(e)
        return undefined
      } finally {
        setPending(false)
      }
    },
    [fn],
  )
  return { run, pending, error, setError }
}
