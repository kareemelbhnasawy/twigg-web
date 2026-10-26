import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { buildSeed, SEED_VERSION } from '@/data/seed'
import type {
  AppConfig, Incident, Invite, Notification, Review, Ride, SeatRequest, TripRequest, User,
} from '@/lib/types'

// Sign-up wizard draft, kept in the DB so a refresh mid-flow doesn't lose progress.
export interface SignupDraft {
  inviteCode: string
  inviterId: string
  phone?: string
  phoneVerified?: boolean
}

export interface Session {
  userId: string | null
  admin: boolean
  pendingPhone?: string // phone awaiting OTP for sign-in
  signup?: SignupDraft
}

export interface DBState {
  seedVersion: number
  users: User[]
  rides: Ride[]
  seatRequests: SeatRequest[]
  tripRequests: TripRequest[]
  reviews: Review[]
  incidents: Incident[]
  invites: Invite[]
  notifications: Notification[]
  config: AppConfig
  session: Session
}

const fresh = (): DBState => ({ seedVersion: SEED_VERSION, ...buildSeed(), session: { userId: null, admin: false } })

export const useDB = create<DBState>()(
  persist(fresh, {
    name: 'twigg-mock-db',
    version: SEED_VERSION,
    storage: createJSONStorage(() => localStorage),
    // A new seed version wipes local data rather than migrating — this is a mock DB.
    migrate: () => fresh(),
  }),
)

export const resetDB = (keepSession = false) => {
  const session = useDB.getState().session
  useDB.setState({ ...fresh(), session: keepSession ? session : { userId: null, admin: false } })
}

// Immutable update helpers used by the mock API.
export const patch = <K extends keyof DBState>(key: K, fn: (v: DBState[K]) => DBState[K]) =>
  useDB.setState((s) => ({ [key]: fn(s[key]) }) as Pick<DBState, K>)

export const updateIn = <T extends { id: string }>(list: T[], id: string, fn: (item: T) => T): T[] =>
  list.map((x) => (x.id === id ? fn(x) : x))
