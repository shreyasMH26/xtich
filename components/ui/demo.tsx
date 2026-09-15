import React from 'react';
import Component from '@/components/ui/text-marque';

function ComponentDemo() {
  return (
    <>
      <div className='h-[500px] grid place-content-center'>
        <Component
          delay={500}
          baseVelocity={-3}
          clasname='font-bold tracking-[-0.07em] leading-[90%]'
        >
          Star the repo if you like it
        </Component>
        <Component
          delay={500}
          baseVelocity={3}
          clasname='font-bold tracking-[-0.07em] leading-[90%]'
        >
          Share it if you like it
        </Component>
      </div>
    </>
  );
}

export { ComponentDemo as DemoOne };
export default ComponentDemo;
