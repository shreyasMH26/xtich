'use client';

import React, { useState } from 'react';
import {
  MorphingDialog,
  MorphingDialogTrigger,
  MorphingDialogContent,
  MorphingDialogTitle,
  MorphingDialogImage,
  MorphingDialogSubtitle,
  MorphingDialogClose,
  MorphingDialogDescription,
  MorphingDialogContainer,
} from '@/components/ui/morphing-dialog';
import { PlusIcon, CheckIcon } from 'lucide-react';

interface XTICHProduct {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  image: string;
  specs: string[];
  desc: string;
}

const XTICH_PIECES: XTICHProduct[] = [
  {
    id: 'hoodie',
    title: 'The Heavyweight Hoodie',
    subtitle: '450 GSM · Obsidian Black',
    tag: 'FLAGSHIP',
    image: 'assets/hoodie-black-front-hr.jpg',
    desc: 'Structured oversized fit. Double-layer hood without drawstrings. Tested across 300 days and 180+ washes.',
    specs: [
      '450 GSM heavyweight brushed fleece',
      'Long-staple cotton blended with tensile poly',
      'Drawstring-free double-layer hood',
      'Anti-deformation ribbed cuffs and waist',
    ],
  },
  {
    id: 'sweatshirt',
    title: 'The Versity Sweatshirt',
    subtitle: '450 GSM · Obsidian Black',
    tag: 'NEW RELEASE',
    image: 'assets/sweatshirt-black-front-hr.jpg',
    desc: 'Heavy-ribbed crewneck. Drop-shoulder drape. Engineered for daily high-frequency wear.',
    specs: [
      '450 GSM thermal fleece knit',
      'Dense 2x2 ribbed collar and cuffs',
      'Ergonomic drop-shoulder patterning',
      'Reinforced twin-needle construction',
    ],
  },
];

