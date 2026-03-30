'use client'

import React from 'react'
import { MapPin, Globe, Mail, LogOut } from 'lucide-react'
import { SignOutButton } from '@clerk/nextjs'

interface WaitlistOverlayProps {
  country: string
}

export default function WaitlistOverlay({ country }: WaitlistOverlayProps) {
  return (
    <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute -inset-4 bg-[#25D366]/10 rounded-full blur-xl animate-pulse" />
            <div className="relative bg-white border-2 border-[#25D366] rounded-2xl p-6 shadow-xl">
              <Globe className="w-16 h-16 text-[#25D366] animate-bounce" />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black text-[#075E54] tracking-tight">
            Sella is coming to <span className="text-[#128C7E]">{country}</span>!
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            We are currently in a <span className="font-bold text-[#25D366]">Private Beta</span> exclusively for the Kenyan market. 
            You've been successfully added to our global waitlist!
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 py-6">
          <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 p-4 rounded-2xl">
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <MapPin className="text-[#128C7E] w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Location Detected</p>
              <p className="text-gray-900 font-semibold">{country}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-[#25D366]/5 border border-[#25D366]/10 p-4 rounded-2xl">
            <div className="bg-white p-2 rounded-lg shadow-sm">
              <Mail className="text-[#25D366] w-5 h-5" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Notification Status</p>
              <p className="text-gray-900 font-semibold">Priority Alert Enabled</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <p className="text-sm text-gray-400 italic">
            You will receive an email as soon as we activate your region.
          </p>
          <div className="flex items-center justify-center gap-4">
            <SignOutButton>
              <button className="flex items-center gap-2 text-gray-500 font-medium hover:text-red-500 transition-colors">
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </SignOutButton>
          </div>
        </div>
      </div>
    </div>
  )
}
