import { motion } from 'motion/react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogoMark } from '@/components/brand'
import { useDB } from '@/store/db'

export default function Splash() {
  const navigate = useNavigate()

  useEffect(() => {
    const t = setTimeout(() => {
      const { session } = useDB.getState()
      navigate(session.userId ? '/app' : '/welcome', { replace: true })
    }, 2200)
    return () => clearTimeout(t)
  }, [navigate])

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-forest text-cream">
      <div className="twig-pattern absolute inset-0 opacity-70" />
      <motion.div
        className="absolute size-[520px] rounded-full bg-sprout/10 blur-3xl"
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.6, ease: 'easeOut' }}
      />
      <div className="relative flex flex-col items-center">
        <LogoMark animate className="size-24 drop-shadow-[0_20px_40px_rgba(0,0,0,0.35)]" />
        <motion.h1
          className="mt-6 font-display text-[56px] leading-none font-extrabold tracking-[-0.05em]"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          twigg
        </motion.h1>
        <motion.p
          className="mt-3 text-[15px] text-cream/70"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.3, duration: 0.6 }}
        >
          Share the road with your circle.
        </motion.p>
      </div>
      <motion.div
        className="absolute bottom-12 h-1 w-24 overflow-hidden rounded-full bg-cream/15"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <motion.div className="h-full bg-sprout" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 2, ease: 'easeInOut' }} />
      </motion.div>
    </div>
  )
}
