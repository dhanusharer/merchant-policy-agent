'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Bot,
  Search,
  Send,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Package,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  Plus,
  Clock,
  Layers,
  Zap,
  Tag,
  DollarSign,
  MessageSquare,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useMerchant, PRESET_MERCHANTS } from '@/lib/MerchantContext';
import { api, formatPaise, formatPercent } from '@/lib/api';
import { AIProductStudioModal } from '@/components/products/AIProductStudioModal';
import { ProductDetailModal } from '@/components/products/ProductDetailModal';

export default function OverviewPage() {
  const { currentMerchant, setCurrentMerchant } = useMerchant();

  // Data states
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Ask Agent state
  const [agentQuery, setAgentQuery] = useState('');
  const [agentAnswer, setAgentAnswer] = useState<string | null>(null);
  const [isAnswering, setIsAnswering] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [selectedProductDetail, setSelectedProductDetail] = useState<any | null>(null);

  // Load live data from backend APIs
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, ordersRes] = await Promise.all([
        api.getProducts(currentMerchant.id).catch(() => []),
        api.getOrders(50, 0).catch(() => [])
      ]);
      setProducts(prodRes || []);
      setOrders(ordersRes || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load live merchant data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentMerchant.id]);

  // Handle Ask Agent Submission
  const handleAskAgent = (queryToAsk?: string) => {
    const q = (queryToAsk || agentQuery).trim();
    if (!q) return;

    setIsAnswering(true);
    const qLower = q.toLowerCase();

    setTimeout(() => {
      let ans = '';
      if (qLower.includes('sales') || qLower.includes('order') || qLower.includes('revenue') || qLower.includes('today')) {
        ans = `📊 Sales Summary Today: You have recorded 18 paid orders totaling ₹44,982 across WhatsApp Direct and Amazon India. WhatsApp Direct is your highest-margin channel today at 64.2% net contribution. Average order value is ₹2,499.`;
      } else if (qLower.includes('stock') || qLower.includes('reorder') || qLower.includes('inventory') || qLower.includes('shortage')) {
        ans = `⚠️ Stock Alert: Vastram Classic Jet Black Formal Trousers have only 6 units remaining (depleting in ~7.5 hours). Olive Linen Shirt has high weekend demand. Recommend clicking "Reorder +50 Units" below immediately.`;
      } else if (qLower.includes('profit') || qLower.includes('margin') || qLower.includes('increase') || qLower.includes('recommend')) {
        ans = `💡 Profit Opportunity: 1) Lift White Oxford Shirt price by ₹200 to ₹2,099 (+₹42,000 monthly profit). 2) Close 18 pending WhatsApp chats with a 5% festive incentive. 3) Bundle Linen Shirt + Khaki Chinos for summer casuals.`;
      } else if (qLower.includes('product') || qLower.includes('catalog') || qLower.includes('best seller') || qLower.includes('shirt')) {
        ans = `⭐ Hero Product: Vastram Classic White Oxford Cotton Shirt is your #1 bestseller with ₹1,899 retail price, ₹650 wholesale COGS, and 65.8% gross margin. 4K Studio E-Commerce asset is verified for Amazon and Flipkart.`;
      } else {
        ans = `🤖 Agent Response: For Vastram Clothing, commercial operations are healthy with ₹44,982 in today's revenue across shirts and trousers. 3 automated recommendations are prioritized below.`;
      }
      setAgentAnswer(ans);
      setIsAnswering(false);
    }, 450);
  };

  // Reorder stock action
  const handleReorder = async (productId: string, productName: string, addUnits: number) => {
    try {
      const prod = products.find((p) => p.id === productId);
      const newStock = (prod?.inventory_quantity || 0) + addUnits;

      await api.updateProduct(currentMerchant.id, productId, {
        inventory_quantity: newStock
      });

      setActionSuccess(`✓ Reordered +${addUnits} units for "${productName}". Stock updated to ${newStock} units.`);
      await loadData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert('Failed to update inventory: ' + err.message);
    }
  };

  // Apply price recommendation
  const handleApplyPriceRecommendation = async (productId: string, newPricePaise: number) => {
    try {
      await api.updateProduct(currentMerchant.id, productId, {
        price_paise: newPricePaise
      });
      setActionSuccess(`✓ Applied recommended retail price of ${formatPaise(newPricePaise)}! Margin updated to 68.2%.`);
      await loadData();
      setTimeout(() => setActionSuccess(null), 4000);
    } catch (err: any) {
      alert('Failed to update price: ' + err.message);
    }
  };

  // Simulated orders stream for today's visual display (Vastram Clothing)
  const todaysOrdersList = [
    {
      id: 'ord_9841',
      customer: '+91 98451 ••••',
      customerFull: '+91 98451 22891',
      channel: 'WHATSAPP',
      channelName: 'WhatsApp Direct',
      productName: 'Vastram Classic White Oxford Cotton Shirt',
      sku: 'VAST-SH-01',
      amountPaise: 189900,
      costPaise: 65000,
      marginPercent: 65.8,
      status: 'PAID',
      method: 'UPI Instant',
      time: '8 mins ago',
      timestamp: 'Today, 06:42 PM',
      image: '/clothing/white_oxford.jpg'
    },
    {
      id: 'ord_9838',
      customer: '+91 94480 ••••',
      customerFull: '+91 94480 77123',
      channel: 'AMAZON',
      channelName: 'Amazon Prime',
      productName: 'Vastram Tailored Khaki Chino Trousers',
      sku: 'VAST-TR-01',
      amountPaise: 229900,
      costPaise: 85000,
      marginPercent: 63.0,
      status: 'PAID',
      method: 'Amazon Pay',
      time: '24 mins ago',
      timestamp: 'Today, 06:26 PM',
      image: '/clothing/khaki_chino.jpg'
    },
    {
      id: 'ord_9832',
      customer: '+91 91082 ••••',
      customerFull: '+91 91082 34901',
      channel: 'WHATSAPP',
      channelName: 'WhatsApp Direct',
      productName: 'Vastram Signature Royal Navy Casual Shirt',
      sku: 'VAST-SH-02',
      amountPaise: 199900,
      costPaise: 72000,
      marginPercent: 64.0,
      status: 'PAID',
      method: 'Instant QR',
      time: '42 mins ago',
      timestamp: 'Today, 06:08 PM',
      image: '/clothing/navy_shirt.jpg'
    },
    {
      id: 'ord_9829',
      customer: '+91 99014 ••••',
      customerFull: '+91 99014 90812',
      channel: 'D2C',
      channelName: 'Direct Website',
      productName: 'Vastram Italian Wool Charcoal Grey Trousers',
      sku: 'VAST-TR-02',
      amountPaise: 279900,
      costPaise: 110000,
      marginPercent: 60.7,
      status: 'PAID',
      method: 'Credit Card',
      time: '1 hour ago',
      timestamp: 'Today, 05:50 PM',
      image: '/clothing/grey_trouser.jpg'
    },
    {
      id: 'ord_9824',
      customer: '+91 98860 ••••',
      customerFull: '+91 98860 11456',
      channel: 'WHATSAPP',
      channelName: 'WhatsApp Direct',
      productName: 'Vastram Pure Olive Linen Casual Shirt',
      sku: 'VAST-SH-03',
      amountPaise: 249900,
      costPaise: 92000,
      marginPercent: 63.2,
      status: 'PAID',
      method: 'UPI Instant',
      time: '1.5 hours ago',
      timestamp: 'Today, 05:20 PM',
      image: '/clothing/linen_shirt.jpg'
    }
  ];

  // Stocks near end in demand calculation (Vastram Clothing)
  const stocksNearEnd = [
    {
      id: products.find((p) => p.sku === 'VAST-TR-03' || p.name?.toLowerCase().includes('black'))?.id || 'prod_vastram_trouser_black',
      name: 'Vastram Classic Jet Black Formal Trousers',
      sku: 'VAST-TR-03',
      currentStock: 6,
      demandRate: '12 orders / day',
      lostGmvPerDay: 26388,
      status: 'CRITICAL',
      statusLabel: 'DEPLETING FAST (<8h)',
      depletionTime: 'In ~7.5 hours',
      recommendedReorder: 50
    },
    {
      id: products.find((p) => p.sku === 'VAST-SH-03' || p.name?.toLowerCase().includes('linen'))?.id || 'prod_vastram_shirt_linen',
      name: 'Vastram Pure Olive Linen Casual Shirt',
      sku: 'VAST-SH-03',
      currentStock: 45,
      demandRate: '10 orders / day',
      lostGmvPerDay: 24990,
      status: 'WARNING',
      statusLabel: 'HIGH WEEKEND VELOCITY',
      depletionTime: 'In ~4.5 days',
      recommendedReorder: 40
    },
    {
      id: products.find((p) => p.sku === 'VAST-TR-02' || p.name?.toLowerCase().includes('grey') || p.name?.toLowerCase().includes('charcoal'))?.id || 'prod_vastram_trouser_grey',
      name: 'Vastram Italian Wool Charcoal Grey Trousers',
      sku: 'VAST-TR-02',
      currentStock: 40,
      demandRate: '8 orders / day',
      lostGmvPerDay: 22392,
      status: 'WARNING',
      statusLabel: 'LOW STOCK (~4.2 days)',
      depletionTime: 'In ~4.2 days',
      recommendedReorder: 30
    }
  ];

  // Hero product ID for recommendation
  const heroProduct = products.find((p) => p.sku === 'VAST-SH-01' || p.name?.toLowerCase().includes('oxford') || p.name?.toLowerCase().includes('shirt')) || products[0];

  return (
    <div className="w-full space-y-6">
      
      {/* ============================================================== */}
      {/* TOP HEADER HERO BANNER (Full-width edge-to-edge across screen) */}
      {/* ============================================================== */}
      <div className="relative w-full overflow-hidden border-b border-[#e4e4e7] bg-[#87776d] shadow-xs">
        {/* Background Banner Image */}
        <img
          src="/catalog_banner.jpg"
          alt="Vyapar Mitra Header Banner"
          className="w-full h-44 sm:h-52 md:h-56 object-cover object-center"
        />
        {/* Strictly bottom-anchored scrim for title contrast — ZERO black fade behind top logo */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 sm:h-32 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />

        {/* Content Container (Top row has 0% backdrop tint, completely clear) */}
        <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 md:p-8">
          
          {/* Top Row: Vyapar Mitra Logo & Ask Agent */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: Vyapar Mitra Brand Logo (No black fade behind logo, slightly larger size, crystal clear) */}
            <div className="flex items-center gap-3 shrink-0">
              <Link href="/" className="inline-flex items-center transition-transform hover:scale-[1.01]">
                <img
                  src="/vyapar_mitra_logo.png"
                  alt="Vyapar Mitra"
                  className="h-11 sm:h-13 md:h-14 w-auto object-contain"
                />
              </Link>
            </div>

            {/* Right: Ask Agent Form */}
            <div className="w-full sm:w-80 md:w-96 shrink-0">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAskAgent();
                }}
                className="relative flex items-center"
              >
                <Bot className="w-4 h-4 text-[#71717a] absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={agentQuery}
                  onChange={(e) => setAgentQuery(e.target.value)}
                  placeholder="Ask Vyapar Mitra Agent..."
                  className="w-full text-xs font-medium pl-9 pr-16 py-2 bg-white/95 text-[#080808] border border-white/60 rounded-lg shadow-xs placeholder:text-[#71717a] focus:bg-white focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={isAnswering}
                  className="absolute right-1 px-3 py-1.5 bg-[#18181b] hover:bg-[#27272a] text-white text-[11px] font-semibold rounded-md transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <span>Ask</span>
                  <Send className="w-3 h-3" />
                </button>
              </form>
            </div>
          </div>

          {/* Bottom Hero Text Inside Banner */}
          <div className="space-y-1">
            <div className="text-[11px] font-mono font-medium tracking-wider text-white/95 uppercase drop-shadow-xs">
              Merchant Operations & Policy Governance
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white drop-shadow-sm">
              Vyapar Mitra Dashboard
            </h1>
            <p className="text-xs text-white/90 max-w-2xl font-normal drop-shadow-xs hidden sm:block">
              Multi-channel margin protection, autonomous stock replenishment, and WhatsApp commerce negotiation.
            </p>
          </div>

        </div>
      </div>

      {/* Main Content Body - Full width with minimal edge gaps */}
      <div className="w-full px-2 sm:px-4 md:px-6 space-y-6">

        {/* Toast Notification for Instant Feedback */}
        {actionSuccess && (
          <div className="p-3.5 rounded-[8px] bg-emerald-50 border border-emerald-300 text-xs font-semibold text-emerald-900 flex items-center gap-2 shadow-sm animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-[8px] bg-rose-50 border border-rose-300 text-xs text-rose-800 flex items-center gap-2 shadow-sm">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

      {/* Dismissible Agent Answer if user asked something */}
      {agentAnswer && (
        <div className="p-3.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-lg text-xs text-[#080808] shadow-xs flex items-start justify-between gap-3 animate-fade-in">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-[#146ef5] shrink-0 mt-0.5" />
            <p className="leading-relaxed font-medium">{agentAnswer}</p>
          </div>
          <button
            onClick={() => setAgentAnswer(null)}
            className="text-[#64748b] hover:text-[#080808] text-xs font-semibold px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Visual Differentiator / Separator Divider */}
      <div className="relative py-1 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[#e4e4e7]" />
        </div>
        <div className="relative bg-white px-3.5 py-1 rounded-full border border-[#e4e4e7] text-[11px] font-semibold text-[#52525b] uppercase tracking-wider shadow-2xs flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
          <span>Live Operations & Demand Monitor</span>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION 1: HIGH-DENSITY OPERATIONS & INSIGHTS COCKPIT          */}
      {/* Professional enterprise design with unified palette & larger KPIs */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN (7 Cols): Financial Pulse & Compact Live Orders */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-[#e4e4e7] rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#f4f4f5]">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-[#f4f4f5] text-[#18181b]">
                  <ShoppingBag className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#09090b] tracking-tight">
                    Todays Orders & Revenue Pulse
                  </h2>
                  <p className="text-[11px] text-[#71717a]">
                    18 verified orders across WhatsApp Direct, Amazon & Website
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono font-medium text-[#52525b] bg-[#f4f4f5] px-2.5 py-0.5 rounded-md border border-[#e4e4e7] hidden sm:inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  <span>3 Active Channels</span>
                </span>
                <button
                  onClick={loadData}
                  className="p-1.5 rounded-lg border border-[#e4e4e7] hover:bg-[#f4f4f5] text-[#52525b] transition-colors"
                  title="Refresh Orders"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Today's KPI Metric Cards (Increased Size & Executive Clarity) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
              
              {/* Card 1: Orders Today */}
              <div className="p-4.5 sm:p-5.5 rounded-xl bg-[#fafafa] border border-[#e4e4e7] shadow-xs flex flex-col justify-between min-h-[136px] sm:min-h-[146px] hover:border-[#18181b] transition-all group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#52525b] uppercase tracking-wider">Orders Today</span>
                  <div className="p-1.5 rounded-lg bg-white border border-[#e4e4e7] text-[#18181b] shadow-2xs group-hover:bg-[#18181b] group-hover:text-white transition-colors">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="my-2">
                  <div className="text-2xl sm:text-3xl lg:text-[32px] font-black text-[#09090b] tracking-tight tabular-nums">
                    18 <span className="text-sm font-normal text-[#71717a]">Orders</span>
                  </div>
                </div>
                <div className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                  <span>✓ 100% Paid & Verified</span>
                </div>
              </div>

              {/* Card 2: Revenue Today */}
              <div className="p-4.5 sm:p-5.5 rounded-xl bg-[#fafafa] border border-[#e4e4e7] shadow-xs flex flex-col justify-between min-h-[136px] sm:min-h-[146px] hover:border-[#18181b] transition-all group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#52525b] uppercase tracking-wider">Revenue Today</span>
                  <div className="p-1.5 rounded-lg bg-white border border-[#e4e4e7] text-[#18181b] shadow-2xs group-hover:bg-[#18181b] group-hover:text-white transition-colors">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="my-2">
                  <div className="text-2xl sm:text-3xl lg:text-[32px] font-black text-[#09090b] tracking-tight tabular-nums">
                    ₹44,982
                  </div>
                </div>
                <div className="text-xs font-medium text-[#71717a]">
                  +18.4% vs benchmark
                </div>
              </div>

              {/* Card 3: Gross Profit */}
              <div className="p-4.5 sm:p-5.5 rounded-xl bg-[#fafafa] border border-[#e4e4e7] shadow-xs flex flex-col justify-between min-h-[136px] sm:min-h-[146px] hover:border-[#18181b] transition-all group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#52525b] uppercase tracking-wider">Gross Profit</span>
                  <div className="p-1.5 rounded-lg bg-white border border-[#e4e4e7] text-[#18181b] shadow-2xs group-hover:bg-[#18181b] group-hover:text-white transition-colors">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="my-2">
                  <div className="text-2xl sm:text-3xl lg:text-[32px] font-black text-[#09090b] tracking-tight tabular-nums">
                    ₹26,090
                  </div>
                </div>
                <div className="text-xs font-semibold text-emerald-700">
                  58.0% Net Gross Margin
                </div>
              </div>

              {/* Card 4: Avg Order Value */}
              <div className="p-4.5 sm:p-5.5 rounded-xl bg-[#fafafa] border border-[#e4e4e7] shadow-xs flex flex-col justify-between min-h-[136px] sm:min-h-[146px] hover:border-[#18181b] transition-all group">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#52525b] uppercase tracking-wider">Avg Order Value</span>
                  <div className="p-1.5 rounded-lg bg-white border border-[#e4e4e7] text-[#18181b] shadow-2xs group-hover:bg-[#18181b] group-hover:text-white transition-colors">
                    <Tag className="w-4 h-4" />
                  </div>
                </div>
                <div className="my-2">
                  <div className="text-2xl sm:text-3xl lg:text-[32px] font-black text-[#09090b] tracking-tight tabular-nums">
                    ₹2,499
                  </div>
                </div>
                <div className="text-xs font-medium text-[#71717a] truncate">
                  Top SKU: Oxford Shirt
                </div>
              </div>

            </div>

            {/* Real-time Channel Revenue Share Breakdown Bar (Refined Enterprise Design) */}
            <div className="p-3.5 rounded-xl bg-[#fbfbfb] border border-[#e4e4e7] space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#18181b] flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#52525b]" />
                  <span>Channel Contribution & Margin Efficiency</span>
                </span>
                <span className="text-[#71717a] font-mono text-[11px]">Total captured: ₹44,982</span>
              </div>

              {/* Progress Stacked Bar */}
              <div className="w-full h-2 rounded-full overflow-hidden bg-[#e4e4e7] flex">
                <div style={{ width: '64.2%' }} className="bg-[#18181b] h-full" title="WhatsApp Direct: 64.2%" />
                <div style={{ width: '29.6%' }} className="bg-[#52525b] h-full" title="Amazon Prime: 29.6%" />
                <div style={{ width: '6.2%' }} className="bg-[#a1a1aa] h-full" title="Direct Web: 6.2%" />
              </div>

              {/* Channel Legend & Profit Ratios */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#18181b] shrink-0" />
                  <span className="font-semibold text-[#09090b]">WhatsApp</span>
                  <span className="text-emerald-700 font-medium font-mono text-[10px]">65.8% margin</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#52525b] shrink-0" />
                  <span className="font-semibold text-[#09090b]">Amazon</span>
                  <span className="text-[#52525b] font-medium font-mono text-[10px]">42.1% margin</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#a1a1aa] shrink-0" />
                  <span className="font-semibold text-[#09090b]">Website</span>
                  <span className="text-[#52525b] font-medium font-mono text-[10px]">61.5% margin</span>
                </div>
              </div>
            </div>

            {/* Recent Captured Orders - Space-Efficient High-Density Feed */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-[#09090b] uppercase tracking-wider flex items-center gap-1.5">
                  <span>Live Transaction Stream:</span>
                  <span className="text-[11px] font-mono text-[#71717a] font-normal">(Instant UPI & Verification)</span>
                </div>
                <Link href="/orders" className="text-xs font-medium text-[#18181b] hover:underline flex items-center gap-0.5">
                  <span>View All 18 Orders</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="divide-y divide-[#f4f4f5] border border-[#e4e4e7] rounded-xl overflow-hidden bg-white shadow-2xs">
                {todaysOrdersList.slice(0, 4).map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className="p-3 hover:bg-[#fafafa] active:bg-[#f4f4f5] flex items-center justify-between gap-3 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={ord.image}
                        alt={ord.productName}
                        className="w-10 h-10 rounded-lg object-cover bg-[#f4f4f5] border border-[#e4e4e7] shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-semibold text-[#09090b] truncate group-hover:text-[#18181b] transition-colors">
                            {ord.productName}
                          </h4>
                          <span className="text-[10px] font-mono font-medium text-[#52525b] bg-[#f4f4f5] px-1.5 py-0.2 rounded border border-[#e4e4e7] shrink-0">
                            {ord.channelName}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#71717a] mt-0.5 flex items-center gap-2 font-mono">
                          <span>{ord.sku}</span>
                          <span>•</span>
                          <span>{ord.time}</span>
                          <span className="text-emerald-700 hidden sm:inline font-medium">+{ord.marginPercent}% margin</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <div className="text-right">
                        <div className="text-xs font-bold text-[#09090b] tabular-nums">
                          {formatPaise(ord.amountPaise)}
                        </div>
                        <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                          Paid ✓
                        </span>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-[#a1a1aa] group-hover:text-[#18181b] transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN (5 Cols): Real-Time Priority Insights & Action Radar */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-[#e4e4e7] rounded-xl p-4 sm:p-5 shadow-xs space-y-3.5">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#f4f4f5]">
              <div className="flex items-center gap-2.5">
                <span className="p-1.5 rounded-lg bg-[#f4f4f5] text-[#18181b]">
                  <Zap className="w-4 h-4" />
                </span>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#09090b] tracking-tight">
                    Merchant Action Radar
                  </h2>
                  <p className="text-[11px] text-[#71717a]">
                    Instant commercial levers & shortage prevention
                  </p>
                </div>
              </div>

              <span className="text-[10px] font-mono text-[#52525b] bg-[#f4f4f5] px-2.5 py-0.5 rounded-md border border-[#e4e4e7] font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span>3 Immediate Levers</span>
              </span>
            </div>

            {/* Lever 1: Critical Stock Shortage Alert */}
            <div className="p-3.5 rounded-xl bg-white border border-[#e4e4e7] hover:border-[#d4d4d8] space-y-2.5 shadow-2xs transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 uppercase tracking-wider">
                    STOCK SHORTAGE (&lt;8h)
                  </span>
                  <h3 className="text-xs font-bold text-[#09090b] leading-tight mt-1">
                    Classic Jet Black Formal Trousers
                  </h3>
                </div>
                <span className="text-xs font-bold text-rose-700 font-mono bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  6 Units Left
                </span>
              </div>

              <div className="text-[11px] text-[#52525b] flex items-center justify-between">
                <span>Velocity: <b className="text-[#09090b]">12 orders/day</b></span>
                <span className="text-rose-700 font-semibold font-mono">Lost GMV: -₹26,388/day</span>
              </div>

              <button
                onClick={() => handleReorder('prod_vastram_trouser_black', 'Classic Jet Black Formal Trousers', 50)}
                className="w-full py-2 px-3 bg-[#18181b] hover:bg-[#27272a] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Reorder +50 Units from Supplier</span>
              </button>
            </div>

            {/* Lever 2: Recommended Price Lift (Instant Profit) */}
            <div className="p-3.5 rounded-xl bg-white border border-[#e4e4e7] hover:border-[#d4d4d8] space-y-2.5 shadow-2xs transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-wider">
                    PRICE OPTIMIZATION
                  </span>
                  <h3 className="text-xs font-bold text-[#09090b] leading-tight mt-1">
                    Classic White Oxford Cotton Shirt
                  </h3>
                </div>
                <span className="text-xs font-bold text-emerald-700 font-mono bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  +₹42,000/mo
                </span>
              </div>

              <p className="text-[11px] text-[#52525b] leading-tight">
                Recommended lift: <b className="text-[#09090b]">₹1,899 → ₹2,099</b> (+₹200/unit). 97.4% customer conversion retention modeled.
              </p>

              <button
                onClick={() => handleApplyPriceRecommendation(heroProduct?.id || 'prod_vastram_shirt_oxford', 209900)}
                className="w-full py-2 px-3 bg-[#18181b] hover:bg-[#27272a] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Apply +₹200 Recommended Retail Price</span>
              </button>
            </div>

            {/* Lever 3: WhatsApp Inactive Shopper Recovery */}
            <div className="p-3.5 rounded-xl bg-white border border-[#e4e4e7] hover:border-[#d4d4d8] space-y-2.5 shadow-2xs transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[10px] font-mono font-bold text-[#52525b] bg-[#f4f4f5] px-2 py-0.5 rounded border border-[#e4e4e7] uppercase tracking-wider">
                    WHATSAPP RETENTION
                  </span>
                  <h3 className="text-xs font-bold text-[#09090b] leading-tight mt-1">
                    18 High-Intent Shopper Inquiries
                  </h3>
                </div>
                <span className="text-xs font-bold text-[#09090b] font-mono bg-[#f4f4f5] px-2 py-0.5 rounded border border-[#e4e4e7]">
                  18 Pending
                </span>
              </div>

              <p className="text-[11px] text-[#52525b] leading-tight">
                Inquiries awaiting quotes. A 5% festive voucher unlocks projected <b className="text-[#09090b]">₹38,000 GMV</b> at 64.2% margin.
              </p>

              <Link
                href="/whatsapp"
                className="w-full py-2 px-3 bg-white hover:bg-[#f4f4f5] text-[#18181b] border border-[#d4d4d8] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs text-center"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Open WhatsApp Agent & Dispatch Deals</span>
              </Link>
            </div>

            {/* Leakage Protection Counter */}
            <div className="p-3 rounded-xl bg-[#fafafa] border border-[#e4e4e7] flex items-center justify-between text-[11px]">
              <span className="text-[#52525b] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#18181b]" />
                <span>Marketplace Fee Leakage Saved:</span>
              </span>
              <span className="font-bold text-[#09090b] font-mono">
                +₹4,120 Saved Today
              </span>
            </div>

          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* ORDER DETAILS MODAL / SHEET                                   */}
      {/* Complete detailed view when merchant taps any order thumbnail  */}
      {/* ============================================================== */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-fade-in"
            onClick={() => setSelectedOrder(null)}
          />

          {/* Modal / Sheet Content */}
          <div className="relative bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full mx-auto p-5 sm:p-6 shadow-2xl border border-[#e4e4e7] z-10 max-h-[90vh] overflow-y-auto animate-slide-up space-y-4">
            
            {/* Top Handle on Mobile */}
            <div className="w-10 h-1 bg-[#d4d4d8] rounded-full mx-auto sm:hidden" />

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#f4f4f5]">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-[#f4f4f5] px-2 py-0.5 rounded border border-[#e4e4e7] text-[#52525b]">
                    {selectedOrder.id}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    ✓ {selectedOrder.status}
                  </span>
                </div>
                <h3 className="text-base font-bold text-[#080808] tracking-tight mt-1">
                  Order Details
                </h3>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-full hover:bg-[#f4f4f5] text-[#71717a] transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Product Card */}
            <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#fafafa] border border-[#e4e4e7]">
              <img
                src={selectedOrder.image}
                alt={selectedOrder.productName}
                className="w-16 h-16 rounded-lg object-cover bg-white border border-[#e4e4e7] shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-[#080808] leading-snug">
                  {selectedOrder.productName}
                </h4>
                <div className="flex items-center gap-2 text-xs font-mono text-[#71717a] mt-1">
                  <span>SKU: {selectedOrder.sku}</span>
                  <span>•</span>
                  <span>Qty: 1 Unit</span>
                </div>
              </div>
            </div>

            {/* Key Information Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-white border border-[#e4e4e7]">
                <div className="text-[11px] text-[#71717a]">Customer Contact</div>
                <div className="font-semibold text-[#080808] mt-0.5 font-mono">{selectedOrder.customerFull}</div>
              </div>
              <div className="p-3 rounded-lg bg-white border border-[#e4e4e7]">
                <div className="text-[11px] text-[#71717a]">Sales Channel</div>
                <div className="font-semibold text-[#080808] mt-0.5">{selectedOrder.channelName}</div>
              </div>
              <div className="p-3 rounded-lg bg-white border border-[#e4e4e7]">
                <div className="text-[11px] text-[#71717a]">Payment Method</div>
                <div className="font-semibold text-[#080808] mt-0.5">{selectedOrder.method}</div>
              </div>
              <div className="p-3 rounded-lg bg-white border border-[#e4e4e7]">
                <div className="text-[11px] text-[#71717a]">Order Timestamp</div>
                <div className="font-semibold text-[#080808] mt-0.5">{selectedOrder.timestamp}</div>
              </div>
            </div>

            {/* Financial Breakdown */}
            <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-[#cbd5e1] space-y-2 text-xs">
              <div className="font-semibold text-[#080808] pb-1 border-b border-[#e2e8f0]">
                Financial Summary
              </div>
              <div className="flex justify-between text-[#52525b]">
                <span>Customer Retail Total:</span>
                <span className="font-bold text-[#080808]">{formatPaise(selectedOrder.amountPaise)}</span>
              </div>
              <div className="flex justify-between text-[#52525b]">
                <span>Wholesale Cost (COGS):</span>
                <span>{formatPaise(selectedOrder.costPaise)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold pt-1 border-t border-[#e2e8f0]">
                <span>Net Gross Margin ({selectedOrder.marginPercent}%):</span>
                <span>+{formatPaise(selectedOrder.amountPaise - selectedOrder.costPaise)}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-2">
              <Link
                href="/orders"
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-2 px-3 text-xs font-semibold text-center bg-[#080808] text-white rounded-lg hover:bg-[#27272a] transition-colors"
              >
                Open Full Orders Ledger →
              </Link>
              <button
                onClick={() => setSelectedOrder(null)}
                className="py-2 px-4 text-xs font-medium border border-[#d4d4d8] text-[#52525b] rounded-lg hover:bg-[#f4f4f5] transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SECTION 2: Todays Strategies                                   */}
      {/* Autonomous growth actions prioritized for maximum profit today  */}
      {/* ============================================================== */}
      <div className="bg-white border border-[#e4e4e7] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f4f4f5]">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#f4f4f5] text-[#18181b]">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#09090b] tracking-tight">
                Todays Strategies
              </h2>
            </div>
            <p className="text-xs text-[#71717a] mt-0.5">
              Autonomous Growth Intelligence: 3 high-impact commercial levers prioritized for maximum profit today.
            </p>
          </div>

          <span className="text-[11px] font-mono text-[#52525b] bg-[#f4f4f5] px-2.5 py-1 rounded-md border border-[#e4e4e7] font-semibold self-start sm:self-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
            <span>3 Strategies Active</span>
          </span>
        </div>

        {/* 3 Actionable Strategies Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Strategy 1: Price Optimization */}
          <div className="p-4.5 rounded-xl bg-[#fafafa] border border-[#e4e4e7] hover:border-[#18181b] transition-all space-y-3 flex flex-col justify-between shadow-2xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 uppercase tracking-wider">
                  PRICE OPTIMIZATION
                </span>
                <span className="text-xs font-bold text-emerald-700 font-mono">
                  +₹42,000 / mo
                </span>
              </div>
              <h3 className="text-xs font-bold text-[#09090b] leading-snug">
                Lift Classic White Oxford Cotton Shirt Price to ₹2,099
              </h3>
              <p className="text-[11px] text-[#52525b] leading-relaxed">
                Demand elasticity analysis shows 97.4% conversion retention at ₹2,099 with zero stockouts. Delivers an additional +₹200 gross margin per unit across WhatsApp Direct and Amazon.
              </p>
            </div>

            <button
              type="button"
              onClick={() => heroProduct && handleApplyPriceRecommendation(heroProduct.id, 209900)}
              className="w-full py-2 px-3 bg-[#18181b] hover:bg-[#27272a] text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Apply Price Update (₹2,099)</span>
            </button>
          </div>

          {/* Strategy 2: Direct Channel Surge */}
          <div className="p-4.5 rounded-xl bg-[#fafafa] border border-[#e4e4e7] hover:border-[#18181b] transition-all space-y-3 flex flex-col justify-between shadow-2xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#52525b] bg-[#f4f4f5] px-2 py-0.5 rounded border border-[#e4e4e7] uppercase tracking-wider">
                  DIRECT CHANNEL SURGE
                </span>
                <span className="text-xs font-bold text-[#09090b] font-mono">
                  18 Sales Ready
                </span>
              </div>
              <h3 className="text-xs font-bold text-[#09090b] leading-snug">
                Close 18 Pending WhatsApp Chats with 5% Festive Style Incentive
              </h3>
              <p className="text-[11px] text-[#52525b] leading-relaxed">
                High buyer purchase intent in WhatsApp chat queue for Oxford Shirts & Chinos. Direct UPI routing avoids 15-22% marketplace commissions, locking in 64.2% net margin.
              </p>
            </div>

            <Link
              href="/whatsapp"
              className="w-full py-2 px-3 bg-[#18181b] hover:bg-[#27272a] text-white rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs text-center"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Open Sales Agent & Dispatch Deals</span>
            </Link>
          </div>

          {/* Strategy 3: Executive Duo Pairing */}
          <div className="p-4.5 rounded-xl bg-[#fafafa] border border-[#e4e4e7] hover:border-[#18181b] transition-all space-y-3 flex flex-col justify-between shadow-2xs">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold text-[#52525b] bg-[#f4f4f5] px-2 py-0.5 rounded border border-[#e4e4e7] uppercase tracking-wider">
                  WORKING CAPITAL PAIRING
                </span>
                <span className="text-xs font-bold text-[#09090b] font-mono">
                  +₹38,000 Volume
                </span>
              </div>
              <h3 className="text-xs font-bold text-[#09090b] leading-snug">
                Pair Olive Linen Shirt + Khaki Chinos as "Executive Summer Duo"
              </h3>
              <p className="text-[11px] text-[#52525b] leading-relaxed">
                Bundle the Linen Casual Shirt (₹2,499) with Khaki Chinos (₹2,299) at ₹4,199. Accelerates cash conversion by 2.4x while maintaining a healthy 61.5% blended gross margin.
              </p>
            </div>

            <Link
              href="/campaigns"
              className="w-full py-2 px-3 border border-[#d4d4d8] bg-white hover:bg-[#f4f4f5] text-[#18181b] rounded-lg font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs text-center"
            >
              <Package className="w-3.5 h-3.5 text-[#52525b]" />
              <span>Create Executive Bundle Deal</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION 3: Current Catalog                                     */}
      {/* Tap any product card to view full description & marketplaces   */}
      {/* ============================================================== */}
      <div className="bg-white border border-[#e4e4e7] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f4f4f5]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shadow-2xs border border-[#e4e4e7] shrink-0 bg-[#fafafa] flex items-center justify-center">
              <img
                src="/catalog_banner.jpg"
                alt="Current Catalog"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-[#09090b] tracking-tight">
                  Current Catalog
                </h2>
                <span className="text-[10px] font-mono font-semibold text-[#18181b] bg-[#f4f4f5] px-2 py-0.5 rounded border border-[#e4e4e7]">
                  LIVE CATALOG
                </span>
              </div>
              <p className="text-xs text-[#71717a] mt-0.5">
                Active inventory items with retail selling prices, wholesale COGS, and gross margin floors. Tap any product to view full description, marketplace placements, and tailored recommendations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/products"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#18181b] text-white rounded-lg hover:bg-[#27272a] transition-colors shadow-2xs"
            >
              <span>Manage Products</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Catalog Table / Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.slice(0, 6).map((product) => {
            const imageUrl = product.attributes?.refined_photo_url ||
              (product.name?.toLowerCase().includes('oxford') || product.name?.toLowerCase().includes('white') ? '/clothing/white_oxford.jpg' :
               product.name?.toLowerCase().includes('navy') ? '/clothing/navy_shirt.jpg' :
               product.name?.toLowerCase().includes('linen') || product.name?.toLowerCase().includes('olive') ? '/clothing/linen_shirt.jpg' :
               product.name?.toLowerCase().includes('khaki') || product.name?.toLowerCase().includes('chino') ? '/clothing/khaki_chino.jpg' :
               product.name?.toLowerCase().includes('grey') || product.name?.toLowerCase().includes('charcoal') ? '/clothing/grey_trouser.jpg' :
               '/clothing/black_trouser.jpg');

            const marginPct = product.price_paise > 0
              ? (((product.price_paise - product.cost_paise) / product.price_paise) * 100).toFixed(1)
              : '0.0';

            return (
              <div
                key={product.id}
                onClick={() => setSelectedProductDetail(product)}
                className="p-3.5 rounded-xl bg-[#fafafa] border border-[#e4e4e7] hover:border-[#18181b] hover:shadow-xs transition-all space-y-3 flex flex-col justify-between cursor-pointer group"
                title="Tap to view complete description, marketplace placements, and recommendations"
              >
                <div className="space-y-2.5">
                  {/* Photo & SKU Tag */}
                  <div className="relative w-full h-36 rounded-lg overflow-hidden bg-white border border-[#e4e4e7] flex items-center justify-center p-2 group-hover:border-[#18181b] transition-colors">
                    <img
                      src={imageUrl}
                      alt={product.name}
                      className="max-h-full max-w-full object-contain"
                    />
                    <div className="absolute bottom-2 right-2 bg-white/95 text-[#09090b] text-[9px] font-mono px-1.5 py-0.5 rounded border border-[#e4e4e7]">
                      {product.sku}
                    </div>
                  </div>

                  {/* Title & Category */}
                  <div>
                    <h3 className="font-bold text-xs text-[#09090b] line-clamp-1 group-hover:text-[#18181b] transition-colors">
                      {product.name}
                    </h3>
                    <div className="text-[10px] text-[#71717a] font-mono mt-0.5 uppercase">
                      Category: {product.category}
                    </div>
                  </div>

                  {/* Price & COGS Economics */}
                  <div className="p-2.5 bg-white rounded-lg border border-[#e4e4e7] space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#71717a]">Selling Price:</span>
                      <strong className="text-[#09090b] tabular-nums font-bold">
                        {formatPaise(product.price_paise)}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[#71717a]">Wholesale COGS:</span>
                      <span className="text-[#71717a] tabular-nums font-mono">
                        {formatPaise(product.cost_paise)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-[#f4f4f5]">
                      <span className="text-[#71717a]">Gross Margin:</span>
                      <span className="text-emerald-700 font-bold font-mono">
                        {marginPct}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stock Level & Details Link */}
                <div className="pt-2 flex items-center justify-between text-[11px] border-t border-[#f4f4f5]">
                  <span className="font-mono text-[#71717a]">
                    Stock: <strong className="text-[#09090b]">{product.inventory_quantity} units</strong>
                  </span>
                  <span className="text-[#18181b] font-semibold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    <span>Details & Channels</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION 4: Stocks are near end in demand. */}
      {/* ============================================================== */}
      <div className="bg-white border border-[#e4e4e7] rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#f4f4f5]">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#f4f4f5] text-[#18181b]">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#09090b] tracking-tight">
                Stocks Near End in Demand
              </h2>
            </div>
            <p className="text-xs text-[#71717a] mt-0.5">
              High-demand products with low or depleted stock. Reorder immediately to avoid lost revenue.
            </p>
          </div>

          <span className="text-[11px] font-mono text-[#52525b] bg-[#f4f4f5] px-2.5 py-1 rounded-md border border-[#e4e4e7] font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
            <span>3 Shortage Risks</span>
          </span>
        </div>

        {/* Shortage Cards */}
        <div className="space-y-3">
          {stocksNearEnd.map((item) => (
            <div
              key={item.sku}
              className="p-4 rounded-xl border border-[#e4e4e7] bg-[#fafafa] hover:border-[#18181b] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
            >
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                      item.status === 'CRITICAL' || item.status === 'OUT_OF_STOCK'
                        ? 'bg-rose-50 text-rose-700 border-rose-200'
                        : 'bg-[#f4f4f5] text-[#52525b] border-[#e4e4e7]'
                    }`}
                  >
                    {item.statusLabel}
                  </span>
                  <span className="text-xs font-mono text-[#71717a]">
                    SKU: {item.sku}
                  </span>
                </div>

                <div className="text-sm font-bold text-[#09090b]">
                  {item.name}
                </div>

                <div className="text-xs text-[#52525b] flex flex-wrap items-center gap-3">
                  <span>
                    Current Stock: <strong className="text-[#09090b]">{item.currentStock} units</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Demand Velocity: <strong className="text-[#09090b]">{item.demandRate}</strong>
                  </span>
                  <span>•</span>
                  <span className="text-rose-700 font-semibold font-mono">
                    Est. Lost Revenue: ~₹{(item.lostGmvPerDay).toLocaleString('en-IN')}/day
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                onClick={() => handleReorder(item.id, item.name, item.recommendedReorder)}
                className="w-full sm:w-auto px-4 py-2.5 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-2xs shrink-0 bg-[#18181b] hover:bg-[#27272a] text-white cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Reorder +{item.recommendedReorder} Units from Supplier</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Global AI Product Studio Modal */}
      <AIProductStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        onProductCreated={() => {
          loadData();
          setActionSuccess('✓ Product created and published to catalog with 4K studio assets!');
        }}
      />

      {/* Product Detail Modal: Description, Marketplaces & AI Recommendations */}
      <ProductDetailModal
        product={selectedProductDetail}
        isOpen={!!selectedProductDetail}
        onClose={() => setSelectedProductDetail(null)}
        onActionComplete={(msg) => {
          setActionSuccess(msg);
          loadData();
        }}
      />
      </div>
    </div>
  );
}
