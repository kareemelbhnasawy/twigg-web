import type { Hub, PickupPoint } from './types'

// Pre-defined hubs for the closed beta (Greater Cairo). Coordinates are approximate
// and only used for static distance math — no paid map APIs.
export const HUBS: Hub[] = [
  {
    id: 'zayed', name: 'Sheikh Zayed', area: 'West', lat: 30.0444, lng: 30.976,
    landmarks: [
      { name: 'Arkan Plaza — main gate', lat: 30.0198, lng: 30.9781 },
      { name: 'Hyper One parking', lat: 30.0593, lng: 30.9668 },
      { name: 'Zayed 2000 roundabout', lat: 30.0472, lng: 30.9833 },
      { name: 'Galleria40', lat: 30.0151, lng: 30.9853 },
      { name: 'Americana Plaza', lat: 30.0236, lng: 30.9851 },
    ],
  },
  {
    id: 'october', name: '6th of October', area: 'West', lat: 29.964, lng: 30.927,
    landmarks: [
      { name: 'Mall of Arabia — Gate 1', lat: 30.0068, lng: 30.9733 },
      { name: 'Juhayna Square', lat: 29.9798, lng: 30.9468 },
      { name: 'El Hosary Mosque', lat: 29.9738, lng: 30.9427 },
      { name: 'Dandy Mall', lat: 30.0625, lng: 31.0272 },
    ],
  },
  {
    id: 'smart', name: 'Smart Village', area: 'West', lat: 30.0718, lng: 31.017,
    landmarks: [
      { name: 'Smart Village — Gate B', lat: 30.0705, lng: 31.0185 },
      { name: 'Cairo–Alex Rd. U-turn', lat: 30.0662, lng: 31.0122 },
      { name: 'Smart Village — Main gate', lat: 30.0731, lng: 31.0201 },
    ],
  },
  {
    id: 'mohandessin', name: 'Mohandessin & Dokki', area: 'Central', lat: 30.056, lng: 31.2,
    landmarks: [
      { name: 'Sphinx Square', lat: 30.0627, lng: 31.1999 },
      { name: 'Shehab St. — Arkadia', lat: 30.0571, lng: 31.2045 },
      { name: 'Gameat El Dowal St.', lat: 30.0569, lng: 31.1985 },
      { name: 'Dokki metro station', lat: 30.0385, lng: 31.2121 },
    ],
  },
  {
    id: 'zamalek', name: 'Zamalek', area: 'Central', lat: 30.0626, lng: 31.2197,
    landmarks: [
      { name: '26th of July St. — Diwan', lat: 30.0612, lng: 31.2236 },
      { name: 'Cairo Tower gate', lat: 30.0459, lng: 31.2243 },
      { name: 'Marriott Hotel', lat: 30.0571, lng: 31.2253 },
    ],
  },
  {
    id: 'downtown', name: 'Downtown & Garden City', area: 'Central', lat: 30.0444, lng: 31.2357,
    landmarks: [
      { name: 'Tahrir Square — Omar Makram', lat: 30.0451, lng: 31.2335 },
      { name: 'Garden City — Kasr El Aini', lat: 30.0352, lng: 31.2312 },
      { name: 'Talaat Harb Square', lat: 30.0489, lng: 31.2401 },
    ],
  },
  {
    id: 'maadi', name: 'Maadi', area: 'Central', lat: 29.9602, lng: 31.2569,
    landmarks: [
      { name: 'Road 9 — metro exit', lat: 29.9606, lng: 31.2577 },
      { name: 'Degla — Laselky St.', lat: 29.9578, lng: 31.2729 },
      { name: 'Maadi Grand Mall', lat: 29.9722, lng: 31.2873 },
      { name: 'Carrefour Maadi', lat: 29.9867, lng: 31.2918 },
    ],
  },
  {
    id: 'heliopolis', name: 'Heliopolis', area: 'East', lat: 30.089, lng: 31.322,
    landmarks: [
      { name: 'Korba — Baron Palace side', lat: 30.0867, lng: 31.3302 },
      { name: 'Merghany St.', lat: 30.0919, lng: 31.3255 },
      { name: 'Heliopolis Club', lat: 30.0905, lng: 31.3203 },
    ],
  },
  {
    id: 'nasr', name: 'Nasr City', area: 'East', lat: 30.0566, lng: 31.33,
    landmarks: [
      { name: 'City Stars — Gate 5', lat: 30.0729, lng: 31.3457 },
      { name: 'Abbas El Akkad St.', lat: 30.0601, lng: 31.3378 },
      { name: 'Stadium — Gate 7', lat: 30.0697, lng: 31.3125 },
    ],
  },
  {
    id: 'newcairo', name: 'New Cairo — 5th Settlement', area: 'East', lat: 30.0074, lng: 31.4913,
    landmarks: [
      { name: 'Point 90 Mall', lat: 30.0201, lng: 31.4965 },
      { name: 'AUC — Gate 4', lat: 30.0187, lng: 31.5009 },
      { name: 'Cairo Festival City — IKEA', lat: 30.0296, lng: 31.4078 },
      { name: 'Downtown Katameya', lat: 30.0234, lng: 31.4294 },
      { name: '90th St. — Waterway', lat: 30.0242, lng: 31.4757 },
    ],
  },
  {
    id: 'rehab', name: 'El Rehab', area: 'East', lat: 30.059, lng: 31.492,
    landmarks: [
      { name: 'Rehab Mall 1', lat: 30.0612, lng: 31.4936 },
      { name: 'Gate 13', lat: 30.0548, lng: 31.4835 },
      { name: 'Eastern Market', lat: 30.0645, lng: 31.4982 },
    ],
  },
  {
    id: 'madinaty', name: 'Madinaty', area: 'East', lat: 30.096, lng: 31.631,
    landmarks: [
      { name: 'Open Air Mall', lat: 30.0912, lng: 31.6234 },
      { name: 'Madinaty — Gate 1', lat: 30.1006, lng: 31.6052 },
      { name: 'Craft Zone', lat: 30.0985, lng: 31.6378 },
    ],
  },
  {
    id: 'capital', name: 'New Administrative Capital', area: 'East', lat: 30.019, lng: 31.759,
    landmarks: [
      { name: 'Government District — Gate 2', lat: 30.0151, lng: 31.7363 },
      { name: 'CBD — Iconic Tower', lat: 30.0084, lng: 31.7008 },
      { name: 'Monorail — Capital station', lat: 30.0302, lng: 31.7485 },
    ],
  },
]

