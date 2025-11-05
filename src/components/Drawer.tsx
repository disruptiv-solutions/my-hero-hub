'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDrawer } from '@/contexts/DrawerContext';

interface DrawerProps {
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({ className = '' }) => {
  const { isDrawerOpen, drawerContent, closeDrawer } = useDrawer();

  if (!isDrawerOpen || !drawerContent) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
        onClick={closeDrawer}
      />
      
      {/* Drawer */}
      <div
        className={`fixed left-64 top-0 right-0 bottom-0 bg-background border-l shadow-lg z-50 transform transition-transform duration-300 ease-in-out ${className}`}
        style={{
          transform: isDrawerOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-6 border-b bg-muted/30">
          <h2 className="text-lg font-semibold">Settings</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeDrawer}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Drawer Content */}
        <div className="p-6 h-full overflow-y-auto">
          {drawerContent}
        </div>
      </div>
    </>
  );
};
