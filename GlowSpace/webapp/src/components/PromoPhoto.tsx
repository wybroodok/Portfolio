import { ImageOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../api'

// Фото грузим через авторизованный fetch (api.downloadBlob), а не через
// <img src=...> напрямую: за туннелем (ngrok) браузер иначе получает
// HTML-страницу предупреждения вместо самой картинки, т.к. <img> не может
// нести заголовок ngrok-skip-browser-warning.
export default function PromoPhoto({ promoId, alt }: { promoId: number; alt: string }) {
  const [url, setUrl] = useState('')
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let objectUrl = ''
    setFailed(false)
    setUrl('')
    api.downloadBlob(`/api/promotions/${promoId}/photo`)
      .then(blob => {
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
      .catch(() => setFailed(true))
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [promoId])

  if (failed) {
    return (
      <div className="w-full h-40 bg-accent-soft flex items-center justify-center">
        <ImageOff size={32} strokeWidth={1.8} className="text-accent" />
      </div>
    )
  }
  if (!url) return null
  // Без фиксированной высоты и object-cover — фото показывается целиком, в
  // том соотношении сторон, в котором его прислали, как и в самом Telegram.
  return <img src={url} alt={alt} className="w-full h-auto block" />
}
