import React from 'react';
import Component from '@/components/ui/text-marque';
import { XTICH_MANIFESTO_SEQUENCE } from '@/components/ui/xtich-text-marque';

function ComponentDemo() {
  return (
    <div className="flex min-h-[500px] w-full flex-col justify-center bg-[#050504] py-16 text-[#FAF8F5]">
      <Component
        delay={200}
        baseVelocity={-2.5}
        scrollDependent={true}
        clasname="font-extrabold uppercase tracking-[0.16em] text-[#FAF8F5] text-[5vw]"
      >
        {XTICH_MANIFESTO_SEQUENCE}
      </Component>
    </div>
  );
}

export { ComponentDemo as DemoOne };
export default ComponentDemo;
