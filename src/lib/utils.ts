import { clsx, type ClassValue } from 'clsx'
import type { User } from './types'

export const cn = (...v: ClassValue[]) => clsx(v)

export const uid = (prefix = '') => `${prefix}${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`

export const inviteCode = () => {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)]
  return `TW-${s}`
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

export const nowISO = () => new Date().toISOString()

export const displayName = (u?: Pick<User, 'firstName' | 'lastName' | 'displayName'> | null) =>
  !u ? 'Someone' : u.displayName?.trim() || `${u.firstName} ${u.lastName.charAt(0)}.`

export const fullName = (u?: Pick<User, 'firstName' | 'lastName'> | null) => (u ? `${u.firstName} ${u.lastName}` : '')

export const initials = (u?: Pick<User, 'firstName' | 'lastName'> | null) =>
  u ? `${u.firstName.charAt(0)}${u.lastName.charAt(0)}`.toUpperCase() : '?'

export function ageFrom(birthdate: string): number {
  const b = new Date(birthdate)
  const n = new Date()
  let a = n.getFullYear() - b.getFullYear()
  if (n.getMonth() < b.getMonth() || (n.getMonth() === b.getMonth() && n.getDate() < b.getDate())) a--
  return a
}

const dayFmt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
const timeFmt = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })

export const fmtTime = (iso: string) => timeFmt.format(new Date(iso))

export function fmtDay(iso: string): string {
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  return dayFmt.format(d)
}

export const fmtDateTime = (iso: string) => `${fmtDay(iso)} · ${fmtTime(iso)}`

export function timeAgo(iso: string): string {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000)
  if (s < 45) return 'just now'
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.round(h / 24)
  if (d < 7) return `${d}d ago`
  return dayFmt.format(new Date(iso))
}

export const toDateInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

export const toTimeInput = (d: Date) => {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getHours())}:${p(d.getMinutes())}`
}

export const normalizePhone = (raw: string) => {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('20')) return `+${digits}`
  if (digits.startsWith('0')) return `+2${digits}`
  return `+20${digits}`
}

export const isValidEgyptMobile = (raw: string) => /^\+201[0125]\d{8}$/.test(normalizePhone(raw))

export const prettyPhone = (p: string) => {
  const m = p.match(/^\+20(\d{3})(\d{3})(\d{4})$/)
  return m ? `+20 ${m[1]} ${m[2]} ${m[3]}` : p
}

// Downscale an uploaded image into a small data URL so it fits comfortably in local storage.
export function fileToAvatar(file: File, size = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Unsupported image'))
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = size
        canvas.height = size
        const ctx = canvas.getContext('2d')!
        const s = Math.min(img.width, img.height)
        ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}

export function hashHue(id: string): number {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}
