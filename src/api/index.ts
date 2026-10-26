// Mock API. Every screen mutates data through these async functions, never through the
// store directly — swapping this file for real HTTP calls is the backend integration point.
import { ADMIN_PASSCODE, DEMO_OTP } from '@/data/seed'
import { suggestPickups } from '@/lib/geo'
import type {
  AppConfig, Car, Incident, IncidentCategory, Notification, Ride, Role, SeatRequest, SettlementMethod,
  TripRequest, User, VerificationStatus,
} from '@/lib/types'
import { displayName, inviteCode, normalizePhone, nowISO, sleep, uid } from '@/lib/utils'
import { patch, updateIn, useDB } from '@/store/db'
import {
  acceptedRequests, canHost, canUseRides, getUser, myRequestFor, participantsOf, seatsTaken,
} from '@/store/selectors'

export class ApiError extends Error {}

const db = () => useDB.getState()
const latency = (ms = 450) => sleep(ms + Math.random() * 250)
function fail(msg: string): never {
  throw new ApiError(msg)
}

const me = (): User => {
  const u = getUser(db(), db().session.userId)
  if (!u) fail('Your session expired. Please sign in again.')
  return u!
}
const requireVerified = () => {
  const u = me()
  if (u.status === 'suspended') fail('Your account is suspended. Contact support.')
  if (!canUseRides(u)) fail('Your profile is still under review. You can ride once an admin verifies you.')
  return u
}
const rideOrFail = (id: string) => db().rides.find((r) => r.id === id) ?? fail('Ride not found.')
const setRide = (id: string, fn: (r: Ride) => Ride) => patch('rides', (l) => updateIn(l, id, fn))
const setSeat = (id: string, fn: (r: SeatRequest) => SeatRequest) => patch('seatRequests', (l) => updateIn(l, id, fn))

export function notify(userId: string, kind: Notification['kind'], title: string, body: string, link?: string) {
  patch('notifications', (l) => [{ id: uid('n_'), userId, kind, title, body, link, read: false, createdAt: nowISO() }, ...l])
}

// Mock counterparts react after a delay so flows feel two-sided.
const isMock = (userId: string) => !!getUser(db(), userId)?.isMock
const later = (ms: number, fn: () => void) => setTimeout(fn, ms)

/* ───────────────────────── Auth ───────────────────────── */

export async function requestSignInOtp(rawPhone: string) {
  await latency()
  const phone = normalizePhone(rawPhone)
  const user = db().users.find((u) => u.phone === phone)
  if (!user) fail('No Twigg account uses this number. Twigg is invite-only — ask a member for an invite.')
  patch('session', (s) => ({ ...s, pendingPhone: phone }))
  return { phone, devCode: DEMO_OTP }
}

export async function verifySignInOtp(code: string) {
  await latency(600)
  const phone = db().session.pendingPhone
  if (!phone) fail('Start again — we lost track of your number.')
  if (code !== DEMO_OTP) fail('That code doesn\'t match. Check the SMS and try again.')
  const user = db().users.find((u) => u.phone === phone)!
  patch('session', (s) => ({ ...s, userId: user.id, pendingPhone: undefined }))
  return user
}

export async function validateInvite(raw: string) {
  await latency()
  const code = raw.trim().toUpperCase()
  const invite = db().invites.find((i) => i.code === code)
  if (!invite) fail('This invite code isn\'t valid. Double-check it with the person who invited you.')
  if (invite!.usedBy) fail('This invite has already been used. Each invite works once.')
  const inviter = getUser(db(), invite!.inviterId)!
  if (inviter.status !== 'verified') fail('This invite is no longer active.')
  patch('session', (s) => ({ ...s, signup: { inviteCode: code, inviterId: inviter.id } }))
  return { code, inviter }
}

export async function requestSignUpOtp(rawPhone: string) {
  await latency()
  const phone = normalizePhone(rawPhone)
  if (db().users.some((u) => u.phone === phone)) fail('This number already has an account. Sign in instead.')
  patch('session', (s) => ({ ...s, signup: s.signup && { ...s.signup, phone, phoneVerified: false } }))
  return { phone, devCode: DEMO_OTP }
}

