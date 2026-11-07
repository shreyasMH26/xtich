import './tailwind.css';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { XTICHProductRail } from '@/components/ui/xtich-product-rail';

function mountRail() {
  const container = document.getElementById('xtich-product-rail-root');
  if (container && !container.dataset.mounted) {
    container.dataset.mounted = 'true';
    const root = createRoot(container);
    root.render(React.createElement(XTICHProductRail));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountRail);
} else {
  mountRail();
}
