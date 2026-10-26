import { routeDistanceKm } from './geo'
import type { AppConfig, FuelType } from './types'

export const FUEL_LABEL: Record<FuelType, string> = {
  gasoline: 'Gasoline',
  diesel: 'Diesel',
  hybrid: 'Hybrid',
  electric: 'Electric',
}

export const isEstimableFuel = (f: FuelType): f is 'gasoline' | 'diesel' => f === 'gasoline' || f === 'diesel'

export interface FuelEstimate {
  distanceKm: number
  consumption: number
  price: number
  total: number
  participants: number
  perPerson: number
  supported: boolean
}

// Estimated Fuel Cost = (Distance ÷ Average Consumption) × Fuel Price
export function estimateFuel(
  config: AppConfig,
  opts: { fromHubId: string; toHubId: string; fuelType: FuelType; passengers: number; hostIncluded: boolean },
): FuelEstimate {
  const distanceKm = routeDistanceKm(opts.fromHubId, opts.toHubId)
  if (!isEstimableFuel(opts.fuelType)) {
    return { distanceKm, consumption: 0, price: 0, total: 0, participants: 0, perPerson: 0, supported: false }
  }
  const consumption = config.consumption[opts.fuelType]
  const price = config.fuelPrice[opts.fuelType]
  const total = (distanceKm / consumption) * price
  const participants = Math.max(1, opts.passengers + (opts.hostIncluded ? 1 : 0))
  return {
    distanceKm,
    consumption,
    price,
    total,
    participants,
    perPerson: total / participants,
    supported: true,
  }
}

export const egp = (n: number) => `EGP ${Math.round(n).toLocaleString('en-US')}`
