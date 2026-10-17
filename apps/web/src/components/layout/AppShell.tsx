'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquare,
  Package,
  TrendingUp,
  FileText,
  Stethoscope,
  Users,
  ShieldCheck,
  CreditCard,
  History,
  Sparkles,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { TenantSelector } from './TenantSelector';
import { api } from '@/lib/api';

const NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/sales-agent', label: 'Sales Agent', icon: MessageSquare },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/channels', label: 'Channel Intelligence', icon: TrendingUp },
  { href: '/listings', label: 'Listings', icon: FileText },
  { href: '/doctor', label: 'Growth Doctor', icon: Stethoscope },
  { href: '/campaigns', label: 'Campaigns', icon: Users },
  { href: '/policies', label: 'Policies & Approvals', icon: ShieldCheck },
  { href: '/orders', label: 'Orders & Payments', icon: CreditCard },
  { href: '/decisions', label: 'Decision Ledger', icon: History },
  { href: '/learning', label: 'Learning Center', icon: Sparkles },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/decisions?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await api.resetDemoData('merch_atlas_travel');
      setResetSuccess(true);
      setTimeout(() => {
        setIsResetModalOpen(false);
        setResetSuccess(false);
        window.location.reload();
      }, 1000);
    } catch (err) {
      alert('Failed to reset demo data: ' + err);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#080808] flex flex-col font-sans overflow-x-hidden max-w-full">
      {/* TopBar */}
      <header className="h-14 border-b border-[#d8d8d8] px-4 sm:px-6 flex items-center justify-between bg-[#ffffff] sticky top-0 z-30 max-w-full">
        {/* Left: Brand + Identity */}
        <div className="flex items-center gap-3 sm:gap-6 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-[#146ef5] flex items-center justify-center text-white font-semibold text-xs tracking-wider">
              MG
            </div>
            <div className="flex items-baseline">
              <span className="font-semibold text-sm tracking-tight text-[#080808] whitespace-nowrap">
                Merchant Growth Agent
              </span>
              <span className="text-[11px] text-[#5a5a5a] ml-2 hidden lg:inline whitespace-nowrap">
                Policy Core: Merchant Policy Agent
              </span>
            </div>
          </div>

          <div className="h-4 w-px bg-[#d8d8d8] hidden sm:block" />

          {/* Merchant Tenant Switcher */}
          <TenantSelector />
        </div>

        {/* Center: Global Search */}
        <div className="hidden md:block flex-1 max-w-md mx-4 lg:mx-8">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-3.5 h-3.5 text-[#5a5a5a] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search trace (opp_..., dec_..., ord_...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#ffffff] border border-[#d8d8d8] rounded-[4px] pl-9 pr-3 py-1.5 text-xs text-[#080808] placeholder-[#bdbdbd] focus:outline-none focus:border-[#146ef5] transition-all font-mono"
            />
          </form>
        </div>

        {/* Right: Runtime Health + Test Mode + Reset Action */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs border border-[#d8d8d8] rounded-[4px] text-[#5a5a5a] hover:text-[#080808] hover:border-[#bdbdbd] transition-colors"
            title="Reset demo data to clean baseline"
          >
            <RotateCcw className="w-3 h-3 text-[#5a5a5a]" />
            <span className="hidden sm:inline font-medium text-[11px]">Reset Demo</span>
          </button>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-[#f0f0f0] border border-[#d8d8d8] text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span className="font-medium text-[#5a5a5a] text-[11px]">ACTIVE</span>
          </div>

          <div className="hidden sm:inline-block px-2 py-0.5 rounded-[4px] border border-[#146ef5]/30 bg-[#eff6ff] text-[#146ef5] text-[11px] font-semibold tracking-wide">
            RAZORPAY TEST MODE
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 min-w-0 max-w-full">
        {/* Sidebar */}
        <aside className="hidden md:flex w-60 border-r border-[#d8d8d8] bg-[#ffffff] p-3 flex-col justify-between shrink-0">
          <nav className="space-y-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 text-xs rounded-[4px] transition-colors ${
                    active
                      ? 'bg-[#146ef5] text-white font-medium'
                      : 'text-[#5a5a5a] hover:bg-[#f0f0f0] hover:text-[#080808]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-[#5a5a5a]'}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* System Footer info */}
          <div className="border-t border-[#d8d8d8] pt-3 px-2 text-[11px] text-[#5a5a5a] space-y-1">
            <div className="flex justify-between font-mono text-[10px]">
              <span>PS21: FINTECH</span>
              <span className="text-[#146ef5]">v0.2.0</span>
            </div>
            <p className="text-[10px] leading-tight text-[#5a5a5a]">
              Zero-leakage paise arithmetic & deterministic margin gates.
            </p>
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="flex-1 min-w-0 bg-[#ffffff] overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Reset Demo Modal */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#d8d8d8] rounded-[8px] max-w-md w-full p-6 space-y-4 shadow-sm">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-sm text-[#080808]">Reset Demo Data</h3>
                <p className="text-xs text-[#5a5a5a] mt-1">
                  This will re-initialize Growth Doctor findings, channel allocations, and sample contacts for merchant{' '}
                  <code className="font-mono text-[#080808]">merch_atlas_travel</code> to their baseline benchmark state.
                </p>
              </div>
            </div>

            {resetSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-[4px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Demo data reset successfully. Reloading view...</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-[#d8d8d8]">
              <button
                onClick={() => setIsResetModalOpen(false)}
                disabled={isResetting}
                className="px-3 py-1.5 text-xs font-medium border border-[#d8d8d8] rounded-[4px] text-[#5a5a5a] hover:bg-[#f0f0f0]"
              >
                Cancel
              </button>
              <button
                onClick={handleResetDemo}
                disabled={isResetting}
                className="px-3 py-1.5 text-xs font-medium bg-[#146ef5] text-white rounded-[4px] hover:bg-[#1366e2]"
              >
                {isResetting ? 'Resetting...' : 'Confirm Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
