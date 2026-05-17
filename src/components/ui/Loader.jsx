import { BookOpen } from 'lucide-react'

export default function Loader() {
  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center animate-pulse">
          <BookOpen size={28} className="text-white" />
        </div>
        <p className="text-amber-600 text-sm font-medium">Cargando Sandbook…</p>
      </div>
    </div>
  )
}