export async function verifySignUpOtp(code: string) {
  await latency(600)
  if (code !== DEMO_OTP) fail('That code doesn\'t match. Check the SMS and try again.')
  patch('session', (s) => ({ ...s, signup: s.signup && { ...s.signup, phoneVerified: true } }))
}

export interface SignupInput {
  firstName: string
  lastName: string
  displayName?: string
  birthdate: string
  email?: string
  social: User['social']
  hasLicense: boolean
  role: Role
  avatar?: string
  car?: Omit<Car, 'id'>
}

export async function completeSignup(input: SignupInput) {
  await latency(800)
  const draft = db().session.signup
  if (!draft?.phone || !draft.phoneVerified) fail('Please verify your mobile number first.')
  const invite = db().invites.find((i) => i.code === draft!.inviteCode)
  if (!invite || invite.usedBy) fail('Your invite is no longer valid.')
  const id = uid('u_')
  const now = nowISO()
  const user: User = {
    id,
    phone: draft!.phone!,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    displayName: input.displayName?.trim() || undefined,
    birthdate: input.birthdate,
    email: input.email?.trim() || undefined,
    social: input.social,
    hasLicense: input.hasLicense,
    role: input.role,
    status: 'unverified',
    avatar: input.avatar,
    interests: [],
    music: [],
    personality: null,
    privacy: { showEmail: false, showMusic: true, showPersonality: true },
    cars: input.car ? [{ ...input.car, id: uid('c_') }] : [],
    invitedBy: draft!.inviterId,
    inviteCodeUsed: draft!.inviteCode,
    createdAt: now,
    termsAcceptedAt: now,
  }
  patch('users', (l) => [...l, user])
  patch('invites', (l) => l.map((i) => (i.code === draft!.inviteCode ? { ...i, usedBy: id, usedAt: now } : i)))
  patch('session', () => ({ userId: id, admin: db().session.admin }))
  notify(draft!.inviterId, 'system', 'Your invite was used', `${user.firstName} joined Twigg with your invite and is waiting for review.`)
  notify(id, 'verification', 'Profile under review', 'The circle is reviewing your profile. Complete your social bio while you wait.', '/app/waiting-room')
  return user
}

export function signOut() {
  patch('session', (s) => ({ userId: null, admin: s.admin }))
}

export function demoSignInAs(userId: string) {
  patch('session', (s) => ({ ...s, userId, pendingPhone: undefined }))
}

export async function acceptBetaDisclaimer() {
  await latency(250)
  const u = me()
  patch('users', (l) => updateIn(l, u.id, (x) => ({ ...x, betaAcceptedAt: nowISO() })))
}

/* ───────────────────────── Profile ───────────────────────── */

export type ProfilePatch = Partial<Pick<User,
  'firstName' | 'lastName' | 'displayName' | 'email' | 'avatar' | 'interests' | 'music' | 'personality' | 'bio' | 'privacy' | 'social' | 'hasLicense'>>

export async function updateProfile(p: ProfilePatch) {
  await latency(350)
  const u = me()
  patch('users', (l) => updateIn(l, u.id, (x) => ({ ...x, ...p })))
}

export async function setRole(role: Role) {
  await latency(350)
  const u = me()
  patch('users', (l) => updateIn(l, u.id, (x) => ({ ...x, role })))
}

// Cars can be added without verification (per spec) — they're only used once the user hosts.
export async function addCar(c: Omit<Car, 'id'>) {
  await latency(350)
  const u = me()
  if (u.cars.some((x) => x.plate.replace(/\s/g, '') === c.plate.replace(/\s/g, ''))) fail('You already added a car with this plate number.')
  const car = { ...c, id: uid('c_') }
  patch('users', (l) => updateIn(l, u.id, (x) => ({ ...x, cars: [...x.cars, car] })))
  return car
}

export async function removeCar(carId: string) {
  await latency(300)
  const u = me()
  const inUse = db().rides.some((r) => r.carId === carId && ['pending', 'confirmed', 'active'].includes(r.status))
  if (inUse) fail('This car is assigned to an upcoming ride. Cancel or finish that ride first.')
  patch('users', (l) => updateIn(l, u.id, (x) => ({ ...x, cars: x.cars.filter((c) => c.id !== carId) })))
}

