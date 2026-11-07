"use client";

import React, { useState, useRef } from "react";
import ClothingRailHero, { type RailGarment } from "@/components/ui/product-rail-gallery";

export const XTICH_RAIL_GARMENTS: RailGarment[] = [
  {
    id: "xt-hoodie-obsidian",
    name: "The Heavyweight Hoodie · Obsidian",
    kind: "hoodie",
    color: "#0d0d0c",
    trim: "#1c1b1a",
    tag: "450 GSM",
    description: "450 GSM long-staple brushed fleece in Obsidian Black. Double-layer structured hood without drawstrings, engineered for 300+ days of shape retention.",
    details: ["450 GSM Heavy Fleece", "Drawstring-Free Hood", "Anti-Deform Ribs", "Obsidian Dye"],
  },
  {
    id: "xt-hoodie-bone",
    name: "The Heavyweight Hoodie · Bone",
    kind: "hoodie",
    color: "#E8E4DC",
    trim: "#D5D0C6",
    tag: "450 GSM",
    description: "Natural unbleached dense fleece with tonal embroidery. Pre-shrunk to prevent post-wash shrinkage across 180+ cycles.",
    details: ["Unbleached Cotton", "450 GSM Fleece", "Tonal Embroidery", "Preshrunk Warp"],
  },
  {
    id: "xt-hoodie-stone",
    name: "The Heavyweight Hoodie · Mineral Stone",
    kind: "hoodie",
    color: "#A7A39B",
    trim: "#8E8A82",
    tag: "450 GSM",
    description: "Garment-dyed mineral stone with matte tactile fleece. Ergonomic drop-shoulder drape designed for high-movement daily wear.",
    details: ["Garment Dyed", "Drop Shoulder Cut", "Tensile Poly Blend", "180+ Wash Rating"],
  },
  {
    id: "xt-hoodie-graphite",
    name: "The Heavyweight Hoodie · Graphite",
    kind: "hoodie",
    color: "#30302e",
    trim: "#20201e",
    tag: "450 GSM",
    description: "Industrial graphite slate fleece. Reinforced twin-needle seams, double-welt kangaroo pocket, and high-density wrist ribbing.",
    details: ["Industrial Slate", "Twin-Needle Seams", "Bar-Tack Reinforced", "High-Density Ribs"],
  },
  {
    id: "xt-hoodie-navy",
    name: "The Heavyweight Hoodie · Deep Navy",
    kind: "hoodie",
    color: "#0F172A",
    trim: "#1E293B",
    tag: "450 GSM",
    description: "Midnight deep navy pigment. Dense brushed fleece lining designed for thermal insulation without added bulk.",
    details: ["Midnight Pigment", "Thermal Fleece", "Structured Silhouette", "Zero-Pill Finish"],
  },
  {
    id: "xt-versity-crewneck",
    name: "The Versity Crewneck · Obsidian",
    kind: "knit",
    color: "#141414",
    trim: "#222222",
    tag: "420 GSM",
    description: "Ergonomic drop-shoulder silhouette tailored for movement. Heavy bound collar that retains its crisp circumference forever.",
    details: ["420 GSM French Terry", "Non-Sag Bound Collar", "Underarm Gusset", "Minimal Back Label"],
  },
  {
    id: "xt-standard-tee",
    name: "The Atelier Heavyweight Tee · Raw Black",
    kind: "tee",
    color: "#181818",
    trim: "#242424",
    tag: "260 GSM",
    description: "Substantial single-jersey heavyweight tee. Clean architectural shoulder drop with blind-stitched hem finish.",
    details: ["260 GSM Combed Cotton", "Blind-Stitched Hem", "Non-Roll Neckband", "Preshrunk Fit"],
  },
  {
    id: "xt-atelier-overcoat",
    name: "The Atelier Overcoat · Architectural Study",
    kind: "coat",
    color: "#121210",
    trim: "#1C1B19",
    tag: "BESPOKE",
    description: "Handcrafted outer silhouette prototyped with Delhi tailors. Deep unstructured drop shoulders and raw unlined interior seam binding.",
    details: ["Atelier Prototype", "Unstructured Lapel", "Raw Seam Binding", "Heavyweight Wool"],
  },
];

export interface XTICHProductRailProps {
  className?: string;
  autoplay?: boolean;
}

