'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  History,
  RefreshCw,
  X
} from 'lucide-react';
import { useMerchant } from '@/lib/MerchantContext';
import { api, formatPaise, formatDateTime } from '@/lib/api';
import { PolicyManagement, PolicyVersionItem } from '@/lib/types';

export default function PoliciesPage() {
  const { currentMerchant } = useMerchant();
  const [data, setData] = useState<PolicyManagement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

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

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="stripe-tag bg-[#f8fafd] border border-[#e5edf5] text-[#533afd] font-mono text-[11px]">
              TENANT: {currentMerchant.id}
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
        <div className="p-4 rounded border border-emerald-200 bg-emerald-50 text-xs text-emerald-800 flex items-center justify-between">
          <span>{actionSuccess}</span>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-900 font-medium">Dismiss</button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded border border-rose-200 bg-rose-50 text-xs text-rose-800">
          {error}
        </div>
      )}

      {/* Active Policy Status Card */}
      <div className="stripe-card p-6 bg-gradient-to-r from-white to-[#f8fafd]">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#e8e9ff] border border-[#b9b9f9] flex items-center justify-center text-[#533afd]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#64748d] uppercase tracking-wider font-medium">Currently Active Policy</span>
                <span className="stripe-tag bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium">
                  {data?.active_policy?.lifecycle_status || 'ACTIVE'}
                </span>
                <span className="stripe-tag bg-[#f8fafd] text-[#50617a] border border-[#e5edf5] text-[10px]">
                  TEST MODE
                </span>
              </div>
              <h2 className="text-lg font-medium text-[#061b31] font-mono mt-0.5" title={data?.active_policy?.policy_id}>
                {data?.active_policy?.policy_id || 'No Active Policy Pointer'}
              </h2>
            </div>
          </div>

          <div className="text-right text-xs">
            <div className="text-[#64748d]">Contract Version</div>
            <div className="font-mono font-medium text-[#061b31] mt-0.5">
              {data?.active_policy?.policy_version || 'merchant-policy/v1'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-4 border-t border-[#e5edf5] text-xs">
          <div>
            <span className="text-[#64748d]">Lifecycle Role</span>
            <div className="font-medium text-[#061b31] mt-0.5">
              ACTIVE BASELINE
            </div>
            <div className="text-[10px] text-[#64748d] mt-0.5">
              Governed Baseline (Test Mode)
            </div>
          </div>
          <div>
            <span className="text-[#64748d]">Governing Strategy</span>
            <div className="font-medium text-[#061b31] mt-0.5">
              {data?.active_policy?.strategy_type || 'NO_OFFER'}
            </div>
            <div className="text-[10px] text-[#64748d] mt-0.5">
              {data?.active_policy?.strategy_type === 'NO_OFFER' ? 'Baseline control policy' : 'Governed commercial strategy'}
            </div>
          </div>
          <div>
            <span className="text-[#64748d]">Observed Contribution</span>
            <div className="font-medium text-emerald-700 mt-0.5 tabular-nums">
              {formatPaise(data?.active_policy?.observed_contribution_paise)}
            </div>
            <div className="text-[10px] text-[#64748d] mt-0.5">
              Policy-specific attributed
            </div>
          </div>
          <div>
            <span className="text-[#64748d]">Evidence Observations</span>
            <div className="font-medium text-[#061b31] mt-0.5 tabular-nums">
              {data?.active_policy?.evidence_count ?? 0}
            </div>
            <div className="text-[10px] text-[#64748d] mt-0.5">
              Scoped strictly to this policy
            </div>
          </div>
        </div>
      </div>

      {/* Policy Version History Table */}
      <div className="stripe-card overflow-hidden">
        <div className="p-5 border-b border-[#e5edf5] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-[#061b31]">Policy Version Registry</h3>
            <p className="text-xs text-[#64748d] mt-0.5">
              Audit-backed version lifecycle registry. Candidates require evidence gating and fresh safety verification before promotion.
            </p>
          </div>
          <span className="stripe-tag bg-[#f8fafd] text-[#64748d] border border-[#e5edf5] text-[11px] font-mono">
            {data?.versions?.length ?? 0} Registered Policies
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafd] border-b border-[#e5edf5] text-[#64748d]">
                <th className="p-3">Policy ID</th>
                <th className="p-3">Version</th>
                <th className="p-3">Strategy</th>
                <th className="p-3">Lifecycle State</th>
                <th className="p-3 text-right">Evidence Count</th>
                <th className="p-3 text-right">Contribution</th>
                <th className="p-3 text-center">Promotion Criteria</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#64748d]">
                    Loading policy versions...
                  </td>
                </tr>
              ) : data?.versions && data.versions.length > 0 ? (
                data.versions.map((ver) => {
                  const strategyDesc =
                    ver.strategy_type === 'NO_OFFER'
                      ? 'Baseline control policy'
                      : ver.strategy_type === 'SINGLE_PRODUCT'
                      ? 'Direct single-item offer'
                      : ver.strategy_type === 'ALTERNATIVE_PRODUCT'
                      ? 'Catalog alternative offer'
                      : ver.strategy_type === 'COMPLEMENTARY_BUNDLE'
                      ? 'Complementary bundle offer'
                      : 'Governed policy';

                  return (
                    <tr key={`${ver.policy_id}_${ver.version_id}`} className="border-b border-[#e5edf5] hover:bg-[#f8fafd] transition-colors">
                      <td className="p-3 font-mono font-medium text-[#061b31] whitespace-nowrap" title={ver.policy_id}>
                        {ver.policy_id}
                      </td>
                      <td className="p-3 font-mono text-[#64748d] text-[11px] whitespace-nowrap">
                        {ver.version_id}
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-[#061b31]">{ver.strategy_type}</div>
                        <div className="text-[10px] text-[#64748d]">{strategyDesc}</div>
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
                      <td className="p-3 text-right font-medium text-emerald-700 tabular-nums">
                        {formatPaise(ver.observed_contribution_paise)}
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
                        ) : ver.promotion_criteria_satisfied || ver.lifecycle_status === 'ELIGIBLE_FOR_PROMOTION' ? (
                          <span
                            className="stripe-tag bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium"
                            title="Satisfies Phase 8.8 promotion criteria"
                          >
                            Eligible
                          </span>
                        ) : (
                          <span
                            className="text-[10px] text-[#839bc8]"
                            title="Requires minimum 20 learning observations and positive contribution"
                          >
                            Pending Evidence
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        {ver.is_active ? (
                          <span className="text-[11px] text-emerald-700 font-medium">Currently Active</span>
                        ) : ver.lifecycle_status === 'CANDIDATE' || ver.lifecycle_status === 'ELIGIBLE_FOR_PROMOTION' ? (
                          <button
                            onClick={() => handleOpenAction('PROMOTE', ver)}
                            className="stripe-btn-primary text-xs py-1 px-2.5"
                          >
                            Promote
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenAction('ROLLBACK', ver)}
                            className="stripe-btn-ghost text-xs py-1 px-2.5 flex items-center gap-1 ml-auto"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Rollback</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#64748d]">
                    No historical policy versions found for this merchant.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Policy Lifecycle Governance Audit History */}
      <div className="stripe-card overflow-hidden">
        <div className="p-5 border-b border-[#e5edf5] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-[#533afd]" />
              <h3 className="text-sm font-medium text-[#061b31]">Lifecycle Governance Audit History</h3>
            </div>
            <p className="text-xs text-[#64748d] mt-0.5">
              Append-only cryptographic audit trail of all policy promotions, rollbacks, and evaluation events.
            </p>
          </div>
          <span className="stripe-tag bg-[#f8fafd] text-[#64748d] border border-[#e5edf5] text-[11px] font-mono">
            {data?.recent_transitions?.length ?? 0} Recorded Transitions
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#f8fafd] border-b border-[#e5edf5] text-[#64748d]">
                <th className="p-3">Transition ID</th>
                <th className="p-3">Candidate / Target</th>
                <th className="p-3">Action</th>
                <th className="p-3">Previous Active</th>
                <th className="p-3">Resulting Active</th>
                <th className="p-3">Audit Rationale & Diagnostics</th>
                <th className="p-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-[#64748d]">Loading transitions...</td>
                </tr>
              ) : data?.recent_transitions && data.recent_transitions.length > 0 ? (
                data.recent_transitions.map((t) => (
                  <tr key={t.transition_id} className="border-b border-[#e5edf5] hover:bg-[#f8fafd] transition-colors">
                    <td className="p-3 font-mono text-[11px] text-[#533afd] font-medium whitespace-nowrap">{t.transition_id}</td>
                    <td className="p-3 font-mono font-medium text-[#061b31] whitespace-nowrap">{t.policy_id}</td>
                    <td className="p-3 whitespace-nowrap">
                      <span className={`stripe-tag text-[10px] font-medium ${
                        t.action === 'PROMOTED'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : t.action === 'ROLLED_BACK'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : t.action === 'CONFLICT'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-[#f8fafd] text-[#64748d] border border-[#e5edf5]'
                      }`}>
                        {t.action}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-[#64748d] whitespace-nowrap">{t.from_state}</td>
                    <td className="p-3 font-mono text-[11px] font-medium text-[#061b31] whitespace-nowrap">{t.to_state}</td>
                    <td className="p-3 text-[#50617a] max-w-xs truncate" title={t.reason}>{t.reason}</td>
                    <td className="p-3 text-right font-mono text-[11px] text-[#64748d] whitespace-nowrap">
                      {formatDateTime(t.timestamp)}
                    </td>
                  </tr>
                ))
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
          <div className="w-full max-w-lg bg-white rounded border border-[#e5edf5] p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-base font-medium text-[#061b31]">
                  {modalType === 'ROLLBACK' ? 'Confirm Policy Rollback' : 'Confirm Policy Promotion'}
                </h3>
                <p className="text-xs text-[#64748d] mt-0.5">
                  Target: <span className="font-mono font-medium text-[#533afd]">{targetPolicy.policy_id}</span>
                </p>
              </div>
              <button
                onClick={() => setModalType(null)}
                aria-label="Close modal"
                className="p-1 rounded text-[#64748d] hover:text-[#061b31]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-[#f8fafd] rounded border border-[#e5edf5] text-xs text-[#50617a] leading-relaxed">
              {modalType === 'ROLLBACK' ? (
                <>
                  <span className="font-medium text-[#061b31]">Safety Clearance Protocol:</span> Before activation, the authoritative Phase 8.8 lifecycle service will re-verify that target policy passes current inventory and margin compliance rules.
                </>
              ) : (
                <>
                  <span className="font-medium text-[#061b31]">Evidence-Gated Protocol:</span> The candidate policy will be evaluated against Phase 8.8 promotion thresholds. If evidence criteria are met, it will become the active production policy.
                </>
              )}
            </div>

            {modalError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded text-xs text-rose-800">
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
                  className="w-full text-xs p-2.5 border border-[#e5edf5] rounded focus:outline-none focus:border-[#533afd] font-sans"
                  placeholder="Explain why this action is being taken for immutable audit logs..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="stripe-btn-ghost text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !rationale.trim()}
                  className="stripe-btn-primary text-xs"
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