export async function createInvite(note?: string) {
  await latency(400)
  const u = requireVerified()
  const mine = db().invites.filter((i) => i.inviterId === u.id)
  if (mine.length >= db().config.maxInvites) fail(`You've used all ${db().config.maxInvites} invites.`)
  const invite = { code: inviteCode(), inviterId: u.id, createdAt: nowISO(), note: note?.trim() || undefined }
  patch('invites', (l) => [invite, ...l])
  return invite
}

export async function revokeInvite(code: string) {
  await latency(300)
  const u = me()
  patch('invites', (l) => l.filter((i) => !(i.code === code && i.inviterId === u.id && !i.usedBy)))
}

/* ───────────────────────── Rides (host) ───────────────────────── */

export interface RideInput {
  carId: string
  fromHubId: string
  toHubId: string
  meetingNote: string
  departAt: string
  timing: Ride['timing']
  seats: number
  luggage: Ride['luggage']
  notes: string
  visibility: Ride['visibility']
  hostIncluded: boolean
}

function validateRide(input: RideInput, u: User) {
  if (input.fromHubId === input.toHubId) fail('Start point and destination must be different hubs.')
  const car = u.cars.find((c) => c.id === input.carId) ?? fail('Pick one of your cars for this ride.')
  if (input.seats < 1 || input.seats > car.seats) fail(`This car offers up to ${car.seats} seats.`)
  if (new Date(input.departAt).getTime() < Date.now() - 5 * 60_000) fail('Departure time is in the past.')
}

export async function createRide(input: RideInput, publish: boolean) {
  await latency(600)
  const u = requireVerified()
  if (!canHost(u)) fail('Switch to Carpooler in your profile to host rides.')
  validateRide(input, u)
  const ride: Ride = {
    ...input,
    id: uid('r_'),
    hostId: u.id,
    status: publish ? 'pending' : 'draft',
    pickupOptions: suggestPickups(input.fromHubId, input.toHubId),
    pickupId: null,
    startConfirmations: [],
    createdAt: nowISO(),
    settlements: [],
  }
  patch('rides', (l) => [ride, ...l])
  if (publish && ride.visibility === 'public') simulateIncomingRequest(ride.id)
  return ride
}

export async function updateDraft(rideId: string, input: RideInput, publish: boolean) {
  await latency(500)
  const u = requireVerified()
  const ride = rideOrFail(rideId)
  if (ride.hostId !== u.id || ride.status !== 'draft') fail('Only drafts can be edited.')
  validateRide(input, u)
  setRide(rideId, (r) => ({
    ...r,
    ...input,
    status: publish ? 'pending' : 'draft',
    pickupOptions: suggestPickups(input.fromHubId, input.toHubId),
  }))
  if (publish && input.visibility === 'public') simulateIncomingRequest(rideId)
}

export async function deleteDraft(rideId: string) {
  await latency(300)
  const ride = rideOrFail(rideId)
  if (ride.hostId !== me().id || ride.status !== 'draft') fail('Only drafts can be deleted.')
  patch('rides', (l) => l.filter((r) => r.id !== rideId))
}

export async function respondToRequest(requestId: string, accept: boolean) {
  await latency(400)
  const u = requireVerified()
  const req = db().seatRequests.find((r) => r.id === requestId) ?? fail('Request not found.')
  const ride = rideOrFail(req.rideId)
  if (ride.hostId !== u.id) fail('Only the host can respond to requests.')
  if (req.status !== 'pending') fail('This request was already handled.')
  if (accept && seatsTaken(db(), ride.id) + req.seats > ride.seats) fail('Not enough seats left. Reject or add seats first.')
  setSeat(requestId, (r) => ({ ...r, status: accept ? 'accepted' : 'rejected', respondedAt: nowISO() }))
  notify(
    req.passengerId, 'request',
    accept ? 'You\'re in! Seat accepted' : 'Seat request declined',
    accept ? `${displayName(u)} accepted your seat request.` : `${displayName(u)} couldn't take you on this ride.`,
    `/app/rides/${ride.id}`,
  )
}

