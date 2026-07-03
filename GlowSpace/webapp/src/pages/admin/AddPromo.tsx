import { Check, CheckCircle2, ListChecks, Megaphone, Pencil, Trash2, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api'
import BulkActionBar from '../../components/BulkActionBar'
import ErrorState from '../../components/ErrorState'
import PageHeader from '../../components/PageHeader'
import PromoPhoto from '../../components/PromoPhoto'
import Spinner from '../../components/Spinner'

// Telegram ограничивает подпись к фото 1024 символами (у обычных сообщений — 4096).
// Раз акция может уйти как photo+caption, ограничиваем текст самым строгим лимитом.
const MAX_PROMO_TEXT = 1024

// Ниже этого разрешения фото будет выглядеть размытым, растянутым на всю
// ширину карточки в разделе "Акции" (там оно теперь показывается как есть,
// без принудительной обрезки — см. Promotions.tsx).
const MIN_PHOTO_WIDTH = 480
const MIN_PHOTO_HEIGHT = 480

interface Promo {
  id: number
  text: string
  has_photo: boolean
  end_date: string
  is_active: boolean
}

function getImageDimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise(resolve => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(url)
    }
    img.onerror = () => {
      resolve(null)
      URL.revokeObjectURL(url)
    }
    img.src = url
  })
}

