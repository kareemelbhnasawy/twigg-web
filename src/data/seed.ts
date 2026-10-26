import { suggestPickups } from '@/lib/geo'
import type {
  AppConfig, Car, Incident, Invite, Notification, Review, Ride, SeatRequest, TripRequest, User,
} from '@/lib/types'
import { toDateInput } from '@/lib/utils'

export const SEED_VERSION = 4

// Demo personas the Demo panel can switch between.
export const PERSONAS = {
  passenger: 'u_nour',
  carpooler: 'u_omar',
} as const

export const DEMO_OTP = '246810'
export const ADMIN_PASSCODE = 'twigg-admin'

const at = (dayOffset: number, hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date()
  d.setDate(d.getDate() + dayOffset)
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}
const inHours = (h: number) => {
  const d = new Date(Date.now() + h * 3600_000)
  d.setMinutes(Math.round(d.getMinutes() / 5) * 5, 0, 0)
  return d.toISOString()
}
const ago = (days: number) => new Date(Date.now() - days * 86400_000).toISOString()

const car = (id: string, make: string, model: string, color: string, plate: string, fuelType: Car['fuelType'] = 'gasoline', seats = 4): Car =>
  ({ id, make, model, color, plate, fuelType, seats })

type UserSeed = Partial<User> & Pick<User, 'id' | 'firstName' | 'lastName'>

let phoneSeq = 0
const user = (u: UserSeed): User => ({
  phone: `+2010${String(55501234 + ++phoneSeq * 7919).padStart(8, '0')}`,
  birthdate: '1995-04-12',
  social: { network: 'instagram', handle: `${u.firstName.toLowerCase()}.${u.lastName.toLowerCase()}` },
  hasLicense: false,
  role: 'passenger',
  status: 'verified',
  interests: [],
  music: [],
  personality: null,
  privacy: { showEmail: false, showMusic: true, showPersonality: true },
  cars: [],
  invitedBy: 'u_founder',
  inviteCodeUsed: null,
  createdAt: ago(60),
  termsAcceptedAt: ago(60),
  betaAcceptedAt: ago(59),
  verifiedAt: ago(58),
  isMock: true,
  ...u,
})