export const hubById = (id: string): Hub => HUBS.find((h) => h.id === id) ?? HUBS[0]

const toRad = (d: number) => (d * Math.PI) / 180

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Straight-line distance × road factor approximates Cairo ring-road driving distance.
const ROAD_FACTOR = 1.32

export function routeDistanceKm(fromHubId: string, toHubId: string): number {
  const km = haversineKm(hubById(fromHubId), hubById(toHubId)) * ROAD_FACTOR
  return Math.max(4, Math.round(km))
}

// Average urban speed by distance band — longer trips use ring road / Suez road.
export function routeDurationMin(km: number): number {
  const avgKmh = km > 35 ? 58 : km > 18 ? 44 : 30
  return Math.round((km / avgKmh) * 60 + 6)
}

export function viaRoad(fromHubId: string, toHubId: string): string {
  const a = hubById(fromHubId).area
  const b = hubById(toHubId).area
  if (a === b) return a === 'West' ? 'via 26th of July Corridor' : a === 'East' ? 'via 90th St. & Suez Rd.' : 'via Corniche El Nil'
  if ((a === 'West' && b === 'East') || (a === 'East' && b === 'West')) return 'via Ring Road & Mehwar'
  if (a === 'West' || b === 'West') return 'via 26th of July Corridor'
  return 'via Salah Salem & Autostrad'
}

// Suggested pickup points: landmarks around the start hub, ranked by how far they
// sit from the straight route line toward the destination ("route-based proximity").
export function suggestPickups(fromHubId: string, toHubId: string): PickupPoint[] {
  const from = hubById(fromHubId)
  const to = hubById(toHubId)
  return from.landmarks
    .map((l, i) => {
      const off = pointToSegmentKm(l, from, to)
      const offRouteKm = Math.round(off * 10) / 10
      return {
        id: `${from.id}-p${i}`,
        name: l.name,
        hubId: from.id,
        lat: l.lat,
        lng: l.lng,
        offRouteKm,
        detourMin: Math.max(1, Math.round(offRouteKm * 2.4)),
      }
    })
    .sort((a, b) => a.offRouteKm - b.offRouteKm)
    .slice(0, 5)
}

function pointToSegmentKm(p: { lat: number; lng: number }, a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  // Equirectangular projection is plenty accurate at city scale.
  const kx = 111.32 * Math.cos(toRad(a.lat))
  const ky = 110.57
  const ax = a.lng * kx, ay = a.lat * ky
  const bx = b.lng * kx, by = b.lat * ky
  const px = p.lng * kx, py = p.lat * ky
  const dx = bx - ax, dy = by - ay
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy || 1)))
  const cx = ax + t * dx, cy = ay + t * dy
  return Math.hypot(px - cx, py - cy)
}
