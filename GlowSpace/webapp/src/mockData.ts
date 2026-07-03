export interface Service {
  id: number
  name: string
  description: string
  duration: number // minutes
  price: number
}

export interface TimeSlot {
  id: number
  datetime: string // ISO string
}

export interface Booking {
  id: number
  service: Service
  slot: TimeSlot
  status: 'pending' | 'confirmed' | 'cancelled'
  // Возвращает только /api/admin/bookings (список для админки) — клиентские
  // /api/bookings/me и /api/bookings/by-ids их не отдают.
  userName?: string
  phone?: string
  createdAt?: string
}

export interface Promotion {
  id: number
  text: string
  endDate: string
}

export interface Review {
  id: number
  userName: string
  serviceName: string
  rating: number
  comment: string
  date: string
}
