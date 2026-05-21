'use client'
import { ArrowLeft, CheckCircle2, ExternalLink, Copy, ChevronDown, ChevronUp } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="text-primary hover:text-primary/80 transition-colors"
    >
      {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
    </button>
  )
}

export default function CatalogSetupPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard/settings?tab=whatsapp')} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <ArrowLeft size={20} className="text-slate-500" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-slate-800 italic font-serif">Meta Commerce Catalog Setup</h1>
            <p className="text-sm text-slate-500 font-bold mt-1">Enable product carousels & rich product messages in WhatsApp</p>
          </div>
        </div>

        {/* Overview Card */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl border-2 border-emerald-100 p-8">
          <h2 className="text-lg font-black text-emerald-800 italic font-serif mb-4">What you&apos;ll get</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { title: 'Product Carousels', desc: 'Up to 10 scrollable product cards in chat' },
              { title: 'Single-Product Cards', desc: 'Products with image, price & View button' },
              { title: 'Catalog in Profile', desc: 'View Catalog button on your WhatsApp profile' },
            ].map((item, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-emerald-100 shadow-sm">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 font-black mb-2">{i + 1}</div>
                <p className="font-bold text-sm text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Prerequisites */}
        <div className="bg-amber-50 border-2 border-amber-100 rounded-3xl p-8">
          <h2 className="text-lg font-black text-amber-800 italic font-serif mb-4">Before you start</h2>
          <ul className="space-y-3">
            {[
              'Meta Business Manager account (business.facebook.com)',
              'WhatsApp Business Account (WABA) with a registered phone number',
              'Admin access to both of the above',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm font-bold text-amber-700">
                <div className="w-5 h-5 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle2 size={12} className="text-amber-600" />
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Step-by-step */}
        <div className="space-y-4">
          <h2 className="text-xl font-black text-slate-800 italic font-serif">Step-by-step Guide</h2>

          {/* Step 1 */}
          <div className={`bg-white rounded-3xl border-2 transition-all ${step >= 1 ? 'border-primary shadow-lg shadow-primary/5' : 'border-slate-200'}`}>
            <button onClick={() => setStep(step === 1 ? -1 : 1)} className="w-full p-6 flex items-center justify-between text-left">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${step >= 1 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>1</div>
                <div>
                  <h3 className="font-black text-slate-800">Create a System User</h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">Generate a permanent API token</p>
                </div>
              </div>
              {step === 1 ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
            </button>
            {step === 1 && (
              <div className="px-6 pb-6 space-y-4 border-t border-slate-100 pt-4">
                <ol className="space-y-3 text-sm font-medium text-slate-600 list-decimal pl-4">
                  <li>Go to <a href="https://business.facebook.com/settings/system-users" target="_blank" rel="noopener noreferrer" className="text-primary underline font-bold">Meta Business Settings → System Users <ExternalLink size={12} className="inline" /></a></li>
                  <li>Click <strong>Add</strong> to create a new System User (name it something like &quot;chatevo-sync&quot;)</li>
                  <li>Set the role to <strong>Admin</strong></li>
                  <li>Click the user&apos;s name, then <strong>Add Assets</strong></li>
                  <li>Add these assets with <strong>Full Control</strong>:
                    <ul className="list-disc pl-6 mt-2 space-y-1 text-xs">
                      <li><strong>Catalogues</strong> — select your catalog (or create one first via Commerce Manager)</li>
                      <li><strong>WhatsApp Accounts</strong> — select your business phone number</li>
                    </ul>
                  </li>
                  <li>Click <strong>Generate New Token</strong></li>
                  <li>Select your app (or create one), set expiry to <strong>Never</strong></li>
                  <li>Check these permissions:
                    <code className="block bg-slate-50 rounded-lg p-3 mt-2 text-xs font-mono text-primary">
                      catalog_management<br />
                      whatsapp_business_management<br />
                      business_management
                    </code>
                  </li>
                  <li>Click <strong>Generate</strong> and <strong>copy the token</strong> — this is your permanent API key</li>
                </ol>
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                  <p className="text-xs font-bold text-blue-700">⚠️ Important: Set token expiry to &quot;Never&quot; so it doesn&apos;t expire. Store it safely — it acts as your permanent API password.</p>
                </div>
              </div>
            )}
          </div>

          {/* Step 2 */}
          <div className={`bg-white rounded-3xl border-2 transition-all ${step >= 2 ? 'border-primary shadow-lg shadow-primary/5' : 'border-slate-200'}`}>
            <button onClick={() => setStep(step === 2 ? -1 : 2)} className="w-full p-6 flex items-center justify-between text-left">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${step >= 2 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>2</div>
                <div>
                  <h3 className="font-black text-slate-800">Find Your IDs</h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">Collect the IDs you&apos;ll need to enter in Chatevo</p>
                </div>
              </div>
              {step === 2 ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
            </button>
            {step === 2 && (
              <div className="px-6 pb-6 space-y-4 border-t border-slate-100 pt-4">
                <div className="space-y-6">
                  <div className="bg-slate-50 rounded-2xl p-5">
                    <h4 className="font-black text-sm text-slate-800 mb-3">A. Your Business ID</h4>
                    <ol className="space-y-2 text-sm font-medium text-slate-600 list-decimal pl-4">
                      <li>Go to <a href="https://business.facebook.com/settings/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Business Settings <ExternalLink size={12} className="inline" /></a></li>
                      <li>Look in the URL: <code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">...business_id=<strong className="text-primary">123456789012345</strong></code></li>
                      <li>The long number after <code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">business_id=</code> is your <strong>Meta Business ID</strong></li>
                    </ol>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-5">
                    <h4 className="font-black text-sm text-slate-800 mb-3">B. Your WABA ID</h4>
                    <ol className="space-y-2 text-sm font-medium text-slate-600 list-decimal pl-4">
                      <li>Go to <a href="https://business.facebook.com/wa-manager" target="_blank" rel="noopener noreferrer" className="text-primary underline">WhatsApp Manager <ExternalLink size={12} className="inline" /></a></li>
                      <li>Select your WhatsApp Business Account</li>
                      <li>The URL will show the account ID: <code className="bg-slate-100 px-2 py-0.5 rounded text-xs font-mono">...waba_id=<strong className="text-primary">123456789012345</strong></code></li>
                    </ol>
                  </div>
                  <div className="bg-slate-50 rounded-2xl p-5">
                    <h4 className="font-black text-sm text-slate-800 mb-3">C. Your Catalog ID</h4>
                    <ol className="space-y-2 text-sm font-medium text-slate-600 list-decimal pl-4">
                      <li>Go to <a href="https://business.facebook.com/commerce" target="_blank" rel="noopener noreferrer" className="text-primary underline">Commerce Manager <ExternalLink size={12} className="inline" /></a></li>
                      <li>Click on your catalog name</li>
                      <li>The URL will show the catalog ID, or find it in the Catalog details page</li>
                      <li>If you don&apos;t have a catalog yet, create one:
                        <ul className="list-disc pl-6 mt-2 space-y-1 text-xs">
                          <li>In Commerce Manager, click <strong>Add Catalog</strong></li>
                          <li>Select <strong>E-Commerce</strong> → <strong>Upload product info</strong></li>
                          <li>Name it and click <strong>Create</strong></li>
                        </ul>
                      </li>
                    </ol>
                  </div>
                </div>
                <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
                  <p className="text-xs font-bold text-green-700">Keep these 3 IDs handy — you&apos;ll paste them into Chatevo settings.</p>
                </div>
              </div>
            )}
          </div>

          {/* Step 3 */}
          <div className={`bg-white rounded-3xl border-2 transition-all ${step >= 3 ? 'border-primary shadow-lg shadow-primary/5' : 'border-slate-200'}`}>
            <button onClick={() => setStep(step === 3 ? -1 : 3)} className="w-full p-6 flex items-center justify-between text-left">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${step >= 3 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>3</div>
                <div>
                  <h3 className="font-black text-slate-800">Enter Credentials in Chatevo</h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">Paste everything into your Settings page</p>
                </div>
              </div>
              {step === 3 ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
            </button>
            {step === 3 && (
              <div className="px-6 pb-6 space-y-4 border-t border-slate-100 pt-4">
                <ol className="space-y-3 text-sm font-medium text-slate-600 list-decimal pl-4">
                  <li>Go to <strong>Chatevo Dashboard → Settings → WhatsApp</strong></li>
                  <li>Unlock the section with your OTP code</li>
                  <li>Fill in the fields:

                    <div className="bg-slate-50 rounded-2xl p-4 mt-3 space-y-3 border border-slate-200">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-500">WhatsApp Phone ID</span>
                        <span className="text-[10px] text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded">Already have this</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-500">System Access Token</span>
                        <span className="text-[10px] text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded">Already have this</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-500">Meta Business ID</span>
                        <span className="text-[10px] text-amber-600 font-black bg-amber-50 px-2 py-0.5 rounded">From Step 2A</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-500">WABA ID</span>
                        <span className="text-[10px] text-amber-600 font-black bg-amber-50 px-2 py-0.5 rounded">From Step 2B</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-500">Catalog ID</span>
                        <span className="text-[10px] text-amber-600 font-black bg-amber-50 px-2 py-0.5 rounded">From Step 2C</span>
                      </div>
                    </div>
                  </li>
                  <li>Click <strong>Save WhatsApp Credentials</strong></li>
                </ol>
                <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                  <p className="text-xs font-bold text-blue-700">Once saved, any product you add/edit/delete in Chatevo will automatically sync to your Meta catalog!</p>
                </div>
              </div>
            )}
          </div>

          {/* Step 4 */}
          <div className={`bg-white rounded-3xl border-2 transition-all ${step >= 4 ? 'border-primary shadow-lg shadow-primary/5' : 'border-slate-200'}`}>
            <button onClick={() => setStep(step === 4 ? -1 : 4)} className="w-full p-6 flex items-center justify-between text-left">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-lg ${step >= 4 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>4</div>
                <div>
                  <h3 className="font-black text-slate-800">Connect to WhatsApp</h3>
                  <p className="text-xs text-slate-500 font-bold mt-0.5">Enable the catalog on your WhatsApp number</p>
                </div>
              </div>
              {step === 4 ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
            </button>
            {step === 4 && (
              <div className="px-6 pb-6 space-y-4 border-t border-slate-100 pt-4">
                <ol className="space-y-3 text-sm font-medium text-slate-600 list-decimal pl-4">
                  <li>Go to <a href="https://business.facebook.com/wa-manager" target="_blank" rel="noopener noreferrer" className="text-primary underline">WhatsApp Manager <ExternalLink size={12} className="inline" /></a></li>
                  <li>Select your WhatsApp Business Account</li>
                  <li>Under <strong>Account Tools</strong> → <strong>Catalog</strong>, verify your catalog is listed</li>
                  <li>Under <strong>Phone Numbers</strong> → select your number → <strong>Commerce Settings</strong></li>
                  <li>Enable:
                    <ul className="list-disc pl-6 mt-2 space-y-1 text-xs">
                      <li><strong>Show catalog on business profile</strong> — adds &quot;View Store&quot; button</li>
                      <li><strong>Shopping cart</strong> — allows add-to-cart in WhatsApp</li>
                    </ul>
                  </li>
                </ol>
              </div>
            )}
          </div>
        </div>

        {/* Video / Help section */}
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl border-2 border-indigo-100 p-8 text-center">
          <h2 className="text-lg font-black text-indigo-800 italic font-serif mb-2">Need help?</h2>
          <p className="text-sm text-indigo-600 font-bold mb-4">Double-check these common issues:</p>
          <div className="grid sm:grid-cols-2 gap-4 text-left">
            <div className="bg-white rounded-2xl p-4 border border-indigo-100">
              <p className="font-black text-xs text-indigo-700 uppercase tracking-widest">Token not working?</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Make sure you selected <strong>Never</strong> for expiry and checked <strong>catalog_management</strong> permission.</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-indigo-100">
              <p className="font-black text-xs text-indigo-700 uppercase tracking-widest">Catalog not showing?</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Ensure the catalog is connected to your WABA in WhatsApp Manager &gt; Catalog.</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-indigo-100">
              <p className="font-black text-xs text-indigo-700 uppercase tracking-widest">Products not syncing?</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Check that your System User has Full Control on both Catalogues and WhatsApp Accounts.</p>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-indigo-100">
              <p className="font-black text-xs text-indigo-700 uppercase tracking-widest">Need more help?</p>
              <p className="text-xs text-slate-500 mt-1 font-medium">Contact your Chatevo account manager for personalized assistance.</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-8">
          <p className="text-xs text-slate-400 font-bold">
            After setup, test by sending &quot;Hi&quot; to your WhatsApp business number
          </p>
        </div>
      </div>
    </div>
  )
}
