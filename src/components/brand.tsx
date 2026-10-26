import { BadgeCheck } from 'lucide-react'
import type { SVGProps } from 'react'
import type { User } from '@/lib/types'
import { cn, hashHue, initials } from '@/lib/utils'

export function LogoMark({ className, animate = false }: { className?: string; animate?: boolean }) {
  const grow = animate ? { strokeDasharray: 80, strokeDashoffset: 80, className: 'animate-grow' } : {}
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <rect width="64" height="64" rx="18" fill="var(--color-forest)" />
      <path d="M17 47 C25 39 34 30 46 18" stroke="var(--color-sprout)" strokeWidth="5" fill="none" strokeLinecap="round" {...grow} />
      <path d="M30 34 C30 26 34 22 40 21" stroke="var(--color-sprout)" strokeWidth="4" fill="none" strokeLinecap="round"
        {...grow} style={animate ? { animationDelay: '0.5s' } : undefined} />
      <circle cx="46" cy="18" r="5" fill="var(--color-clay)" className={animate ? 'animate-pop' : undefined} style={animate ? { animationDelay: '1.1s' } : undefined} />
      <circle cx="17" cy="47" r="5" fill="var(--color-cream)" />
    </svg>
  )
}

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoMark className="size-8" />
      <span className={cn('font-display text-[23px] font-extrabold tracking-[-0.04em]', light ? 'text-cream' : 'text-forest')}>
        twigg
      </span>
    </span>
  )
}

const avatarTones = [
  'bg-sprout-soft text-forest',
  'bg-clay-soft text-[#8f3b12]',
  'bg-sky-soft text-sky',
  'bg-amber-soft text-[#7a5310]',
  'bg-[#e4dcef] text-[#4c3d6b]',
]

const avatarSizes = { xs: 'size-7 text-[10px]', sm: 'size-9 text-xs', md: 'size-12 text-sm', lg: 'size-16 text-lg', xl: 'size-24 text-2xl' }

export function Avatar({ user, size = 'md', verified, className }: {
  user?: Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'> | null
  size?: keyof typeof avatarSizes
  verified?: boolean
  className?: string
}) {
  const tone = avatarTones[hashHue(user?.id ?? 'x') % avatarTones.length]
  return (
    <span className={cn('relative inline-flex shrink-0', className)}>
      {user?.avatar ? (
        <img src={user.avatar} alt="" className={cn('rounded-full object-cover ring-2 ring-paper', avatarSizes[size])} />
      ) : (
        <span className={cn('inline-flex items-center justify-center rounded-full font-display font-bold ring-2 ring-paper', tone, avatarSizes[size])}>
          {initials(user)}
        </span>
      )}
      {verified && (
        <BadgeCheck
          className={cn('absolute -right-0.5 -bottom-0.5 fill-sprout text-forest', size === 'xl' ? 'size-7' : size === 'lg' ? 'size-5' : 'size-4')}
          strokeWidth={2.2}
        />
      )}
    </span>
  )
}

export function AvatarStack({ users, max = 3 }: { users: (Pick<User, 'id' | 'firstName' | 'lastName' | 'avatar'> | undefined)[]; max?: number }) {
  const shown = users.filter(Boolean).slice(0, max)
  const extra = users.length - shown.length
  return (
    <span className="flex -space-x-2">
      {shown.map((u) => <Avatar key={u!.id} user={u} size="xs" />)}
      {extra > 0 && (
        <span className="inline-flex size-7 items-center justify-center rounded-full bg-sand text-[10px] font-bold text-ink-soft ring-2 ring-paper">+{extra}</span>
      )}
    </span>
  )
}

export const InstagramIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
  </svg>
)

export const FacebookIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.8 1.4-3.8 3.9v2.3H8v3h2.5V21h3z" />
  </svg>
)

// Vertical twig used on ride cards: hollow start node, a branch with a sprouting leaf, filled destination.
export function TwigLine({ className }: { className?: string }) {
  return (
    <div className={cn('flex w-4 flex-col items-center', className)} aria-hidden>
      <span className="mt-1.5 size-3 shrink-0 rounded-full border-[2.5px] border-forest bg-paper" />
      <span className="relative my-1 w-[2px] flex-1 rounded-full bg-gradient-to-b from-forest/60 to-clay/60">
        <svg viewBox="0 0 12 12" className="absolute top-1/2 left-[1px] size-3 -translate-y-1/2 text-moss">
          <path d="M0 10 C2 4 6 1 11 1 C10 6 6 10 0 10 Z" fill="currentColor" opacity="0.75" />
        </svg>
      </span>
      <span className="mb-1.5 size-3 shrink-0 rotate-45 rounded-[3px] rounded-tl-full rounded-br-full bg-clay" />
    </div>
  )
}
