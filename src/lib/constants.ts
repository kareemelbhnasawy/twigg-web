import type { IncidentCategory, Luggage, Personality, RideStatus } from './types'

export const INTEREST_TAGS = [
  'Football ⚽', 'Coffee ☕', 'Startups', 'Design', 'Tech', 'Books', 'Padel 🎾', 'Gym',
  'Running', 'Travel', 'Food spots', 'Photography', 'Podcasts', 'Movies', 'Gaming', 'Art',
  'Volunteering', 'Finance', 'Medicine', 'Engineering', 'Languages', 'Pets 🐾',
]

export const MUSIC_TAGS = [
  'Amr Diab', 'Mahraganat', 'Arabic indie', 'Oum Kalthoum', 'Fairuz', 'Wegz & rap',
  'Pop', 'Hip-hop', 'Rock', 'Jazz', 'Lo-fi', 'Electronic', 'Quran', 'Podcasts only', 'Silence please',
]

export const PERSONALITY: Record<Personality, { label: string; short: string; emoji: string; blurb: string }> = {
  quiet: { label: 'Prefers quiet rides', short: 'Quiet', emoji: '🌙', blurb: 'Headphones in, minimal small talk.' },
  chatty: { label: 'Enjoys conversation', short: 'Chatty', emoji: '💬', blurb: 'Happy to chat the whole way.' },
  depends: { label: 'Depends on the day', short: 'Flexible', emoji: '🌤️', blurb: 'Read the room — either works.' },
}

export const TRIP_PREFERENCES = [
  'Quiet ride', 'Happy to chat', 'No smoking', 'AC on', 'Female host preferred', 'Small bag only',
  'Pet-friendly', 'Music OK', 'Can walk to pickup',
]

export const LUGGAGE_LABEL: Record<Luggage, string> = {
  none: 'No luggage',
  small: 'Backpack / small bag',
  medium: 'Carry-on size',
  large: 'Large suitcase OK',
}

export const RIDE_STATUS: Record<RideStatus, { label: string; tone: 'muted' | 'amber' | 'sprout' | 'clay' | 'forest' | 'danger' }> = {
  draft: { label: 'Draft', tone: 'muted' },
  pending: { label: 'Pending', tone: 'amber' },
  confirmed: { label: 'Confirmed', tone: 'sprout' },
  active: { label: 'Active', tone: 'clay' },
  completed: { label: 'Completed', tone: 'forest' },
  cancelled: { label: 'Cancelled', tone: 'danger' },
}

export const INCIDENT_LABEL: Record<IncidentCategory, { label: string; hint: string }> = {
  unsafe_vehicle: { label: 'Unsafe vehicle', hint: 'Brakes, tyres, seatbelts, reckless driving' },
  ride_discomfort: { label: 'Ride discomfort', hint: 'Smoking, loud music, uncomfortable situation' },
  behavior: { label: 'Behavior concerns', hint: 'Harassment, rudeness, unlisted participants' },
  other: { label: 'Something else', hint: 'Anything you want the team to know' },
}

export const REVIEW_TAGS = ['On time', 'Smooth driver', 'Great company', 'Clean car', 'Respectful', 'Easy pickup', 'Late', 'Felt rushed']

export const SAFETY_CHECKLIST = [
  { id: 'identity', label: 'Identity matches profile', hint: 'The people in the car match their Twigg photos and names.' },
  { id: 'participants', label: 'No unlisted participants', hint: 'Only the confirmed riders are on this ride.' },
  { id: 'terms', label: 'I agree to the shared ride terms', hint: 'Seatbelts on, respectful conduct, fuel settled offline.' },
]

export const NATIVE_FEATURES = [
  { key: 'gps', title: 'Continuous GPS tracking', body: 'Live trip sharing with trusted contacts, running in the background.' },
  { key: 'speed', title: 'Speed monitoring', body: 'Gentle alerts when a ride exceeds safe speeds.' },
  { key: 'penalties', title: 'Automated penalties', body: 'Fair, consistent rules for no-shows and late cancellations.' },
  { key: 'compensation', title: 'Compensation logic', body: 'Automatic make-goods when a ride falls through.' },
  { key: 'abuse', title: 'Advanced abuse detection', body: 'Smarter signals to keep the circle safe.' },
  { key: 'insurance', title: 'Insurance integrations', body: 'Partner coverage for every shared ride.' },
  { key: 'wallet', title: 'Wallet & payments', body: 'Settle fuel in-app instead of cash or transfer.' },
  { key: 'sos', title: 'Emergency SOS', body: 'One-tap emergency line with live location.' },
  { key: 'patterns', title: 'Pattern monitoring', body: 'Detects unusual route or timing patterns.' },
  { key: 'theme', title: 'Dark & light mode', body: 'Your Twigg, your theme.' },
]
