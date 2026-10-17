'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  RefreshCw,
  AlertCircle,
  Tag,
  Lock,
  Layers,
  ArrowRight,
  Wand2,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useMerchant } from '@/lib/MerchantContext';
import { api, formatPaise, formatPercent } from '@/lib/api';
import { AIProductStudioModal } from '@/components/products/AIProductStudioModal';
import { ProductDetailModal } from '@/components/products/ProductDetailModal';

export default function ProductsPage() {
  const { currentMerchant } = useMerchant();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getProducts(currentMerchant.id);
      setProducts(res.products || res || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [currentMerchant.id]);

  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category)))];
  const filtered = selectedCategory === 'ALL'
    ? products
    : products.filter((p) => p.category === selectedCategory);

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 py-4 space-y-6">
      {/* Header with Vyapar Mitra Branding */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#e4e4e7]">
        <div className="flex items-center gap-3">
          <img
            src="/vyapar_mitra_logo.png"
            alt="Vyapar Mitra"
            className="h-10 sm:h-11 w-auto object-contain"
          />
          <div className="h-6 w-[1px] bg-[#e4e4e7] hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-semibold text-[#080808] bg-[#f4f4f5] px-2 py-0.5 rounded border border-[#e4e4e7]">
                LIVE INVENTORY
              </span>
              <span className="text-xs text-[#71717a]">
                Wholesale & Margins
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#080808] tracking-tight mt-0.5">
              Product Catalog
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsStudioOpen(true)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold bg-[#080808] text-white rounded-lg hover:bg-[#27272a] transition-all shadow-xs"
          >
            <Wand2 className="w-3.5 h-3.5 text-amber-300" />
            <span>+ Add New Product</span>
          </button>
          <button
            onClick={loadProducts}
            disabled={loading}
            className="p-2 sm:px-3 sm:py-2 text-xs font-medium border border-[#d4d4d8] text-[#52525b] rounded-lg hover:bg-[#f4f4f5] transition-colors"
            title="Refresh Catalog"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Banner Strip */}
      <div className="relative w-full h-24 sm:h-32 rounded-[10px] overflow-hidden border border-[#e4e4e7] shadow-xs">
        <img
          src="/catalog_banner.jpg"
          alt="Vyapar Mitra Apparel Collection"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent flex flex-col justify-center px-5 sm:px-8 text-white">
          <span className="text-[10px] font-mono tracking-widest text-amber-300 uppercase font-semibold">
            Merchant Inventory & Economics
          </span>
          <h2 className="text-base sm:text-xl font-bold tracking-tight text-white mt-0.5">
            Active Catalog — Vyapar Mitra Collection
          </h2>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3.5 rounded-[8px] bg-emerald-50 border border-emerald-300 text-xs font-semibold text-emerald-900 flex items-center gap-2 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-[4px] border border-rose-300 bg-rose-50 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-medium text-[#5a5a5a] mr-1">Category:</span>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 text-xs rounded-[4px] font-medium border transition-colors ${
              selectedCategory === cat
                ? 'bg-[#146ef5] text-white border-[#146ef5]'
                : 'bg-white text-[#5a5a5a] border-[#d8d8d8] hover:border-[#bdbdbd]'
            }`}
          >
            {cat === 'ALL' ? 'All Products' : cat.replace(/_/g, ' ').toUpperCase()}
          </button>
        ))}
      </div>

      {/* Catalog Table */}
      <div className="studio-card overflow-hidden">
        <div className="p-4 border-b border-[#d8d8d8] flex items-center justify-between bg-[#f0f0f0]">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#080808]">
              Active Merchant Products ({filtered.length})
            </h3>
            <p className="text-[11px] text-[#5a5a5a]">
              Tap any row to view complete description, marketplace placements, and tailored recommendations.
            </p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-[#5a5a5a]">
            <Lock className="w-3.5 h-3.5 text-amber-700" />
            <span className="font-semibold text-amber-800">COGS Firewalled from AI Buyers</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#ffffff] text-[#5a5a5a] font-semibold border-b border-[#d8d8d8]">
              <tr>
                <th className="py-2.5 px-3">SKU & Title</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Physical Stock</th>
                <th className="py-2.5 px-3">Reserved</th>
                <th className="py-2.5 px-3">List Price</th>
                <th className="py-2.5 px-3">Wholesale COGS</th>
                <th className="py-2.5 px-3">Gross Margin</th>
                <th className="py-2.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d8d8d8]">
              {filtered.map((p) => {
                const margin = p.price_paise > 0
                  ? ((p.price_paise - p.cost_paise) / p.price_paise) * 100
                  : 0;
                return (
                  <tr
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className="hover:bg-[#f8fafc] active:bg-[#f1f5f9] cursor-pointer transition-colors group"
                    title="Click to view complete description, marketplaces, and AI recommendations"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={p.attributes?.refined_photo_url ||
                            (p.name?.toLowerCase().includes('oxford') || p.name?.toLowerCase().includes('white') ? '/clothing/white_oxford.jpg' :
                             p.name?.toLowerCase().includes('navy') ? '/clothing/navy_shirt.jpg' :
                             p.name?.toLowerCase().includes('linen') || p.name?.toLowerCase().includes('olive') ? '/clothing/linen_shirt.jpg' :
                             p.name?.toLowerCase().includes('khaki') || p.name?.toLowerCase().includes('chino') ? '/clothing/khaki_chino.jpg' :
                             p.name?.toLowerCase().includes('grey') || p.name?.toLowerCase().includes('charcoal') ? '/clothing/grey_trouser.jpg' :
                             '/clothing/black_trouser.jpg')}
                          alt={p.name}
                          className="w-10 h-10 rounded-md object-cover bg-white border border-[#e4e4e7] shrink-0 group-hover:border-[#146ef5] transition-colors"
                        />
                        <div>
                          <div className="font-semibold text-[#080808] group-hover:text-[#146ef5] transition-colors">
                            {p.name}
                          </div>
                          <div className="font-mono text-[10px] text-[#71717a]">{p.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-[#5a5a5a]">
                      {p.category}
                    </td>
                    <td className="py-3 px-3 font-semibold text-[#080808]">
                      {p.inventory_quantity} units
                    </td>
                    <td className="py-3 px-3 text-amber-700 font-medium">
                      {p.reserved_quantity || 0}
                    </td>
                    <td className="py-3 px-3 font-bold text-[#080808]">
                      {formatPaise(p.price_paise)}
                    </td>
                    <td className="py-3 px-3 font-mono text-[#5a5a5a]">
                      {formatPaise(p.cost_paise)}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-700">
                      {margin.toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#146ef5] bg-blue-50 px-2 py-1 rounded border border-blue-200 group-hover:bg-[#146ef5] group-hover:text-white transition-all">
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Detail Modal: Description, Marketplaces & AI Recommendations */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onActionComplete={(msg) => {
          setToastMsg(msg);
          loadProducts();
        }}
      />

      {/* Multimodal AI Product Studio Modal */}
      <AIProductStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        onProductCreated={loadProducts}
      />
    </div>
  );
}
