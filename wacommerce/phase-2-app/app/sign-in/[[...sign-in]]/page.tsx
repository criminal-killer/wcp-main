import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden">
          <div className="p-8 text-center bg-primary/5 border-b border-primary/10">
            <div className="inline-flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-black text-xl text-gray-900">SELLA</span>
            </div>
            <p className="text-gray-500 text-sm font-medium">Professional WhatsApp Commerce</p>
          </div>
          <div className="p-8">
            <SignIn fallbackRedirectUrl="/dashboard" />
            
            <div className="mt-8 pt-6 border-t border-gray-50 text-center">
              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-2">Trouble signing in?</p>
              <a 
                href="https://accounts.clerk.dev/forgot-password" 
                className="text-primary text-sm font-bold hover:underline underline-offset-4"
              >
                Reset your password
              </a>
            </div>
          </div>
        </div>
        <p className="text-center mt-6 text-xs text-gray-400 font-medium">
          &copy; 2026 SELLA Platform. All rights reserved.
        </p>
      </div>
    </div>
  )
}