export function buildSeed() {
  const users: User[] = [
    user({
      id: 'u_founder', firstName: 'Twigg', lastName: 'Circle', displayName: 'Twigg Team', role: 'carpooler',
      social: { network: 'instagram', handle: 'twigg.eg' }, invitedBy: null, priorRides: 40,
      interests: ['Startups'], personality: 'depends',
    }),
    user({
      id: 'u_nour', firstName: 'Nour', lastName: 'Hassan', phone: '+201001234567', birthdate: '1997-08-21',
      email: 'nour.hassan@gmail.com', social: { network: 'instagram', handle: 'nour.hsn' },
      interests: ['Design', 'Coffee ☕', 'Podcasts', 'Padel 🎾'], music: ['Arabic indie', 'Fairuz', 'Lo-fi'],
      personality: 'quiet', bio: 'Product designer commuting Zayed → New Cairo. Coffee on me if you play Cairokee.',
      invitedBy: 'u_mariam', isMock: false, priorRides: 9, hasLicense: true,
    }),
    user({
      id: 'u_omar', firstName: 'Omar', lastName: 'Farouk', phone: '+201112345678', birthdate: '1993-02-03',
      email: 'omar.farouk@outlook.com', social: { network: 'instagram', handle: 'omarfarouk' }, role: 'carpooler', hasLicense: true,
      interests: ['Football ⚽', 'Tech', 'Startups', 'Running'], music: ['Amr Diab', 'Wegz & rap', 'Podcasts only'],
      personality: 'chatty', bio: 'Software lead at a fintech in New Cairo. Leave Zayed at 8 sharp-ish.',
      cars: [car('c_omar1', 'Hyundai', 'Elantra CN7', 'Silver', 'ق ه ط 4821'), car('c_omar2', 'Toyota', 'Corolla', 'White', 'ر س ب 1957', 'gasoline')],
      invitedBy: 'u_founder', isMock: false, priorRides: 23,
    }),
    user({
      id: 'u_mariam', firstName: 'Mariam', lastName: 'Adel', role: 'carpooler', hasLicense: true, personality: 'chatty',
      interests: ['Books', 'Travel', 'Food spots'], music: ['Amr Diab', 'Pop', 'Arabic indie'],
      bio: 'Dentist. I drive Zayed ⇄ 5th Settlement daily, always with a playlist.',
      cars: [car('c_mariam', 'Kia', 'Sportage', 'Midnight blue', 'م ن ع 7310')], priorRides: 31,
    }),
    user({
      id: 'u_karim', firstName: 'Karim', lastName: 'Mostafa', role: 'carpooler', hasLicense: true, personality: 'quiet',
      interests: ['Engineering', 'Gym'], music: ['Lo-fi', 'Electronic'], social: { network: 'facebook', handle: 'karim.mostafa.eng' },
      bio: 'Network engineer at Smart Village. Quiet mornings, strict 8:15.',
      cars: [car('c_karim', 'Skoda', 'Octavia', 'Grey', 'ص ط د 2208', 'diesel')], priorRides: 18,
    }),
    user({
      id: 'u_salma', firstName: 'Salma', lastName: 'Ibrahim', role: 'carpooler', hasLicense: true, personality: 'depends',
      interests: ['Finance', 'Padel 🎾', 'Coffee ☕'], music: ['Jazz', 'Fairuz'],
      cars: [car('c_salma', 'MG', 'ZS', 'Red', 'ل و ي 6604')], priorRides: 12,
    }),
    user({
      id: 'u_laila', firstName: 'Laila', lastName: 'Fathy', role: 'carpooler', hasLicense: true, personality: 'quiet',
      interests: ['Languages', 'Volunteering'], music: ['Oum Kalthoum', 'Quran'],
      cars: [car('c_laila', 'Nissan', 'Sunny', 'Beige', 'ع ف ج 3390')], priorRides: 7,
    }),
    user({
      id: 'u_tarek', firstName: 'Tarek', lastName: 'Nabil', role: 'carpooler', hasLicense: true, personality: 'chatty',
      interests: ['Football ⚽', 'Movies', 'Gaming'], music: ['Mahraganat', 'Hip-hop'],
      cars: [car('c_tarek', 'Chevrolet', 'Optra', 'Black', 'ب ج ك 5172')], priorRides: 4,
    }),
    user({ id: 'u_hana', firstName: 'Hana', lastName: 'Mahmoud', personality: 'chatty', interests: ['Art', 'Photography'], music: ['Pop'], priorRides: 14 }),
    user({ id: 'u_ahmed', firstName: 'Ahmed', lastName: 'Samir', personality: 'quiet', interests: ['Medicine', 'Running'], music: ['Podcasts only'], priorRides: 6 }),
    user({ id: 'u_yara', firstName: 'Yara', lastName: 'Khaled', personality: 'chatty', interests: ['Startups', 'Travel'], music: ['Wegz & rap', 'Pop'], priorRides: 2 }),
    // Waiting for admin review
    user({
      id: 'u_mostafa', firstName: 'Mostafa', lastName: 'Zaki', status: 'unverified', verifiedAt: undefined, invitedBy: 'u_omar',
      inviteCodeUsed: 'TW-OMR7Q2', social: { network: 'instagram', handle: 'mostafa.zaki' }, createdAt: ago(1), personality: 'quiet',
      interests: ['Tech'], priorRides: 0,
    }),
    user({
      id: 'u_dina', firstName: 'Dina', lastName: 'Sherif', status: 'unverified', verifiedAt: undefined, invitedBy: 'u_mariam', role: 'carpooler',
      hasLicense: true, inviteCodeUsed: 'TW-MRM4K8', social: { network: 'facebook', handle: 'dina.sherif.90' }, createdAt: ago(0.3),
      cars: [car('c_dina', 'Peugeot', '2008', 'White', 'ط ر ق 8812')], priorRides: 0,
    }),
  ]

  const cfg: AppConfig = {
    fuelPrice: { gasoline: 19.25, diesel: 17.5 },
    consumption: { gasoline: 11.5, diesel: 14 },
    supportPhone: '+20 100 894 4000',
    supportHours: 'Daily, 7:00 – 23:00 Cairo time',
    maxInvites: 5,
    reviewDisplayThreshold: 3,
    flags: {
      publicReviewsAfterThreshold: true,
      nativeOnly: { gps: true, speed: true, penalties: true, compensation: true, abuse: true, insurance: true, wallet: true, sos: true, patterns: true, theme: true },
    },
    updatedAt: ago(3),
  }

  const ride = (r: Partial<Ride> & Pick<Ride, 'id' | 'hostId' | 'carId' | 'fromHubId' | 'toHubId' | 'departAt'>): Ride => ({
    meetingNote: '',
    timing: 'flexible',
    seats: 3,
    luggage: 'small',
    notes: '',
    visibility: 'public',
    hostIncluded: true,
    status: 'pending',
    pickupOptions: suggestPickups(r.fromHubId, r.toHubId),
    pickupId: null,
    startConfirmations: [],
    createdAt: ago(1),
    settlements: [],
    ...r,
  })

  const rides: Ride[] = [
    ride({ id: 'r_mariam_am', hostId: 'u_mariam', carId: 'c_mariam', fromHubId: 'zayed', toHubId: 'newcairo', departAt: at(1, '07:30'), seats: 3,
      meetingNote: 'Wait by Arkan main gate, I\'ll flash my lights.', notes: 'I stop for coffee at Point 90 if we\'re early ☕' }),
    ride({ id: 'r_karim_am', hostId: 'u_karim', carId: 'c_karim', fromHubId: 'october', toHubId: 'smart', departAt: at(1, '08:15'), timing: 'sharp', seats: 2, luggage: 'none',
      notes: 'Sharp means sharp — I leave at 8:15 on the dot.' }),
    ride({ id: 'r_salma_pm', hostId: 'u_salma', carId: 'c_salma', fromHubId: 'maadi', toHubId: 'newcairo', departAt: inHours(6), seats: 2,
      meetingNote: 'Road 9 metro exit, near the bakery.' }),
    ride({ id: 'r_laila_cap', hostId: 'u_laila', carId: 'c_laila', fromHubId: 'heliopolis', toHubId: 'capital', departAt: at(2, '07:00'), timing: 'sharp', visibility: 'private', seats: 3,
      notes: 'Private ride — I review every request. Women riders preferred.' }),
    ride({ id: 'r_tarek_dt', hostId: 'u_tarek', carId: 'c_tarek', fromHubId: 'rehab', toHubId: 'downtown', departAt: at(2, '09:00'), seats: 3, luggage: 'medium' }),
    ride({ id: 'r_mariam_pm', hostId: 'u_mariam', carId: 'c_mariam', fromHubId: 'newcairo', toHubId: 'zayed', departAt: at(1, '18:00'), seats: 3,
      meetingNote: 'AUC Gate 4 parking', notes: 'Return trip. Flexible by ±15 min.' }),
    ride({ id: 'r_salma_mon', hostId: 'u_salma', carId: 'c_salma', fromHubId: 'maadi', toHubId: 'smart', departAt: at(3, '07:45'), seats: 3 }),

    // Omar (carpooler persona) — hosting
    ride({ id: 'r_omar_am', hostId: 'u_omar', carId: 'c_omar1', fromHubId: 'zayed', toHubId: 'newcairo', departAt: at(1, '08:00'), seats: 3,
      meetingNote: 'Hyper One parking, row near the pharmacy.', notes: 'AC on, podcasts or football talk.' }),
    ride({ id: 'r_omar_draft', hostId: 'u_omar', carId: 'c_omar2', fromHubId: 'newcairo', toHubId: 'zayed', departAt: at(1, '18:30'), status: 'draft', seats: 2 }),
    ride({ id: 'r_omar_past', hostId: 'u_omar', carId: 'c_omar1', fromHubId: 'zayed', toHubId: 'newcairo', departAt: at(-2, '08:00'), status: 'completed', seats: 3,
      pickupId: 'zayed-p0', startConfirmations: ['u_omar', 'u_nour', 'u_yara'], confirmedAt: ago(3), startedAt: ago(2), completedAt: ago(2),
      settlements: [
        { passengerId: 'u_nour', status: 'settled', method: 'transfer', amount: 70, note: 'InstaPay', settledAt: ago(2), markedBy: 'u_nour' },
        { passengerId: 'u_yara', status: 'pending' },
      ] }),

    // Nour (passenger persona) — riding
    ride({ id: 'r_mariam_today', hostId: 'u_mariam', carId: 'c_mariam', fromHubId: 'zayed', toHubId: 'newcairo', departAt: inHours(2), status: 'confirmed', seats: 3,
      meetingNote: 'Midnight-blue Kia — I\'ll text when I\'m 5 min away.', confirmedAt: ago(0.4) }),
    ride({ id: 'r_salma_past', hostId: 'u_salma', carId: 'c_salma', fromHubId: 'zayed', toHubId: 'maadi', departAt: at(-4, '17:30'), status: 'completed', seats: 2,
      startConfirmations: ['u_salma', 'u_nour'], confirmedAt: ago(5), startedAt: ago(4), completedAt: ago(4),
      settlements: [{ passengerId: 'u_nour', status: 'pending' }] }),
    ride({ id: 'r_tarek_cancel', hostId: 'u_tarek', carId: 'c_tarek', fromHubId: 'zayed', toHubId: 'downtown', departAt: at(-6, '09:00'), status: 'cancelled', seats: 3,
      cancelledAt: ago(6.2), cancelReason: 'Car at the mechanic, sorry!' }),
  ]
  for (const r of rides) {
    if (r.status === 'confirmed' || r.status === 'completed') r.pickupId = r.pickupId ?? r.pickupOptions[0].id
  }

  const sr = (s: Partial<SeatRequest> & Pick<SeatRequest, 'id' | 'rideId' | 'passengerId'>): SeatRequest => ({
    seats: 1, message: '', status: 'pending', source: 'request', createdAt: ago(0.2), ...s,
  })

  const seatRequests: SeatRequest[] = [
    sr({ id: 's1', rideId: 'r_mariam_am', passengerId: 'u_hana', status: 'accepted', respondedAt: ago(0.5) }),
    sr({ id: 's2', rideId: 'r_omar_am', passengerId: 'u_hana', message: 'Hi Omar! I work near Point 90, can hop off there?' }),
    sr({ id: 's3', rideId: 'r_omar_am', passengerId: 'u_ahmed', message: 'Quiet rider, small backpack only.' }),
    sr({ id: 's4', rideId: 'r_omar_am', passengerId: 'u_yara', status: 'accepted', respondedAt: ago(0.6) }),
    sr({ id: 's5', rideId: 'r_omar_past', passengerId: 'u_nour', status: 'accepted', createdAt: ago(4), respondedAt: ago(3.5) }),
    sr({ id: 's6', rideId: 'r_omar_past', passengerId: 'u_yara', status: 'accepted', createdAt: ago(4), respondedAt: ago(3.5) }),
    sr({ id: 's7', rideId: 'r_mariam_today', passengerId: 'u_nour', status: 'accepted', message: 'See you at the gate!', createdAt: ago(1), respondedAt: ago(0.9) }),
    sr({ id: 's8', rideId: 'r_mariam_today', passengerId: 'u_hana', status: 'accepted', createdAt: ago(1), respondedAt: ago(0.9) }),
    sr({ id: 's9', rideId: 'r_salma_past', passengerId: 'u_nour', status: 'accepted', createdAt: ago(6), respondedAt: ago(5.5) }),
    sr({ id: 's10', rideId: 'r_karim_am', passengerId: 'u_nour', message: 'I can be at Juhayna Square by 8:05.' }),
    sr({ id: 's11', rideId: 'r_tarek_cancel', passengerId: 'u_nour', status: 'accepted', createdAt: ago(7), respondedAt: ago(7) }),
    sr({ id: 's12', rideId: 'r_salma_pm', passengerId: 'u_ahmed', status: 'accepted', respondedAt: ago(0.1) }),
  ]

  const tr = (t: Partial<TripRequest> & Pick<TripRequest, 'id' | 'passengerId' | 'fromHubId' | 'toHubId'>): TripRequest => ({
    meetingNote: '', date: toDateInput(new Date(Date.now() + 86400_000)), windowStart: '07:30', windowEnd: '08:30', timing: 'flexible', seats: 1,
    preferences: [], notes: '', visibility: 'public', shareToken: t.id.replace('t_', 'share-'), status: 'open', createdAt: ago(0.3), ...t,
  })

  const tripRequests: TripRequest[] = [
    tr({ id: 't_hana', passengerId: 'u_hana', fromHubId: 'zayed', toHubId: 'newcairo', preferences: ['Happy to chat', 'AC on'], meetingNote: 'Near Galleria40' }),
    tr({ id: 't_ahmed', passengerId: 'u_ahmed', fromHubId: 'october', toHubId: 'downtown', windowStart: '08:00', windowEnd: '09:00', timing: 'sharp', preferences: ['Quiet ride', 'No smoking'] }),
    tr({ id: 't_yara', passengerId: 'u_yara', fromHubId: 'maadi', toHubId: 'smart', seats: 2, preferences: ['Music OK'], notes: 'Me + my sister, both interns at Smart Village.' }),
    tr({ id: 't_nour', passengerId: 'u_nour', fromHubId: 'zayed', toHubId: 'capital', date: toDateInput(new Date(Date.now() + 3 * 86400_000)), windowStart: '07:00', windowEnd: '08:00',
      preferences: ['Quiet ride', 'Small bag only'], notes: 'Client workshop in the Capital on Sunday.' }),
  ]

  const reviews: Review[] = [
    { id: 'rv1', rideId: 'r_omar_past', fromId: 'u_nour', toId: 'u_omar', rating: 5, tag: 'Smooth driver', status: 'approved', createdAt: ago(2) },
    { id: 'rv2', rideId: 'r_omar_past', fromId: 'u_yara', toId: 'u_omar', rating: 4, tag: 'Great company', comment: 'A bit too much football talk 😄', status: 'pending', createdAt: ago(1.8) },
    { id: 'rv3', rideId: 'r_x', fromId: 'u_hana', toId: 'u_mariam', rating: 5, tag: 'On time', status: 'approved', createdAt: ago(9) },
    { id: 'rv4', rideId: 'r_x', fromId: 'u_ahmed', toId: 'u_karim', rating: 5, tag: 'Clean car', status: 'approved', createdAt: ago(12) },
    { id: 'rv5', rideId: 'r_x', fromId: 'u_yara', toId: 'u_tarek', rating: 3, tag: 'Late', comment: 'Was 20 min late without texting.', status: 'pending', createdAt: ago(1) },
    { id: 'rv6', rideId: 'r_x', fromId: 'u_nour', toId: 'u_salma', rating: 5, tag: 'Respectful', status: 'approved', createdAt: ago(20) },
  ]

  const incidents: Incident[] = [
    { id: 'i1', reporterId: 'u_yara', rideId: 'r_x', aboutUserId: 'u_tarek', category: 'ride_discomfort', description: 'Driver was smoking with windows closed even after I asked politely.',
      contactBack: true, status: 'open', actions: [], createdAt: ago(1.5) },
    { id: 'i2', reporterId: 'u_hana', category: 'unsafe_vehicle', aboutUserId: 'u_karim', description: 'Rear seatbelt on the left side does not lock.', contactBack: false,
      status: 'reviewing', actions: [{ at: ago(0.8), text: 'Called host — he is fixing it this week. Asked for a photo once repaired.' }], createdAt: ago(2) },
  ]

  const invites: Invite[] = [
    { code: 'TW-CAIRO1', inviterId: 'u_omar', createdAt: ago(5), note: 'Open demo invite' },
    { code: 'TW-OMR7Q2', inviterId: 'u_omar', createdAt: ago(4), usedBy: 'u_mostafa', usedAt: ago(1) },
    { code: 'TW-MRM4K8', inviterId: 'u_mariam', createdAt: ago(2), usedBy: 'u_dina', usedAt: ago(0.3) },
    { code: 'TW-NUR3X9', inviterId: 'u_nour', createdAt: ago(10), note: 'For Salma' },
    { code: 'TW-NURA42', inviterId: 'u_nour', createdAt: ago(1), note: 'Cousin' },
  ]

  const notifications: Notification[] = [
    { id: 'n1', userId: 'u_omar', kind: 'request', title: 'New seat requests', body: 'Hana and Ahmed want to join your Zayed → New Cairo ride.', link: '/app/rides/r_omar_am', read: false, createdAt: ago(0.2) },
    { id: 'n2', userId: 'u_omar', kind: 'settlement', title: 'Settlement pending', body: 'Yara hasn\'t been marked as settled for your ride on Tuesday.', link: '/app/rides/r_omar_past', read: false, createdAt: ago(1) },
    { id: 'n3', userId: 'u_nour', kind: 'ride', title: 'Ride confirmed', body: 'Mariam confirmed pickup at Arkan Plaza — main gate.', link: '/app/rides/r_mariam_today', read: false, createdAt: ago(0.4) },
    { id: 'n4', userId: 'u_nour', kind: 'settlement', title: 'Settle your fuel share', body: 'Your ride with Salma is complete. Mark it as settled once you\'ve paid.', link: '/app/rides/r_salma_past', read: true, createdAt: ago(4) },
  ]

  return { users, rides, seatRequests, tripRequests, reviews, incidents, invites, notifications, config: cfg }
}
