'use client'

import React from 'react'

export const LoadingStore = () => {
    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-xl">
            <div className="relative">
                {/* Outer Ring */}
                <div className="w-32 h-32 rounded-full border-t-2 border-primary animate-spin" />
                
                {/* Inner Logo Animation */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.4)] animate-pulse">
                        <span className="text-primary-foreground font-serif text-4xl font-black">C</span>
                    </div>
                </div>
            </div>
            
            <div className="mt-12 text-center space-y-4 max-w-xs">
                <h2 className="text-2xl font-serif font-black tracking-tighter text-primary">CRAFTING YOUR STORE</h2>
                <p className="text-muted-foreground text-sm font-medium animate-pulse">
                    Setting up your digital boutique...
                </p>
                
                {/* Progress Bar Placeholder */}
                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-[shimmer_2s_infinite]" style={{ width: '40%' }} />
                </div>
            </div>

            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(250%); }
                }
            `}</style>
        </div>
    )
}
