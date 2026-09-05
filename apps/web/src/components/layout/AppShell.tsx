'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Cpu,
  ShieldCheck,
  FlaskConical,
  Sparkles,
  History,
  Search,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { TenantSelector } from './TenantSelector';

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/decisions', label: 'AI Decisions', icon: Cpu },
  { href: '/policies', label: 'Policies', icon: ShieldCheck },
  { href: '/experiments', label: 'Experiments', icon: FlaskConical },
  { href: '/learning', label: 'Learning', icon: Sparkles },
  { href: '/activity', label: 'Activity', icon: History },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/activity?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#061b31] flex flex-col font-sans overflow-x-hidden max-w-full">
      {/* TopBar */}
      <header className="h-14 border-b border-[#e5edf5] px-4 sm:px-6 flex items-center justify-between bg-[#ffffff] sticky top-0 z-30 max-w-full">
        {/* Left: Brand + Identity */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded bg-[#533afd] flex items-center justify-center text-white font-medium text-xs tracking-wider">
              RZ
            </div>
            <div className="flex items-baseline">
              <span className="font-medium text-sm tracking-tight text-[#061b31] whitespace-nowrap">Merchant AI</span>
              <span className="text-xs text-[#64748d] ml-1.5 font-light hidden sm:inline whitespace-nowrap">Control Center</span>
            </div>
          </div>

          <div className="h-4 w-px bg-[#e5edf5] hidden sm:block" />

          {/* Merchant Tenant Switcher */}
          <TenantSelector />
        </div>

        {/* Center: Global Search */}
        <div className="hidden md:block flex-1 max-w-md mx-4 lg:mx-8">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-3.5 h-3.5 text-[#839bc8] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search trace or ID (opp_..., dec_..., ord_..., out_...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#f8fafd] border border-[#e5edf5] rounded pl-9 pr-3 py-1.5 text-xs text-[#061b31] placeholder-[#839bc8] focus:outline-none focus:border-[#533afd] focus:bg-white transition-all font-mono"
            />
          </form>
        </div>

        {/* Right: Runtime Health + Test Mode */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f8fafd] border border-[#e5edf5] text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-normal text-[#50617a] text-[11px] tracking-wide">HEALTHY</span>
          </div>

          <div className="hidden sm:inline-block px-2.5 py-0.5 rounded-full border border-[#b9b9f9] bg-[#e8e9ff] text-[#533afd] text-[11px] font-medium tracking-wide">
            TEST MODE
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 min-w-0 max-w-full">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 border-r border-[#e5edf5] bg-[#ffffff] p-3 flex-col justify-between shrink-0">
          <nav className="space-y-0.5">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-xs rounded transition-colors ${
                    active
                      ? 'bg-[#f8fafd] text-[#533afd] font-medium border-l-2 border-[#533afd] -ml-px pl-[11px]'
                      : 'text-[#50617a] hover:text-[#061b31] hover:bg-[#f8fafd]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-[#533afd]' : 'text-[#64748d]'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-[#e5edf5] text-[11px] text-[#64748d] px-2 space-y-1 font-light">
            <div className="font-mono text-[10px]">Track 01 | Razorpay AI 2026</div>
            <div className="text-[10px] text-[#839bc8]">Backend Authoritative v1.0</div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 bg-[#ffffff] overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