export async function selectPickup(rideId: string, pickupId: string) {
  await latency(300)
  const ride = rideOrFail(rideId)
  if (ride.hostId !== me().id) fail('Only the host sets the pickup point.')
  if (!['pending', 'confirmed'].includes(ride.status)) fail('Pickup can only change before the ride starts.')
  setRide(rideId, (r) => ({ ...r, pickupId }))
  if (ride.status === 'confirmed') {
    const pickup = ride.pickupOptions.find((p) => p.id === pickupId)
    acceptedRequests(db(), rideId).forEach((r) =>
      notify(r.passengerId, 'ride', 'Pickup point changed', `New pickup: ${pickup?.name}.`, `/app/rides/${rideId}`))
  }
}

export async function confirmRide(rideId: string) {
  await latency(500)
  const ride = rideOrFail(rideId)
  const u = me()
  if (ride.hostId !== u.id) fail('Only the host confirms the ride.')
  if (!acceptedRequests(db(), rideId).length) fail('Accept at least one rider before confirming.')
  if (!ride.pickupId) fail('Choose the final pickup point first.')
  setRide(rideId, (r) => ({ ...r, status: 'confirmed', confirmedAt: nowISO() }))
  const pickup = ride.pickupOptions.find((p) => p.id === ride.pickupId)
  acceptedRequests(db(), rideId).forEach((r) =>
    notify(r.passengerId, 'ride', 'Ride confirmed', `${displayName(u)} confirmed. Pickup at ${pickup?.name}.`, `/app/rides/${rideId}`))
}

// Both parties must confirm "Start Ride" (after the safety checklist) before it becomes active.
export async function confirmStart(rideId: string) {
  await latency(400)
  const u = requireVerified()
  const ride = rideOrFail(rideId)
  if (ride.status !== 'confirmed') fail('The ride must be confirmed before starting.')
  const participants = participantsOf(db(), ride)
  if (!participants.includes(u.id)) fail('Only riders on this ride can start it.')
  addStartConfirmation(rideId, u.id)
  // Mock riders confirm shortly after the real user does.
  participants.filter((p) => p !== u.id && isMock(p)).forEach((p, i) => later(1800 + i * 900, () => addStartConfirmation(rideId, p)))
}

function addStartConfirmation(rideId: string, userId: string) {
  const ride = db().rides.find((r) => r.id === rideId)
  if (!ride || ride.status !== 'confirmed') return
  const confirmations = Array.from(new Set([...ride.startConfirmations, userId]))
  const everyone = participantsOf(db(), ride).every((p) => confirmations.includes(p))
  setRide(rideId, (r) => ({ ...r, startConfirmations: confirmations, ...(everyone ? { status: 'active', startedAt: nowISO() } : {}) }))
  if (everyone) participantsOf(db(), ride).forEach((p) => notify(p, 'ride', 'Ride started', 'Everyone confirmed — have a good ride. Seatbelts on!', `/app/rides/${rideId}`))
}

export async function completeRide(rideId: string) {
  await latency(500)
  const ride = rideOrFail(rideId)
  if (ride.status !== 'active') fail('Only active rides can be completed.')
  if (!participantsOf(db(), ride).includes(me().id)) fail('Only riders on this ride can end it.')
  const settlements = acceptedRequests(db(), rideId).map((r) => ({ passengerId: r.passengerId, status: 'pending' as const }))
  setRide(rideId, (r) => ({ ...r, status: 'completed', completedAt: nowISO(), settlements }))
  participantsOf(db(), ride).forEach((p) =>
    notify(p, 'settlement', 'Ride completed', 'Settle the fuel share offline, then mark it as settled. Don\'t forget to leave a review.', `/app/rides/${rideId}`))
}

