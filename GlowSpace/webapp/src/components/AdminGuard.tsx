import { ShieldOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthContext'
import Spinner from './Spinner'

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh]">
        <Spinner />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[100dvh] text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center mb-4">
          <ShieldOff size={32} strokeWidth={2} className="text-accent" />
        </div>
        <p className="font-semibold text-primary">Извините, вы не администратор</p>
        <p className="text-sm text-hint mt-1">Этот раздел доступен только персоналу салона</p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 px-6 py-3 bg-accent text-white rounded-full font-semibold text-sm"
        >
          На главную
        </button>
      </div>
    )
  }

  return <>{children}</>
}
