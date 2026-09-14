'use client'

import React from 'react'

export interface XtichCloudLoaderProps {
  /**
   * Theme palette for the orbital particles
   * - 'atelier': XTICH signature palette (Bone, Champagne Gold, Raw Graphite, Silver)
   * - 'monochrome': Pure obsidian, bone, and platinum tones
   * - 'quantum': Original multi-color chromatic spectrum
   */
  variant?: 'atelier' | 'monochrome' | 'quantum'
  /**
   * Optional center brandmark or label
   */
  showCenterMark?: boolean
  /**
   * Subtitle or edition note
   */
  caption?: string
  className?: string
}

export default function XtichCloudLoader({
  variant = 'atelier',
  showCenterMark = true,
  caption = 'CALIBRATING EMBROIDERY MATRIX',
  className = ''
}: XtichCloudLoaderProps) {
  const isAtelier = variant === 'atelier'
  const isMono = variant === 'monochrome'

  // Particle 1 (Fast inner orbit)
  const p1Class = isAtelier
    ? 'bg-[#FAF8F5] shadow-[0_0_16px_rgba(250,248,245,0.9),0_0_32px_rgba(250,248,245,0.4)]'
    : isMono
    ? 'bg-white shadow-[0_0_14px_rgba(255,255,255,0.85)]'
    : 'bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.75),0_0_24px_rgba(248,113,113,0.3)]'

  // Particle 2 (Large outer orbit)
  const p2Class = isAtelier
    ? 'bg-[#C5A880] shadow-[0_0_20px_rgba(197,168,128,0.75),0_0_40px_rgba(197,168,128,0.35)]'
    : isMono
    ? 'bg-[#A7A39B] shadow-[0_0_18px_rgba(167,163,155,0.6)]'
    : 'bg-blue-400 shadow-[0_0_16px_rgba(96,165,250,0.7),0_0_30px_rgba(96,165,250,0.25)]'

  // Particle 3 (Center oscillator)
  const p3Class = isAtelier
    ? 'bg-[#D4AF37] shadow-[0_0_16px_rgba(212,175,55,0.85),0_0_30px_rgba(212,175,55,0.4)]'
    : isMono
    ? 'bg-[#E8E4DC] shadow-[0_0_16px_rgba(232,228,220,0.8)]'
    : 'bg-yellow-400 shadow-[0_0_14px_rgba(250,204,21,0.75),0_0_26px_rgba(250,204,21,0.3)]'

  // Particle 4 (Slow wide sweep)
  const p4Class = isAtelier
    ? 'bg-[#8E8B82] shadow-[0_0_14px_rgba(142,139,130,0.7),0_0_28px_rgba(142,139,130,0.3)]'
    : isMono
    ? 'bg-[#55534E] shadow-[0_0_12px_rgba(85,83,78,0.6)]'
    : 'bg-green-400 shadow-[0_0_12px_rgba(74,222,128,0.75),0_0_24px_rgba(74,222,128,0.3)]'

  return (
    <div className={`relative flex flex-col items-center justify-center overflow-hidden ${className}`}>
      {/* Orbital Quantum Stage */}
      <div className="relative isolate flex h-32 w-56 items-center justify-center">

        {/* Center Static Micro Dot or Crosshair */}
        {showCenterMark && (
          <div className="pointer-events-none absolute z-20 flex flex-col items-center justify-center opacity-30">
            <span className="font-mono text-[9px] tracking-[0.3em] text-[#FAF8F5]">✦</span>
          </div>
        )}

        {/* PARTICLE 1 — Fast inner stitch */}
        <div className="absolute z-30 h-3.5 w-3.5 animate-quantum-red">
          <div className={`h-full w-full rounded-full transition-colors duration-500 ${p1Class}`} />
        </div>

        {/* PARTICLE 2 — Large outer atmosphere */}
        <div className="absolute z-10 h-5 w-5 animate-quantum-blue">
          <div className={`h-full w-full rounded-full transition-colors duration-500 ${p2Class}`} />
        </div>

        {/* PARTICLE 3 — Center nucleus */}
        <div className="absolute z-40 h-4 w-4 animate-quantum-yellow">
          <div className={`h-full w-full rounded-full transition-colors duration-500 ${p3Class}`} />
        </div>

        {/* PARTICLE 4 — Slow orbital periphery */}
        <div className="absolute z-0 h-3 w-3 animate-quantum-green">
          <div className={`h-full w-full rounded-full transition-colors duration-500 ${p4Class}`} />
        </div>
      </div>

      {/* Editorial Caption */}
      {caption && (
        <div className="mt-4 flex flex-col items-center gap-1 text-center">
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#FAF8F5]/40">
            {caption}
          </span>
          <div className="h-[1px] w-8 bg-gradient-to-r from-transparent via-[#FAF8F5]/20 to-transparent" />
        </div>
      )}

      <style>{`
        /* --------------------------------
           PARTICLE 1 (Fast inner orbit)
        --------------------------------- */
        @keyframes quantum-red {
          0% {
            transform: translate3d(-46px, 7px, 0) scale(0.72);
            opacity: 0.45;
          }
          25% {
            transform: translate3d(-23px, -7px, 0) scale(0.95);
            opacity: 0.78;
          }
          50% {
            transform: translate3d(46px, 0, 0) scale(1.18);
            opacity: 1;
          }
          75% {
            transform: translate3d(23px, 7px, 0) scale(0.95);
            opacity: 0.78;
          }
          100% {
            transform: translate3d(-46px, 7px, 0) scale(0.72);
            opacity: 0.45;
          }
        }
        .animate-quantum-red {
          animation: quantum-red 3.8s cubic-bezier(0.37, 0, 0.63, 1) infinite;
          will-change: transform, opacity;
        }

        /* --------------------------------
           PARTICLE 2 (Slow, heavy orbit)
        --------------------------------- */
        @keyframes quantum-blue {
          0% {
            transform: translate3d(38px, -4px, 0) scale(1);
            opacity: 0.95;
          }
          25% {
            transform: translate3d(19px, 7px, 0) scale(0.88);
            opacity: 0.72;
          }
          50% {
            transform: translate3d(-38px, 3px, 0) scale(0.68);
            opacity: 0.42;
          }
          75% {
            transform: translate3d(-19px, -7px, 0) scale(0.88);
            opacity: 0.72;
          }
          100% {
            transform: translate3d(38px, -4px, 0) scale(1);
            opacity: 0.95;
          }
        }
        .animate-quantum-blue {
          animation: quantum-blue 5.6s cubic-bezier(0.37, 0, 0.63, 1) infinite;
          will-change: transform, opacity;
        }

        /* --------------------------------
           PARTICLE 3 (Central oscillator)
        --------------------------------- */
        @keyframes quantum-yellow {
          0% {
            transform: translate3d(-27px, 2px, 0) scale(0.82);
            opacity: 0.65;
          }
          20% {
            transform: translate3d(-17px, -5px, 0) scale(0.94);
            opacity: 0.82;
          }
          50% {
            transform: translate3d(27px, 0, 0) scale(1.08);
            opacity: 1;
          }
          80% {
            transform: translate3d(17px, 5px, 0) scale(0.94);
            opacity: 0.82;
          }
          100% {
            transform: translate3d(-27px, 2px, 0) scale(0.82);
            opacity: 0.65;
          }
        }
        .animate-quantum-yellow {
          animation: quantum-yellow 3.1s cubic-bezier(0.37, 0, 0.63, 1) infinite;
          will-change: transform, opacity;
        }

        /* --------------------------------
           PARTICLE 4 (Slow wide sweep)
        --------------------------------- */
        @keyframes quantum-green {
          0% {
            transform: translate3d(64px, 6px, 0) scale(0.52);
            opacity: 0.25;
          }
          20% {
            transform: translate3d(43px, -5px, 0) scale(0.68);
            opacity: 0.45;
          }
          50% {
            transform: translate3d(0, 3px, 0) scale(1);
            opacity: 0.9;
          }
          80% {
            transform: translate3d(-43px, -5px, 0) scale(0.68);
            opacity: 0.45;
          }
          100% {
            transform: translate3d(-64px, 6px, 0) scale(0.52);
            opacity: 0.25;
          }
        }
        .animate-quantum-green {
          animation: quantum-green 6.4s cubic-bezier(0.37, 0, 0.63, 1) infinite alternate;
          will-change: transform, opacity;
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-quantum-red,
          .animate-quantum-blue,
          .animate-quantum-yellow,
          .animate-quantum-green {
            animation: none;
          }
        }
      `}</style>
    </div>
  )
}
