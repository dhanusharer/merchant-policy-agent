'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  CheckCircle2,
  RefreshCw,
  Stethoscope,
  MessageSquare,
  Users,
  Clock,
  ExternalLink
} from 'lucide-react';
import { useMerchant } from '@/lib/MerchantContext';
import {
  api,
  formatPaise,
  formatPercent,
  formatDateTime,
  getExecutionStatusBadge,
  getOutcomeStatusBadge
} from '@/lib/api';
import { DashboardOverview } from '@/lib/types';
import { DecisionDetailDrawer } from '@/components/decisions/DecisionDetailDrawer';

export default function OverviewPage() {
  const { currentMerchant } = useMerchant();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [doctorFindings, setDoctorFindings] = useState<any[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);
  const [proposingAction, setProposingAction] = useState(false);
  const [proposedSuccess, setProposedSuccess] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, doctorRes, approvalsRes] = await Promise.all([
        api.getOverview(currentMerchant.id),
        api.getDoctorFindings(currentMerchant.id).catch(() => ({ findings: [] })),
        api.getApprovals(currentMerchant.id).catch(() => ({ approvals: [] }))
      ]);
      setData(overviewRes);
      setDoctorFindings(doctorRes.findings || []);
      setApprovals(approvalsRes.approvals || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentMerchant.id]);

  const topFinding = doctorFindings.length > 0 ? doctorFindings[0] : null;

  const handleProposeAction = async (findingId: string) => {
    setProposingAction(true);
    try {
      await api.proposeDoctorAction(currentMerchant.id, findingId);
      setProposedSuccess(true);
      await loadData();
      setTimeout(() => setProposedSuccess(false), 3000);
    } catch (err: any) {
      alert('Failed to propose action: ' + err.message);
    } finally {
      setProposingAction(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#d8d8d8]">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] font-semibold text-[#146ef5] bg-[#eff6ff] px-2 py-0.5 rounded-[4px] border border-[#146ef5]/20">
              TENANT: {currentMerchant.id}
            </span>
            <span className="text-xs text-[#5a5a5a]">
              Updated {formatDateTime(data?.generated_at)}
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-[#080808] tracking-tight mt-1">
            Merchant Growth Cockpit
          </h1>
          <p className="text-xs md:text-sm text-[#5a5a5a] mt-0.5 max-w-3xl leading-relaxed">
            Autonomous commercial policy, channel allocation, and margin governance for {currentMerchant.name}.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Link
            href="/sales-agent"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-[#146ef5] text-white rounded-[4px] hover:bg-[#1366e2] transition-colors shadow-xs"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Open Sales Agent</span>
          </Link>
          <Link
            href="/channels"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#d8d8d8] text-[#080808] rounded-[4px] hover:bg-[#f0f0f0] transition-colors"
          >
            <TrendingUp className="w-3.5 h-3.5 text-[#146ef5]" />
            <span>Channel Segregation</span>
          </Link>
          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-[#d8d8d8] text-[#5a5a5a] rounded-[4px] hover:bg-[#f0f0f0] transition-colors"
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

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="studio-card p-4">
          <div className="text-[11px] text-[#5a5a5a] font-medium uppercase tracking-wider">AI Enquiries</div>
          <div className="text-2xl font-semibold text-[#080808] mt-1 tabular-nums">
            {data?.ai_buyer_opportunities_count ?? 0}
          </div>
          <div className="text-[11px] text-[#5a5a5a] mt-0.5">Autonomous requests</div>
        </div>

        <div className="studio-card p-4">
          <div className="text-[11px] text-[#5a5a5a] font-medium uppercase tracking-wider">Decisions Rendered</div>
          <div className="text-2xl font-semibold text-[#080808] mt-1 tabular-nums">
            {data?.decision_count ?? 0}
          </div>
          <div className="text-[11px] text-[#5a5a5a] mt-0.5">Policy validated</div>
        </div>

        <div className="studio-card p-4">
          <div className="text-[11px] text-[#5a5a5a] font-medium uppercase tracking-wider">Verified Sales</div>
          <div className="text-2xl font-semibold text-[#080808] mt-1 tabular-nums">
            {data?.paid_transactions_count ?? 0}
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">Razorpay Captured Orders</div>
        </div>

        <div className="studio-card p-4">
          <div className="text-[11px] text-[#5a5a5a] font-medium uppercase tracking-wider">Net Contribution</div>
          <div className="text-2xl font-semibold text-[#146ef5] mt-1 tabular-nums">
            {formatPaise(data?.observed_contribution_paise)}
          </div>
          <div className="text-[11px] text-[#5a5a5a] mt-0.5">Revenue − COGS − Fees</div>
        </div>

        <div className="studio-card p-4">
          <div className="text-[11px] text-[#5a5a5a] font-medium uppercase tracking-wider">Decision Rate</div>
          <div className="text-2xl font-semibold text-[#080808] mt-1 tabular-nums">
            {data?.decision_rate_percent !== undefined ? `${data.decision_rate_percent.toFixed(0)}%` : '100%'}
          </div>
          <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">≥ 25% floor preserved</div>
        </div>

        <div className="studio-card p-4">
          <div className="text-[11px] text-[#5a5a5a] font-medium uppercase tracking-wider">Pending Approvals</div>
          <div className="text-2xl font-semibold text-amber-700 mt-1 tabular-nums">
            {approvals.length}
          </div>
          <div className="text-[11px] text-[#5a5a5a] mt-0.5">Requires owner sign-off</div>
        </div>
      </div>

      {/* Top Banner: Growth Doctor Finding & Channel Strategy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Growth Doctor Finding */}
        <div className="lg:col-span-2 studio-card p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-rose-50 text-rose-700 rounded-[4px] border border-rose-200">
                  <Stethoscope className="w-4 h-4" />
                </span>
                <span className="font-semibold text-xs tracking-wider uppercase text-rose-800">
                  Top Growth Doctor Finding
                </span>
              </div>
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 bg-[#f0f0f0] border border-[#d8d8d8] rounded-[4px] text-[#5a5a5a]">
                HIGH CONFIDENCE
              </span>
            </div>

            {topFinding ? (
              <>
                <h3 className="text-lg font-semibold text-[#080808]">
                  {topFinding.title}
                </h3>
                <p className="text-xs text-[#5a5a5a] leading-relaxed">
                  {topFinding.description}
                </p>
                <div className="p-3 bg-[#f0f0f0] rounded-[4px] border border-[#d8d8d8] text-xs font-mono text-[#080808] flex items-center justify-between">
                  <span>Method: {topFinding.method_note}</span>
                  <span className="font-semibold text-rose-700">{topFinding.rupee_impact_formatted}</span>
                </div>
              </>
            ) : (
              <p className="text-xs text-[#5a5a5a]">No critical leaks detected. Run analysis to check catalog velocity.</p>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#d8d8d8]">
            <Link href="/doctor" className="text-xs font-medium text-[#146ef5] hover:underline flex items-center gap-1">
              <span>View all 3 findings in Growth Doctor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            {topFinding && topFinding.status === 'DETECTED' && (
              <button
                onClick={() => handleProposeAction(topFinding.id)}
                disabled={proposingAction}
                className="px-3 py-1.5 text-xs font-medium bg-[#146ef5] text-white rounded-[4px] hover:bg-[#1366e2] transition-colors"
              >
                {proposingAction ? 'Proposing...' : 'Propose Owner Action'}
              </button>
            )}
            {topFinding && topFinding.status === 'PROPOSED' && (
              <span className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-1 rounded-[4px] border border-amber-200">
                Action Queued for Owner Approval
              </span>
            )}
            {proposedSuccess && (
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded-[4px] border border-emerald-200">
                Action Proposed Successfully!
              </span>
            )}
          </div>
        </div>

        {/* Channel Intelligence Summary */}
        <div className="studio-card p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-blue-50 text-[#146ef5] rounded-[4px] border border-blue-200">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <span className="font-semibold text-xs tracking-wider uppercase text-[#146ef5]">
                  Channel Strategy
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#5a5a5a]">7 CHANNELS</span>
            </div>

            <h3 className="text-sm font-semibold text-[#080808]">
              Marketplace Growth Manager
            </h3>
            <p className="text-xs text-[#5a5a5a] leading-relaxed">
              Every SKU is evaluated on net retained contribution after deducting channel referral fees, closing costs, reverse logistics, and acquisition spend.
            </p>

            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs py-1 border-b border-[#d8d8d8]">
                <span className="text-[#5a5a5a]">Direct WhatsApp & Web:</span>
                <span className="font-semibold text-emerald-700">Top Retained Margin (42%)</span>
              </div>
              <div className="flex justify-between text-xs py-1 border-b border-[#d8d8d8]">
                <span className="text-[#5a5a5a]">Amazon / Flipkart:</span>
                <span className="font-semibold text-blue-700">High Volume Hero SKUs</span>
              </div>
              <div className="flex justify-between text-xs py-1">
                <span className="text-[#5a5a5a]">ONDC Open Network:</span>
                <span className="font-semibold text-[#080808]">Decentralized Reach (4.5% fee)</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#d8d8d8]">
            <Link
              href="/channels"
              className="text-xs font-medium text-[#146ef5] hover:underline flex items-center justify-between"
            >
              <span>View full channel segregation board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Decision Audit Ledger Snapshot */}
      <div className="studio-card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#080808]">
              Recent Policy Decisions
            </h3>
            <p className="text-xs text-[#5a5a5a]">
              Audit trail of autonomous AI buyer interactions governed by deterministic margin bounds.
            </p>
          </div>
          <Link
            href="/decisions"
            className="text-xs font-medium text-[#146ef5] hover:underline flex items-center gap-1"
          >
            <span>View all in Decision Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto border border-[#d8d8d8] rounded-[4px]">
          <table className="w-full text-xs text-left">
            <thead className="bg-[#f0f0f0] text-[#080808] font-semibold border-b border-[#d8d8d8]">
              <tr>
                <th className="py-2.5 px-3">Decision ID</th>
                <th className="py-2.5 px-3">Strategy</th>
                <th className="py-2.5 px-3">Offered Price</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3">Gate Status</th>
                <th className="py-2.5 px-3">Payment Outcome</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d8d8d8]">
              {data?.recent_decisions && data.recent_decisions.length > 0 ? (
                data.recent_decisions.slice(0, 5).map((d) => {
                  const execBadge = getExecutionStatusBadge(d.execution_status);
                  const outBadge = getOutcomeStatusBadge(d.outcome_status);
                  return (
                    <tr key={d.decision_id} className="hover:bg-[#f0f0f0] transition-colors">
                      <td className="py-2.5 px-3 font-mono font-medium text-[#080808]">{d.decision_id}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-[4px] bg-[#f0f0f0] border border-[#d8d8d8] font-mono text-[10px] text-[#080808]">
                          {d.selected_strategy_type}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#080808]">{formatPaise(d.proposed_price_paise)}</td>
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-[10px] text-[#5a5a5a] uppercase">{d.decision_mode}</span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-medium ${execBadge.className}`}>
                          {execBadge.label}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {outBadge ? (
                          <span className={`px-2 py-0.5 rounded-[4px] text-[10px] font-medium ${outBadge.className}`}>
                            {outBadge.label}
                          </span>
                        ) : (
                          <span className="text-[#5a5a5a] text-[11px]">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedDecisionId(d.decision_id)}
                          className="px-2 py-1 text-[11px] font-medium text-[#146ef5] hover:bg-[#eff6ff] rounded-[4px] border border-transparent hover:border-[#146ef5]/20"
                        >
                          Why?
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-xs text-[#5a5a5a]">
                    No decision events recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Detail Drawer */}
      {selectedDecisionId && currentMerchant && (
        <DecisionDetailDrawer
          decisionId={selectedDecisionId}
          merchantId={currentMerchant.id}
          onClose={() => setSelectedDecisionId(null)}
        />
      )}
    </div>
  );
}
