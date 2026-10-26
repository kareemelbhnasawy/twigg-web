import { create } from 'zustand'
import { HUBS, haversineKm } from './geo'
import type { Hub } from './types'

export const GOOGLE_MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim() || ''
// Advanced markers require a Map ID; Google's demo ID works for development.
export const GOOGLE_MAP_ID = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID?.trim() || 'DEMO_MAP_ID'

// Google reports a rejected key (wrong key, API not enabled, referrer not allowed) only through
// this global callback, so we track it ourselves and fall back to the keyless embed.
export const useMapsAuth = create<{ failed: boolean }>(() => ({ failed: false }))
if (GOOGLE_MAPS_KEY) {
  const w = window as Window & { gm_authFailure?: () => void }
  const previous = w.gm_authFailure
  w.gm_authFailure = () => {
    previous?.()
    useMapsAuth.setState({ failed: true })
  }
}

export const CAIRO = { lat: 30.0444, lng: 31.2357 }

// Taps on the map snap to the closest hub, as long as it's within this radius.
export const SNAP_RADIUS_KM = 12

export function nearestHub(p: { lat: number; lng: number }): { hub: Hub; km: number } {
  return HUBS
    .map((hub) => ({ hub, km: haversineKm(p, hub) }))
    .sort((a, b) => a.km - b.km)[0]
}

const ll = (h: Hub) => `${h.lat},${h.lng}`

// Keyless Google Maps embed — used when no API key is configured (or the key is rejected).
export function embedUrl(from?: Hub, to?: Hub): string {
  if (from && to) return `https://maps.google.com/maps?saddr=${ll(from)}&daddr=${ll(to)}&output=embed&hl=en`
  const one = from ?? to
  if (one) return `https://maps.google.com/maps?q=${ll(one)}&z=13&output=embed&hl=en`
  return 'https://maps.google.com/maps?q=Cairo,Egypt&z=10&output=embed&hl=en'
}

export const directionsUrl = (from: Hub, to: Hub) =>
  `https://www.google.com/maps/dir/?api=1&origin=${ll(from)}&destination=${ll(to)}&travelmode=driving`
