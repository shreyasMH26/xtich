import { LiquidButton, MetalButton } from "@/components/ui/liquid-glass-button";

export default function DemoOne() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-12 bg-neutral-950 p-8 text-white">
      {/* Liquid Glass Showcase */}
      <div className="flex flex-col items-center gap-4">
        <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
          Liquid Glass Button
        </h2>
        <div className="relative flex h-[180px] w-full max-w-[420px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
          <LiquidButton size="xxl">
            Liquid Glass
          </LiquidButton>
        </div>
      </div>

      {/* Tactile Metal Buttons (Atelier Variants) */}
      <div className="flex flex-col items-center gap-6">
        <h2 className="font-mono text-xs uppercase tracking-[0.25em] text-neutral-400">
          Tactile Metal Buttons (Haute Atelier Finishes)
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          <MetalButton variant="default">Obsidian</MetalButton>
          <MetalButton variant="gold">Champagne</MetalButton>
          <MetalButton variant="bronze">Bronze Weave</MetalButton>
          <MetalButton variant="primary">Deep Navy</MetalButton>
          <MetalButton variant="success">Emerald</MetalButton>
          <MetalButton variant="error">Crimson</MetalButton>
        </div>
      </div>
    </div>
  );
}
