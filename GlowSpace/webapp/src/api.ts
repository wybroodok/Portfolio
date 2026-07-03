import { getTg } from './telegram'

export const BASE = import.meta.env.VITE_API_URL ?? ''

function authHeaders(): Record<string, string> {
  const tg = getTg()
  const initData = tg?.initData ?? ''
  const tgUser = tg?.initDataUnsafe?.user ?? null
  return {
    'ngrok-skip-browser-warning': 'true',
    ...(initData ? { 'X-Init-Data': initData } : {}),
    // HTTP-заголовки — ByteString (0–255), а имя/юзернейм могут быть кириллицей
    // или содержать эмодзи — encodeURIComponent превращает JSON в чистый ASCII.
    ...(tgUser ? { 'X-Tg-User': encodeURIComponent(JSON.stringify(tgUser)) } : {}),
  }
}

// FastAPI отдаёт ошибки как {"detail": "..."} или (при 422 от pydantic)
// {"detail": [{"msg": "...", ...}, ...]} — вместо сырого JSON/трейса
// показываем читаемый текст. Код статуса оставляем в начале сообщения:
// на него завязана проверка `.startsWith('401')`/`.includes('409')` в
// некоторых местах приложения.
function extractErrorDetail(text: string): string {
  try {
    const body = JSON.parse(text)
    if (typeof body.detail === 'string') return body.detail
    if (Array.isArray(body.detail)) {
      return body.detail.map((d: any) => d.msg ?? JSON.stringify(d)).join('; ')
    }
  } catch {}
  return text
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const isFormData = options?.body instanceof FormData
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      // FormData сам выставляет Content-Type с boundary — нельзя его перебивать.
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...authHeaders(),
      ...options?.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`${res.status} ${extractErrorDetail(text)}`)
  }
  return res.json()
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: body instanceof FormData ? body : JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  downloadBlob: async (path: string): Promise<Blob> => {
    const res = await fetch(`${BASE}${path}`, { headers: authHeaders() })
    if (!res.ok) throw new Error(`${res.status} ${extractErrorDetail(await res.text())}`)
    return res.blob()
  },
}
