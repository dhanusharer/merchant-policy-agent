"""Phase 10 Final Freeze Gate Verification Tests.

Validates all 8 required Phase 10 semantic hardening invariants:
A. Baseline policy does not display false promotion satisfaction
B. Policy evidence count is not inflated by joined rows
C. Observed contribution is not inflated by joined rows
D. Active-policy metrics remain policy-specific
E. Tenant isolation remains intact
F. API values equal authoritative DB/service values
G. Decision Detail terminology remains semantically correct
H. Execution/payment/learning states remain distinct
"""

import pytest
import pytest_asyncio
from datetime import datetime, timezone
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

from domain.models import (
    Merchant,
    MerchantActivePolicy,
    MerchantPolicyVersionRecord,
    PolicyMemoryRecord,
    CanonicalDecisionRecord,
    DecisionExecutionRecord,
    OutcomeFeedbackRecord
)
from services.dashboard.service import (
    PolicyViewService,
    DecisionViewService,
    DashboardOverviewService
)
from services.dashboard.schemas import (
    PolicyManagementDTO,
    DecisionDetailDTO,
    PolicyVersionItemDTO
)
from services.lifecycle.service import PolicyLifecycleService
from services.lifecycle.schemas import (
    PolicyPromotionRequest,
    PromotionStatus,
    PromotionFailureCode
)
from services.lifecycle.errors import ActivePolicyConflictError
from services.commerce_service import MerchantNotFoundError
from apps.api.routers.dashboard import (
    PolicyPromoteActionRequest,
    PolicyRollbackActionRequest
)


@pytest_asyncio.fixture
async def db_session():
    """Async database session connected to active test.db."""
    engine = create_async_engine("sqlite+aiosqlite:///./test.db")
    async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)
    async with async_session() as session:
        yield session
    await engine.dispose()


@pytest.mark.asyncio
async def test_criterion_a_baseline_policy_not_false_satisfied(db_session: AsyncSession):
    """Criterion A: Baseline policy does not display false promotion satisfaction."""
    data = await PolicyViewService.get_policies(db_session, "merch_atlas_travel")
    assert data.active_policy is not None
    assert data.active_policy.policy_id == "cand_base_no_offer"
    
    # Active baseline version in registry MUST have promotion_criteria_satisfied == False
    baseline_versions = [v for v in data.versions if v.is_active]
    assert len(baseline_versions) == 1
    baseline_ver = baseline_versions[0]
    assert baseline_ver.promotion_criteria_satisfied is False, (
        "Baseline policy must NOT be marked as satisfying candidate promotion criteria!"
    )
    assert baseline_ver.policy_id == "cand_base_no_offer"


@pytest.mark.asyncio
async def test_criterion_b_and_c_no_join_inflation(db_session: AsyncSession):
    """Criterion B & C: Evidence count and observed contribution are NOT inflated by joins."""
    merchant_id = "merch_atlas_travel"
    policy_id = "cand_54256751"

    # Direct count from PolicyMemoryRecord
    direct_ev_stmt = select(func.count(PolicyMemoryRecord.id)).where(
        and_(
            PolicyMemoryRecord.merchant_id == merchant_id,
            PolicyMemoryRecord.policy_id == policy_id
        )
    )
    authoritative_count = (await db_session.execute(direct_ev_stmt)).scalar() or 0

    direct_contrib_stmt = select(
        func.coalesce(func.sum(PolicyMemoryRecord.reward_contribution_paise), 0)
    ).where(
        and_(
            PolicyMemoryRecord.merchant_id == merchant_id,
            PolicyMemoryRecord.policy_id == policy_id
        )
    )
    authoritative_contrib = (await db_session.execute(direct_contrib_stmt)).scalar() or 0

    # Retrieve through PolicyViewService
    policies_data = await PolicyViewService.get_policies(db_session, merchant_id)
    cand_version = next((v for v in policies_data.versions if v.policy_id == policy_id), None)
    
    assert cand_version is not None, f"Candidate {policy_id} must be in versions"
    # Invariant: service metrics must EXACTLY match direct PolicyMemoryRecord query
    assert cand_version.evidence_count == authoritative_count, (
        f"Evidence count {cand_version.evidence_count} must match direct authoritative count {authoritative_count}"
    )
    assert cand_version.observed_contribution_paise == authoritative_contrib, (
        f"Observed contribution {cand_version.observed_contribution_paise} must match authoritative {authoritative_contrib}"
    )


