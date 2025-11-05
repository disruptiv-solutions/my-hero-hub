'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { ImageSessionDrawer } from './ImageSessionDrawer';

export const GlobalDrawerContainer: React.FC = () => {
  const pathname = usePathname();
  
  // Only show the ImageSessionDrawer on the generate page and session pages
  if (pathname === '/generate' || pathname?.startsWith('/generate/')) {
    return (
      <div className="fixed right-0 top-16 bottom-0 w-[220px] z-20">
        <ImageSessionDrawer />
      </div>
    );
  }
  
  return null;
};
