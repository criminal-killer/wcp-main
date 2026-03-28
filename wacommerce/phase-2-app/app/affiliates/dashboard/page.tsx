import Link from 'next/link'
import { Wallet, Users, Settings, LogOut, Download, Copy, Target, TrendingUp, HandCoins } from 'lucide-react'

// Dummy data for mockup purposes. In reality, we fetch from `affiliates` and `payouts` tables.
const mockAffiliate = {
  name: 'John Partner',
  status: 'approved',
  referralCode: 'ref_john123',
  totalEarned: 450,
  balance: 150,
  activeReferrals: 12
}

export default function AffiliateDashboard() {
  return (
    <div className="min-h-screen bg-slate-50 font-outfit flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col h-screen fixed">
        <div className="p-6 border-b border-slate-100">
          <Link href="/" className="font-serif font-black text-2xl text-primary block">
            SELLA <span className="text-[10px] uppercase font-sans tracking-widest text-slate-400">Affiliates</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/affiliates/dashboard" className="flex items-center gap-3 px-4 py-3 text-sm font-bold bg-green-50 text-[#25D366] rounded-xl">
            <TrendingUp size={18} /> Overview
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
            <Users size={18} /> My Referrals
          </Link>
          <Link href="#" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
            <Wallet size={18} /> Payouts
          </Link>
          <Link href="#swipe-file" className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
            <Download size={18} /> Marketing Kit
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-100 mt-auto">
          <button className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-500 hover:text-red-500 transition-colors w-full text-left">
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black font-serif tracking-tight">Welcome back, {mockAffiliate.name}</h1>
            <p className="text-slate-500 font-medium">Here's what's happening with your referrals today.</p>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Your Link:</span>
            <code className="text-sm font-bold text-primary">sella.io/?ref={mockAffiliate.referralCode}</code>
            <button className="ml-2 p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-800">
              <Copy size={16} />
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full translate-x-1/3 -translate-y-1/3 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Available Balance</p>
                <Wallet className="text-[#25D366]" size={24} />
              </div>
              <p className="text-4xl font-black text-slate-900">${mockAffiliate.balance}</p>
              
              <button 
                disabled={mockAffiliate.balance < 100}
                className="mt-6 w-full text-sm font-bold bg-slate-900 text-white py-3 rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <HandCoins size={16} /> {mockAffiliate.balance >= 100 ? 'Request Payout' : '$100 Minimum Required'}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Earned</p>
                <TrendingUp className="text-blue-500" size={24} />
              </div>
              <p className="text-4xl font-black text-slate-900">${mockAffiliate.totalEarned}</p>
              <p className="text-sm text-slate-500 font-medium mt-2">Lifetime commissions.</p>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
             <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Active Referrals</p>
                <Users className="text-purple-500" size={24} />
              </div>
              <p className="text-4xl font-black text-slate-900">{mockAffiliate.activeReferrals}</p>
              <p className="text-sm text-slate-500 font-medium mt-2">Merchants currently yielding 10%.</p>
            </div>
          </div>
        </div>

        {/* Marketing Kit / Swipe File */}
        <section id="swipe-file" className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-black font-serif tracking-tight">Marketing Kit</h2>
              <p className="text-slate-500 font-medium mt-1">Copy & paste these materials to your audience.</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 flex items-center justify-center rounded-2xl">
              <Target size={24} className="text-indigo-500" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Email Template</h3>
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl relative group">
                <button className="absolute top-4 right-4 p-2 bg-white border border-slate-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-slate-100 flex items-center gap-2 text-xs font-bold text-slate-600">
                  <Copy size={14} /> Copy HTML
                </button>
                <div className="space-y-3 text-sm font-medium text-slate-700">
                  <p><strong>Subject:</strong> Transform your WhatsApp into a real store 🚀</p>
                  <hr className="border-slate-200" />
                  <p>Hey [Name],</p>
                  <p>I know you've been struggling with managing orders on WhatsApp. I just found SELLA and it's a game-changer.</p>
                  <p>It lets you build a full catalog, accept payments (Paystack/Stripe/M-Pesa), and manage orders without buyers ever leaving the chat.</p>
                  <p>Check it out here: <strong>https://sella-app.vercel.app/?ref={mockAffiliate.referralCode}</strong></p>
                  <p>Best,<br/>[Your Name]</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">Banners & Socials</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="aspect-video bg-emerald-100 rounded-2xl border-2 border-dashed border-emerald-300 flex flex-col items-center justify-center text-emerald-800 p-4 text-center cursor-pointer hover:bg-emerald-200 transition-colors">
                  <Download size={24} className="mb-2" />
                  <span className="text-xs font-bold">Download Instagram Story</span>
                </div>
                <div className="aspect-video bg-blue-100 rounded-2xl border-2 border-dashed border-blue-300 flex flex-col items-center justify-center text-blue-800 p-4 text-center cursor-pointer hover:bg-blue-200 transition-colors">
                  <Download size={24} className="mb-2" />
                  <span className="text-xs font-bold">Download Twitter Card</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 font-medium">These images automatically include your referral code embedded as a QR code or visible link.</p>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}