export async function cancelRide(rideId: string, reason: string) {
  await latency(500)
  const ride = rideOrFail(rideId)
  const u = me()
  if (ride.hostId !== u.id) fail('Only the host can cancel the ride.')
  if (['completed', 'cancelled', 'active'].includes(ride.status)) fail('This ride can no longer be cancelled.')
  setRide(rideId, (r) => ({ ...r, status: 'cancelled', cancelledAt: nowISO(), cancelReason: reason.trim() || undefined }))
  db().seatRequests.filter((r) => r.rideId === rideId && ['pending', 'accepted'].includes(r.status)).forEach((r) =>
    notify(r.passengerId, 'ride', 'Ride cancelled', `${displayName(u)} cancelled the ride${reason ? `: “${reason}”` : '.'}`, `/app/rides/${rideId}`))
}

export async function setHostIncluded(rideId: string, hostIncluded: boolean) {
  await latency(200)
  const ride = rideOrFail(rideId)
  if (ride.hostId !== me().id) fail('Only the host can change the split.')
  setRide(rideId, (r) => ({ ...r, hostIncluded }))
}

/* ───────────────────────── Settlement (offline, status only) ───────────────────────── */

export async function markSettled(rideId: string, passengerId: string, details: { method?: SettlementMethod; amount?: number; note?: string }) {
  await latency(400)
  const u = me()
  const ride = rideOrFail(rideId)
  if (ride.status !== 'completed') fail('Settlement opens after the ride is completed.')
  if (u.id !== ride.hostId && u.id !== passengerId) fail('Only the host or that rider can mark this settled.')
  setRide(rideId, (r) => ({
    ...r,
    settlements: r.settlements.map((s) =>
      s.passengerId === passengerId ? { ...s, ...details, status: 'settled', settledAt: nowISO(), markedBy: u.id } : s),
  }))
  const other = u.id === ride.hostId ? passengerId : ride.hostId
  notify(other, 'settlement', 'Marked as settled', `${displayName(u)} marked the fuel share as settled.`, `/app/rides/${rideId}`)
}

/* ───────────────────────── Rides (passenger) ───────────────────────── */

export async function requestSeat(rideId: string, seats: number, message: string) {
  await latency(500)
  const u = requireVerified()
  const ride = rideOrFail(rideId)
  if (ride.hostId === u.id) fail('You\'re hosting this ride.')
  if (!['pending', 'confirmed'].includes(ride.status)) fail('This ride isn\'t taking requests.')
  const existing = myRequestFor(db(), rideId, u.id)
  if (existing && ['pending', 'accepted'].includes(existing.status)) fail('You already requested a seat on this ride.')
  if (seatsTaken(db(), rideId) + seats > ride.seats) fail('Not enough seats left on this ride.')
  const req: SeatRequest = { id: uid('s_'), rideId, passengerId: u.id, seats, message: message.trim(), status: 'pending', source: 'request', createdAt: nowISO() }
  patch('seatRequests', (l) => [req, ...l])
  notify(ride.hostId, 'request', 'New seat request', `${displayName(u)} wants ${seats} seat${seats > 1 ? 's' : ''}.`, `/app/rides/${rideId}`)
  if (isMock(ride.hostId)) simulateHostResponse(req.id)
  return req
}

export async function withdrawRequest(requestId: string) {
  await latency(350)
  const u = me()
  const req = db().seatRequests.find((r) => r.id === requestId) ?? fail('Request not found.')
  if (req.passengerId !== u.id) fail('Not your request.')
  const ride = rideOrFail(req.rideId)
  if (ride.status === 'active') fail('The ride is already underway.')
  setSeat(requestId, (r) => ({ ...r, status: 'withdrawn', respondedAt: nowISO() }))
  if (req.status === 'accepted') {
    setRide(ride.id, (r) => ({ ...r, startConfirmations: r.startConfirmations.filter((x) => x !== u.id) }))
    notify(ride.hostId, 'request', 'A rider cancelled', `${displayName(u)} cancelled their seat.`, `/app/rides/${ride.id}`)
  }
}

/* ───────────────────────── Trip requests ───────────────────────── */

export type TripRequestInput = Omit<TripRequest, 'id' | 'passengerId' | 'shareToken' | 'status' | 'createdAt'>

