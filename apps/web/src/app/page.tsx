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
  RefreshCw
} from 'lucide-react';
import { useMerchant } from '@/lib/MerchantContext';
import { api, formatPaise, formatPercent, formatDateTime, getExecutionStatusBadge, getOutcomeStatusBadge } from '@/lib/api';
import { DashboardOverview } from '@/lib/types';
import { DecisionDetailDrawer } from '@/components/decisions/DecisionDetailDrawer';

export default function OverviewPage() {
  const { currentMerchant } = useMerchant();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    api.getOverview(currentMerchant.id)
      .then((res) => setData(res))
      .catch((err) => setError(err.message || 'Failed to load dashboard overview'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [currentMerchant.id]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="stripe-tag bg-[#f8fafd] border border-[#e5edf5] text-[#533afd] font-mono text-[11px]">
              TENANT: {currentMerchant.id}
            </span>
            <span className="text-xs text-[#64748d] font-light">
              Updated {formatDateTime(data?.generated_at)}
            </span>
          </div>
          <h1 className="text-3xl font-light text-[#061b31] tracking-tight mt-1.5">
            {data?.status_headline || 'Teach an AI what makes your business win.'}
          </h1>
          <p className="text-sm text-[#50617a] font-normal mt-1 max-w-2xl leading-relaxed">
            {data?.status_subtext || 'Autonomous decision pipeline balancing revenue and margin with point-in-time safety checks and closed-loop learning.'}
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="stripe-btn-ghost flex items-center gap-1.5 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded border border-rose-200 bg-rose-50 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="stripe-card p-4">
          <div className="text-xs text-[#64748d] font-normal">AI Opportunities</div>
          <div className="text-2xl font-light text-[#061b31] mt-1 tabular-nums">
            {data?.ai_buyer_opportunities_count ?? 0}
          </div>
          <div className="text-[11px] text-[#839bc8] mt-1 font-light">Incoming shopping queries</div>
        </div>

        <div className="stripe-card p-4">
          <div className="text-xs text-[#64748d] font-normal">Decisions Evaluated</div>
          <div className="text-2xl font-light text-[#061b31] mt-1 tabular-nums">
            {data?.decision_count ?? 0}
          </div>
          <div className="text-[11px] text-[#839bc8] mt-1 font-light">Canonical decisions rendered</div>
        </div>

        <div className="stripe-card p-4">
          <div className="text-xs text-[#64748d] font-normal">Decision Rate</div>
          <div className="text-2xl font-light text-[#061b31] mt-1 tabular-nums">
            {formatPercent(data?.decision_rate_percent)}
          </div>
          <div className="text-[11px] text-[#839bc8] mt-1 font-light">Opportunities evaluated</div>
        </div>

        <div className="stripe-card p-4">
          <div className="text-xs text-[#64748d] font-normal">Expected Contribution</div>
          <div className="text-2xl font-light text-[#533afd] mt-1 tabular-nums">
            {formatPaise(data?.expected_contribution_paise, data?.currency)}
          </div>
          <div className="text-[11px] text-[#839bc8] mt-1 font-light">Predicted portfolio gain</div>
        </div>

        <div className="stripe-card p-4">
          <div className="text-xs text-[#64748d] font-normal">Test-Mode Observed</div>
          <div className="text-2xl font-light text-emerald-700 mt-1 tabular-nums">
            {formatPaise(data?.test_mode_observed_contribution_paise, data?.currency)}
          </div>
          <div className="text-[11px] text-[#839bc8] mt-1 font-light">Captured test rewards</div>
        </div>

        <div className="stripe-card p-4">
          <div className="text-xs text-[#64748d] font-normal">Paid Transactions</div>
          <div className="text-2xl font-light text-[#061b31] mt-1 tabular-nums">
            {data?.paid_transactions_count ?? 0}
          </div>
          <div className="text-[11px] text-[#839bc8] mt-1 font-light">Settled through Phase 5</div>
        </div>
      </div>

      {/* Two Column Section: Learning Insight & Active Policy */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Top Learned Commercial Signal */}
        <div className="lg:col-span-2 stripe-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#533afd]" />
                <div>
                  <h3 className="text-sm font-medium text-[#061b31]">Top Learned Commercial Signal</h3>
                  <p className="text-[11px] text-[#64748d]">Best performing candidate across explored buyer contexts</p>
                </div>
              </div>
              <span className="stripe-tag bg-[#e8e9ff] text-[#533afd] text-[11px] font-medium">
                TOP CONTEXT SIGNAL
              </span>
            </div>

            {data?.learning_insight ? (
              <div className="space-y-4">
                <p className="text-sm text-[#50617a] leading-relaxed">
                  In category <span className="font-semibold text-[#061b31]">{data.learning_insight.context_description}</span>, the autonomous agent identified <span className="font-semibold text-[#533afd]">{data.learning_insight.observed_preference_strategy}</span> as the superior economic trade-off.
                </p>

                <div className="grid grid-cols-3 gap-4 p-4 rounded bg-[#f8fafd] border border-[#e5edf5] text-xs">
                  <div>
                    <div className="text-[#64748d]">Context Evidence</div>
                    <div className="text-base font-medium text-[#061b31] mt-0.5 tabular-nums">
                      {data.learning_insight.evidence_count} observation
                    </div>
                    <div className="text-[10px] text-[#839bc8] mt-0.5 font-light">For this candidate-context pair</div>
                  </div>
                  <div>
                    <div className="text-[#64748d]">Signal Contribution</div>
                    <div className="text-base font-medium text-emerald-700 mt-0.5 tabular-nums">
                      {formatPaise(data.learning_insight.observed_contribution_paise)}
                    </div>
                    <div className="text-[10px] text-[#839bc8] mt-0.5 font-light">Realized candidate margin</div>
                  </div>
                  <div>
                    <div className="text-[#64748d]">Signal Strength</div>
                    <div className="mt-0.5">
                      <span className="stripe-tag bg-white border border-[#b9b9f9] text-[#533afd] text-[10px] font-medium">
                        {data.learning_insight.evidence_strength} (n={data.learning_insight.evidence_count})
                      </span>
                    </div>
                    <div className="text-[10px] text-[#839bc8] mt-1 font-light">LinUCB explore stage</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#64748d]">
                No observations yet. Learning begins as eligible Test Mode outcomes complete.
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-[#e5edf5] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-[#50617a]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span>Merchant Model Learning: <strong>{data?.total_learning_observations_count ?? 0} applied updates</strong> across <strong>{data?.total_contexts_count ?? data?.learning_insight?.context_coverage_count ?? 0} buyer contexts</strong></span>
            </div>
            <Link href="/learning" className="text-[#533afd] hover:underline flex items-center gap-1 font-medium shrink-0">
              <span>View Learning Center</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Right 1 Col: Active Policy Status */}
        <div className="stripe-card p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <div>
                  <h3 className="text-sm font-medium text-[#061b31]">Active Commercial Policy</h3>
                  <p className="text-[11px] text-[#64748d]">Current governed baseline</p>
                </div>
              </div>
              <span className="stripe-tag bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">
                {data?.active_policy?.lifecycle_status || 'ACTIVE'}
              </span>
            </div>

            {data?.active_policy ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-[#f8fafd] rounded border border-[#e5edf5] font-mono">
                  <div className="text-[10px] text-[#64748d]">Policy ID</div>
                  <div className="font-medium text-[#061b31] mt-0.5">{data.active_policy.policy_id}</div>
                  <div className="text-[10px] text-[#64748d] mt-2">Contract Version</div>
                  <div className="font-medium text-[#061b31] mt-0.5">{data.active_policy.policy_version}</div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between">
                    <span className="text-[#64748d]">Lifecycle Role:</span>
                    <span className="font-medium text-[#061b31]">
                      {data.active_policy.strategy_type === 'ACTIVE_PORTFOLIO' ? 'ACTIVE BASELINE' : data.active_policy.strategy_type}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748d]">Active Policy Contribution:</span>
                    <span className="font-medium text-emerald-700 tabular-nums">
                      {formatPaise(data.active_policy.observed_contribution_paise)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748d]">Active Policy Evidence:</span>
                    <span className="font-medium text-[#061b31] tabular-nums">
                      {data.active_policy.evidence_count} observations
                    </span>
                  </div>
                </div>

                <div className="p-2.5 bg-[#f8fafd] rounded border border-[#e5edf5] text-[11px] text-[#64748d] leading-relaxed">
                  Baseline control policy issues zero promotional discounts. Active exploration can discover higher-yield candidates without changing this baseline until governed promotion criteria are satisfied.
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-[#64748d]">
                No active policy pointer found.
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-[#e5edf5]">
            <Link href="/policies" className="text-xs text-[#533afd] hover:underline flex items-center justify-between font-medium">
              <span>Inspect Policy Lifecycle</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Attention Required Items */}
      {data?.attention_items && data.attention_items.length > 0 && (
        <div className="stripe-card p-5 border-amber-200 bg-amber-50/40">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-medium text-amber-950">Attention Required</h3>
          </div>
          <div className="space-y-2">
            {data.attention_items.map((item) => (
              <div key={item.id} className="p-3 bg-white rounded border border-amber-200 text-xs flex justify-between items-center">
                <div>
                  <div className="font-medium text-[#061b31]">{item.title}</div>
                  <div className="text-[#50617a] mt-0.5">{item.description}</div>
                </div>
                {item.action_hint && (
                  <span className="stripe-tag bg-amber-100 text-amber-900 text-[10px] font-medium">
                    {item.action_hint}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Decisions Table */}
      <div className="stripe-card overflow-hidden">
        <div className="p-5 border-b border-[#e5edf5] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-[#061b31]">Recent Autonomous Decisions</h3>
            <p className="text-xs text-[#64748d] mt-0.5">Click any row to open the complete 11-stage lineage and confidential economic inspection.</p>
          </div>
          <Link href="/decisions" className="stripe-btn-ghost text-xs">
            View All Decisions
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafd] border-b border-[#e5edf5] text-[#64748d]">
                <th className="p-3">Decision ID</th>
                <th className="p-3">Opportunity</th>
                <th className="p-3">Mode</th>
                <th className="p-3">Strategy</th>
                <th className="p-3 text-right">Proposed Price</th>
                <th className="p-3 text-center">Execution</th>
                <th className="p-3 text-center">Outcome</th>
                <th className="p-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {data?.recent_decisions && data.recent_decisions.length > 0 ? (
                data.recent_decisions.map((dec) => (
                  <tr
                    key={dec.decision_id}
                    onClick={() => setSelectedDecisionId(dec.decision_id)}
                    className="border-b border-[#e5edf5] hover:bg-[#f8fafd] cursor-pointer transition-colors"
                  >
                    <td className="p-3 font-mono text-[#533afd] font-medium">{dec.decision_id}</td>
                    <td className="p-3 font-mono text-[#64748d]">{dec.opportunity_id}</td>
                    <td className="p-3">
                      <span className="stripe-tag bg-[#e8e9ff] text-[#533afd] text-[10px] font-medium">
                        {dec.decision_mode}
                      </span>
                    </td>
                    <td className="p-3 text-[#061b31]">{dec.selected_strategy_type}</td>
                    <td className="p-3 text-right font-medium text-[#061b31] tabular-nums">
                      {formatPaise(dec.proposed_price_paise)}
                    </td>
                    <td className="p-3 text-center">
                      {(() => {
                        const badge = getExecutionStatusBadge(dec.execution_status);
                        return (
                          <span className={`stripe-tag ${badge.className} text-[10px]`}>
                            {badge.label}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-3 text-center">
                      {(() => {
                        const badge = getOutcomeStatusBadge(dec.outcome_status);
                        return badge ? (
                          <span className={`stripe-tag ${badge.className} text-[10px]`}>
                            {badge.label}
                          </span>
                        ) : (
                          <span className="text-[#839bc8] text-[10px]">—</span>
                        );
                      })()}
                    </td>
                    <td className="p-3 text-right text-[#64748d] font-mono text-[11px]">
                      {formatDateTime(dec.created_at)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#64748d]">
                    No decisions evaluated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decision Detail Drawer */}
      <DecisionDetailDrawer
        decisionId={selectedDecisionId}
        merchantId={currentMerchant.id}
        onClose={() => setSelectedDecisionId(null)}
      />
    </div>
  );
}
