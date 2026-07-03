import { Check, ListChecks, Pencil, Plus, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { api } from '../../api'
import BulkActionBar from '../../components/BulkActionBar'
import ErrorState from '../../components/ErrorState'
import PageHeader from '../../components/PageHeader'
import Spinner from '../../components/Spinner'

// Не toISOString() — та конвертирует в UTC перед обрезкой и в некоторые часы
// суток для положительных часовых поясов (вся Россия) сдвигает дату на день назад.
function todayLocalStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const todayStr = todayLocalStr()

interface Slot {
  id: number
  datetime: string
  is_available: boolean
}

// datetime приходит без временной зоны (naive, локальное время сервера) —
// new Date('2026-...T...') в браузере интерпретировала бы это как UTC и
// сдвигала отображаемое время. Разбираем строку руками вместо new Date().
function splitIso(iso: string): { date: string; time: string } {
  const [date, timePart] = iso.split('T')
  return { date, time: (timePart ?? '00:00').slice(0, 5) }
}

export default function AddSlot() {
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [addError, setAddError] = useState('')
  const submittingRef = useRef(false)

  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')
  const [retry, setRetry] = useState(0)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editTime, setEditTime] = useState('')
  const [rowError, setRowError] = useState('')
  const [acting, setActing] = useState<number | null>(null)

  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  useEffect(() => {
    setLoading(true)
    setListError('')
    api.get<Slot[]>('/api/admin/slots')
      .then(setSlots)
      .catch((e: any) => setListError(e.message))
      .finally(() => setLoading(false))
  }, [retry])

  const handleSubmit = async () => {
    if (!date || !time || submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    setAddError('')
    try {
      const created = await api.post<Slot>('/api/admin/slots', { datetime: `${date}T${time}` })
      setSlots(prev => [...prev, created].sort((a, b) => a.datetime.localeCompare(b.datetime)))
      setDate('')
      setTime('')
    } catch (e: any) {
      setAddError(e.message)
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  const startEdit = (s: Slot) => {
    const { date, time } = splitIso(s.datetime)
    setEditingId(s.id)
    setEditDate(date)
    setEditTime(time)
    setRowError('')
  }

  const saveEdit = async (id: number) => {
    setActing(id)
    setRowError('')
    try {
      const updated = await api.put<Slot>(`/api/admin/slots/${id}`, { datetime: `${editDate}T${editTime}` })
      setSlots(prev => prev.map(s => s.id === id ? { ...s, datetime: updated.datetime } : s))
      setEditingId(null)
    } catch (e: any) {
      setRowError(e.message)
    } finally {
      setActing(null)
    }
  }

  const deleteSlot = async (id: number) => {
    if (!confirm('Удалить слот?')) return
    setActing(id)
    try {
      await api.delete(`/api/admin/slots/${id}`)
      setSlots(prev => prev.filter(s => s.id !== id))
    } catch (e: any) {
      alert(e.message)
    } finally {
      setActing(null)
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
    if (!confirm(`Удалить выбранные слоты (${selected.size})?`)) return
    setBulkDeleting(true)
    const ids = [...selected]
    const results = await Promise.allSettled(ids.map(id => api.delete(`/api/admin/slots/${id}`)))
    const failedIds = ids.filter((_, i) => results[i].status === 'rejected')
    setSlots(prev => prev.filter(s => !ids.includes(s.id) || failedIds.includes(s.id)))
    setSelected(new Set())
    setBulkDeleting(false)
    if (failedIds.length > 0) {
      alert(`Не удалось удалить ${failedIds.length} из ${ids.length} — на них уже есть запись.`)
    } else {
      setSelectMode(false)
    }
  }

  return (
    <div className={`page-enter flex flex-col min-h-[100dvh] ${selectMode ? 'pb-24' : 'pb-6'}`}>
      <PageHeader title="Слоты" back="/admin" />

      <div className="flex-1 px-4 pt-4 flex flex-col gap-4">
        {!selectMode && (
        <div className="bg-card rounded-2xl p-4 border border-tgline flex flex-col gap-3">
          <div className="flex gap-2">
            <input
              type="date"
              min={todayStr}
              value={date}
              onChange={e => setDate(e.target.value)}
              className="flex-1 min-w-0 bg-app border border-tgline rounded-xl px-3 py-2.5 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <input
              type="time"
              value={time}
              onChange={e => setTime(e.target.value)}
              className="flex-1 min-w-0 bg-app border border-tgline rounded-xl px-3 py-2.5 text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
          {addError && <p className="text-red-500 dark:text-red-400 text-xs">{addError}</p>}
          <button
            disabled={!date || !time || submitting}
            onClick={handleSubmit}
            className="w-full py-2.5 bg-accent text-white rounded-xl font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            <Plus size={16} /> {submitting ? 'Добавляем...' : 'Добавить слот'}
          </button>
        </div>
        )}

        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-primary text-sm">Список слотов</h2>
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
            {slots.length === 0 ? (
              <div className="text-center py-10 text-hint text-sm">Слотов нет</div>
            ) : slots.map(s => {
              const busy = acting === s.id
              if (!selectMode && editingId === s.id) {
                return (
                  <div key={s.id} className="p-3 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <input
                        type="date"
                        min={todayStr}
                        value={editDate}
                        onChange={e => setEditDate(e.target.value)}
                        className="flex-1 min-w-0 bg-app border border-tgline rounded-xl px-2.5 py-2 text-primary text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                      <input
                        type="time"
                        value={editTime}
                        onChange={e => setEditTime(e.target.value)}
                        className="flex-1 min-w-0 bg-app border border-tgline rounded-xl px-2.5 py-2 text-primary text-xs focus:outline-none focus:ring-2 focus:ring-accent"
                      />
                      <button
                        onClick={() => saveEdit(s.id)}
                        disabled={busy}
                        className="w-9 h-9 shrink-0 rounded-xl bg-accent text-white flex items-center justify-center disabled:opacity-50"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        disabled={busy}
                        className="w-9 h-9 shrink-0 rounded-xl border border-tgline text-hint flex items-center justify-center"
                      >
                        <X size={16} />
                      </button>
                    </div>
                    {rowError && <p className="text-red-500 dark:text-red-400 text-xs">{rowError}</p>}
                  </div>
                )
              }
              return (
                <div key={s.id} className="p-3.5 flex items-center gap-3">
                  {selectMode && (
                    <button
                      onClick={() => s.is_available && toggleSelected(s.id)}
                      disabled={!s.is_available}
                      title={s.is_available ? undefined : 'Занятые слоты нельзя удалить массово'}
                      className={`w-6 h-6 shrink-0 rounded-full border-2 flex items-center justify-center disabled:opacity-30 ${
                        selected.has(s.id) ? 'bg-accent border-accent text-white' : 'border-tgline'
                      }`}
                    >
                      {selected.has(s.id) && <Check size={14} />}
                    </button>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-primary">
                      {new Date(s.datetime.replace('T', ' ')).toLocaleString('ru-RU', {
                        day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </div>
                    <span
                      className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                        s.is_available
                          ? 'bg-accent-soft text-accent'
                          : 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}
                    >
                      {s.is_available ? 'Свободен' : 'Занят'}
                    </span>
                  </div>
                  {!selectMode && (
                  <button
                    onClick={() => startEdit(s)}
                    disabled={!s.is_available || busy}
                    title={s.is_available ? undefined : 'Сначала отмените запись на этот слот'}
                    className="w-9 h-9 shrink-0 rounded-xl border border-tgline text-hint flex items-center justify-center disabled:opacity-30"
                  >
                    <Pencil size={15} />
                  </button>
                  )}
                  {!selectMode && (
                  <button
                    onClick={() => deleteSlot(s.id)}
                    disabled={!s.is_available || busy}
                    title={s.is_available ? undefined : 'Сначала отмените запись на этот слот'}
                    className="w-9 h-9 shrink-0 rounded-xl border border-red-200 dark:border-red-800 text-red-400 flex items-center justify-center disabled:opacity-30"
                  >
                    <Trash2 size={15} />
                  </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

      </div>
      {selectMode && <BulkActionBar count={selected.size} onDelete={bulkDelete} deleting={bulkDeleting} />}
    </div>
  )
}
