import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-[#25D366] rounded-xl flex items-center justify-center">
              <span className="text-white font-bold">S</span>
            </div>
            <span className="font-black text-2xl text-gray-900">SELLA</span>
          </div>
          <p className="text-gray-500">Create your WhatsApp store — free for 14 days</p>
        </div>
        <SignUp fallbackRedirectUrl="/onboarding" />
      </div>
    </div>
  )
}