export function XTICHProductRail({ className = "", autoplay = true }: XTICHProductRailProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [spotlight, setSpotlight] = useState({ x: 50, y: 25, active: false });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setSpotlight({ x, y, active: true });
  };

  const handleMouseLeave = () => {
    setSpotlight((prev) => ({ ...prev, active: false }));
  };

  return (
    <div
      ref={containerRef}
      data-xtich-rail
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full overflow-hidden border-y border-white/15 bg-[#050505] text-white py-14 md:py-20 select-none ${className}`}
    >
      {/* ─────────────────────────────────────────────────────────────
          LAYER 1: Architectural Blueprint Drafting Grid & Laser Coordinates
          ───────────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(to right, rgba(255, 255, 255, 0.09) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.09) 1px, transparent 1px)
          `,
          backgroundSize: "24px 24px, 24px 24px, 120px 120px, 120px 120px",
          backgroundPosition: "-1px -1px",
        }}
      />

      {/* ─────────────────────────────────────────────────────────────
          LAYER 2: Precision Intersection Crosshairs (+)
          ───────────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-25"
        style={{
          backgroundImage: `radial-gradient(circle 1.5px at center, rgba(255, 255, 255, 0.8) 100%, transparent 100%)`,
          backgroundSize: "120px 120px",
          backgroundPosition: "0 0",
        }}
      />

      {/* ─────────────────────────────────────────────────────────────
          LAYER 3: Interactive Gallery Spotlight & Overhead Tungsten Beam
          ───────────────────────────────────────────────────────────── */}
      {/* Permanent overhead soft gallery floodlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-1000"
        style={{
          background: `
            radial-gradient(ellipse 95% 45% at 50% 0%, rgba(255, 250, 235, 0.12) 0%, rgba(220, 210, 195, 0.04) 45%, transparent 75%),
            radial-gradient(ellipse 70% 30% at 50% 35%, rgba(255, 255, 255, 0.06) 0%, transparent 70%)
          `,
        }}
      />

      {/* Dynamic interactive spotlight tracking visitor cursor */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-0 transition-opacity duration-500 ${
          spotlight.active ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background: `radial-gradient(circle 420px at ${spotlight.x}% ${spotlight.y}%, rgba(255, 252, 242, 0.14) 0%, rgba(215, 205, 185, 0.05) 50%, transparent 80%)`,
        }}
      />

      {/* ─────────────────────────────────────────────────────────────
          LAYER 4: Studio Horizon Backlit Halo behind the rail bar
          ───────────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 z-0 top-[28%] md:top-[26%] h-[70px] -translate-y-1/2 blur-2xl opacity-60"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 15%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.04) 85%, transparent 100%)",
        }}
      />

      {/* ─────────────────────────────────────────────────────────────
          LAYER 5: Perspective Atelier Floor & Contact Shadows
          ───────────────────────────────────────────────────────────── */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[38%] opacity-80"
        style={{
          background: `
            linear-gradient(to bottom, transparent 0%, rgba(10, 10, 10, 0.4) 40%, rgba(0, 0, 0, 0.95) 100%),
            radial-gradient(ellipse 90% 40% at 50% 85%, rgba(0, 0, 0, 0.95) 0%, transparent 80%)
          `,
        }}
      />

      {/* Perspective floor grid line */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[14%] z-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-[6%] z-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"
      />

      {/* ─────────────────────────────────────────────────────────────
          LAYER 6: Technical Calibration Badges & Corner Framing
          ───────────────────────────────────────────────────────────── */}
      {/* Top Left Technical Tag */}
      <div className="pointer-events-none absolute top-4 left-4 md:top-6 md:left-8 z-10 hidden sm:flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.25em] text-white/45">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/80 animate-pulse" />
        <span>RIG // XTICH-ARCHIVE-01</span>
        <span className="text-white/20">|</span>
        <span>ELEVATION: +1850MM</span>
      </div>

      {/* Top Right Technical Tag */}
      <div className="pointer-events-none absolute top-4 right-4 md:top-6 md:right-8 z-10 hidden sm:flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.25em] text-white/45">
        <span>3D CLOTH PHYSICS: ACTIVE</span>
        <span className="text-white/20">|</span>
        <span>SCALE: 1:1 ATELIER SPEC</span>
      </div>

      {/* Bottom Left Fabrication Tag */}
      <div className="pointer-events-none absolute bottom-4 left-4 md:bottom-6 md:left-8 z-10 hidden md:flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">
        <span>COORDINATES [28°38'N 77°13'E]</span>
        <span className="text-white/20">·</span>
        <span>DELHI ATELIER PRODUCTION</span>
      </div>

      {/* Bottom Right Interaction Hint */}
      <div className="pointer-events-none absolute bottom-4 right-4 md:bottom-6 md:right-8 z-10 hidden md:flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/35">
        <span>INTERACTION: SLIDE &amp; UNHOOK</span>
        <span className="text-white/20">·</span>
        <span>360° ROTATION</span>
      </div>

      {/* Hairline Corner Brackets */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-3 left-3 h-3 w-3 border-t border-l border-white/30"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-3 right-3 h-3 w-3 border-t border-r border-white/30"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-3 left-3 h-3 w-3 border-b border-l border-white/30"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-3 right-3 h-3 w-3 border-b border-r border-white/30"
      />

      {/* ─────────────────────────────────────────────────────────────
          CORE CONTENT: Clothing Rail Engine
          ───────────────────────────────────────────────────────────── */}
      <div className="relative z-10">
        <ClothingRailHero
          items={XTICH_RAIL_GARMENTS}
          hanger="matte"
          eyebrow="ATELIER ARCHIVE · THE RAIL EXPERIENCE"
          heading="Inspect The Architecture."
          caption="Slide along the rail to inspect garment drape, turn pieces in real-time, or unhook to examine reverse construction."
          autoplay={autoplay}
          className="bg-transparent text-white"
          action={
            <div className="flex flex-wrap items-center justify-center gap-3 mt-1">
              <a
                href="#bespoke"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-6 py-2.5 text-xs font-semibold tracking-wider uppercase text-black transition-all hover:bg-neutral-200 hover:shadow-[0_0_24px_rgba(255,255,255,0.25)] focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                Commission Bespoke
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </a>
              <a
                href="#shop"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-xs font-semibold tracking-wider uppercase text-white backdrop-blur-md transition-all hover:bg-white/10 hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
              >
                Reserve Batch Piece
              </a>
            </div>
          }
        />
      </div>
    </div>
  );
}

export default XTICHProductRail;
