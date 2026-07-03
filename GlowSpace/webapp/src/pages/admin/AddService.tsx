import { Check, CheckCircle2, ListChecks, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { api } from '../../api'
import BulkActionBar from '../../components/BulkActionBar'
import ErrorState from '../../components/ErrorState'
import PageHeader from '../../components/PageHeader'
import Spinner from '../../components/Spinner'
import { type Service } from '../../mockData'

interface Form {
  name: string
  description: string
  duration: string
  price: string
}

const EMPTY_FORM: Form = { name: '', description: '', duration: '60', price: '' }

export default function AddService() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [retry, setRetry] = useState(0)

  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<Form>(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setListError('')
    api.get<Service[]>('/api/services')
      .then(setServices)
      .catch((e: any) => setListError(e.message))
      .finally(() => setLoading(false))
  }, [retry])

  const set = (field: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }))

  const valid = form.name.trim() && Number(form.price) > 0 && (form.duration.trim() === '' || Number(form.duration) > 0)

  const resetForm = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
    setError('')
  }

  const startEdit = (svc: Service) => {
    setEditingId(svc.id)
    setForm({
      name: svc.name,
      description: svc.description ?? '',
      duration: String(svc.duration ?? 60),
      price: String(svc.price),
    })
    setError('')
  }

  const handleSubmit = async () => {
    if (!valid) return
    setSubmitting(true)
    setError('')
    const body = {
      name: form.name.trim(),
      description: form.description.trim(),
      duration_minutes: parseInt(form.duration) || 60,
      price: parseInt(form.price),
    }
    try {
      if (editingId) {
        await api.put(`/api/admin/services/${editingId}`, body)
        setServices(prev => prev.map(s => s.id === editingId
          ? { ...s, name: body.name, description: body.description, duration: body.duration_minutes, price: body.price }
          : s))
        resetForm()
      } else {
        const created = await api.post<{ id: number }>('/api/admin/services', body)
        setServices(prev => [...prev, {
          id: created.id, name: body.name, description: body.description,
          duration: body.duration_minutes, price: body.price,
        }])
        setDone(true)
        setTimeout(() => setDone(false), 1500)
        setForm(EMPTY_FORM)
      }
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const deleteOne = async (id: number) => {
    if (!confirm('Удалить услугу?')) return
    try {
      await api.delete(`/api/admin/services/${id}`)
      setServices(prev => prev.filter(s => s.id !== id))
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
    if (!confirm(`Удалить выбранные услуги (${selected.size})?`)) return
    setBulkDeleting(true)
    const ids = [...selected]
    const results = await Promise.allSettled(ids.map(id => api.delete(`/api/admin/services/${id}`)))
    const failedIds = ids.filter((_, i) => results[i].status === 'rejected')
    setServices(prev => prev.filter(s => !ids.includes(s.id) || failedIds.includes(s.id)))
    setSelected(new Set())
    setBulkDeleting(false)
    if (failedIds.length > 0) {
      alert(`Не удалось удалить ${failedIds.length} из ${ids.length} — вероятно, на них есть записи.`)
    } else {
      setSelectMode(false)
    }
  }

  const cls = "w-full bg-card border border-tgline rounded-2xl px-4 py-3 text-primary placeholder-hint focus:outline-none focus:ring-2 focus:ring-accent"

  return (
    <div className={`page-enter flex flex-col min-h-[100dvh] ${selectMode ? 'pb-24' : 'pb-6'}`}>
      <PageHeader title="Услуги" back="/admin" />

      <div className="flex-1 px-4 pt-4 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-primary text-sm">Список услуг</h2>
          <button
            onClick={toggleSelectMode}
            className="flex items-center gap-1.5 text-xs text-accent font-medium px-2 py-1"
          >
            {selectMode ? <X size={14} /> : <ListChecks size={14} />}
            {selectMode ? 'Отмена' : 'Выбрать'}
          </button>
        </div>

        {loading ? (
          <Spinner compact />
        ) : listError ? (
          <ErrorState message={listError} compact onRetry={() => setRetry(n => n + 1)} />
        ) : (
          <div className="bg-card rounded-2xl border border-tgline divide-y divide-tgline overflow-hidden">
            {services.length === 0 ? (
              <div className="text-center py-10 text-hint text-sm">Услуг нет</div>
            ) : services.map(svc => (
              <div key={svc.id} className="p-4 flex items-center gap-3">
                {selectMode && (
                  <button
                    onClick={() => toggleSelected(svc.id)}
                    className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center ${
                      selected.has(svc.id) ? 'bg-accent border-accent text-white' : 'border-tgline'
                    }`}
                  >
                    {selected.has(svc.id) && <Check size={14} />}
                  </button>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-semibold text-primary text-sm">{svc.name}</span>
                    <span className="text-accent font-bold text-sm shrink-0">{svc.price} ₽</span>
                  </div>
                  {svc.description && <p className="text-xs text-hint mt-0.5">{svc.description}</p>}
                  <p className="text-xs text-hint mt-0.5">{svc.duration} мин</p>
                </div>
                {!selectMode && (
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => startEdit(svc)}
                      className="w-8 h-8 rounded-xl border border-tgline text-hint flex items-center justify-center"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => deleteOne(svc.id)}
                      className="w-8 h-8 rounded-xl border border-red-200 dark:border-red-800 text-red-400 flex items-center justify-center"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!selectMode && (
          <div className="flex flex-col gap-4">
            <h2 className="font-semibold text-primary text-sm">
              {editingId ? 'Редактировать услугу' : 'Добавить услугу'}
            </h2>
            {done && (
              <div className="flex items-center gap-2 bg-accent-soft rounded-xl px-3 py-2.5 text-accent text-sm font-medium">
                <CheckCircle2 size={16} /> Услуга «{form.name}» добавлена!
              </div>
            )}
            <Field label="Название *">
              <input value={form.name} onChange={set('name')} placeholder="Чистка лица" className={cls} />
            </Field>
            <Field label="Описание">
              <textarea value={form.description} onChange={set('description')}
                placeholder="Краткое описание" rows={3} className={cls + ' resize-none'} />
            </Field>
            <div className="flex gap-3">
              <Field label="Длительность (мин)" className="flex-1">
                <input type="number" min="1" value={form.duration} onChange={set('duration')} className={cls} />
              </Field>
              <Field label="Цена (₽) *" className="flex-1">
                <input type="number" min="1" value={form.price} onChange={set('price')} placeholder="2500" className={cls} />
              </Field>
            </div>
            {error && <p className="text-red-500 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 rounded-xl px-4 py-2">{error}</p>}
            {editingId ? (
              <div className="flex flex-col gap-3">
                <button
                  disabled={!valid || submitting}
                  onClick={handleSubmit}
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
                disabled={!valid || submitting}
                onClick={handleSubmit}
                className="w-full py-3.5 bg-accent text-white rounded-full font-semibold mt-2 disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <Plus size={16} /> {submitting ? 'Добавляем...' : 'Добавить услугу'}
              </button>
            )}
          </div>
        )}
      </div>
      {selectMode && <BulkActionBar count={selected.size} onDelete={bulkDelete} deleting={bulkDeleting} />}
    </div>
  )
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs text-hint mb-1.5 block">{label}</label>
      {children}
    </div>
  )
}
