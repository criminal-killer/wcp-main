import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#25D366]" />
        <p className="text-sm font-bold text-slate-400 mt-3">Loading contacts...</p>
      </div>
    </div>
  )
}
