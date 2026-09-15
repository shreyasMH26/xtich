'use client';

import React from 'react';
import TextMarquee from './text-marque';
import { cn } from '@/lib/utils';

export interface XtichMarqueeSectionProps {
  /**
   * Editorial visual theme
   */
  variant?: 'atelier' | 'monochrome' | 'ghost';
  /**
   * First line track copy
   */
  primaryTrackText?: string;
  /**
   * Second line counter-track copy
   */
  secondaryTrackText?: string;
  className?: string;
}

/**
 * XTICH Haute Atelier Kinetic Marquee
 * Features dual-direction scroll-velocity responsive typography
 */
export function XtichTextMarquee({
  variant = 'atelier',
  primaryTrackText = 'XTICH · A PIECE THAT EXISTS ONCE · HAUTE EMBROIDERY DIGITALE · 450 GSM COTTON FLEECE ·',
  secondaryTrackText = 'DAVANGERE 2023 · ARCHITECTURAL COUNTER-STANDARD · CRAFTED FOR BUILDERS · EDITION VOL. 01 ·',
  className = '',
}: XtichMarqueeSectionProps) {
  const isAtelier = variant === 'atelier';
  const isGhost = variant === 'ghost';

  const primaryStyle = isAtelier
    ? 'font-serif uppercase tracking-[0.18em] text-[#FAF8F5] drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]'
    : isGhost
    ? 'font-serif uppercase tracking-[0.22em] text-[#FAF8F5]/15'
    : 'font-mono uppercase tracking-[0.14em] text-[#E8E4DC]';

  const secondaryStyle = isAtelier
    ? 'font-mono uppercase tracking-[0.24em] text-[#C5A880]/80 text-[4vw]'
    : isGhost
    ? 'font-mono uppercase tracking-[0.28em] text-[#FAF8F5]/10 text-[4vw]'
    : 'font-mono uppercase tracking-[0.20em] text-[#A7A39B]/60 text-[4vw]';

  return (
    <section
      className={cn(
        'relative flex w-full flex-col justify-center gap-6 overflow-hidden border-y border-[#FAF8F5]/10 bg-[#050504] py-14 select-none',
        className
      )}
      aria-label="XTICH Atelier Kinetic Marquee"
    >
      {/* Top Editorial Telemetry Tag */}
      <div className="flex w-full items-center justify-between px-8 font-mono text-[9px] uppercase tracking-[0.25em] text-[#FAF8F5]/30">
        <span>XTICH / KINETIC ARCHIVE</span>
        <span>VELOCITY-DRIVEN TYPOGRAPHY</span>
      </div>

      {/* Primary Track (Forward Velocity) */}
      <TextMarquee
        baseVelocity={-2.8}
        scrollDependent={true}
        clasname={primaryStyle}
      >
        {primaryTrackText}
      </TextMarquee>

      {/* Secondary Track (Reverse Counter-Velocity) */}
      <TextMarquee
        baseVelocity={2.8}
        scrollDependent={true}
        clasname={secondaryStyle}
      >
        {secondaryTrackText}
      </TextMarquee>

      {/* Bottom Subtle Rule */}
      <div className="flex w-full items-center justify-between px-8 font-mono text-[9px] uppercase tracking-[0.25em] text-[#FAF8F5]/20">
        <span>DAVANGERE · BENGALURU</span>
        <span>EDITION 2026</span>
      </div>
    </section>
  );
}

export default XtichTextMarquee;
