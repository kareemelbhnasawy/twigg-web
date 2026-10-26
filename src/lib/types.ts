// Domain model for Twigg. Shapes are kept backend-friendly (flat, id references)
// so the mock DB can later be swapped for a real API without touching screens.

export type ID = string
export type ISODate = string

export type Role = 'passenger' | 'carpooler'
export type VerificationStatus = 'unverified' | 'verified' | 'denied' | 'suspended'
export type Personality = 'quiet' | 'chatty' | 'depends'
export type SocialNetwork = 'instagram' | 'facebook'
export type FuelType = 'gasoline' | 'diesel' | 'hybrid' | 'electric'
export type Timing = 'flexible' | 'sharp'
export type Visibility = 'public' | 'private'
export type Luggage = 'none' | 'small' | 'medium' | 'large'

export interface Car {
  id: ID
  make: string
  model: string
  color: string
  plate: string
  fuelType: FuelType
  seats: number
}

export interface PrivacySettings {
  showEmail: boolean
  showMusic: boolean
  showPersonality: boolean
}

export interface User {
  id: ID
  phone: string
  firstName: string
  lastName: string
  displayName?: string
  birthdate: string
  email?: string
  social: { network: SocialNetwork; handle: string }
  hasLicense: boolean
  role: Role
  status: VerificationStatus
  statusNote?: string
  avatar?: string // data URL; falls back to initials
  interests: string[]
  music: string[]
  personality: Personality | null
  bio?: string
  privacy: PrivacySettings
  cars: Car[]
  invitedBy: ID | null
  inviteCodeUsed: string | null
  createdAt: ISODate
  termsAcceptedAt: ISODate
  betaAcceptedAt?: ISODate
  verifiedAt?: ISODate
  isMock?: boolean // seeded counterpart driven by the simulator
  priorRides?: number // ride history that predates this dataset
}

export interface Hub {
  id: ID
  name: string
  area: 'West' | 'Central' | 'East'
  lat: number
  lng: number
  landmarks: { name: string; lat: number; lng: number }[]
}

export interface PickupPoint {
  id: ID
  name: string
  hubId: ID
  lat: number
  lng: number
  offRouteKm: number
  detourMin: number
}

export type RideStatus = 'draft' | 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled'

export type SettlementMethod = 'cash' | 'transfer' | 'other'

export interface Settlement {
  passengerId: ID
  status: 'pending' | 'settled'
  method?: SettlementMethod
  amount?: number
  note?: string
  settledAt?: ISODate
  markedBy?: ID
}

export interface Ride {
  id: ID
  hostId: ID
  carId: ID
  fromHubId: ID
  toHubId: ID
  meetingNote: string
  departAt: ISODate
  timing: Timing
  seats: number
  luggage: Luggage
  notes: string
  visibility: Visibility
  hostIncluded: boolean
  status: RideStatus
  pickupOptions: PickupPoint[]
  pickupId: ID | null
  startConfirmations: ID[]
  createdAt: ISODate
  confirmedAt?: ISODate
  startedAt?: ISODate
  completedAt?: ISODate
  cancelledAt?: ISODate
  cancelReason?: string
  settlements: Settlement[]
}

export type SeatRequestStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'

export interface SeatRequest {
  id: ID
  rideId: ID
  passengerId: ID
  seats: number
  message: string
  status: SeatRequestStatus
  source: 'request' | 'offer' // offer = host invited passenger from a trip request
  tripRequestId?: ID
  createdAt: ISODate
  respondedAt?: ISODate
}

export interface TripRequest {
  id: ID
  passengerId: ID
  fromHubId: ID
  toHubId: ID
  meetingNote: string
  date: string // yyyy-mm-dd
  windowStart: string // HH:mm
  windowEnd: string
  timing: Timing
  seats: number
  preferences: string[]
  notes: string
  visibility: Visibility
  targetRideId?: ID
  shareToken: string
  status: 'open' | 'matched' | 'closed'
  createdAt: ISODate
}

export interface Review {
  id: ID
  rideId: ID
  fromId: ID
  toId: ID
  rating: number
  tag?: string
  comment?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: ISODate
}

export type IncidentCategory = 'unsafe_vehicle' | 'ride_discomfort' | 'behavior' | 'other'

export interface Incident {
  id: ID
  reporterId: ID
  rideId?: ID
  aboutUserId?: ID
  category: IncidentCategory
  description: string
  contactBack: boolean
  status: 'open' | 'reviewing' | 'resolved'
  actions: { at: ISODate; text: string }[]
  createdAt: ISODate
}

export interface Invite {
  code: string
  inviterId: ID
  createdAt: ISODate
  note?: string
  usedBy?: ID
  usedAt?: ISODate
}

export interface Notification {
  id: ID
  userId: ID
  kind: 'request' | 'ride' | 'verification' | 'settlement' | 'review' | 'system'
  title: string
  body: string
  link?: string
  read: boolean
  createdAt: ISODate
}

export interface AppConfig {
  fuelPrice: { gasoline: number; diesel: number } // EGP per litre
  consumption: { gasoline: number; diesel: number } // km per litre
  supportPhone: string
  supportHours: string
  maxInvites: number
  reviewDisplayThreshold: number
  flags: {
    publicReviewsAfterThreshold: boolean
    nativeOnly: Record<string, boolean>
  }
  updatedAt: ISODate
}
