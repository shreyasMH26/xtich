"use client";

import React from "react";
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
  return (
    <div
      data-xtich-rail
      className={`relative w-full border-y border-white/10 bg-[#090909] text-white py-12 md:py-16 ${className}`}
    >
      <ClothingRailHero
        items={XTICH_RAIL_GARMENTS}
        hanger="matte"
        eyebrow="ATELIER ARCHIVE · THE RAIL EXPERIENCE"
        heading="Inspect The Architecture."
        caption="Slide along the rail to inspect garment drape, turn pieces in real-time, or unhook to examine reverse construction."
        autoplay={autoplay}
        className="bg-transparent text-white"
        action={
          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href="#bespoke"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white px-6 py-2.5 text-xs font-semibold tracking-wider uppercase text-black transition-all hover:bg-neutral-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              Commission Bespoke
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </a>
            <a
              href="#shop"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-2.5 text-xs font-semibold tracking-wider uppercase text-white backdrop-blur-md transition-all hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/40"
            >
              Reserve Batch Piece
            </a>
          </div>
        }
      />
    </div>
  );
}

export default XTICHProductRail;
