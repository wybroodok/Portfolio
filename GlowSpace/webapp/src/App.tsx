import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './AuthContext'
import AdminGuard from './components/AdminGuard'
import BottomNav from './components/BottomNav'

import Home from './pages/Home'
import Booking from './pages/Booking'
import MyBookings from './pages/MyBookings'
import Promotions from './pages/Promotions'
import About from './pages/About'
import Settings from './pages/Settings'

import AdminPanel from './pages/admin/AdminPanel'
import AllBookings from './pages/admin/AllBookings'
import AddSlot from './pages/admin/AddSlot'
import AddService from './pages/admin/AddService'
import Reviews from './pages/admin/Reviews'
import AddPromo from './pages/admin/AddPromo'
import DayBlock from './pages/admin/DayBlock'

import './App.css'

const BOTTOM_NAV_ROUTES = ['/', '/booking', '/my-bookings', '/promotions', '/settings']

function Layout() {
  const location = useLocation()
  const showNav = BOTTOM_NAV_ROUTES.includes(location.pathname)

  return (
    <>
      <Routes>
        <Route path="/"              element={<Home />} />
        <Route path="/booking"       element={<Booking />} />
        <Route path="/my-bookings"   element={<MyBookings />} />
        <Route path="/promotions"    element={<Promotions />} />
        <Route path="/about"         element={<About />} />
        <Route path="/settings"      element={<Settings />} />

        <Route path="/admin"              element={<AdminGuard><AdminPanel /></AdminGuard>} />
        <Route path="/admin/bookings"     element={<AdminGuard><AllBookings /></AdminGuard>} />
        <Route path="/admin/add-slot"     element={<AdminGuard><AddSlot /></AdminGuard>} />
        <Route path="/admin/add-service"  element={<AdminGuard><AddService /></AdminGuard>} />
        <Route path="/admin/reviews"      element={<AdminGuard><Reviews /></AdminGuard>} />
        <Route path="/admin/add-promo"    element={<AdminGuard><AddPromo /></AdminGuard>} />
        <Route path="/admin/day-block"    element={<AdminGuard><DayBlock /></AdminGuard>} />
      </Routes>
      {showNav && <BottomNav />}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </BrowserRouter>
  )
}
