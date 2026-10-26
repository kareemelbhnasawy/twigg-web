import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { DemoPanel } from '@/components/DemoPanel'
import { MapsProvider } from '@/components/map/HubMapPicker'
import { Toaster } from '@/components/ui/Toast'
import { AdminLayout } from '@/layouts/AdminLayout'
import { AppLayout } from '@/layouts/AppLayout'
import { RequireAuth, RequireGuest } from '@/layouts/guards'
import AdminConfig from '@/pages/admin/AdminConfig'
import AdminIncidents from '@/pages/admin/AdminIncidents'
import AdminOverview from '@/pages/admin/AdminOverview'
import AdminReviews from '@/pages/admin/AdminReviews'
import AdminRides from '@/pages/admin/AdminRides'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminVerification from '@/pages/admin/AdminVerification'
import CreateRide from '@/pages/app/CreateRide'
import CreateTripRequest from '@/pages/app/CreateTripRequest'
import Home from '@/pages/app/Home'
import MyTrips from '@/pages/app/MyTrips'
import Notifications from '@/pages/app/Notifications'
import RideDetail from '@/pages/app/RideDetail'
import TripRequestDetail, { ShareLinkResolver } from '@/pages/app/TripRequestDetail'
import WaitingRoom from '@/pages/app/WaitingRoom'
import Cars from '@/pages/profile/Cars'
import EditProfile from '@/pages/profile/EditProfile'
import Invites from '@/pages/profile/Invites'
import Profile from '@/pages/profile/Profile'
import PublicProfile from '@/pages/profile/PublicProfile'
import BetaTerms from '@/pages/settings/BetaTerms'
import ComingNative from '@/pages/settings/ComingNative'
import Settings from '@/pages/settings/Settings'
import Support from '@/pages/settings/Support'
import Help from '@/pages/auth/Help'
import InviteLanding from '@/pages/auth/InviteLanding'
import NotFound, { RouteError } from '@/pages/NotFound'
import SignIn from '@/pages/auth/SignIn'
import SignUp from '@/pages/auth/SignUp'
import Splash from '@/pages/auth/Splash'
import Welcome from '@/pages/auth/Welcome'

function Root() {
  return (
    <MapsProvider>
      <Outlet />
      <Toaster />
      <DemoPanel />
    </MapsProvider>
  )
}

export const router = createBrowserRouter([
  {
    element: <Root />,
    errorElement: <RouteError />,
    children: [
      { path: '/', element: <Splash /> },
      {
        element: <RequireGuest />,
        children: [
          { path: '/welcome', element: <Welcome /> },
          { path: '/signin', element: <SignIn /> },
          { path: '/signup', element: <SignUp /> },
          { path: '/invite/:code', element: <InviteLanding /> },
        ],
      },
      { path: '/help', element: <Help /> },
      {
        element: <RequireAuth />,
        children: [
          { path: '/r/:token', element: <ShareLinkResolver /> },
          {
            path: '/app',
            element: <AppLayout />,
            children: [
              { index: true, element: <Home /> },
              { path: 'rides/new', element: <CreateRide /> },
              { path: 'rides/:id', element: <RideDetail /> },
              { path: 'rides/:id/edit', element: <CreateRide /> },
              { path: 'requests/new', element: <CreateTripRequest /> },
              { path: 'requests/:id', element: <TripRequestDetail /> },
              { path: 'trips', element: <MyTrips /> },
              { path: 'notifications', element: <Notifications /> },
              { path: 'waiting-room', element: <WaitingRoom /> },
              { path: 'profile', element: <Profile /> },
              { path: 'profile/edit', element: <EditProfile /> },
              { path: 'profile/cars', element: <Cars /> },
              { path: 'profile/invites', element: <Invites /> },
              { path: 'users/:id', element: <PublicProfile /> },
              { path: 'settings', element: <Settings /> },
              { path: 'settings/beta-terms', element: <BetaTerms /> },
              { path: 'settings/native', element: <ComingNative /> },
              { path: 'support', element: <Support /> },
            ],
          },
        ],
      },
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true, element: <AdminOverview /> },
          { path: 'verification', element: <AdminVerification /> },
          { path: 'users', element: <AdminUsers /> },
          { path: 'rides', element: <AdminRides /> },
          { path: 'incidents', element: <AdminIncidents /> },
          { path: 'reviews', element: <AdminReviews /> },
          { path: 'config', element: <AdminConfig /> },
        ],
      },
      { path: '/home', element: <Navigate to="/app" replace /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])