export function XTICHMorphingCollection() {
  const [selectedSize, setSelectedSize] = useState<Record<string, string>>({
    hoodie: 'M',
    sweatshirt: 'M',
  });
  const [reserved, setReserved] = useState<Record<string, boolean>>({});

  const handleReserve = (productId: string) => {
    setReserved((prev) => ({ ...prev, [productId]: true }));
    setTimeout(() => {
      setReserved((prev) => ({ ...prev, [productId]: false }));
    }, 3000);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 text-[#FAF8F5]">
      {/* Minimal Header */}
      <div className="mb-12 text-center md:text-left">
        <span className="font-mono text-xs tracking-[0.24em] text-[#88888C] uppercase">
          ACTIVE LINEUP · VERSITY SERIES
        </span>
        <h2 className="mt-2 text-3xl font-extrabold uppercase tracking-tight md:text-5xl text-white">
          THE GARMENTS
        </h2>
        <p className="mt-2 font-mono text-xs tracking-wider text-[#A0A0A5]">
          Two heavyweight silhouettes. Tap to inspect specifications and reserve.
        </p>
      </div>

      {/* Grid of Minimal Trigger Cards */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {XTICH_PIECES.map((piece) => (
          <MorphingDialog
            key={piece.id}
            transition={{
              type: 'spring',
              bounce: 0.05,
              duration: 0.28,
            }}
          >
            {/* Ultra-minimal Trigger Card */}
            <MorphingDialogTrigger
              style={{ borderRadius: '8px' }}
              className="group flex flex-col overflow-hidden border border-white/10 bg-[#0E0E10] transition-all hover:border-white/25 hover:shadow-[0_12px_32px_rgba(0,0,0,0.6)]"
            >
              <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#0A0A0C]">
                <MorphingDialogImage
                  src={piece.image}
                  alt={piece.title}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute top-3 left-3 border border-white/15 bg-black/60 px-2 py-0.5 font-mono text-[10px] tracking-widest text-white backdrop-blur-sm">
                  {piece.tag}
                </span>
                <div className="absolute right-3 bottom-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/80 text-white backdrop-blur-sm transition-transform group-hover:scale-110">
                  <PlusIcon size={14} />
                </div>
              </div>

              <div className="flex items-center justify-between p-4">
                <div>
                  <MorphingDialogTitle className="font-mono text-sm font-semibold tracking-wider text-white uppercase">
                    {piece.title}
                  </MorphingDialogTitle>
                  <MorphingDialogSubtitle className="mt-0.5 font-mono text-xs text-[#88888C]">
                    {piece.subtitle}
                  </MorphingDialogSubtitle>
                </div>
                <span className="font-mono text-[11px] tracking-widest text-white/70 group-hover:text-white">
                  INSPECT →
                </span>
              </div>
            </MorphingDialogTrigger>

            {/* Expanded Morphing Dialog Container */}
            <MorphingDialogContainer>
              <MorphingDialogContent
                style={{ borderRadius: '12px' }}
                className="pointer-events-auto relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-y-auto border border-white/15 bg-[#121214] text-[#FAF8F5] shadow-2xl"
              >
                <div className="relative aspect-video w-full overflow-hidden bg-black">
                  <MorphingDialogImage
                    src={piece.image}
                    alt={piece.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-transparent to-transparent" />
                </div>

                <div className="p-6 md:p-8">
                  <div className="flex items-center justify-between border-b border-white/10 pb-4">
                    <div>
                      <span className="font-mono text-[10px] tracking-widest text-[#88888C]">
                        VERSITY SERIES
                      </span>
                      <MorphingDialogTitle className="mt-1 text-2xl font-bold uppercase tracking-tight text-white">
                        {piece.title}
                      </MorphingDialogTitle>
                      <MorphingDialogSubtitle className="font-mono text-xs text-[#A0A0A5]">
                        {piece.subtitle}
                      </MorphingDialogSubtitle>
                    </div>
                  </div>

                  <MorphingDialogDescription
                    disableLayoutAnimation
                    variants={{
                      initial: { opacity: 0, y: 15 },
                      animate: { opacity: 1, y: 0 },
                      exit: { opacity: 0, y: 15 },
                    }}
                  >
                    <p className="mt-4 text-sm font-light leading-relaxed text-[#D0D0D5]">
                      {piece.desc}
                    </p>

                    {/* Specification Bullets */}
                    <div className="mt-6 border-t border-white/10 pt-4">
                      <span className="font-mono text-[10px] tracking-widest text-[#88888C]">
                        CONSTRUCTION SPECIFICATIONS
                      </span>
                      <ul className="mt-2 space-y-1.5 font-mono text-xs text-[#B5B5BA]">
                        {piece.specs.map((s, idx) => (
                          <li key={idx} className="flex items-center gap-2">
                            <span className="h-1 w-1 rounded-full bg-white/50" />
                            <span>{s}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Size Selector & Reservation */}
                    <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-[#88888C]">
                          SIZE:
                        </span>
                        <div className="flex gap-1.5">
                          {['S', 'M', 'L', 'XL'].map((size) => (
                            <button
                              key={size}
                              type="button"
                              onClick={() =>
                                setSelectedSize((prev) => ({
                                  ...prev,
                                  [piece.id]: size,
                                }))
                              }
                              className={`h-7 w-8 font-mono text-xs transition-colors ${
                                selectedSize[piece.id] === size
                                  ? 'bg-white text-black font-bold'
                                  : 'border border-white/20 text-[#A0A0A5] hover:border-white/50'
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleReserve(piece.id)}
                        className="inline-flex items-center justify-center gap-2 bg-white px-5 py-2.5 font-mono text-xs font-semibold tracking-wider text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {reserved[piece.id] ? (
                          <>
                            <CheckIcon size={14} />
                            RESERVED ({selectedSize[piece.id]})
                          </>
                        ) : (
                          <>RESERVE ALLOCATION →</>
                        )}
                      </button>
                    </div>
                  </MorphingDialogDescription>
                </div>

                <MorphingDialogClose className="top-4 right-4 rounded-full border border-white/20 bg-black/60 p-1.5 text-white backdrop-blur-md transition-colors hover:bg-white hover:text-black" />
              </MorphingDialogContent>
            </MorphingDialogContainer>
          </MorphingDialog>
        ))}
      </div>
    </div>
  );
}

export default XTICHMorphingCollection;
