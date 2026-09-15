'use client';

import React from 'react';
import TextMarquee from './text-marque';
import { cn } from '@/lib/utils';

/**
 * All 20 XTICH Brand Manifesto Statements
 */
export const XTICH_BRAND_STATEMENTS = [
  'EXISTS ONCE. BUILT TO LAST.',
  'MADE WITH INTENT. BUILT TO LAST.',
  'BUILT WITH PURPOSE. WORN WITH INTENT.',
  'MADE TO EXIST. BUILT TO ENDURE.',
  'BUILT DIFFERENT. MADE TO LAST.',
  'FORMED WITH INTENT. BUILT FOR TIME.',
  'MADE FOR NOW. BUILT FOR ALWAYS.',
  'CUT WITH PURPOSE. BUILT TO LAST.',
  'BUILT FROM SCRATCH. MADE TO ENDURE.',
  'BORN FROM FRICTION. BUILT WITH PURPOSE.',
  'MADE SLOW. WORN OFTEN.',
  'BUILT HEAVY. MADE TO ENDURE.',
  'NO SHORTCUTS. ONLY CRAFT.',
  'LESS NOISE. MORE INTENT.',
  'FORM. FUNCTION. ENDURANCE.',
  'BUILT FOR BUILDERS. MADE TO ENDURE.',
  'WEAR THE WORK. CARRY THE CRAFT.',
  'THE EVERYDAY. RECONSIDERED.',
  'ORDINARY FORM. UNCOMMON INTENT.',
  'NOT MORE. JUST BETTER.',
] as const;

/**
 * Continuous horizontal sequence separated by restrained bullet •
 */
export const XTICH_MANIFESTO_SEQUENCE =
  XTICH_BRAND_STATEMENTS.join('  •  ') + '  •  ';

export interface XtichTextMarqueeProps {
  baseVelocity?: number;
  scrollDependent?: boolean;
  className?: string;
  textClassName?: string;
}

/**
 * XTICH Brand Manifesto Kinetic Marquee
 * Continuous, oversized horizontal manifesto moving seamlessly through the page.
 * Pure monochrome, heavy, architectural typography without decorative borders, cards, or colors.
 */
export function XtichTextMarquee({
  baseVelocity = -2.5,
  scrollDependent = true,
  className = '',
  textClassName = '',
}: XtichTextMarqueeProps) {
  return (
    <section
      className={cn(
        'relative flex w-full max-w-[100vw] overflow-hidden bg-[#050504] py-12 md:py-20 select-none contain-paint',
        className
      )}
      aria-label="XTICH Brand Manifesto"
    >
      <TextMarquee
        baseVelocity={baseVelocity}
        scrollDependent={scrollDependent}
        clasname={cn(
          'font-display font-extrabold uppercase tracking-[0.16em] text-[#FAF8F5] text-[6vw] md:text-[4.5vw] leading-none whitespace-nowrap',
          textClassName
        )}
      >
        {XTICH_MANIFESTO_SEQUENCE}
      </TextMarquee>
    </section>
  );
}

export default XtichTextMarquee;
