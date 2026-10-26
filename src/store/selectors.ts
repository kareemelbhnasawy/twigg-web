import { useMemo } from 'react'
import { useDB, type DBState } from './db'
import type { Ride, SeatRequest, User } from '@/lib/types'

// Pure selectors take the raw DB so they can be reused in the mock API and in hooks.
// Hooks subscribe to whole tables (stable references) and derive with useMemo,
// which avoids zustand v5's "new array every render" loop.

export const getUser = (db: Pick<DBState, 'users'>, id?: string | null) => db.users.find((u) => u.id === id)

export const rideRequests = (db: Pick<DBState, 'seatRequests'>, rideId: string) =>
  db.seatRequests.filter((r) => r.rideId === rideId)

export const acceptedRequests = (db: Pick<DBState, 'seatRequests'>, rideId: string) =>
  rideRequests(db, rideId).filter((r) => r.status === 'accepted')

export const seatsTaken = (db: Pick<DBState, 'seatRequests'>, rideId: string) =>
  acceptedRequests(db, rideId).reduce((n, r) => n + r.seats, 0)

export const participantsOf = (db: Pick<DBState, 'seatRequests'>, ride: Ride) => [
  ride.hostId,
  ...acceptedRequests(db, ride.id).map((r) => r.passengerId),
]

export const isParticipant = (db: Pick<DBState, 'seatRequests'>, ride: Ride, userId: string) =>
  participantsOf(db, ride).includes(userId)

export const myRequestFor = (db: Pick<DBState, 'seatRequests'>, rideId: string, userId: string): SeatRequest | undefined =>
  db.seatRequests
    .filter((r) => r.rideId === rideId && r.passengerId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

export const completedRideCount = (db: Pick<DBState, 'rides' | 'seatRequests' | 'users'>, userId: string) => {
  const prior = getUser(db, userId)?.priorRides ?? 0
  const done = db.rides.filter((r) => r.status === 'completed' && isParticipant(db, r, userId)).length
  return prior + done
}

export const ratingFor = (db: Pick<DBState, 'reviews'>, userId: string) => {
  const approved = db.reviews.filter((r) => r.toId === userId && r.status === 'approved')
  if (!approved.length) return null
  return { avg: approved.reduce((s, r) => s + r.rating, 0) / approved.length, count: approved.length }
}

// ——— Hooks ———

export const useSession = () => useDB((s) => s.session)
export const useConfig = () => useDB((s) => s.config)

export function useMe(): User | undefined {
  const userId = useDB((s) => s.session.userId)
  const users = useDB((s) => s.users)
  return useMemo(() => users.find((u) => u.id === userId), [users, userId])
}

export function useUser(id?: string | null) {
  const users = useDB((s) => s.users)
  return useMemo(() => users.find((u) => u.id === id), [users, id])
}

export function useUsersMap() {
  const users = useDB((s) => s.users)
  return useMemo(() => new Map(users.map((u) => [u.id, u])), [users])
}

export function useRide(id?: string) {
  const rides = useDB((s) => s.rides)
  return useMemo(() => rides.find((r) => r.id === id), [rides, id])
}

export function useRideRequests(rideId?: string) {
  const seatRequests = useDB((s) => s.seatRequests)
  return useMemo(() => seatRequests.filter((r) => r.rideId === rideId), [seatRequests, rideId])
}

export function useSeatRequests() {
  return useDB((s) => s.seatRequests)
}

export function useMyNotifications() {
  const userId = useDB((s) => s.session.userId)
  const all = useDB((s) => s.notifications)
  return useMemo(
    () => all.filter((n) => n.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [all, userId],
  )
}

export function useStats(userId?: string) {
  const rides = useDB((s) => s.rides)
  const seatRequests = useDB((s) => s.seatRequests)
  const users = useDB((s) => s.users)
  const reviews = useDB((s) => s.reviews)
  return useMemo(() => {
    if (!userId) return { rides: 0, rating: null }
    return { rides: completedRideCount({ rides, seatRequests, users }, userId), rating: ratingFor({ reviews }, userId) }
  }, [rides, seatRequests, users, reviews, userId])
}

export const canUseRides = (u?: User) => u?.status === 'verified'
export const canHost = (u?: User) => canUseRides(u) && u?.role === 'carpooler'
