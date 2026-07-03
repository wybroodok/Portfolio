export default function Spinner({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex justify-center ${compact ? 'py-10' : 'py-20'}`}>
      <div className="w-7 h-7 rounded-full border-2 border-tgline border-t-accent animate-spin" />
    </div>
  )
}