export default function AddPromo() {
  const navigate = useNavigate()

  const [promos, setPromos] = useState<Promo[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [listRetry, setListRetry] = useState(0)

  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [existingHasPhoto, setExistingHasPhoto] = useState(false)
  const [removePhoto, setRemovePhoto] = useState(false)

  const [text, setText] = useState('')
  const [endDate, setEndDate] = useState('')
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState<{ sent: number; total: number } | null>(null)
  const [error, setError] = useState('')
  const [photoError, setPhotoError] = useState('')

  useEffect(() => {
    setListLoading(true)
    setListError('')
    api.get<Promo[]>('/api/admin/promotions')
      .then(setPromos)
      .catch((e: any) => setListError(e.message))
      .finally(() => setListLoading(false))
  }, [listRetry])

  // Текст не обязателен — акция может быть только с фото (как в боте)
  const valid = Boolean((text.trim() || photo || (editingId && existingHasPhoto && !removePhoto)) && endDate)

  // URL превью выводится из выбранного файла, а не хранится отдельным state —
  // так его нельзя рассинхронизировать с `photo`. Ревокуем при смене/размонтировании,
  // иначе каждый выбранный файл навсегда держит blob-URL в памяти вкладки.
  const photoPreviewUrl = useMemo(() => (photo ? URL.createObjectURL(photo) : ''), [photo])
  useEffect(() => () => { if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl) }, [photoPreviewUrl])

  const resetForm = () => {
    setEditingId(null)
    setExistingHasPhoto(false)
    setRemovePhoto(false)
    setText('')
    setEndDate('')
    setPhoto(null)
    setPhotoError('')
    setError('')
  }

  const startEdit = (p: Promo) => {
    setEditingId(p.id)
    setExistingHasPhoto(p.has_photo)
    setRemovePhoto(false)
    setText(p.text)
    setEndDate(p.end_date.slice(0, 10))
    setPhoto(null)
    setPhotoError('')
    setError('')
  }

  const deletePromo = async (id: number) => {
    if (!confirm('Удалить акцию безвозвратно?')) return
    try {
      await api.delete(`/api/admin/promos/${id}`)
      setPromos(prev => prev.filter(p => p.id !== id))
      if (editingId === id) resetForm()
    } catch (e: any) {
      alert(e.message)
    }
  }

  const toggleSelectMode = () => {
    setSelectMode(m => !m)
    setSelected(new Set())
  }

  const toggleSelected = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const bulkDelete = async () => {
    if (selected.size === 0) return
    if (!confirm(`Удалить выбранные акции (${selected.size})?`)) return
    setBulkDeleting(true)
    const ids = [...selected]
    const results = await Promise.allSettled(ids.map(id => api.delete(`/api/admin/promos/${id}`)))
    const failedIds = ids.filter((_, i) => results[i].status === 'rejected')
    setPromos(prev => prev.filter(p => !ids.includes(p.id) || failedIds.includes(p.id)))
    setSelected(new Set())
    setBulkDeleting(false)
    if (failedIds.length > 0) {
      alert(`Не удалось удалить ${failedIds.length} из ${ids.length}.`)
    } else {
      setSelectMode(false)
    }
  }

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setPhotoError('')
    if (!file) {
      setPhoto(null)
      return
    }
    const dims = await getImageDimensions(file)
    if (dims && (dims.width < MIN_PHOTO_WIDTH || dims.height < MIN_PHOTO_HEIGHT)) {
      setPhotoError(
        `Слишком маленькое разрешение (${dims.width}×${dims.height}). ` +
        `Минимум ${MIN_PHOTO_WIDTH}×${MIN_PHOTO_HEIGHT} — иначе фото будет размытым на всю ширину экрана.`,
      )
      setPhoto(null)
      e.target.value = ''
      return
    }
    setPhoto(file)
    setRemovePhoto(false)
  }

  // Синхронный флаг, а не только `submitting` state — React batch'ит рендеры,
  // и двойной тап (частое явление во встроенных WebView) может успеть вызвать
  // handlePublish дважды до того, как disabled-состояние кнопки обновится.
  const submittingRef = useRef(false)

  const handlePublish = async () => {
    if (!valid || submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    setError('')
    try {
      const form = new FormData()
      form.append('text', text.trim())
      form.append('end_date', endDate)
      if (photo) form.append('photo', photo)
      const res = await api.post<{ id: number; sent: number; total: number }>(
        '/api/admin/promos', form,
      )
      setResult({ sent: res.sent, total: res.total })
      setTimeout(() => navigate('/admin'), 2000)
    } catch (e: any) {
      setError(e.message)
      submittingRef.current = false
    } finally {
      setSubmitting(false)
    }
  }

  // Редактирование не рассылает акцию заново — только меняет то, что уже
  // показывается в разделе "Акции", поэтому без шага предпросмотра/рассылки.
  const handleUpdate = async () => {
    if (!valid || !editingId || submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    setError('')
    try {
      const form = new FormData()
      form.append('text', text.trim())
      form.append('end_date', endDate)
      form.append('remove_photo', String(removePhoto))
      if (photo) form.append('photo', photo)
      const updated = await api.put<{ id: number; has_photo: boolean; end_date: string }>(
        `/api/admin/promos/${editingId}`, form,
      )
      setPromos(prev => prev.map(p => p.id === editingId
        ? { ...p, text: text.trim(), end_date: updated.end_date, has_photo: updated.has_photo }
        : p))
      resetForm()
    } catch (e: any) {
      setError(e.message)
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  if (result) {
    return (
      <div className="page-enter flex flex-col items-center justify-center min-h-[100dvh] text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-accent-soft flex items-center justify-center mb-3">
          <CheckCircle2 size={32} strokeWidth={1.8} className="text-accent" />
        </div>
        <p className="font-semibold text-primary">Акция опубликована!</p>
        <p className="text-xs text-hint mt-1">Разослано {result.sent} из {result.total} пользователей</p>
      </div>
    )
  }

  if (preview) {
    return (
      <div className="page-enter flex flex-col min-h-[100dvh] pb-6">
        <PageHeader title="Предпросмотр" back={() => setPreview(false)} />
        <div className="flex-1 px-4 pt-4">
          <div className="bg-card rounded-2xl overflow-hidden border border-tgline">
            {photoPreviewUrl && (
              // object-contain, а не object-cover — предпросмотр не должен
              // обрезать фото; так оно и покажется клиентам в разделе "Акции".
              <img src={photoPreviewUrl} alt="" className="w-full max-h-64 object-contain bg-app" />
            )}
            <div className="p-4">
              {text.trim() && <p className="text-primary text-sm leading-relaxed">{text}</p>}
              <p className="text-xs text-hint mt-2">
                До {new Date(endDate).toLocaleDateString('ru-RU')}
              </p>
            </div>
          </div>
          {error && <p className="text-red-500 dark:text-red-400 text-sm mt-3 bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2">{error}</p>}
          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={handlePublish}
              disabled={submitting}
              className="w-full py-3.5 bg-accent text-white rounded-full font-semibold disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? 'Публикуем...' : <><Megaphone size={18} /> Опубликовать и разослать</>}
            </button>
            <button onClick={() => setPreview(false)} disabled={submitting} className="w-full py-3 text-hint text-sm">
              Редактировать
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`page-enter flex flex-col min-h-[100dvh] ${selectMode ? 'pb-24' : 'pb-6'}`}>
      <PageHeader title="Акции" back="/admin" />
      <div className="flex-1 px-4 pt-4 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-primary text-sm">Список акций</h2>
          <button
            onClick={toggleSelectMode}
            className="flex items-center gap-1.5 text-xs text-accent font-medium px-2 py-1"
          >
            {selectMode ? <X size={14} /> : <ListChecks size={14} />}
            {selectMode ? 'Отмена' : 'Выбрать'}
          </button>
        </div>

        {listLoading ? (
          <Spinner compact />
        ) : listError ? (
          <ErrorState message={listError} compact onRetry={() => setListRetry(n => n + 1)} />
        ) : promos.length === 0 ? (
          <div className="text-center py-10 text-hint text-sm">Акций нет</div>
        ) : (
          <div className="flex flex-col gap-3">
            {promos.map(p => {
              const endStr = new Date(p.end_date).toLocaleDateString('ru-RU', {
                day: '2-digit', month: '2-digit', year: 'numeric',
              })
              return (
                <div key={p.id} className="bg-card rounded-2xl overflow-hidden border border-tgline flex">
                  {selectMode && (
                    <button
                      onClick={() => toggleSelected(p.id)}
                      className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center m-3 ${
                        selected.has(p.id) ? 'bg-accent border-accent text-white' : 'border-tgline'
                      }`}
                    >
                      {selected.has(p.id) && <Check size={14} />}
                    </button>
                  )}
                  <div className="min-w-0 flex-1">
                    {p.has_photo && <PromoPhoto promoId={p.id} alt={p.text || 'Фото акции'} />}
                    <div className="p-3.5">
                      {p.text && <p className="text-primary text-sm leading-relaxed line-clamp-3">{p.text}</p>}
                      <div className="flex items-center justify-between mt-2">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            p.is_active
                              ? 'text-accent bg-accent-soft'
                              : 'text-gray-400 bg-gray-100 dark:bg-gray-700'
                          }`}
                        >
                          До {endStr}{!p.is_active && ' · истекла'}
                        </span>
                        {!selectMode && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(p)}
                            className="w-8 h-8 rounded-xl border border-tgline text-hint flex items-center justify-center"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => deletePromo(p.id)}
                            className="w-8 h-8 rounded-xl border border-red-200 dark:border-red-800 text-red-400 flex items-center justify-center"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!selectMode && (
        <div className="flex flex-col gap-4">
          <h2 className="font-semibold text-primary text-sm">
            {editingId ? 'Редактировать акцию' : 'Добавить акцию'}
          </h2>
          <div>
            <label className="text-xs text-hint mb-1.5 block">Текст акции</label>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Напишите описание акции..."
              rows={4}
              maxLength={MAX_PROMO_TEXT}
              className="w-full bg-card border border-tgline rounded-2xl px-4 py-3 text-primary placeholder-hint focus:outline-none focus:ring-2 focus:ring-accent resize-none"
            />
            <p className="text-xs text-hint mt-1 text-right">{text.length}/{MAX_PROMO_TEXT}</p>
          </div>
          <div>
            <label className="text-xs text-hint mb-1.5 block">Фото (необязательно)</label>
            {editingId && existingHasPhoto && !photo && !removePhoto && (
              <div className="mb-2 rounded-2xl overflow-hidden border border-tgline">
                <PromoPhoto promoId={editingId} alt="Текущее фото" />
                <button
                  onClick={() => setRemovePhoto(true)}
                  className="w-full py-2 text-xs text-red-400 bg-app"
                >
                  Убрать фото
                </button>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="w-full bg-card border border-tgline rounded-2xl px-4 py-3 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            {photoError && <p className="text-red-500 dark:text-red-400 text-xs mt-1.5">{photoError}</p>}
            {photoPreviewUrl && (
              <img src={photoPreviewUrl} alt="" className="w-full max-h-40 object-contain bg-app rounded-2xl mt-2" />
            )}
          </div>
          <div>
            <label className="text-xs text-hint mb-1.5 block">Дата окончания *</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full bg-card border border-tgline rounded-2xl px-4 py-3 text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          <p className="text-xs text-hint">* нужен текст или фото, и дата окончания</p>
          {editingId && error && (
            <p className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2">{error}</p>
          )}
          {editingId ? (
            <div className="flex flex-col gap-3">
              <button
                disabled={!valid || submitting}
                onClick={handleUpdate}
                className="w-full py-3.5 bg-accent text-white rounded-full font-semibold disabled:opacity-40"
              >
                {submitting ? 'Сохраняем...' : 'Сохранить изменения'}
              </button>
              <button onClick={resetForm} disabled={submitting} className="w-full py-3 text-hint text-sm">
                Отмена
              </button>
            </div>
          ) : (
            <button
              disabled={!valid}
              onClick={() => setPreview(true)}
              className="w-full py-3.5 bg-accent text-white rounded-full font-semibold mt-2 disabled:opacity-40"
            >
              Предпросмотр →
            </button>
          )}
        </div>
        )}
      </div>
      {selectMode && <BulkActionBar count={selected.size} onDelete={bulkDelete} deleting={bulkDeleting} />}
    </div>
  )
}
