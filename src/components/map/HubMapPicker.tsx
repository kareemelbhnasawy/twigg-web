import {
  AdvancedMarker, AdvancedMarkerAnchorPoint, APILoadingStatus, APIProvider, Map, Polyline, useApiLoadingStatus, useMap, useMapsLibrary,
  type MapMouseEvent,
} from '@vis.gl/react-google-maps'
import { ExternalLink, MousePointerClick, Navigation } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Segmented } from '@/components/ui/Form'
import { toast } from '@/components/ui/Toast'
import { HUBS, hubById, routeDistanceKm, routeDurationMin, viaRoad } from '@/lib/geo'
import { CAIRO, directionsUrl, embedUrl, GOOGLE_MAP_ID, GOOGLE_MAPS_KEY, nearestHub, SNAP_RADIUS_KM, useMapsAuth } from '@/lib/maps'
import type { Hub } from '@/lib/types'
import { cn } from '@/lib/utils'

// Loads the Maps JS API once for the whole app — only when a key is configured.
export function MapsProvider({ children }: { children: ReactNode }) {
  if (!GOOGLE_MAPS_KEY) return <>{children}</>
  return <APIProvider apiKey={GOOGLE_MAPS_KEY} language="en" region="EG">{children}</APIProvider>
}

interface PickerProps {
  fromHubId: string
  toHubId: string
  onFrom: (hubId: string) => void
  onTo: (hubId: string) => void
  className?: string
}

interface RouteInfo { km: number; min: number; via?: string }

// Start/destination picker on a real Google map. Hubs stay the source of truth (dense matching
// in the beta): tapping a hub — or anywhere near one — selects it, and the selects stay in sync.
export function HubMapPicker(props: PickerProps) {
  return GOOGLE_MAPS_KEY ? <InteractivePicker {...props} /> : <EmbedPicker {...props} />
}

function InteractivePicker({ fromHubId, toHubId, onFrom, onTo, className }: PickerProps) {
  const status = useApiLoadingStatus()
  const authFailed = useMapsAuth((s) => s.failed)
  const [mode, setMode] = useState<'from' | 'to'>(fromHubId && !toHubId ? 'to' : 'from')
  const [route, setRoute] = useState<RouteInfo | null>(null)
  const from = fromHubId ? hubById(fromHubId) : undefined
  const to = toHubId ? hubById(toHubId) : undefined

  if (authFailed || status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return <EmbedPicker fromHubId={fromHubId} toHubId={toHubId} onFrom={onFrom} onTo={onTo} className={className}
      notice="Google Maps couldn't load with the configured key — showing a preview instead." />
  }

  const pick = (hubId: string) => {
    if (mode === 'from') {
      if (hubId === toHubId) return toast('That\'s already your destination', 'info')
      onFrom(hubId)
      setMode('to')
    } else {
      if (hubId === fromHubId) return toast('That\'s already your start point', 'info')
      onTo(hubId)
    }
  }

  const onMapClick = (e: MapMouseEvent) => {
    const latLng = e.detail.latLng
    if (!latLng) return
    const { hub, km } = nearestHub(latLng)
    if (km > SNAP_RADIUS_KM) return toast(`No Twigg hub there yet — the nearest is ${hub.name}`, 'info')
    pick(hub.id)
  }

  return (
    <div className={cn('overflow-hidden rounded-[var(--radius-xl2)] border border-sand bg-paper', className)}>
      <div className="p-3">
        <Segmented size="sm" value={mode} onChange={setMode} options={[
          { value: 'from', label: <ModeLabel letter="A" tone="forest" text={from?.name ?? 'Set start'} /> },
          { value: 'to', label: <ModeLabel letter="B" tone="clay" text={to?.name ?? 'Set destination'} /> },
        ]} />
      </div>
      <div className="relative h-72 sm:h-80">
        <Map
          defaultCenter={CAIRO}
          defaultZoom={10}
          mapId={GOOGLE_MAP_ID}
          gestureHandling="cooperative"
          disableDefaultUI
          zoomControl
          clickableIcons={false}
          onClick={onMapClick}
        >
          {HUBS.map((h) => {
            const role = h.id === fromHubId ? 'from' : h.id === toHubId ? 'to' : null
            return (
              <AdvancedMarker key={h.id} position={h} title={h.name} zIndex={role ? 10 : 1} onClick={() => pick(h.id)}
                anchorPoint={role ? AdvancedMarkerAnchorPoint.BOTTOM_CENTER : AdvancedMarkerAnchorPoint.CENTER}>
                <HubPin hub={h} role={role} />
              </AdvancedMarker>
            )
          })}
          <RouteLayer from={from} to={to} onRoute={setRoute} />
        </Map>
        <p className="pointer-events-none absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-forest/90 px-3 py-1.5 text-[12px] font-semibold text-cream shadow">
          <MousePointerClick className="size-3.5 text-sprout" />
          Tap a hub to {(mode === 'from' ? from : to) ? 'change' : 'set'} your {mode === 'from' ? 'start' : 'destination'}
        </p>
      </div>
      <RouteFooter from={from} to={to} route={route} />
    </div>
  )
}

