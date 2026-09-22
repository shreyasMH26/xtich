import React from 'react';
import { XTICHMorphingCollection } from '@/components/ui/xtich-morphing-dialog';
import { MorphingDialogBasicOne } from '@/components/ui/morphing-dialog-demo';
import { XTICHBespokeScroll } from '@/components/ui/xtich-bespoke-scroll';
import { XTICHHero } from '@/components/ui/xtich-cinematic-hero';

function ComponentDemo() {
  return (
    <div className="flex flex-col w-full min-h-screen bg-black">
      <XTICHHero />
      <XTICHBespokeScroll />
      <XTICHMorphingCollection />
    </div>
  );
}

export {
  ComponentDemo as DemoOne,
  MorphingDialogBasicOne,
  XTICHMorphingCollection,
  XTICHBespokeScroll,
  XTICHHero,
};
export default ComponentDemo;

