'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  History,
  RefreshCw,
  X,
  Lock,
  Copy,
  Check,
  Layers,
  Info,
  Sparkles
} from 'lucide-react';
import { useMerchant } from '@/lib/MerchantContext';
import { api, formatPaise, formatDateTime } from '@/lib/api';
import { PolicyManagement, PolicyVersionItem } from '@/lib/types';

function getHumanStrategyName(strategyType?: string | null, isActiveBaseline?: boolean): string {
  if (!strategyType) return 'Commercial Strategy';
  switch (strategyType) {
    case 'NO_OFFER':
      return isActiveBaseline ? 'NO_OFFER — Active Baseline' : 'No Offer Baseline Policy';
    case 'COMPLEMENTARY_BUNDLE':
      return 'Complementary Bundle Offer';
    case 'BOUNDED_DISCOUNT':
      return 'Bounded Discount Strategy';
    case 'ALTERNATIVE_PRODUCT':
      return 'Alternative Product Strategy';
    case 'SINGLE_PRODUCT':
      return 'Single Product Strategy';
    default:
      return strategyType.replace(/_/g, ' ');
  }
}

export default function PoliciesPage() {
  const { currentMerchant } = useMerchant();
  const [data, setData] = useState<PolicyManagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal State
  const [modalType, setModalType] = useState<'PROMOTE' | 'ROLLBACK' | null>(null);
  const [targetPolicy, setTargetPolicy] = useState<PolicyVersionItem | null>(null);
  const [rationale, setRationale] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadPolicies = () => {
    setLoading(true);
    setError(null);
    api.getPolicies(currentMerchant.id)
      .then((res) => setData(res))
      .catch((err) => setError(err.message || 'Failed to load policy management'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPolicies();
  }, [currentMerchant.id]);

  const copyToClipboard = (text?: string | null, label?: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(label || text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenAction = (type: 'PROMOTE' | 'ROLLBACK', item: PolicyVersionItem) => {
    setModalType(type);
    setTargetPolicy(item);
    setRationale(type === 'ROLLBACK' ? 'Rollback via Merchant Control Center' : 'Promoted based on verified evidence');
    setModalError(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && modalType) {
        setModalType(null);
        setTargetPolicy(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalType]);

  const handleConfirmAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetPolicy || !modalType) return;
    setSubmitting(true);
    setModalError(null);

    try {
      if (modalType === 'ROLLBACK') {
        const expectedCurrent = data?.active_policy?.policy_id;
        const res = await api.rollbackPolicy(currentMerchant.id, targetPolicy.policy_id, rationale, expectedCurrent);
        setActionSuccess(`Policy rolled back to ${targetPolicy.policy_id} (Audit Event: ${res.audit_event_id})`);
      } else {
        const expectedPrev = data?.active_policy?.policy_id;
        const res = await api.promotePolicy(currentMerchant.id, targetPolicy.policy_id, rationale, expectedPrev);
        setActionSuccess(`Policy promotion evaluated: ${res.message} (Audit Event: ${res.audit_event_id})`);
      }
      setModalType(null);
      setTargetPolicy(null);
      loadPolicies();
    } catch (err: any) {
      if (err.status === 409 || err.message?.includes('conflict')) {
        setModalError(`State Conflict: Active policy has changed since this page loaded (${err.message}). Refreshing policy state...`);
        loadPolicies();
      } else {
        setModalError(err.message || 'Operation failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const isActiveNoOffer = data?.active_policy?.strategy_type === 'NO_OFFER' || !data?.active_policy?.promoted_at;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="stripe-tag bg-[#f8fafd] border border-[#e5edf5] text-[#533afd] font-mono text-[11px]">
              TENANT: {currentMerchant.id}
            </span>
            <span className="stripe-tag bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-medium">
              TEST MODE
            </span>
            <span className="text-xs text-[#64748d]">Authoritative Phase 8.8 Policy Lifecycle</span>
          </div>
          <h1 className="text-3xl font-light text-[#061b31] tracking-tight mt-1.5">
            Commercial Policy Lifecycle
          </h1>
          <p className="text-sm text-[#50617a] font-normal mt-1 leading-relaxed">
            Manage, evaluate, and safely rollback commercial policies. Transitions are evidence-gated with atomic database locks and point-in-time safety clearance.
          </p>
        </div>

        <button
          onClick={loadPolicies}
          disabled={loading}
          className="stripe-btn-ghost flex items-center gap-1.5 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-lg border border-emerald-200 bg-emerald-50 text-xs text-emerald-800 flex items-center justify-between shadow-xs">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-900 font-medium cursor-pointer">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-800 shadow-xs">
          {error}
        </div>
      )}

      {/* 1. Active Policy Status Card */}
      <div className="stripe-card p-6 bg-gradient-to-r from-white to-[#f8fafd] border border-[#e5edf5] rounded-xl shadow-xs">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#e8e9ff] border border-[#b9b9f9] flex items-center justify-center text-[#533afd] shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#64748d] uppercase tracking-wider font-semibold">
                  Currently Active Policy
                </span>
                <span className="stripe-tag bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">
                  {data?.active_policy?.lifecycle_status || 'ACTIVE'}
                </span>
                <span className="stripe-tag bg-[#f8fafd] text-[#50617a] border border-[#e5edf5] text-[10px]">
                  TEST MODE
                </span>
              </div>

              {/* Primary Human Headline */}
              <h2 className="text-xl font-semibold text-[#061b31] tracking-tight mt-1">
                {isActiveNoOffer
                  ? 'NO_OFFER — Active Baseline'
                  : `Governed Strategy — ${getHumanStrategyName(data?.active_policy?.strategy_type, true)}`}
              </h2>

              {/* Secondary Technical Identity */}
              <div className="flex items-center gap-2 mt-1 font-mono text-xs text-[#64748d]">
                <span>Policy ID:</span>
                <button
                  onClick={() => copyToClipboard(data?.active_policy?.policy_id, 'active_pol')}
                  className="font-medium text-[#533afd] hover:underline flex items-center gap-1 cursor-pointer"
                  title="Click to copy policy ID"
                >
                  <span>{data?.active_policy?.policy_id || 'cand_base_no_offer'}</span>
                  {copiedId === 'active_pol' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                </button>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right text-xs shrink-0">
            <div className="text-[#64748d]">Contract Version</div>
            <div className="font-mono font-medium text-[#061b31] mt-0.5">
              {data?.active_policy?.policy_version || 'merchant-policy/v1'}
            </div>
          </div>
        </div>

        {/* 4-Metric Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-[#e5edf5] text-xs">
          <div>
            <span className="text-[#64748d]">Lifecycle Role</span>
            <div className="font-semibold text-[#061b31] mt-0.5">
              ACTIVE BASELINE
            </div>
            <div className="text-[10px] text-[#64748d] mt-0.5">
              Governed Baseline (Test Mode)
            </div>
          </div>

          <div>
            <span className="text-[#64748d]">Governing Strategy</span>
            <div className="font-semibold text-[#061b31] mt-0.5">
              {data?.active_policy?.strategy_type || 'NO_OFFER'}
            </div>
            <div className="text-[10px] text-[#64748d] mt-0.5">
              baseline control policy
            </div>
          </div>

          <div>
            <span className="text-[#64748d]">Observed Contribution</span>
            <div className="font-semibold text-emerald-700 mt-0.5 tabular-nums text-sm">
              {formatPaise(data?.active_policy?.observed_contribution_paise)}
            </div>
            <div className="text-[10px] text-[#64748d] mt-0.5">
              {(data?.active_policy?.evidence_count ?? 0) === 0
                ? 'No policy-specific observations'
                : 'Policy-specific attributed'}
            </div>
          </div>

          <div>
            <span className="text-[#64748d]">Evidence Observations</span>
            <div className="font-semibold text-[#061b31] mt-0.5 tabular-nums text-sm">
              {data?.active_policy?.evidence_count ?? 0}
            </div>
            <div className="text-[10px] text-[#64748d] mt-0.5">
              {(data?.active_policy?.evidence_count ?? 0) === 0
                ? 'No policy-specific observations'
                : 'Verified policy-specific observations'}
            </div>
          </div>
        </div>

        {/* Baseline Explanatory Note Callout */}
        <div className="mt-4 pt-3 border-t border-[#e5edf5] flex items-center gap-2 text-xs text-[#50617a]">
          <Info className="w-4 h-4 text-[#533afd] shrink-0" />
          <span>
            <strong className="font-semibold text-[#061b31]">NO_OFFER is the governed baseline control policy.</strong> Learned candidates do not replace the active policy until promotion requirements are satisfied.
          </span>
        </div>
      </div>

      {/* 2. Active vs Learned Mental Model Callout */}
      <div className="stripe-card p-4 bg-[#f8fafd] border border-[#e5edf5] rounded-xl flex items-start gap-3 shadow-xs">
        <div className="w-8 h-8 rounded-lg bg-[#533afd]/10 text-[#533afd] flex items-center justify-center shrink-0 mt-0.5">
          <Layers className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          <h3 className="text-xs font-semibold text-[#061b31] uppercase tracking-wider">
            Learning and activation are separate.
          </h3>
          <p className="text-xs text-[#50617a] leading-relaxed">
            Learned candidates may show promising evidence without becoming the active policy. A candidate becomes active only after the existing governance and promotion criteria are satisfied.
          </p>
        </div>
      </div>

      {/* 3. Compact Visual Lifecycle Legend */}
      <div className="flex flex-wrap items-center gap-2 text-[11px] p-3 bg-white border border-[#e5edf5] rounded-xl shadow-xs">
        <span className="font-semibold text-[#64748d] uppercase tracking-wider text-[10px] mr-1">
          Lifecycle Roles:
        </span>
        <div className="flex items-center gap-1.5">
          <span className="stripe-tag bg-[#e8e9ff] text-[#533afd] border border-[#b9b9f9] text-[10px] font-medium">CANDIDATE</span>
          <span className="text-[#64748d]">Being evaluated</span>
        </div>
        <span className="text-[#cbd5e1]">•</span>
        <div className="flex items-center gap-1.5">
          <span className="stripe-tag bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">ELIGIBLE FOR PROMOTION</span>
          <span className="text-[#64748d]">Passed promotion gates</span>
        </div>
        <span className="text-[#cbd5e1]">•</span>
        <div className="flex items-center gap-1.5">
          <span className="stripe-tag bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">ACTIVE</span>
          <span className="text-[#64748d]">Currently governed</span>
        </div>
        <span className="text-[#cbd5e1]">•</span>
        <div className="flex items-center gap-1.5">
          <span className="stripe-tag bg-[#f8fafd] text-[#64748d] border border-[#e5edf5] text-[10px]">RETIRED</span>
          <span className="text-[#64748d]">No longer active</span>
        </div>
        <span className="text-[#cbd5e1]">•</span>
        <div className="flex items-center gap-1.5">
          <span className="stripe-tag bg-amber-50 text-amber-700 border border-amber-200 text-[10px]">ROLLED BACK</span>
          <span className="text-[#64748d]">Previously active; reverted</span>
        </div>
      </div>

      {/* 4. Policy Version History Table */}
      <div className="stripe-card overflow-hidden border border-[#e5edf5] rounded-xl shadow-xs">
        <div className="p-5 border-b border-[#e5edf5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#f8fafd]">
          <div>
            <h3 className="text-sm font-semibold text-[#061b31]">Policy Version Registry</h3>
            <p className="text-xs text-[#64748d] mt-0.5">
              Registered commercial policies and their current lifecycle state. Candidates require verified evidence and fresh safety checks before promotion.
            </p>
          </div>
          <span className="stripe-tag bg-white text-[#64748d] border border-[#e5edf5] text-[11px] font-mono shrink-0">
            {data?.versions?.length ?? 0} Registered Policies
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafd] border-b border-[#e5edf5] text-[#64748d]">
                <th className="p-3 font-medium">Policy & Strategy</th>
                <th className="p-3 font-medium">Version</th>
                <th className="p-3 font-medium">Lifecycle State</th>
                <th className="p-3 text-right font-medium">Evidence Count</th>
                <th className="p-3 text-right font-medium">Observed Contribution</th>
                <th className="p-3 text-center font-medium">Promotion Criteria</th>
                <th className="p-3 text-right font-medium">Governance Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#64748d]">
                    Loading policy versions...
                  </td>
                </tr>
              ) : data?.versions && data.versions.length > 0 ? (
                data.versions.map((ver) => {
                  const humanTitle = getHumanStrategyName(ver.strategy_type, ver.is_active);
                  const isEligible = ver.promotion_criteria_satisfied || ver.lifecycle_status === 'ELIGIBLE_FOR_PROMOTION';

                  return (
                    <tr key={`${ver.policy_id}_${ver.version_id}`} className="border-b border-[#e5edf5] hover:bg-[#f8fafd] transition-colors">
                      {/* Primary Human Strategy + Secondary Monospace Policy ID */}
                      <td className="p-3">
                        <div className="font-semibold text-[#061b31] text-xs">
                          {humanTitle}
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#64748d] mt-0.5">
                          <span>{ver.policy_id}</span>
                          <button
                            onClick={() => copyToClipboard(ver.policy_id, ver.policy_id)}
                            className="text-[#94a3b8] hover:text-[#533afd] cursor-pointer"
                            title="Copy policy ID"
                          >
                            {copiedId === ver.policy_id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      <td className="p-3 font-mono text-[#64748d] text-[11px] whitespace-nowrap">
                        {ver.version_id}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span
                          className={`stripe-tag text-[10px] font-medium ${
                            ver.is_active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : ver.lifecycle_status === 'RETIRED'
                              ? 'bg-[#f8fafd] text-[#64748d] border border-[#e5edf5]'
                              : ver.lifecycle_status === 'ROLLED_BACK'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : ver.lifecycle_status === 'ELIGIBLE_FOR_PROMOTION'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-[#e8e9ff] text-[#533afd] border border-[#b9b9f9]'
                          }`}
                        >
                          {ver.is_active ? 'ACTIVE' : ver.lifecycle_status}
                        </span>
                      </td>

                      <td className="p-3 text-right tabular-nums font-mono">
                        {ver.evidence_count}
                      </td>

                      <td className="p-3 text-right tabular-nums">
                        <div className="font-medium text-emerald-700">
                          {formatPaise(ver.observed_contribution_paise)}
                        </div>
                        {ver.evidence_count === 0 && (
                          <div className="text-[10px] text-[#94a3b8]">No policy-specific observations</div>
                        )}
                      </td>

                      <td className="p-3 text-center whitespace-nowrap">
                        {ver.is_active ? (
                          <span
                            className="stripe-tag bg-[#f8fafd] text-[#50617a] border border-[#e5edf5] text-[10px] font-medium"
                            title="Root active baseline; exempt from candidate promotion gating"
                          >
                            Baseline — Not Applicable
                          </span>
                        ) : ver.lifecycle_status === 'RETIRED' || ver.lifecycle_status === 'ROLLED_BACK' ? (
                          <span
                            className="stripe-tag bg-[#f8fafd] text-[#64748d] border border-[#e5edf5] text-[10px]"
                            title="Historical version superseded or rolled back"
                          >
                            Historical
                          </span>
                        ) : isEligible ? (
                          <span
                            className="stripe-tag bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium"
                            title="Satisfies Phase 8.8 promotion criteria"
                          >
                            Eligible
                          </span>
                        ) : (
                          <span
                            className="text-[11px] text-[#839bc8] font-medium cursor-help"
                            title="Promotion requires the configured evidence and safety criteria."
                          >
                            Pending Evidence
                          </span>
                        )}
                      </td>

                      {/* Promotion Button Semantics */}
                      <td className="p-3 text-right whitespace-nowrap">
                        {ver.is_active ? (
                          <span className="text-[11px] text-emerald-700 font-medium">Currently Active</span>
                        ) : ver.lifecycle_status === 'RETIRED' || ver.lifecycle_status === 'ROLLED_BACK' ? (
                          <button
                            onClick={() => handleOpenAction('ROLLBACK', ver)}
                            className="stripe-btn-ghost text-xs py-1 px-2.5 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Rollback</span>
                          </button>
                        ) : isEligible ? (
                          <button
                            onClick={() => handleOpenAction('PROMOTE', ver)}
                            className="stripe-btn-primary text-xs py-1 px-3 cursor-pointer"
                          >
                            Promote
                          </button>
                        ) : (
                          <button
                            disabled
                            className="py-1 px-2.5 rounded-lg text-xs bg-[#f8fafd] border border-[#e5edf5] text-[#94a3b8] cursor-not-allowed inline-flex items-center gap-1.5 font-medium transition-colors"
                            title="Requires sufficient verified evidence and successful safety/governance checks."
                            aria-disabled="true"
                          >
                            <Lock className="w-3 h-3 text-[#94a3b8]" />
                            <span>Not Eligible</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#64748d]">
                    No historical policy versions found for this merchant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Policy Lifecycle Governance Audit History */}
      <div className="stripe-card overflow-hidden border border-[#e5edf5] rounded-xl shadow-xs">
        <div className="p-5 border-b border-[#e5edf5] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#f8fafd]">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#533afd]" />
              <h3 className="text-sm font-semibold text-[#061b31]">Lifecycle Governance Audit History</h3>
            </div>
            <p className="text-xs text-[#64748d] mt-0.5">
              Append-only record of promotion evaluations, lifecycle changes, rollbacks, and safety decisions.
            </p>
          </div>
          <span className="stripe-tag bg-white text-[#64748d] border border-[#e5edf5] text-[11px] font-mono shrink-0">
            {data?.recent_transitions?.length ?? 0} Governance Evaluations
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-[#f8fafd] border-b border-[#e5edf5] text-[#64748d]">
                <th className="p-3 font-medium">Evaluation ID</th>
                <th className="p-3 font-medium">Candidate / Target</th>
                <th className="p-3 font-medium">Governance Action</th>
                <th className="p-3 font-medium">Previous Active</th>
                <th className="p-3 font-medium">Resulting Active</th>
                <th className="p-3 font-medium">Audit Rationale & Diagnostics</th>
                <th className="p-3 text-right font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-[#64748d]">Loading transitions...</td>
                </tr>
              ) : data?.recent_transitions && data.recent_transitions.length > 0 ? (
                data.recent_transitions.map((t) => {
                  const isUnchanged = t.from_state === t.to_state || t.action === 'INSUFFICIENT_EVIDENCE';

                  return (
                    <tr key={t.transition_id} className="border-b border-[#e5edf5] hover:bg-[#f8fafd] transition-colors">
                      <td className="p-3 font-mono text-[11px] text-[#533afd] font-medium whitespace-nowrap">{t.transition_id}</td>
                      <td className="p-3 font-mono font-medium text-[#061b31] whitespace-nowrap">{t.policy_id}</td>
                      
                      {/* Preserves authoritative enum while providing clear contextual note */}
                      <td className="p-3 whitespace-nowrap">
                        <span className={`stripe-tag text-[10px] font-medium ${
                          t.action === 'PROMOTED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : t.action === 'ROLLED_BACK'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : t.action === 'CONFLICT'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {t.action}
                        </span>
                        {isUnchanged && (
                          <div className="text-[10px] text-[#64748d] mt-0.5">
                            Promotion rejected; active policy unchanged
                          </div>
                        )}
                        {t.action === 'PROMOTED' && (
                          <div className="text-[10px] text-emerald-700 mt-0.5">
                            Promoted to active policy
                          </div>
                        )}
                        {t.action === 'ROLLED_BACK' && (
                          <div className="text-[10px] text-amber-700 mt-0.5">
                            Reverted to previous policy
                          </div>
                        )}
                      </td>

                      <td className="p-3 font-mono text-[11px] text-[#64748d] whitespace-nowrap">{t.from_state}</td>
                      <td className="p-3 font-mono text-[11px] font-medium text-[#061b31] whitespace-nowrap">{t.to_state}</td>
                      <td className="p-3 text-[#50617a] max-w-xs truncate" title={t.reason}>{t.reason}</td>
                      <td className="p-3 text-right font-mono text-[11px] text-[#64748d] whitespace-nowrap">
                        {formatDateTime(t.timestamp)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-[#64748d]">
                    No governance lifecycle transitions recorded yet for this merchant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      {modalType && targetPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-[2px]" role="dialog" aria-modal="true" aria-label={modalType === 'ROLLBACK' ? 'Confirm Policy Rollback' : 'Confirm Policy Promotion'}>
          <div className="w-full max-w-lg bg-white rounded-xl border border-[#e5edf5] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-semibold text-[#061b31]">
                  {modalType === 'ROLLBACK' ? 'Confirm Policy Rollback' : 'Confirm Policy Promotion'}
                </h3>
                <p className="text-xs text-[#64748d] mt-0.5">
                  Target: <span className="font-mono font-medium text-[#533afd]">{targetPolicy.policy_id}</span> ({getHumanStrategyName(targetPolicy.strategy_type)})
                </p>
              </div>
              <button
                onClick={() => setModalType(null)}
                aria-label="Close modal"
                className="p-1 rounded text-[#64748d] hover:text-[#061b31] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#f8fafd] rounded-lg border border-[#e5edf5] text-xs text-[#50617a] leading-relaxed">
              {modalType === 'ROLLBACK' ? (
                <>
                  <span className="font-semibold text-[#061b31]">Safety Clearance Protocol:</span> Before activation, the authoritative Phase 8.8 lifecycle service will re-verify that target policy passes current inventory and margin compliance rules.
                </>
              ) : (
                <>
                  <span className="font-semibold text-[#061b31]">Evidence-Gated Protocol:</span> The candidate policy will be evaluated against Phase 8.8 promotion thresholds. If evidence criteria are met, it will become the active production policy.
                </>
              )}
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                {modalError}
              </div>
            )}

            <form onSubmit={handleConfirmAction} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#50617a] mb-1">
                  Audit Rationale (Required)
                </label>
                <textarea
                  required
                  rows={3}
                  value={rationale}
                  onChange={(e) => setRationale(e.target.value)}
                  className="w-full text-xs p-2.5 border border-[#e5edf5] rounded-lg focus:outline-none focus:border-[#533afd] font-sans"
                  placeholder="Explain why this action is being taken for immutable audit logs..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="stripe-btn-ghost text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !rationale.trim()}
                  className="stripe-btn-primary text-xs cursor-pointer"
                >
                  {submitting ? 'Executing...' : modalType === 'ROLLBACK' ? 'Execute Safe Rollback' : 'Execute Promotion'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