function ModeLabel({ letter, tone, text }: { letter: string; tone: 'forest' | 'clay'; text: string }) {
  return (
    <span className="flex min-w-0 items-center justify-center gap-1.5">
      <span className={cn('flex size-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
        tone === 'forest' ? 'bg-sprout text-forest' : 'bg-clay text-white')}>{letter}</span>
      <span className="truncate">{text}</span>
    </span>
  )
}

function HubPin({ hub, role }: { hub: Hub; role: 'from' | 'to' | null }) {
  if (!role) {
    return (
      <span className="group relative flex size-6 cursor-pointer items-center justify-center">
        <span className="size-3.5 rounded-full border-[2.5px] border-forest bg-paper shadow-md transition group-hover:scale-125 group-hover:bg-sprout" />
        <span className="pointer-events-none absolute bottom-full mb-1 rounded-full bg-ink px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap text-cream opacity-0 transition group-hover:opacity-100">
          {hub.name}
        </span>
      </span>
    )
  }
  const from = role === 'from'
  return (
    <span className="flex cursor-pointer flex-col items-center drop-shadow-lg">
      <span className={cn('flex items-center gap-1.5 rounded-full py-1 pr-3 pl-1 text-[12px] font-bold whitespace-nowrap',
        from ? 'bg-forest text-cream' : 'bg-clay text-white')}>
        <span className={cn('flex size-5 items-center justify-center rounded-full text-[10px]', from ? 'bg-sprout text-forest' : 'bg-white text-clay')}>
          {from ? 'A' : 'B'}
        </span>
        {hub.name}
      </span>
      <span className={cn('-mt-1 size-2.5 rotate-45', from ? 'bg-forest' : 'bg-clay')} />
    </span>
  )
}

