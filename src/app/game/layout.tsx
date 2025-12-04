/**
 * @fileoverview Game Layout - Main Navigation Shell
 * @module app/game/layout
 * 
 * OVERVIEW:
 * Authenticated game shell with sidebar navigation and header.
 * Wraps all /game/* routes with consistent navigation.
 * 
 * @created 2025-11-20
 * @updated 2025-11-21 - Added proper signOut functionality
 * @author ECHO v1.1.0
 */

'use client';

import { Button } from '@heroui/react';
import { useRouter, usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ReactNode, useState } from 'react';

interface GameLayoutProps {
  children: ReactNode;
}

const navItems = [
  { 
    label: 'Dashboard', 
    href: '/game',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    )
  },
  { 
    label: 'Profile', 
    href: '/game/player',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    )
  },
  { 
    label: 'Companies', 
    href: '/game/companies',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    )
  },
  { 
    label: 'Employees', 
    href: '/game/employees',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  { 
    label: 'Contracts', 
    href: '/game/contracts/marketplace',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  },
  { 
    label: 'Market', 
    href: '/game/market',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      </svg>
    )
  },
  { 
    label: 'Politics', 
    href: '/game/politics',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
      </svg>
    )
  },
  { 
    label: 'Map', 
    href: '/game/map',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
      </svg>
    )
  },
];

function Sidebar({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} h-screen bg-gradient-to-b from-slate-900 to-slate-950 border-r border-white/10 flex flex-col gap-2 p-4 sticky top-0 transition-all duration-300`}>
      <div className="mb-6 px-2 flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
              TheSimGov
            </h1>
            <p className="text-xs text-slate-400 mt-1">Build your government simulation</p>
          </div>
        )}
        <button
          onClick={onToggle}
          className="p-2 rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-all duration-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isCollapsed ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            )}
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant={pathname === item.href ? 'flat' : 'light'}
            color={pathname === item.href ? 'primary' : 'default'}
            className={`${isCollapsed ? 'justify-center px-0 min-w-0' : 'justify-start'} transition-all duration-300 ${
              pathname === item.href 
                ? 'bg-blue-500/20 border border-blue-500/30 font-semibold text-white shadow-lg shadow-blue-500/10' 
                : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
            }`}
            onPress={() => router.push(item.href)}
            startContent={!isCollapsed ? item.icon : undefined}
            isIconOnly={isCollapsed}
          >
            {isCollapsed ? item.icon : item.label}
          </Button>
        ))}
      </div>

      <div className="flex-1" />

      <Button
        variant="flat"
        className={`w-full bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30 transition-all duration-300 ${isCollapsed ? 'justify-center px-0 min-w-0' : ''}`}
        onPress={() => signOut({ callbackUrl: '/login' })}
        startContent={!isCollapsed ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        ) : undefined}
        isIconOnly={isCollapsed}
      >
        {isCollapsed ? (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        ) : 'Sign Out'}
      </Button>
    </div>
  );
}

export default function GameLayout({ children }: GameLayoutProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)} />
      </div>

      {/* Mobile Drawer - simplified without HeroUI Drawer (not available) */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden" onClick={() => setIsDrawerOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="absolute left-0 top-0 h-full w-64">
            <Sidebar isCollapsed={false} onToggle={() => {}} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 bg-background">
        {/* Mobile Header */}
        <div className="flex md:hidden bg-slate-900/80 backdrop-blur-xl border-b border-white/10 p-4 justify-between items-center">
          <button
            onClick={() => setIsDrawerOpen(true)}
            className="text-white text-2xl hover:text-blue-400 transition-colors"
          >
            ☰
          </button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
            TheSimGov
          </h1>
          <div className="w-10" />
        </div>

        {children}
      </div>
    </div>
  );
}

/**
 * IMPLEMENTATION NOTES:
 * 
 * 1. **Sticky Sidebar**: Desktop navigation always visible
 * 2. **Mobile Drawer**: Responsive hamburger menu
 * 3. **Active State**: Highlight current page
 * 4. **Consistent Shell**: All game routes wrapped with nav
 */
