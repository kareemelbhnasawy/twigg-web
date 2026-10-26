import { useRouteError } from 'react-router-dom'
import { LogoMark } from '@/components/brand'
import { Button } from '@/components/ui/Button'
import { resetDB } from '@/store/db'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <LogoMark className="size-16" />
      <p className="mt-6 font-mono text-[12px] tracking-[0.16em] text-ink-faint uppercase">404 · Wrong turn</p>
      <h1 className="mt-2 text-[40px] leading-none font-bold text-forest">This road doesn't exist.</h1>
      <p className="mt-3 max-w-sm text-[15px] text-ink-soft">The page may have moved, or the link was mistyped.</p>
      <Button className="mt-8" to="/">Take me home</Button>
    </div>
  )
}

export function RouteError() {
  const error = useRouteError()
  console.error(error)
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <LogoMark className="size-16" />
      <p className="mt-6 font-mono text-[12px] tracking-[0.16em] text-ink-faint uppercase">Something broke</p>
      <h1 className="mt-2 text-[36px] leading-none font-bold text-forest">We hit a pothole.</h1>
      <p className="mt-3 max-w-sm text-[15px] text-ink-soft">{error instanceof Error ? error.message : 'An unexpected error occurred.'}</p>
      <div className="mt-8 flex gap-3">
        <Button variant="paper" onClick={() => { resetDB(); location.assign('/') }}>Reset demo data</Button>
        <Button onClick={() => location.assign('/')}>Reload app</Button>
      </div>
    </div>
  )
}