// Draws the road route via the Routes API (Route.computeRoutes) when the key allows it; otherwise
// a dashed straight line. Also keeps the camera framed on whatever is selected.
function RouteLayer({ from, to, onRoute }: { from?: Hub; to?: Hub; onRoute: (r: RouteInfo | null) => void }) {
  const map = useMap()
  const routes = useMapsLibrary('routes')
  const [path, setPath] = useState<google.maps.LatLngLiteral[] | null>(null)
  const [road, setRoad] = useState(false)

  useEffect(() => {
    onRoute(null)
    setRoad(false)
    if (!from || !to) {
      setPath(null)
      return
    }
    setPath([from, to])
    if (!routes) return
    let cancelled = false
    routes.Route.computeRoutes({
      origin: { lat: from.lat, lng: from.lng },
      destination: { lat: to.lat, lng: to.lng },
      travelMode: 'DRIVING',
      region: 'EG',
      language: 'en',
      fields: ['path', 'distanceMeters', 'durationMillis', 'description'],
    })
      .then(({ routes: found }) => {
        const r = found?.[0]
        if (cancelled || !r?.path?.length) return
        setPath(r.path.map((p) => ({ lat: p.lat, lng: p.lng })))
        setRoad(true)
        onRoute({ km: (r.distanceMeters ?? 0) / 1000, min: (r.durationMillis ?? 0) / 60000, via: r.description ?? undefined })
      })
      .catch(() => { /* Routes API not enabled on this key — keep the straight line */ })
    return () => { cancelled = true }
    // onRoute is a state setter from the parent; hub ids fully describe the inputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [from?.id, to?.id, routes])

  // Until both ends are chosen, keep every hub in view so the next one is always tappable;
  // then frame the route.
  useEffect(() => {
    if (!map) return
    const points = path ?? HUBS
    const bounds = new google.maps.LatLngBounds()
    points.forEach((p) => bounds.extend(p))
    // Route view leaves room for the A/B name pills, which extend sideways from their points.
    map.fitBounds(bounds, path ? { top: 96, bottom: 32, left: 96, right: 120 } : { top: 64, bottom: 24, left: 32, right: 32 })
  }, [map, path])

  if (!path) return null
  return road ? (
    <>
      <Polyline path={path} strokeColor="#1d3a2a" strokeOpacity={0.18} strokeWeight={11} />
      <Polyline path={path} strokeColor="#1d3a2a" strokeOpacity={0.95} strokeWeight={5} />
    </>
  ) : (
    <Polyline path={path} geodesic strokeOpacity={0} icons={[{
      icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeColor: '#e3743c', scale: 3 },
      offset: '0',
      repeat: '14px',
    }]} />
  )
}

function EmbedPicker({ fromHubId, toHubId, className, notice }: PickerProps & { notice?: string }) {
  const from = fromHubId ? hubById(fromHubId) : undefined
  const to = toHubId ? hubById(toHubId) : undefined
  return (
    <div className={cn('overflow-hidden rounded-[var(--radius-xl2)] border border-sand bg-paper', className)}>
      <div className="relative h-72 bg-sand/40 sm:h-80">
        <iframe
          key={`${fromHubId}-${toHubId}`}
          title="Route preview on Google Maps"
          src={embedUrl(from, to)}
          className="size-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
        {!(from && to) && (
          <p className="pointer-events-none absolute top-3 left-3 rounded-full bg-forest/90 px-3 py-1.5 text-[12px] font-semibold text-cream shadow">
            {from || to ? 'Now choose the other hub above' : 'Choose your start and destination above'}
          </p>
        )}
      </div>
      <RouteFooter from={from} to={to} route={null} />
      {(notice || import.meta.env.DEV) && (
        <p className="border-t border-sand bg-cream/50 px-4 py-2 text-[11.5px] text-ink-faint">
          {notice ?? 'Dev note: add VITE_GOOGLE_MAPS_API_KEY to .env.local to tap hubs directly on the map.'}
        </p>
      )}
    </div>
  )
}

function RouteFooter({ from, to, route }: { from?: Hub; to?: Hub; route: RouteInfo | null }) {
  if (!from || !to) return null
  const km = route ? Math.round(route.km) : routeDistanceKm(from.id, to.id)
  const min = route ? Math.round(route.min) : routeDurationMin(km)
  const via = route?.via ? `via ${route.via}` : viaRoad(from.id, to.id)
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-sand px-4 py-3">
      <p className="flex items-center gap-2 text-[13px] text-ink-soft">
        <Navigation className="size-4 text-moss" />
        <span><b className="text-ink">{route ? '' : '≈ '}{km} km</b> · ~{min} min · {via}</span>
      </p>
      <a href={directionsUrl(from, to)} target="_blank" rel="noreferrer"
        className="inline-flex items-center gap-1 text-[12.5px] font-bold text-forest hover:underline">
        Open in Google Maps <ExternalLink className="size-3.5" />
      </a>
    </div>
  )
}
