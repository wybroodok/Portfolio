import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from './api'
import { getTg, type TgUser } from './telegram'

interface AuthState {
  user: TgUser | null
  isAdmin: boolean
  loading: boolean
}

const initialState: AuthState = { user: null, isAdmin: false, loading: true }

const AuthContext = createContext<AuthState>(initialState)

async function fetchMe() {
  return api.get<{ user: TgUser | null; is_admin: boolean; x_init_data_len: number }>('/api/me')
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(initialState)

  useEffect(() => {
    async function run() {
      try {
        let res = await fetchMe()
        // Telegram иногда заполняет initData на клиенте с небольшой задержкой
        // после старта страницы. Если сервер ничего не увидел, а initData на
        // клиенте к этому моменту уже появился — короткая пауза и повтор,
        // прежде чем окончательно считать пользователя неавторизованным.
        if (res.x_init_data_len === 0 && !res.user && getTg()?.initData) {
          await new Promise(r => setTimeout(r, 400))
          res = await fetchMe()
        }
        setState({ user: res.user, isAdmin: res.is_admin, loading: false })
      } catch {
        setState({ user: null, isAdmin: false, loading: false })
      }
    }
    run()
  }, [])

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  return useContext(AuthContext)
}
