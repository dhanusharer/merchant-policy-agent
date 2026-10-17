'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Stethoscope,
  Grid,
  TrendingUp,
  FileText,
  Users,
  MessageSquare,
  ShieldCheck,
  CreditCard,
  History,
  Sparkles,
  X,
  AlertTriangle,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import { api } from '@/lib/api';

// 4 Primary Bottom Navigation Tabs (Instagram style)
const BOTTOM_NAV_ITEMS = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/products', label: 'Products', icon: Package },
  { href: '/doctor', label: 'Growth Doctor', icon: Stethoscope },
];

// Remaining features accessible via "More" / "Others" drawer
const MORE_FEATURES = [
  {
    href: '/channels',
    label: 'Channel Intelligence',
    icon: TrendingUp,
    description: 'Amazon, WhatsApp & Blinkit margin metrics',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200'
  },
  {
    href: '/listings',
    label: 'Listings',
    icon: FileText,
    description: 'Multi-channel catalog & inventory sync',
    color: 'bg-blue-50 text-blue-600 border-blue-200'
  },
  {
    href: '/campaigns',
    label: 'Campaigns',
    icon: Users,
    description: 'Automated WhatsApp promo & discount blasts',
    color: 'bg-purple-50 text-purple-600 border-purple-200'
  },
  {
    href: '/whatsapp',
    label: 'WhatsApp Live Agent',
    icon: MessageSquare,
    description: 'Meta Business Platform, phone simulator & webhook audits',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-200'
  },
  {
    href: '/sales-agent',
    label: 'Sales Agent',
    icon: MessageSquare,
    description: 'Autonomous customer chat negotiations',
    color: 'bg-amber-50 text-amber-600 border-amber-200'
  },
  {
    href: '/policies',
    label: 'Policies & Approvals',
    icon: ShieldCheck,
    description: 'Margin protection & autonomous governance rules',
    color: 'bg-rose-50 text-rose-600 border-rose-200'
  },
  {
    href: '/orders',
    label: 'Orders & Payments',
    icon: CreditCard,
    description: 'Customer checkouts & verified payment receipts',
    color: 'bg-indigo-50 text-indigo-600 border-indigo-200'
  },
  {
    href: '/decisions',
    label: 'Decision Ledger',
    icon: History,
    description: 'Auditable traces of agent actions & auto-orders',
    color: 'bg-teal-50 text-teal-600 border-teal-200'
  },
  {
    href: '/learning',
    label: 'Learning Center',
    icon: Sparkles,
    description: 'Merchant AI memory, benchmarks & feedback loops',
    color: 'bg-orange-50 text-orange-600 border-orange-200'
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const handleResetDemo = async () => {
    setIsResetting(true);
    try {
      await api.resetDemoData('merch_atlas_travel');
      setResetSuccess(true);
      setTimeout(() => {
        setIsResetModalOpen(false);
        setResetSuccess(false);
        setIsMoreOpen(false);
        window.location.reload();
      }, 1000);
    } catch (err) {
      alert('Failed to reset demo data: ' + err);
    } finally {
      setIsResetting(false);
    }
  };

  // Determine if active route is inside the "More" drawer
  const isMoreActive = MORE_FEATURES.some(
    (item) => pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
  );

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#080808] flex flex-col font-sans overflow-x-hidden max-w-full">
      {/* Content Viewport with bottom padding for mobile bar */}
      <main className="flex-1 min-w-0 bg-[#fafafa] pb-24 md:pb-20">
        {children}
      </main>

      {/* ============================================================== */}
      {/* INSTAGRAM-STYLE BOTTOM NAVIGATION (4 ITEMS)                    */}
      {/* 1: Overview | 2: Products | 3: Growth Doctor | 4: More/Others  */}
      {/* ============================================================== */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#e4e4e7] px-2 py-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
        <div className="max-w-md mx-auto grid grid-cols-4 items-center">
          
          {/* Tab 1: Overview */}
          <Link
            href="/"
            onClick={() => setIsMoreOpen(false)}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-all ${
              pathname === '/'
                ? 'text-[#080808] font-bold scale-105'
                : 'text-[#71717a] hover:text-[#080808] font-medium'
            }`}
          >
            <div className={`p-1 rounded-full ${pathname === '/' ? 'bg-[#080808] text-white shadow-xs' : ''}`}>
              <LayoutDashboard className="w-4 h-4" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Overview</span>
          </Link>

          {/* Tab 2: Products */}
          <Link
            href="/products"
            onClick={() => setIsMoreOpen(false)}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-all ${
              pathname.startsWith('/products')
                ? 'text-[#080808] font-bold scale-105'
                : 'text-[#71717a] hover:text-[#080808] font-medium'
            }`}
          >
            <div className={`p-1 rounded-full ${pathname.startsWith('/products') ? 'bg-[#080808] text-white shadow-xs' : ''}`}>
              <Package className="w-4 h-4" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Products</span>
          </Link>

          {/* Tab 3: Growth Doctor */}
          <Link
            href="/doctor"
            onClick={() => setIsMoreOpen(false)}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-all ${
              pathname.startsWith('/doctor')
                ? 'text-[#080808] font-bold scale-105'
                : 'text-[#71717a] hover:text-[#080808] font-medium'
            }`}
          >
            <div className={`p-1 rounded-full ${pathname.startsWith('/doctor') ? 'bg-[#080808] text-white shadow-xs' : ''}`}>
              <Stethoscope className="w-4 h-4" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Doctor</span>
          </Link>

          {/* Tab 4: More / Others (Opens Remaining Features Drawer) */}
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={`flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-all ${
              isMoreOpen || isMoreActive
                ? 'text-[#080808] font-bold scale-105'
                : 'text-[#71717a] hover:text-[#080808] font-medium'
            }`}
          >
            <div className={`p-1 rounded-full ${isMoreOpen || isMoreActive ? 'bg-[#080808] text-white shadow-xs' : ''}`}>
              <Grid className="w-4 h-4" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5">Others</span>
          </button>

        </div>
      </nav>

      {/* ============================================================== */}
      {/* "OTHERS / MORE" BOTTOM SHEET MODAL (SLIDE-UP DRAWER)           */}
      {/* Channels, Listings, Campaigns, Sales Agent, Policies, Orders   */}
      {/* ============================================================== */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setIsMoreOpen(false)}
          />

          {/* Sheet Container */}
          <div className="relative bg-white rounded-t-2xl max-w-lg w-full mx-auto p-4 sm:p-5 shadow-2xl border-t border-[#e4e4e7] z-10 max-h-[85vh] overflow-y-auto animate-slide-up space-y-4">
            
            {/* Top Drag Handle */}
            <div className="w-10 h-1 bg-[#d4d4d8] rounded-full mx-auto" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#f4f4f5]">
              <div className="flex items-center gap-3">
                <img
                  src="/vyapar_mitra_logo.png"
                  alt="Vyapar Mitra"
                  className="h-8 w-auto object-contain"
                />
                <div className="h-5 w-[1px] bg-[#e4e4e7]" />
                <div>
                  <h3 className="text-sm font-bold text-[#080808] tracking-tight">
                    Merchant Operations Suite
                  </h3>
                  <p className="text-[11px] text-[#71717a]">
                    Channels, campaigns, policies, and ledger
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-full hover:bg-[#f4f4f5] text-[#71717a] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Features List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {MORE_FEATURES.map((item) => {
                const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMoreOpen(false)}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                      active
                        ? 'border-[#080808] bg-[#f4f4f5] shadow-xs'
                        : 'border-[#e4e4e7] bg-white hover:border-[#a1a1aa] hover:bg-[#fafafa]'
                    }`}
                  >
                    <div className={`p-2 rounded-lg border ${item.color} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold truncate ${active ? 'text-[#080808]' : 'text-[#18181b]'}`}>
                          {item.label}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-[#a1a1aa] shrink-0" />
                      </div>
                      <p className="text-[10px] text-[#71717a] leading-snug line-clamp-2 mt-0.5">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Reset Demo Quick Action */}
            <div className="pt-2 border-t border-[#f4f4f5] flex items-center justify-between">
              <span className="text-[10px] font-mono text-[#71717a]">
                Vyapar Mitra AI Operations Engine
              </span>
              <button
                onClick={() => {
                  setIsMoreOpen(false);
                  setIsResetModalOpen(true);
                }}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline"
              >
                Reset Demo Data
              </button>
            </div>
          </div>
        </div>
      )}

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
                  <code className="font-mono text-[#080808]">Vyapar Mitra</code> to their baseline benchmark state.
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
                className="px-3 py-1.5 text-xs font-medium bg-[#080808] text-white rounded-[4px] hover:bg-[#27272a]"
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
