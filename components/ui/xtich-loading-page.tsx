'use client'

import React, { useEffect, useState } from 'react'
import XtichCloudLoader from './xtich-cloud-loader'

export interface XtichLoadingPageProps {
  onComplete?: () => void
  durationMs?: number
  editionTitle?: string
}

export default function XtichLoadingPage({
  onComplete,
  durationMs = 2800,
  editionTitle = 'VOL. 01 — EDITION 2026'
}: XtichLoadingPageProps) {
  const [progress, setProgress] = useState(0)
  const [isDismissing, setIsDismissing] = useState(false)

  useEffect(() => {
    const stepTime = 40
    const steps = durationMs / stepTime
    let currentStep = 0

    const timer = setInterval(() => {
      currentStep++
      const rawProgress = Math.min(100, Math.round((currentStep / steps) * 100))
      setProgress(rawProgress)

      if (rawProgress >= 100) {
        clearInterval(timer)
        setTimeout(() => {
          setIsDismissing(true)
          setTimeout(() => {
            if (onComplete) onComplete()
          }, 800)
        }, 300)
      }
    }, stepTime)

    return () => clearInterval(timer)
  }, [durationMs, onComplete])

  return (
    <div
      className={`fixed inset-0 z-[100000] flex flex-col items-center justify-between bg-[#050504] px-6 py-12 text-[#FAF8F5] transition-opacity duration-700 ease-out ${
        isDismissing ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
    >
      {/* Top Editorial Telemetry */}
      <header className="flex w-full max-w-5xl items-center justify-between font-mono text-[10px] tracking-[0.2em] uppercase text-[#FAF8F5]/40">
        <span>XTICH / ATELIER</span>
        <span>{editionTitle}</span>
      </header>

      {/* Main Center Stage */}
      <main className="flex flex-col items-center justify-center gap-8">
        {/* Brandmark */}
        <div className="flex flex-col items-center gap-2">
          <span className="font-serif text-2xl tracking-[0.35em] text-[#FAF8F5]">
            XTICH.
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-[#FAF8F5]/35">
            HAUTE EMBROIDERY DIGITALE
          </span>
        </div>

        {/* Quantum Orbital Loader */}
        <XtichCloudLoader
          variant="atelier"
          caption="INITIALIZING THREAD MATRIX"
        />

        {/* Progress Bar & Counter */}
        <div className="flex w-48 flex-col items-center gap-2">
          <div className="relative h-[1px] w-full overflow-hidden bg-[#FAF8F5]/15">
            <div
              className="h-full bg-[#FAF8F5] transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex w-full justify-between font-mono text-[9px] tracking-wider text-[#FAF8F5]/40">
            <span>CALIBRATION</span>
            <span>{String(progress).padStart(2, '0')}%</span>
          </div>
        </div>
      </main>

      {/* Bottom Editorial Credits */}
      <footer className="flex w-full max-w-5xl items-center justify-between font-mono text-[10px] tracking-[0.2em] uppercase text-[#FAF8F5]/30">
        <span>PARIS · MILAN · BENGALURU</span>
        <span>A PIECE THAT EXISTS ONCE</span>
      </footer>
    </div>
  )
}