export async function createTripRequest(input: TripRequestInput) {
  await latency(600)
  const u = requireVerified()
  if (input.fromHubId === input.toHubId) fail('Start point and destination must be different hubs.')
  if (input.windowEnd <= input.windowStart) fail('The time window must end after it starts.')
  const trip: TripRequest = { ...input, id: uid('t_'), passengerId: u.id, shareToken: uid('share-'), status: 'open', createdAt: nowISO() }
  patch('tripRequests', (l) => [trip, ...l])
  // A targeted private request becomes a seat request on that ride.
  if (trip.targetRideId) {
    const req = await requestSeatSilently(trip.targetRideId, u.id, trip.seats, trip.notes, trip.id)
    if (req && isMock(rideOrFail(trip.targetRideId).hostId)) simulateHostResponse(req.id)
  } else {
    simulateOfferFor(trip.id)
  }
  return trip
}

async function requestSeatSilently(rideId: string, passengerId: string, seats: number, message: string, tripRequestId: string) {
  const ride = db().rides.find((r) => r.id === rideId)
  if (!ride) return null
  const req: SeatRequest = { id: uid('s_'), rideId, passengerId, seats, message, status: 'pending', source: 'request', tripRequestId, createdAt: nowISO() }
  patch('seatRequests', (l) => [req, ...l])
  notify(ride.hostId, 'request', 'Private trip request', 'A rider sent a request targeted at your ride.', `/app/rides/${rideId}`)
  return req
}

export async function closeTripRequest(id: string) {
  await latency(300)
  const trip = db().tripRequests.find((t) => t.id === id) ?? fail('Request not found.')
  if (trip.passengerId !== me().id) fail('Not your request.')
  patch('tripRequests', (l) => updateIn(l, id, (t) => ({ ...t, status: 'closed' })))
}

// Host offers one of their rides to a passenger's trip request.
export async function offerRide(tripRequestId: string, rideId: string) {
  await latency(500)
  const u = requireVerified()
  const trip = db().tripRequests.find((t) => t.id === tripRequestId) ?? fail('Request not found.')
  const ride = rideOrFail(rideId)
  if (ride.hostId !== u.id) fail('You can only offer your own rides.')
  if (seatsTaken(db(), rideId) + trip.seats > ride.seats) fail('That ride doesn\'t have enough free seats.')
  if (db().seatRequests.some((r) => r.rideId === rideId && r.passengerId === trip.passengerId && ['pending', 'accepted'].includes(r.status)))
    fail('You already offered this ride to them.')
  const req: SeatRequest = {
    id: uid('s_'), rideId, passengerId: trip.passengerId, seats: trip.seats, message: '', status: 'pending', source: 'offer', tripRequestId, createdAt: nowISO(),
  }
  patch('seatRequests', (l) => [req, ...l])
  notify(trip.passengerId, 'request', 'A host offered you a seat', `${displayName(u)} offered a seat matching your trip request.`, `/app/requests/${trip.id}`)
  if (isMock(trip.passengerId)) {
    later(3200, () => {
      const current = db().seatRequests.find((r) => r.id === req.id)
      if (current?.status !== 'pending') return
      setSeat(req.id, (r) => ({ ...r, status: 'accepted', respondedAt: nowISO() }))
      patch('tripRequests', (l) => updateIn(l, trip.id, (t) => ({ ...t, status: 'matched' })))
      notify(u.id, 'request', 'Offer accepted', `${displayName(getUser(db(), trip.passengerId))} accepted your offer. Choose a pickup and confirm the ride.`, `/app/rides/${rideId}`)
    })
  }
}

export async function respondToOffer(requestId: string, accept: boolean) {
  await latency(400)
  const u = requireVerified()
  const req = db().seatRequests.find((r) => r.id === requestId) ?? fail('Offer not found.')
  if (req.passengerId !== u.id || req.source !== 'offer') fail('Not your offer.')
  if (req.status !== 'pending') fail('This offer was already handled.')
  const ride = rideOrFail(req.rideId)
  if (accept && seatsTaken(db(), ride.id) + req.seats > ride.seats) fail('Sorry — that ride just filled up.')
  setSeat(requestId, (r) => ({ ...r, status: accept ? 'accepted' : 'rejected', respondedAt: nowISO() }))
  if (accept && req.tripRequestId) patch('tripRequests', (l) => updateIn(l, req.tripRequestId!, (t) => ({ ...t, status: 'matched' })))
  notify(ride.hostId, 'request', accept ? 'Offer accepted' : 'Offer declined', `${displayName(u)} ${accept ? 'accepted' : 'declined'} your seat offer.`, `/app/rides/${ride.id}`)
  if (accept && isMock(ride.hostId)) simulateHostConfirms(ride.id)
}

