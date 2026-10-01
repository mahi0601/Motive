import React from 'react';
import { LogoMark } from './Logo';

// What shows while a code-split page's files download.
const PageFallback = () => (
  <div className="flex min-h-[40vh] items-center justify-center" aria-busy="true">
    <div className="animate-pulse">
      <LogoMark size={40} />
    </div>
  </div>
);

export default PageFallback;
