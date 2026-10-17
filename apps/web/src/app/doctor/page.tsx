'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Stethoscope,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  TrendingDown,
  Info,
  DollarSign,
  PackageCheck
} from 'lucide-react';
import { useMerchant } from '@/lib/MerchantContext';
import { api, formatPaise } from '@/lib/api';

export default function GrowthDoctorPage() {
  const { currentMerchant } = useMerchant();
  const [findings, setFindings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadFindings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDoctorFindings(currentMerchant.id);
      setFindings(res.findings || []);
    } catch (err: any) {
      setError(err.message || 'Failed to execute Growth Doctor audit');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFindings();
  }, [currentMerchant.id]);

  const handleProposeAction = async (findingId: string) => {
    setActionLoadingId(findingId);
    try {
      await api.proposeDoctorAction(currentMerchant.id, findingId);
      await loadFindings();
    } catch (err: any) {
      alert('Failed to queue action: ' + err.message);
    } finally {
      setActionLoadingId(null);
    }
  };

  const totalImpactPaise = findings.reduce((sum, f) => sum + (f.rupee_impact_paise || 0), 0);

  return (
    <div className="w-full px-2 sm:px-4 md:px-6 py-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#d8d8d8]">
        <div className="flex items-center gap-3">
          <img
            src="/vyapar_mitra_logo.png"
            alt="Vyapar Mitra"
            className="h-10 sm:h-11 w-auto object-contain"
          />
          <div className="h-6 w-[1px] bg-[#e4e4e7] hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[11px] font-semibold text-[#146ef5] bg-[#eff6ff] px-2 py-0.5 rounded-[4px] border border-[#146ef5]/20">
                COMMERCIAL DIAGNOSTICS
              </span>
              <span className="text-xs text-[#5a5a5a]">
                Deterministic Profit Leak Audit
              </span>
            </div>
            <h1 className="text-xl md:text-2xl font-semibold text-[#080808] tracking-tight mt-0.5">
              Growth Doctor
            </h1>
            <p className="text-xs md:text-sm text-[#5a5a5a] mt-0.5 max-w-3xl leading-relaxed">
              Uncovers hidden margin leaks, dead stock, and pricing opportunities backed by mathematical proof and transaction evidence.
            </p>
          </div>
        </div>

        <button
          onClick={loadFindings}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[#146ef5] text-white rounded-[4px] hover:bg-[#1366e2] self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Re-run Diagnostic Audit</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-[4px] border border-rose-300 bg-rose-50 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Aggregate Impact Banner */}
      <div className="studio-card p-6 bg-[#f0f0f0] border-[#d8d8d8] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-[#5a5a5a] uppercase tracking-wider">
            Total Diagnosed Commercial Opportunity
          </span>
          <div className="text-3xl font-bold text-[#080808] mt-1 tabular-nums">
            {formatPaise(totalImpactPaise)}
          </div>
          <p className="text-xs text-[#5a5a5a] mt-0.5">
            Combined trapped capital, discount leakage, and unrealized price gap across catalog.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/policies"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-[#d8d8d8] bg-white text-[#080808] rounded-[4px] hover:bg-[#f0f0f0]"
          >
            <span>Review Pending Approvals Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Findings Cards */}
      <div className="space-y-6">
        {findings.map((f, idx) => {
          const isDeadStock = f.category === 'DEAD_STOCK';
          const isLeakage = f.category === 'MARGIN_LEAKAGE';
          const isUnderpriced = f.category === 'UNDERPRICED';

          return (
            <div key={f.id} className="studio-card p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#d8d8d8]">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-[4px] bg-[#f0f0f0] border border-[#d8d8d8] flex items-center justify-center font-bold text-xs text-[#080808]">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-semibold text-[#5a5a5a] uppercase">
                        {f.category.replace('_', ' ')}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-[2px] bg-white border border-[#d8d8d8] font-mono text-[#5a5a5a]">
                        CONFIDENCE: {f.confidence}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-[#080808] mt-0.5">
                      {f.title}
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <div className="text-right">
                    <span className="text-[10px] text-[#5a5a5a] block uppercase font-medium">Estimated Impact</span>
                    <span className="text-base font-bold text-[#146ef5] tabular-nums">
                      {f.rupee_impact_formatted}
                    </span>
                  </div>
                </div>
              </div>

              {/* Description & Method */}
              <div className="space-y-2">
                <p className="text-xs text-[#5a5a5a] leading-relaxed">
                  {f.description}
                </p>
                <div className="p-3 bg-[#f0f0f0] border border-[#d8d8d8] rounded-[4px] text-xs font-mono text-[#080808]">
                  <span className="font-semibold text-[#5a5a5a]">Calculation Method: </span>
                  {f.method_note}
                </div>
              </div>

              {/* Evidence Rows Table */}
              {f.evidence_rows && f.evidence_rows.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-[#080808]">Audit Evidence Rows:</span>
                  <div className="overflow-x-auto border border-[#d8d8d8] rounded-[4px]">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#f0f0f0] text-[#5a5a5a] border-b border-[#d8d8d8]">
                        <tr>
                          {Object.keys(f.evidence_rows[0]).map((key) => (
                            <th key={key} className="py-2 px-3 font-semibold uppercase text-[10px]">
                              {key.replace(/_/g, ' ')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#d8d8d8]">
                        {f.evidence_rows.map((row: any, rIdx: number) => (
                          <tr key={rIdx} className="hover:bg-[#f0f0f0]">
                            {Object.values(row).map((val: any, cIdx: number) => (
                              <td key={cIdx} className="py-2 px-3 font-mono text-[11px] text-[#080808]">
                                {typeof val === 'number' && keyLooksLikePaise(Object.keys(row)[cIdx])
                                  ? formatPaise(val)
                                  : String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Action Proposal Footer */}
              <div className="pt-3 border-t border-[#d8d8d8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs text-[#5a5a5a] flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#146ef5]" />
                  <span>
                    Action Type: <code className="font-mono text-[#080808]">{f.recommended_action_type}</code>
                  </span>
                </div>

                {f.status === 'DETECTED' ? (
                  <button
                    onClick={() => handleProposeAction(f.id)}
                    disabled={actionLoadingId === f.id}
                    className="px-4 py-2 text-xs font-semibold bg-[#146ef5] text-white rounded-[4px] hover:bg-[#1366e2] disabled:opacity-50 transition-colors"
                  >
                    {actionLoadingId === f.id ? 'Creating Proposal...' : 'Propose Action for Owner Approval'}
                  </button>
                ) : (
                  <span className="px-3 py-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-[4px]">
                    Action Queued in Approvals Queue
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function keyLooksLikePaise(key: string): boolean {
  return key.endsWith('_paise') || key.includes('cost') || key.includes('price') || key.includes('gain') || key.includes('leakage');
}
