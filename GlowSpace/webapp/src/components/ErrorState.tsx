import { AlertTriangle } from 'lucide-react'

export default function ErrorState({
  message,
  onRetry,
  compact = false,
}: {
  message: string
  onRetry?: () => void
  compact?: boolean
}) {
  return (
    <div className={`text-center ${compact ? 'py-10' : 'py-20'}`}>
      <AlertTriangle size={36} strokeWidth={2} className="text-amber-500 mx-auto mb-3" />
      <p className="text-hint text-sm">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-3 text-accent text-sm font-medium">
          Повторить
        </button>
      )}
    </div>
  )
}