/* ───────────────────────── Reviews & safety ───────────────────────── */

export async function submitReview(rideId: string, toId: string, rating: number, tag?: string, comment?: string) {
  await latency(500)
  const u = me()
  const ride = rideOrFail(rideId)
  if (ride.status !== 'completed') fail('You can review after the ride is completed.')
  if (db().reviews.some((r) => r.rideId === rideId && r.fromId === u.id && r.toId === toId)) fail('You already reviewed this person for this ride.')
  if (rating < 1 || rating > 5) fail('Pick a rating from 1 to 5.')
  patch('reviews', (l) => [{ id: uid('rv_'), rideId, fromId: u.id, toId, rating, tag, comment: comment?.trim() || undefined, status: 'pending', createdAt: nowISO() }, ...l])
}

export async function reportIncident(input: { category: IncidentCategory; description: string; rideId?: string; aboutUserId?: string; contactBack: boolean }) {
  await latency(700)
  const u = me()
  if (input.description.trim().length < 10) fail('Tell us a little more (at least 10 characters).')
  const incident: Incident = { ...input, id: uid('i_'), reporterId: u.id, description: input.description.trim(), status: 'open', actions: [], createdAt: nowISO() }
  patch('incidents', (l) => [incident, ...l])
  return incident
}

/* ───────────────────────── Notifications ───────────────────────── */

export function markNotificationRead(id: string) {
  patch('notifications', (l) => updateIn(l, id, (n) => ({ ...n, read: true })))
}

export function markAllNotificationsRead() {
  const userId = db().session.userId
  patch('notifications', (l) => l.map((n) => (n.userId === userId ? { ...n, read: true } : n)))
}

/* ───────────────────────── Admin ───────────────────────── */

const requireAdmin = () => {
  if (!db().session.admin) fail('Admin session required.')
}

export async function adminSignIn(passcode: string) {
  await latency(500)
  if (passcode.trim() !== ADMIN_PASSCODE) fail('Wrong passcode.')
  patch('session', (s) => ({ ...s, admin: true }))
}

export function adminSignOut() {
  patch('session', (s) => ({ ...s, admin: false }))
}

export async function setUserStatus(userId: string, status: VerificationStatus, note?: string) {
  await latency(400)
  requireAdmin()
  patch('users', (l) => updateIn(l, userId, (u) => ({
    ...u, status, statusNote: note?.trim() || undefined, ...(status === 'verified' ? { verifiedAt: nowISO() } : {}),
  })))
  const copy: Record<VerificationStatus, [string, string]> = {
    verified: ['You\'re verified ✓', 'Welcome to the circle! You can now join and host rides, and invite up to 5 friends.'],
    denied: ['Verification not approved', note || 'We couldn\'t verify your profile. Contact support if you think this is a mistake.'],
    suspended: ['Account suspended', note || 'Your account was suspended after a manual review. Contact support.'],
    unverified: ['Profile back in review', 'An admin moved your profile back to review.'],
  }
  notify(userId, 'verification', copy[status][0], copy[status][1], status === 'verified' ? '/app' : '/app/support')
}

export async function updateConfig(next: Pick<AppConfig, 'fuelPrice' | 'consumption' | 'supportPhone' | 'supportHours' | 'maxInvites' | 'reviewDisplayThreshold' | 'flags'>) {
  await latency(500)
  requireAdmin()
  patch('config', (c) => ({ ...c, ...next, updatedAt: nowISO() }))
}

export async function moderateReview(id: string, status: 'approved' | 'rejected') {
  await latency(300)
  requireAdmin()
  patch('reviews', (l) => updateIn(l, id, (r) => ({ ...r, status })))
}

