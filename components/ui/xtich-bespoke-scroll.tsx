"use client";
import React, { useState } from "react";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";

export interface HoodieColor {
  id: string;
  name: string;
  code: string;
  hex: string;
  frontImg: string;
  backImg: string;
}

const HOODIE_COLORS: HoodieColor[] = [
  {
    id: "obsidian",
    name: "Obsidian",
    code: "01 / OBSIDIAN",
    hex: "#0A0A0A",
    frontImg: "assets/hoodie-obsidian-front.png",
    backImg: "assets/hoodie-obsidian-back.png",
  },
  {
    id: "bone",
    name: "Bone",
    code: "02 / BONE",
    hex: "#E8E4DC",
    frontImg: "assets/hoodie-bone-front.png",
    backImg: "assets/hoodie-bone-back.png",
  },
  {
    id: "stone",
    name: "Stone",
    code: "03 / STONE",
    hex: "#A7A39B",
    frontImg: "assets/hoodie-stone-front.png",
    backImg: "assets/hoodie-stone-back.png",
  },
  {
    id: "graphite",
    name: "Graphite",
    code: "04 / GRAPHITE",
    hex: "#343434",
    frontImg: "assets/hoodie-graphite-front.png",
    backImg: "assets/hoodie-graphite-back.png",
  },
  {
    id: "deep-navy",
    name: "Deep Navy",
    code: "05 / DEEP NAVY",
    hex: "#111923",
    frontImg: "assets/hoodie-deep-navy-front.png",
    backImg: "assets/hoodie-deep-navy-back.png",
  },
];

export function XTICHBespokeScroll() {
  const [activeColor, setActiveColor] = useState<HoodieColor>(HOODIE_COLORS[0]);
  const [viewMode, setViewMode] = useState<"front" | "back">("front");
  const [markText, setMarkText] = useState("XTICH");

  return (
    <div className="flex flex-col bg-[#060607] text-[#FAF8F5] overflow-hidden py-12 md:py-24">
      <ContainerScroll
        titleComponent={
          <div className="flex flex-col items-center justify-center space-y-4 px-4 pb-6">
            <span className="inline-block border border-white/20 bg-white/5 px-3 py-1 font-mono text-xs tracking-[0.24em] text-white/70 uppercase">
              XTICH / BESPOKE EDITION
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-6xl text-white uppercase">
              A PIECE THAT EXISTS ONCE.
            </h1>
            <p className="max-w-xl text-sm font-light tracking-wide text-[#9E9E9E] md:text-base">
              Your idea. Our craft. Made for you.
            </p>
          </div>
        }
      >
        <div className="relative flex h-full w-full flex-col justify-between rounded-xl bg-[#0F0F11] p-4 md:p-8 text-[#FAF8F5] border border-white/10 shadow-2xl">
          {/* Top Status Bar */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3 font-mono text-[10px] md:text-xs tracking-widest text-[#88888C]">
            <span>COMMISSION · 01 / 01</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setViewMode("front")}
                className={`px-2 py-0.5 transition-colors ${
                  viewMode === "front"
                    ? "bg-white text-black font-semibold"
                    : "text-[#88888C] hover:text-white"
                }`}
              >
                FRONT
              </button>
              <span>/</span>
              <button
                type="button"
                onClick={() => setViewMode("back")}
                className={`px-2 py-0.5 transition-colors ${
                  viewMode === "back"
                    ? "bg-white text-black font-semibold"
                    : "text-[#88888C] hover:text-white"
                }`}
              >
                BACK
              </button>
            </div>
          </div>

          {/* Center Stage: Hoodie & Dynamic Mark */}
          <div className="relative my-auto flex items-center justify-center py-4">
            <div className="relative w-64 md:w-80 aspect-square flex items-center justify-center">
              <img
                src={viewMode === "front" ? activeColor.frontImg : activeColor.backImg}
                alt={`XTICH Bespoke Hoodie - ${activeColor.name}`}
                className="max-h-full max-w-full object-contain transition-opacity duration-300 drop-shadow-[0_20px_40px_rgba(0,0,0,0.8)]"
              />

              {/* Dynamic Embroidery Overlay */}
              <div
                className={`absolute ${
                  viewMode === "front"
                    ? "top-[36%] left-[54%]"
                    : "top-[40%] left-1/2 -translate-x-1/2"
                } border border-white/30 bg-black/60 px-2 py-0.5 font-mono text-[10px] tracking-widest text-white backdrop-blur-sm pointer-events-none`}
              >
                {markText}
              </div>
            </div>
          </div>

          {/* Bottom Controls Bar: Clear & Minimal */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-white/10 pt-4 items-center">
            {/* Swatches */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] tracking-widest text-[#777]">
                COLOR
              </span>
              <div className="flex items-center gap-1.5">
                {HOODIE_COLORS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveColor(c)}
                    aria-label={c.name}
                    className={`h-5 w-5 rounded-full border transition-all ${
                      activeColor.id === c.id
                        ? "border-white scale-110 ring-2 ring-white/30"
                        : "border-white/20 opacity-70 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Spec */}
            <div className="text-center font-mono text-[11px] text-[#A0A0A5]">
              450 GSM HEAVY FLEECE · {activeColor.name.toUpperCase()}
            </div>

            {/* Action */}
            <div className="flex justify-end">
              <a
                href="#bespoke"
                className="inline-flex items-center gap-2 bg-white px-4 py-2 font-mono text-xs font-semibold tracking-wider text-black transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                COMMISSION YOUR PIECE →
              </a>
            </div>
          </div>
        </div>
      </ContainerScroll>
    </div>
  );
}

export default XTICHBespokeScroll;
