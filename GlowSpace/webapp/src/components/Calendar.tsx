import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const MONTH_LABELS = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]

// Не toISOString() — та конвертирует в UTC перед обрезкой и в некоторые часы
// суток для положительных часовых поясов (вся Россия) сдвигает дату на день назад.
function toLocalDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function buildMonthGrid(year: number, month: number): (Date | null)[] {
  const firstOfMonth = new Date(year, month, 1)
  const startWeekday = (firstOfMonth.getDay() + 6) % 7 // понедельник = 0
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = []
  for (let i = 0; i < startWeekday; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  return cells
}

interface Props {
  value: string // YYYY-MM-DD или ''
  onSelect: (dateStr: string) => void
}

export default function Calendar({ value, onSelect }: Props) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth()

  const goPrevMonth = () => {
    if (isCurrentMonth) return
    const d = new Date(viewYear, viewMonth - 1, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }
  const goNextMonth = () => {
    const d = new Date(viewYear, viewMonth + 1, 1)
    setViewYear(d.getFullYear())
    setViewMonth(d.getMonth())
  }

  const cells = buildMonthGrid(viewYear, viewMonth)

  return (
    <div className="bg-card rounded-2xl p-4 border border-tgline">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={goPrevMonth}
          disabled={isCurrentMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center text-hint disabled:opacity-25 active:bg-accent-soft transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="font-semibold text-primary text-sm">
          {MONTH_LABELS[viewMonth]} {viewYear}
        </span>
        <button
          onClick={goNextMonth}
          className="w-8 h-8 rounded-full flex items-center justify-center text-hint active:bg-accent-soft transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-1">
        {WEEKDAY_LABELS.map(label => (
          <div key={label} className="text-center text-xs text-hint font-medium py-1">
            {label}
          </div>
        ))}
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />
          const dateStr = toLocalDateStr(date)
          const isPast = date < today
          const isSelected = dateStr === value
          const isToday = dateStr === toLocalDateStr(today)
          return (
            <div key={dateStr} className="flex items-center justify-center py-0.5">
              <button
                onClick={() => !isPast && onSelect(dateStr)}
                disabled={isPast}
                className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-accent text-white'
                    : isPast
                    ? 'text-hint/40'
                    : isToday
                    ? 'text-accent bg-accent-soft'
                    : 'text-primary active:bg-accent-soft'
                }`}
              >
                {date.getDate()}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
