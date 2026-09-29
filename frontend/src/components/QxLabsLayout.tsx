import React from 'react';
import { QxLabsNavbar } from './QxLabsNavbar';
import { SidebarProvider } from '@/components/ui/sidebar';

export const QxLabsLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="min-h-screen bg-[#fbfbfd] text-zinc-900 flex flex-col font-sans w-full">
        <QxLabsNavbar />
        <main className="flex-1 flex flex-col w-full">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
};
