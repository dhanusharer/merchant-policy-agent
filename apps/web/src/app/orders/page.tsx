'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CreditCard,
  RefreshCw,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api, formatPaise, formatDateTime, getOutcomeStatusBadge } from '@/lib/api';

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getOrders(50, 0);
      setOrders(res.items || res || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#d8d8d8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-semibold text-[#146ef5] bg-[#eff6ff] px-2 py-0.5 rounded-[4px] border border-[#146ef5]/20">
              PAYMENT TRUTH SUBSTRATE
            </span>
            <span className="text-xs text-[#5a5a5a]">
              Razorpay Test Mode Order Ledger
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#080808] tracking-tight mt-1">
            Orders & Razorpay Payments
          </h1>
          <p className="text-xs md:text-sm text-[#5a5a5a] mt-0.5 max-w-3xl leading-relaxed">
            Real-time synchronization with Razorpay Orders API. Every payment is cryptographically verified via HMAC-SHA256 webhook signatures before training the reinforcement learner.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <a
            href="http://127.0.0.1:8000/test-checkout"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#146ef5] text-white rounded-[4px] hover:bg-[#1366e2] transition-colors"
          >
            <span>Open Razorpay Test Checkout</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            onClick={loadOrders}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#d8d8d8] text-[#080808] rounded-[4px] hover:bg-[#f0f0f0]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-[4px] border border-rose-300 bg-rose-50 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Info Banner */}
      <div className="studio-card p-4 bg-[#eff6ff] border-[#146ef5]/30 flex items-start gap-3 text-xs">
        <ShieldCheck className="w-5 h-5 text-[#146ef5] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-[#146ef5]">Authoritative Ground Truth Invariant</div>
          <p className="text-[#5a5a5a] leading-relaxed">
            Simulated clicks or abandoned carts never train the commercial policy bandit. Only verified <code>payment.captured</code> webhook outcomes calculate financial contribution and update model weights.
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="studio-card overflow-hidden">
        <div className="p-4 border-b border-[#d8d8d8] flex items-center justify-between bg-[#f0f0f0]">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#080808]">
              Razorpay Synchronized Orders ({orders.length})
            </h3>
            <p className="text-[11px] text-[#5a5a5a]">
              Tracked against official Razorpay Test API order identifiers.
            </p>
          </div>
          <span className="font-mono text-xs text-[#5a5a5a]">CURRENCY: INR</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#ffffff] text-[#5a5a5a] font-semibold border-b border-[#d8d8d8]">
              <tr>
                <th className="py-2.5 px-3">Internal Order ID</th>
                <th className="py-2.5 px-3">Razorpay Order ID</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Created</th>
                <th className="py-2.5 px-3 text-right">Interactive Pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d8d8d8]">
              {orders.length > 0 ? (
                orders.map((o) => {
                  const badge = getOutcomeStatusBadge(o.status);
                  return (
                    <tr key={o.id} className="hover:bg-[#f0f0f0] transition-colors">
                      <td className="py-3 px-3 font-mono font-medium text-[#080808]">
                        {o.id}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#5a5a5a]">
                        {o.razorpay_order_id || '—'}
                      </td>
                      <td className="py-3 px-3 font-bold text-[#080808]">
                        {formatPaise(o.amount_paise)}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-semibold ${
                          o.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-[#f0f0f0] text-[#5a5a5a] border border-[#d8d8d8]'
                        }`}>
                          {o.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#5a5a5a] font-mono text-[11px]">
                        {formatDateTime(o.created_at)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {o.razorpay_order_id ? (
                          <a
                            href={`http://127.0.0.1:8000/test-checkout?order_id=${encodeURIComponent(o.razorpay_order_id)}&amount=${o.amount_paise}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#146ef5] hover:underline"
                          >
                            <span>Pay in Test Mode</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : (
                          <span className="text-[#5a5a5a] text-[11px]">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#5a5a5a]">
                    No orders created yet. Complete a checkout in the Sales Agent or via MCP to generate Razorpay orders.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
