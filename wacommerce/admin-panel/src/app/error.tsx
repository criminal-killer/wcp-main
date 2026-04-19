'use client'

import { useEffect } from 'react'
import { AlertOctagon, RotateCcw } from 'lucide-react'

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service if needed
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6 text-center animate-in zoom-in-95 duration-500">
      <div className="w-24 h-24 bg-red-100/50 rounded-full flex items-center justify-center">
        <AlertOctagon size={48} className="text-red-500" />
      </div>
      <div className="max-w-md">
        <h2 className="text-2xl font-black font-serif text-slate-800 mb-2">Something went wrong</h2>
        <p className="text-slate-500 font-medium mb-8">
          The admin panel encountered an unexpected error. This might be due to a missing database table or connection issue.
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex items-center gap-2 bg-slate-900 text-white font-bold px-6 py-3 rounded-xl hover:-translate-y-0.5 transition-all shadow-lg shadow-slate-900/20"
        >
          <RotateCcw size={18} />
          Try Again
        </button>
      </div>
    </div>
  )
}
