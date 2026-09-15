'use client';

import TextMarquee from '@/components/ui/text-marque';

export default function TextMarqueeDemo() {
  return (
    <div className="flex min-h-screen flex-col justify-center gap-16 bg-[#050504] py-20 text-[#FAF8F5]">
      {/* Primary Velocity Marquee */}
      <div className="flex flex-col gap-2">
        <span className="px-6 font-mono text-[10px] uppercase tracking-[0.25em] text-[#FAF8F5]/40">
          Editorial Velocity Track 01 / Scroll Sensitive
        </span>
        <TextMarquee
          baseVelocity={-3}
          scrollDependent={true}
          clasname="font-serif tracking-[0.2em] uppercase text-[#FAF8F5] select-none"
        >
          XTICH · A PIECE THAT EXISTS ONCE ·
        </TextMarquee>
      </div>

      {/* Counter Velocity Marquee */}
      <div className="flex flex-col gap-2">
        <span className="px-6 font-mono text-[10px] uppercase tracking-[0.25em] text-[#FAF8F5]/40">
          Editorial Velocity Track 02 / Reverse Stream
        </span>
        <TextMarquee
          baseVelocity={3}
          scrollDependent={true}
          clasname="font-mono text-[4vw] tracking-[0.15em] uppercase text-[#FAF8F5]/30 select-none"
        >
          DAVANGERE 2023 · HAUTE EMBROIDERY · 450 GSM COTTON FLEECE ·
        </TextMarquee>
      </div>
    </div>
  );
}