export async function logIncidentAction(id: string, text: string, status?: Incident['status']) {
  await latency(350)
  requireAdmin()
  patch('incidents', (l) => updateIn(l, id, (i) => ({
    ...i,
    status: status ?? (i.status === 'open' ? 'reviewing' : i.status),
    actions: text.trim() ? [...i.actions, { at: nowISO(), text: text.trim() }] : i.actions,
  })))
}

/* ───────────────────────── Simulator ───────────────────────── */

function simulateHostResponse(requestId: string) {
  later(3500, () => {
    const req = db().seatRequests.find((r) => r.id === requestId)
    if (!req || req.status !== 'pending') return
    const ride = db().rides.find((r) => r.id === req.rideId)
    if (!ride) return
    const accept = seatsTaken(db(), ride.id) + req.seats <= ride.seats
    setSeat(requestId, (r) => ({ ...r, status: accept ? 'accepted' : 'rejected', respondedAt: nowISO() }))
    const host = getUser(db(), ride.hostId)
    notify(req.passengerId, 'request', accept ? 'You\'re in! Seat accepted' : 'Seat request declined',
      accept ? `${displayName(host)} accepted your request.` : `${displayName(host)}'s ride is full.`, `/app/rides/${ride.id}`)
    if (accept) {
      if (req.tripRequestId) patch('tripRequests', (l) => updateIn(l, req.tripRequestId!, (t) => ({ ...t, status: 'matched' })))
      simulateHostConfirms(ride.id)
    }
  })
}

function simulateHostConfirms(rideId: string) {
  later(2800, () => {
    const ride = db().rides.find((r) => r.id === rideId)
    if (!ride || ride.status !== 'pending') return
    const pickup = ride.pickupOptions.find((p) => p.id === ride.pickupId) ?? ride.pickupOptions[0]
    setRide(rideId, (r) => ({ ...r, pickupId: pickup.id, status: 'confirmed', confirmedAt: nowISO() }))
    acceptedRequests(db(), rideId).forEach((r) =>
      notify(r.passengerId, 'ride', 'Ride confirmed', `${displayName(getUser(db(), ride.hostId))} confirmed. Pickup at ${pickup.name}.`, `/app/rides/${rideId}`))
  })
}

function simulateIncomingRequest(rideId: string) {
  later(7000, () => {
    const ride = db().rides.find((r) => r.id === rideId)
    if (!ride || ride.status !== 'pending' || seatsTaken(db(), rideId) >= ride.seats) return
    const taken = new Set(db().seatRequests.filter((r) => r.rideId === rideId).map((r) => r.passengerId))
    const rider = db().users.find((u) => u.isMock && u.status === 'verified' && u.role === 'passenger' && !taken.has(u.id))
    if (!rider) return
    patch('seatRequests', (l) => [{
      id: uid('s_'), rideId, passengerId: rider.id, seats: 1, message: 'Hi! This route is perfect for me 🙌', status: 'pending', source: 'request', createdAt: nowISO(),
    }, ...l])
    notify(ride.hostId, 'request', 'New seat request', `${displayName(rider)} wants to join your ride.`, `/app/rides/${rideId}`)
  })
}

function simulateOfferFor(tripRequestId: string) {
  later(6000, () => {
    const trip = db().tripRequests.find((t) => t.id === tripRequestId)
    if (!trip || trip.status !== 'open') return
    const ride = db().rides.find((r) =>
      r.status === 'pending' && isMock(r.hostId) && r.fromHubId === trip.fromHubId && seatsTaken(db(), r.id) + trip.seats <= r.seats)
    if (!ride) return
    patch('seatRequests', (l) => [{
      id: uid('s_'), rideId: ride.id, passengerId: trip.passengerId, seats: trip.seats, message: '', status: 'pending', source: 'offer', tripRequestId, createdAt: nowISO(),
    }, ...l])
    notify(trip.passengerId, 'request', 'A host offered you a seat', `${displayName(getUser(db(), ride.hostId))} has a ride that matches your request.`, `/app/requests/${trip.id}`)
  })
}
