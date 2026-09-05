/**
 * Centralized API Client for Phase 10 Merchant AI Control Center.
 * Connects Next.js to the FastAPI backend.
 */

import {
  DashboardOverview,
  DecisionListResponse,
  DecisionDetail,
  PolicyManagement,
  ExperimentListResponse,
  LearningCenter,
  ActivityListResponse,
  OpportunityTrace,
  ControlActionResponse
} from './types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(endpoint: string, options?: RequestInit, merchantId?: string): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> || {})
  };

  if (merchantId) {
    headers['X-Caller-Merchant-ID'] = merchantId;
  }

  try {
    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({ detail: res.statusText }));
      throw new ApiError(errBody.detail || 'API request failed', res.status, errBody);
    }
    return (await res.json()) as T;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || 'Network error connecting to backend API', 500);
  }
}

export const api = {
  // 1. Overview
  getOverview: (merchantId: string) =>
    request<DashboardOverview>(`/api/v1/dashboard/overview?merchant_id=${encodeURIComponent(merchantId)}`, undefined, merchantId),

  // 2. Decisions
  getDecisions: (merchantId: string, params?: { limit?: number; offset?: number; mode?: string; status?: string }) => {
    const query = new URLSearchParams({ merchant_id: merchantId });
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    if (params?.mode) query.set('mode', params.mode);
    if (params?.status) query.set('execution_status', params.status);
    return request<DecisionListResponse>(`/api/v1/dashboard/decisions?${query.toString()}`, undefined, merchantId);
  },

  getDecisionDetail: (decisionId: string, merchantId: string) =>
    request<DecisionDetail>(`/api/v1/dashboard/decisions/${encodeURIComponent(decisionId)}?merchant_id=${encodeURIComponent(merchantId)}`, undefined, merchantId),

  executeDecision: (decisionId: string, merchantId: string) =>
    request<any>(`/api/v1/decisions/${encodeURIComponent(decisionId)}/execute`, {
      method: 'POST',
      body: JSON.stringify({ merchant_id: merchantId })
    }, merchantId),

  reconcileOrder: (orderId: string) =>
    request<any>(`/api/v1/orders/${encodeURIComponent(orderId)}/reconcile`, {
      method: 'POST'
    }),

  // 3. Policies
  getPolicies: (merchantId: string) =>
    request<PolicyManagement>(`/api/v1/dashboard/policies?merchant_id=${encodeURIComponent(merchantId)}`, undefined, merchantId),

  promotePolicy: (merchantId: string, candidatePolicyId: string, rationale: string, expectedPreviousPolicyId?: string) =>
    request<ControlActionResponse>('/api/v1/dashboard/policies/promote', {
      method: 'POST',
      body: JSON.stringify({
        merchant_id: merchantId,
        candidate_policy_id: candidatePolicyId,
        expected_previous_policy_id: expectedPreviousPolicyId,
        rationale
      })
    }, merchantId),

  rollbackPolicy: (merchantId: string, targetPolicyId: string, rationale: string, expectedCurrentPolicyId?: string) =>
    request<ControlActionResponse>('/api/v1/dashboard/policies/rollback', {
      method: 'POST',
      body: JSON.stringify({
        merchant_id: merchantId,
        target_policy_id: targetPolicyId,
        expected_current_policy_id: expectedCurrentPolicyId,
        rationale
      })
    }, merchantId),

  // 4. Experiments
  getExperiments: (merchantId: string) =>
    request<ExperimentListResponse>(`/api/v1/dashboard/experiments?merchant_id=${encodeURIComponent(merchantId)}`, undefined, merchantId),

  // 5. Learning Center
  getLearning: (merchantId: string) =>
    request<LearningCenter>(`/api/v1/dashboard/learning?merchant_id=${encodeURIComponent(merchantId)}`, undefined, merchantId),

  // 6. Activity
  getActivity: (merchantId: string, params?: { limit?: number; offset?: number }) => {
    const query = new URLSearchParams({ merchant_id: merchantId });
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    return request<ActivityListResponse>(`/api/v1/dashboard/activity?${query.toString()}`, undefined, merchantId);
  },

  // 7. Opportunity Trace
  getTrace: (opportunityId: string, merchantId: string) =>
    request<OpportunityTrace>(`/api/v1/dashboard/traces/${encodeURIComponent(opportunityId)}?merchant_id=${encodeURIComponent(merchantId)}`, undefined, merchantId)
};

// Utilities for currency, dates, and formatting
export function formatPaise(paise: number | undefined | null, currency: string = 'INR'): string {
  if (paise === undefined || paise === null) return '₹0';
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 0
  }).format(rupees);
}

export function formatPercent(val: number | undefined | null): string {
  if (val === undefined || val === null) return '0%';
  return `${Number(val).toFixed(1)}%`;
}

export function formatDateTime(isoString?: string | null): string {
  if (!isoString) return '—';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-IN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  } catch {
    return isoString;
  }
}

export function getExecutionStatusBadge(status: string): { className: string; label: string } {
  switch (status) {
    case 'EXECUTION_COMPLETED':
      return { className: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'EXECUTION_COMPLETED' };
    case 'EXECUTION_REJECTED':
      return { className: 'bg-rose-50 text-rose-700 border border-rose-200', label: 'EXECUTION_REJECTED' };
    case 'SAFETY_REJECTED':
      return { className: 'bg-rose-50 text-rose-700 border border-rose-200', label: 'SAFETY_REJECTED' };
    case 'PENDING_EXECUTION_GATE':
      return { className: 'bg-amber-50 text-amber-700 border border-amber-200', label: 'PENDING_EXECUTION_GATE' };
    default:
      return { className: 'bg-slate-50 text-slate-700 border border-slate-200', label: status || 'UNKNOWN' };
  }
}

export function getOutcomeStatusBadge(status?: string | null): { className: string; label: string } | null {
  if (!status) return null;
  switch (status) {
    case 'PAYMENT_SUCCESS':
      return { className: 'bg-emerald-50 text-emerald-700 border border-emerald-200', label: 'PAID (Test Mode)' };
    case 'PAYMENT_FAILED':
    case 'FAILED':
      return { className: 'bg-rose-50 text-rose-700 border border-rose-200', label: 'PAYMENT_FAILED' };
    case 'ORDER_CREATED':
      return { className: 'bg-blue-50 text-blue-700 border border-blue-200', label: 'ORDER_CREATED' };
    default:
      return { className: 'bg-slate-50 text-slate-700 border border-slate-200', label: status };
  }
}
