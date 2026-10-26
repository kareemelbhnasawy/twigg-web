import { X } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

// Bottom sheet on phones, centered dialog on larger screens.
export function Modal({ open, onClose, title, subtitle, children, footer, dismissible = true, className }: {
  open: boolean
  onClose?: () => void
  title?: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
  dismissible?: boolean
  className?: string
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && dismissible && onClose?.()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, dismissible, onClose])

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true">
          <motion.div
            className="absolute inset-0 bg-forest/45 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => dismissible && onClose?.()}
          />
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 340 }}
            className={cn(
              'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-paper shadow-[var(--shadow-lift)] sm:max-w-lg sm:rounded-[28px]',
              className,
            )}
          >
            <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-sand sm:hidden" />
            {(title || dismissible) && (
              <div className="flex items-start justify-between gap-4 px-6 pt-4 sm:pt-6">
                <div>
                  {title && <h2 className="text-[22px] font-semibold leading-tight text-forest">{title}</h2>}
                  {subtitle && <p className="mt-1 text-[13.5px] text-ink-soft">{subtitle}</p>}
                </div>
                {dismissible && onClose && (
                  <button onClick={onClose} aria-label="Close" className="-mr-2 rounded-full p-2 text-ink-soft transition hover:bg-sand/60">
                    <X className="size-5" />
                  </button>
                )}
              </div>
            )}
            <div className="overflow-y-auto px-6 py-5">{children}</div>
            {footer && <div className="border-t border-sand bg-cream/40 px-6 py-4 pb-safe">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
