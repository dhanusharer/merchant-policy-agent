'use client';

import React, { useState, useEffect } from 'react';
import {
  Package,
  RefreshCw,
  AlertCircle,
  Tag,
  Lock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useMerchant } from '@/lib/MerchantContext';
import { api, formatPaise, formatPercent } from '@/lib/api';

export default function ProductsPage() {
  const { currentMerchant } = useMerchant();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

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
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#d8d8d8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-semibold text-[#146ef5] bg-[#eff6ff] px-2 py-0.5 rounded-[4px] border border-[#146ef5]/20">
              OWNER INVENTORY & COGS
            </span>
            <span className="text-xs text-[#5a5a5a]">
              Wholesale Economics View
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#080808] tracking-tight mt-1">
            Merchant Product Catalog
          </h1>
          <p className="text-xs md:text-sm text-[#5a5a5a] mt-0.5 max-w-3xl leading-relaxed">
            Authorized merchant inventory with wholesale COGS and margin floors. (COGS is strictly concealed from external AI buyers by the egress firewall).
          </p>
        </div>

        <button
          onClick={loadProducts}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#146ef5] text-white rounded-[4px] hover:bg-[#1366e2] self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Catalog</span>
        </button>
      </div>

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
              All amounts in exact integer paise. Stock reservations audited atomically.
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
                <th className="py-2.5 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d8d8d8]">
              {filtered.map((p) => {
                const margin = p.price_paise > 0
                  ? ((p.price_paise - p.cost_paise) / p.price_paise) * 100
                  : 0;
                return (
                  <tr key={p.id} className="hover:bg-[#f0f0f0] transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#080808]">{p.name}</div>
                      <div className="font-mono text-[10px] text-[#5a5a5a]">{p.sku}</div>
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
                      {p.inventory_quantity > 0 ? (
                        <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-[4px] text-[10px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                          OUT OF STOCK
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
