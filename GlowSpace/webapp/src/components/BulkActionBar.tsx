import { Trash2 } from 'lucide-react'

// Закреплена внизу экрана (а не в конце списка) — при длинном списке кнопка
// "Удалить выбранные" иначе оказывалась бы за пределами видимой области, и
// пользователь мог её просто не найти, не долистав до конца.
export default function BulkActionBar({
  count,
  onDelete,
  deleting,
}: {
  count: number
  onDelete: () => void
  deleting: boolean
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-app border-t border-tgline px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <button
        onClick={onDelete}
        disabled={count === 0 || deleting}
        className="w-full py-3 bg-red-500 text-white rounded-2xl font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
      >
        <Trash2 size={16} /> {deleting ? 'Удаляем...' : `Удалить выбранные (${count})`}
      </button>
    </div>
  )
}