@pytest.mark.asyncio
async def test_criterion_d_active_policy_metrics_remain_policy_specific(db_session: AsyncSession):
    """Criterion D: Active policy metrics refer strictly to the current active policy."""
    data = await PolicyViewService.get_policies(db_session, "merch_atlas_travel")
    active = data.active_policy
    assert active is not None
    assert active.policy_id == "cand_base_no_offer"

    # Total merchant-level memory count across all explored candidates
    all_mem_stmt = select(func.count(PolicyMemoryRecord.id)).where(
        PolicyMemoryRecord.merchant_id == "merch_atlas_travel"
    )
    total_mem_count = (await db_session.execute(all_mem_stmt)).scalar() or 0

    # Active baseline has 0 observations, whereas exploration candidates have memory records
    assert active.evidence_count == 0, (
        f"Active baseline evidence count must be 0, not {active.evidence_count}"
    )
    assert active.observed_contribution_paise == 0, (
        f"Active baseline observed contribution must be 0, not {active.observed_contribution_paise}"
    )
    assert total_mem_count > 0, "Exploration candidates have memory records, confirming isolation from active baseline"


@pytest.mark.asyncio
async def test_criterion_e_tenant_isolation(db_session: AsyncSession):
    """Criterion E: Tenant isolation remains strictly enforced; no cross-merchant leakage."""
    atlas_data = await PolicyViewService.get_policies(db_session, "merch_atlas_travel")
    alpha_data = await PolicyViewService.get_policies(db_session, "merch_alpha")

    # Distinct active policies
    assert atlas_data.active_policy.policy_id == "cand_base_no_offer"
    assert alpha_data.active_policy.policy_id == "cand_alpha_base"

    # Policies in atlas must not appear in alpha versions
    atlas_pids = {v.policy_id for v in atlas_data.versions}
    alpha_pids = {v.policy_id for v in alpha_data.versions}
    assert "cand_alpha_base" not in atlas_pids
    assert "cand_54256751" not in alpha_pids

    # Querying non-existent merchant raises MerchantNotFoundError
    with pytest.raises(MerchantNotFoundError):
        await PolicyViewService.get_policies(db_session, "merch_nonexistent_xyz")


@pytest.mark.asyncio
async def test_criterion_f_api_values_equal_authoritative_db_values(db_session: AsyncSession):
    """Criterion F: API projection values exactly match underlying authoritative DB rows."""
    merchant_id = "merch_atlas_travel"

    # Authoritative DB row
    active_row = (await db_session.execute(
        select(MerchantActivePolicy).where(MerchantActivePolicy.merchant_id == merchant_id)
    )).scalar_one()

    # Service projection
    service_res = await PolicyViewService.get_policies(db_session, merchant_id)
    assert service_res.active_policy.policy_id == active_row.policy_id
    assert service_res.active_policy.policy_version == active_row.policy_version


@pytest.mark.asyncio
async def test_criterion_g_decision_detail_terminology(db_session: AsyncSession):
    """Criterion G: Decision Detail terminology: Predicted Contribution vs Ranking Score vs Observed."""
    # Find any existing decision
    stmt = select(CanonicalDecisionRecord).where(
        CanonicalDecisionRecord.merchant_id == "merch_atlas_travel"
    ).limit(1)
    dec = (await db_session.execute(stmt)).scalar_one_or_none()
    
    if dec:
        detail = await DecisionViewService.get_decision_detail(db_session, dec.id, "merch_atlas_travel")
        assert hasattr(detail.merchant_evaluation, "predicted_contribution_paise")
        assert hasattr(detail.merchant_evaluation, "composite_ranking_score")
        assert hasattr(detail, "candidates")
        for c in detail.candidates:
            assert hasattr(c, "predicted_contribution_paise")
            assert hasattr(c, "composite_ranking_score")
            assert isinstance(c.composite_ranking_score, float)
            assert isinstance(c.predicted_contribution_paise, int)


@pytest.mark.asyncio
async def test_criterion_h_execution_payment_learning_states_distinct(db_session: AsyncSession):
    """Criterion H: Execution, Payment Outcome, and Learning states are decoupled and distinct."""
    # Inspect all canonical decisions
    stmt = select(CanonicalDecisionRecord).where(
        CanonicalDecisionRecord.merchant_id == "merch_atlas_travel"
    )
    decisions = (await db_session.execute(stmt)).scalars().all()
    
    for d in decisions:
        detail = await DecisionViewService.get_decision_detail(db_session, d.id, "merch_atlas_travel")
        # Invariant: Execution status exists
        assert detail.execution_status in ("EXECUTION_COMPLETED", "EXECUTION_REJECTED", "PENDING_EXECUTION_GATE")
        # Invariant: Outcome status is distinct
        if detail.outcome_status == "PAYMENT_FAILED":
            assert detail.execution_status == "EXECUTION_COMPLETED"
            assert isinstance(detail.learning_eligible, bool)
    
    assert len(decisions) > 0
