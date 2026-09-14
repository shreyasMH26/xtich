"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { LiquidButton, MetalButton } from "./liquid-glass-button"

/**
 * XTICH Editorial Action Button
 * Combines Liquid Glass with Haute Atelier Tactile Metal finishes
 */
export function XtichAtelierButton({
  children,
  variant = "gold",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "gold" | "bronze" | "glass"
}) {
  if (variant === "glass") {
    return (
      <LiquidButton
        size="xxl"
        className={cn(
          "font-mono uppercase tracking-[0.2em] text-xs text-[#FAF8F5]",
          className
        )}
        {...props}
      >
        {children}
      </LiquidButton>
    )
  }

  return (
    <MetalButton
      variant={variant}
      className={cn(
        "font-mono uppercase tracking-[0.16em] text-xs px-8 h-12",
        className
      )}
      {...props}
    >
      {children}
    </MetalButton>
  )
}

export default XtichAtelierButton
