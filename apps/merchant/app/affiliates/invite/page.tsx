import { SignUp } from "@clerk/nextjs";

export default function AffiliateInvitePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-outfit">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black font-serif tracking-tight text-slate-900 mb-2">
          Accept Your Invitation
        </h1>
        <p className="text-slate-500 font-medium max-w-sm mx-auto">
          Create your account or sign in to access your Chatevo affiliate dashboard.
        </p>
      </div>
      
      <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-200">
        <SignUp
          forceRedirectUrl="/affiliates/dashboard"
          signInForceRedirectUrl="/affiliates/dashboard"
          routing="hash"
          appearance={{
            elements: {
              card: "shadow-none border-none",
              rootBox: "mx-auto",
              formButtonPrimary: "bg-slate-900 hover:bg-slate-800 text-white shadow-none",
              footerActionLink: "text-primary hover:text-primary/80",
            }
          }}
        />
      </div>
    </div>
  );
}
