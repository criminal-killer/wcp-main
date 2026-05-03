import { SignUp } from "@clerk/nextjs"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-[#F0F2F5] flex flex-col items-center justify-center p-6 relative font-outfit">
      <div className="absolute inset-0 bg-noise pointer-events-none opacity-[0.03]" />
      
      {/* Back Button */}
      <div className="absolute top-10 left-10 z-20">
          <Link 
            href="/" 
            className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-bold group bg-white/50 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 shadow-sm"
          >
              <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              <span>Back Home</span>
          </Link>
      </div>

      <div className="w-full max-w-md relative z-10 py-12">
        <SignUp 
          appearance={{
            elements: {
              formButtonPrimary: 'bg-primary hover:bg-primary/90 text-sm font-bold',
              card: 'shadow-2xl rounded-[32px] border-none p-8',
              headerTitle: 'text-2xl font-serif font-black text-[#075E54]',
              headerSubtitle: 'text-slate-500 font-medium',
            }
          }}
        />
      </div>
    </div>
  )
}
