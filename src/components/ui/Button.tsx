import { LoaderCircle } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'accent' | 'sprout' | 'outline' | 'ghost' | 'danger' | 'paper'
type Size = 'sm' | 'md' | 'lg'

const variants: Record<Variant, string> = {
  primary: 'bg-forest text-cream hover:bg-forest-soft shadow-[0_6px_16px_-8px_rgba(29,58,42,0.7)]',
  accent: 'bg-clay text-white hover:brightness-105 shadow-[0_6px_16px_-8px_rgba(227,116,60,0.8)]',
  sprout: 'bg-sprout text-forest hover:brightness-[1.03]',
  outline: 'border-[1.5px] border-forest/80 text-forest hover:bg-forest/5',
  ghost: 'text-forest hover:bg-forest/[0.06]',
  danger: 'bg-danger text-white hover:brightness-105',
  paper: 'bg-paper text-forest border border-sand hover:border-sand-deep',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5',
  md: 'h-11 px-5 text-sm gap-2',
  lg: 'h-14 px-6 text-[15px] gap-2.5',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  iconRight?: ReactNode
  block?: boolean
  to?: string
}

export function Button({ variant = 'primary', size = 'md', loading, icon, iconRight, block, to, className, children, disabled, ...rest }: Props) {
  const cls = cn(
    'inline-flex items-center justify-center rounded-full font-semibold tracking-[-0.005em] whitespace-nowrap select-none',
    'transition-[transform,background-color,filter,box-shadow] duration-150 active:scale-[0.97]',
    'disabled:opacity-45 disabled:pointer-events-none disabled:shadow-none',
    variants[variant],
    sizes[size],
    block && 'w-full',
    className,
  )
  const content = (
    <>
      {loading ? <LoaderCircle className="size-4 animate-spin" /> : icon}
      {children}
      {!loading && iconRight}
    </>
  )
  if (to && !disabled) {
    return (
      <Link to={to} className={cls}>
        {content}
      </Link>
    )
  }
  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {content}
    </button>
  )
}

export function IconButton({ label, className, children, ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex size-10 items-center justify-center rounded-full text-forest transition hover:bg-forest/[0.07] active:scale-95',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
