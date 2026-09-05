"""Dedicated Deterministic Demo Reset & Population Runner.
Razorpay AI Buildathon 2026 - Track 01

Connects to the authoritative development database (test.db by default or DATABASE_URL)
and executes the real, un-mocked, end-to-end Merchant Policy Agent runtime pipeline:
  BuyerIntent -> CommerceContext -> PolicyCandidate -> LinUCB Prediction
  -> Selection -> Fresh Safety Check -> Execution Boundary -> Phase 5 Order
  -> Payment (Captured / Failed) -> Outcome Feedback -> Evidence -> Memory -> LinUCB Update

Usage:
  python scripts/run_demo_population.py
"""

import sys
import os
import asyncio
import uuid
from decimal import Decimal
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List

# Ensure repository root is in sys.path
WORKSPACE_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(WORKSPACE_ROOT))

# Enforce demo environment tag
os.environ["DEMO_ENVIRONMENT"] = "local_demo"

from sqlalchemy import select, delete, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from apps.api.core.database import init_db, AsyncSessionLocal, engine
from domain.models import (
    Merchant,
    Product,
    ProductRelationship,
    MerchantPriority,
    MerchantActivePolicy,
    MerchantPolicyVersionRecord,
    CanonicalDecisionRecord,
    DecisionExecutionRecord,
    Order,
    Payment,
    OutcomeFeedbackRecord,
    LearningEvidenceRecord,
    PolicyMemoryRecord,
    AppliedModelObservationRecord,
    PolicyLearningModelState,
    PolicySelectionRecord,
    AuditEvent,
    ExperimentRecord,
    PolicyLifecycleAuditRecord,
    ExplorationDecisionRecord,
    PolicySafetyRecord,
    MerchantExplorationState,
    ClosedLoopEvaluationRecord
)
from services.commerce_service import CommerceService
from services.runtime.schemas import (
    CanonicalDecisionRequest,
    DecisionMode,
    CANONICAL_DECISION_SCHEMA_VERSION
)
from services.runtime.service import CanonicalDecisionRuntime
from services.boundary.schemas import DecisionExecuteRequest, ExecutionBoundaryStatus
from services.boundary.service import DecisionExecutionBoundaryService
from services.outcome.schemas import OutcomeProcessRequest, OutcomeStatus
from services.outcome.service import OutcomeFeedbackService
from services.outcome.errors import OutcomeTenantViolationError
from services.learning.model_service import PolicyLearningModelService
from services.lifecycle.service import PolicyLifecycleService
from services.lifecycle.schemas import PolicyPromotionRequest, PromotionStatus
from services.execution.concurrency import InventoryReservationManager
from apps.api.core.state_machine import TransactionState
from services.selection.ranking import CANONICAL_BASELINE_POLICY_ID


async def reset_demo_merchants(db: AsyncSession, merchant_ids: List[str]) -> None:
    """Safely reset ONLY designated demo merchants without destroying unrelated developer tables."""
    print(f"\n[Reset] Purging existing records for designated demo merchants: {merchant_ids}")
    
    for m_id in merchant_ids:
        # 1. Fetch decision IDs to delete orders & payments cleanly
        dec_res = await db.execute(
            select(CanonicalDecisionRecord.id).where(CanonicalDecisionRecord.merchant_id == m_id)
        )
        dec_ids = [r[0] for r in dec_res.all()]
        
        if dec_ids:
            # Fetch order IDs
            ord_res = await db.execute(
                select(Order.id).where(Order.decision_id.in_(dec_ids))
            )
            ord_ids = [r[0] for r in ord_res.all()]
            
            if ord_ids:
                await db.execute(delete(Payment).where(Payment.order_id.in_(ord_ids)))
                await db.execute(delete(Order).where(Order.id.in_(ord_ids)))
        
        # 2. Delete merchant domain records
        await db.execute(delete(AppliedModelObservationRecord).where(AppliedModelObservationRecord.merchant_id == m_id))
        await db.execute(delete(LearningEvidenceRecord).where(LearningEvidenceRecord.merchant_id == m_id))
        await db.execute(delete(PolicyMemoryRecord).where(PolicyMemoryRecord.merchant_id == m_id))
        await db.execute(delete(OutcomeFeedbackRecord).where(OutcomeFeedbackRecord.merchant_id == m_id))
        await db.execute(delete(DecisionExecutionRecord).where(DecisionExecutionRecord.merchant_id == m_id))
        await db.execute(delete(CanonicalDecisionRecord).where(CanonicalDecisionRecord.merchant_id == m_id))
        await db.execute(delete(ExplorationDecisionRecord).where(ExplorationDecisionRecord.merchant_id == m_id))
        await db.execute(delete(PolicySafetyRecord).where(PolicySafetyRecord.merchant_id == m_id))
        await db.execute(delete(MerchantExplorationState).where(MerchantExplorationState.merchant_id == m_id))
        await db.execute(delete(ClosedLoopEvaluationRecord).where(ClosedLoopEvaluationRecord.merchant_id == m_id))
        await db.execute(delete(PolicySelectionRecord).where(PolicySelectionRecord.merchant_id == m_id))
        await db.execute(delete(PolicyLearningModelState).where(PolicyLearningModelState.merchant_id == m_id))
        await db.execute(delete(AuditEvent).where(AuditEvent.merchant_id == m_id))
        await db.execute(delete(ExperimentRecord).where(ExperimentRecord.merchant_id == m_id))
        await db.execute(delete(PolicyLifecycleAuditRecord).where(PolicyLifecycleAuditRecord.merchant_id == m_id))
        await db.execute(delete(MerchantActivePolicy).where(MerchantActivePolicy.merchant_id == m_id))
        await db.execute(delete(MerchantPolicyVersionRecord).where(MerchantPolicyVersionRecord.merchant_id == m_id))
        await db.execute(delete(ProductRelationship).where(ProductRelationship.merchant_id == m_id))
        await db.execute(delete(MerchantPriority).where(MerchantPriority.merchant_id == m_id))
        await db.execute(delete(Product).where(Product.merchant_id == m_id))
        await db.execute(delete(Merchant).where(Merchant.id == m_id))
    
    await db.commit()
    print("[Reset] Purge complete.")


async def seed_demo_merchants(db: AsyncSession) -> None:
    """Seed clean, realistic commercial catalogs and policies for Atlas Travel Gear and Alpha Outfitters."""
    now = datetime.now(timezone.utc)

    # -------------------------------------------------------------------------
    # MERCHANT A: Atlas Travel Gear (Primary Demo Merchant)
    # -------------------------------------------------------------------------
    print("\n[Seed] Seeding Merchant A: Atlas Travel Gear (merch_atlas_travel)...")
    merch_atlas = Merchant(
        id="merch_atlas_travel",
        name="Atlas Travel Gear",
        currency="INR",
        status="ACTIVE",
        business_objective="BALANCE_REVENUE_AND_MARGIN",
        minimum_margin_percent=Decimal("25.00"),
        maximum_discount_percent=Decimal("8.00"),
        target_aov_paise=400000  # INR 4,000.00
    )
    db.add(merch_atlas)

    products_atlas = [
        Product(
            id="prod_travel_backpack",
            merchant_id="merch_atlas_travel",
            sku="ATLAS-BP-01",
            name="Atlas All-Weather Travel Backpack (35L)",
            description="Waterproof modular backpack with laptop compartment and ergonomic harness.",
            category="travel_backpack",
            price_paise=299900,  # INR 2,999.00
            cost_paise=180000,   # INR 1,800.00 (COGS)
            currency="INR",
            inventory_quantity=25,
            attributes={"laptop_size": 16.0, "water_resistant": True, "volume_liters": 35},
            is_active=True
        ),
        Product(
            id="prod_laptop_sleeve",
            merchant_id="merch_atlas_travel",
            sku="ATLAS-SL-02",
            name="Protective Shock-Resistant Laptop Sleeve 16in",
            description="Memory foam padded protective sleeve matching travel backpack interior.",
            category="laptop_sleeve",
            price_paise=79900,   # INR 799.00
            cost_paise=35000,    # INR 350.00 (COGS)
            currency="INR",
            inventory_quantity=30,
            attributes={"laptop_size": 16.0, "water_resistant": True},
            is_active=True
        ),
        Product(
            id="prod_usbc_hub",
            merchant_id="merch_atlas_travel",
            sku="ATLAS-HB-03",
            name="Compact USB-C Multiport Travel Hub",
            description="Aluminum 7-port travel hub with 4K HDMI and 100W Power Delivery.",
            category="usbc_hub",
            price_paise=149900,  # INR 1,499.00
            cost_paise=70000,    # INR 700.00 (COGS)
            currency="INR",
            inventory_quantity=20,
            attributes={"ports": 7, "power_delivery_watts": 100},
            is_active=True
        ),
        Product(
            id="prod_limited_flask",
            merchant_id="merch_atlas_travel",
            sku="ATLAS-LTD-04",
            name="Ultra Limited Edition Travel Vacuum Flask",
            description="Strictly limited inventory insulated titanium travel flask.",
            category="travel_backpack",
            price_paise=129900,  # INR 1,299.00
            cost_paise=60000,    # INR 600.00 (COGS)
            currency="INR",
            inventory_quantity=3, # Exactly 3 units for inventory exhaustion validation
            attributes={"laptop_size": 16.0, "water_resistant": True, "limited": True},
            is_active=True
        )
    ]
    for p in products_atlas:
        db.add(p)

    db.add(MerchantPriority(merchant_id="merch_atlas_travel", priority_product_ids=["prod_travel_backpack"]))

    db.add(ProductRelationship(
        merchant_id="merch_atlas_travel",
        primary_product_id="prod_travel_backpack",
        related_product_id="prod_laptop_sleeve",
        relationship_type="COMPLEMENTARY",
        affinity_score=Decimal("0.85"),
        source="merchant_defined"
    ))
    db.add(ProductRelationship(
        merchant_id="merch_atlas_travel",
        primary_product_id="prod_travel_backpack",
        related_product_id="prod_usbc_hub",
        relationship_type="COMPLEMENTARY",
        affinity_score=Decimal("0.70"),
        source="merchant_defined"
    ))

    db.add(MerchantPolicyVersionRecord(
        id="pver_atlas_v0",
        merchant_id="merch_atlas_travel",
        policy_id="cand_base_no_offer",
        policy_version="merchant-policy/v1",
        lifecycle_status="ACTIVE",
        strategy_type="NO_OFFER",
        product_ids_json=[],
        rationale="Conservative baseline policy",
        provenance_json={"author": "System"},
        created_at=now,
        updated_at=now
    ))
    db.add(MerchantActivePolicy(
        merchant_id="merch_atlas_travel",
        policy_id=CANONICAL_BASELINE_POLICY_ID,
        policy_version="merchant-policy/v1",
        activated_at=now,
        promotion_id="init_baseline"
    ))

    # Candidate Policy: COMPLEMENTARY_BUNDLE with insufficient evidence (Requirement F & Freeze Gate)
    db.add(MerchantPolicyVersionRecord(
        id="pver_atlas_cand1",
        merchant_id="merch_atlas_travel",
        policy_id="cand_54256751",
        policy_version="merchant-policy/v1",
        lifecycle_status="CANDIDATE",
        strategy_type="COMPLEMENTARY_BUNDLE",
        product_ids_json=["prod_travel_backpack", "prod_laptop_sleeve"],
        rationale="Candidate travel bundle policy targeting high-intent business travelers",
        provenance_json={"author": "MerchantAI Lab", "generation_context": "phase12_hero_demo"},
        created_at=now,
        updated_at=now
    ))

    # -------------------------------------------------------------------------
    # MERCHANT B: Alpha Outfitters (Multi-Tenant Isolation Validation)
    # -------------------------------------------------------------------------
    print("[Seed] Seeding Merchant B: Alpha Outfitters (merch_alpha)...")
    merch_alpha = Merchant(
        id="merch_alpha",
        name="Alpha Outfitters",
        currency="INR",
        status="ACTIVE",
        business_objective="MAXIMIZE_CONTRIBUTION",
        minimum_margin_percent=Decimal("30.00"),
        maximum_discount_percent=Decimal("5.00"),
        target_aov_paise=500000  # INR 5,000.00
    )
    db.add(merch_alpha)

    products_alpha = [
        Product(
            id="prod_alpha_tent",
            merchant_id="merch_alpha",
            sku="ALPHA-PACK-01",
            name="Alpha Alpine Expedition Travel Backpack",
            description="Extreme weather expedition backpack for rugged travel.",
            category="travel_backpack",
            price_paise=899900,  # INR 8,999.00
            cost_paise=450000,   # INR 4,500.00 (COGS)
            currency="INR",
            inventory_quantity=25,
            attributes={"water_resistant": True, "laptop_size": 16.0},
            is_active=True
        ),
        Product(
            id="prod_alpha_sleeve",
            merchant_id="merch_alpha",
            sku="ALPHA-SLEEVE-02",
            name="Sub-Zero Thermal Protective Sleeve",
            description="Insulated protective travel sleeve.",
            category="laptop_sleeve",
            price_paise=349900,  # INR 3,499.00
            cost_paise=190000,   # INR 1,900.00 (COGS)
            currency="INR",
            inventory_quantity=35,
            attributes={"water_resistant": True, "laptop_size": 16.0},
            is_active=True
        )
    ]
    for p in products_alpha:
        db.add(p)

    db.add(MerchantPriority(merchant_id="merch_alpha", priority_product_ids=["prod_alpha_tent"]))
    db.add(MerchantPolicyVersionRecord(
        id="pver_alpha_v0",
        merchant_id="merch_alpha",
        policy_id="cand_alpha_base",
        policy_version="merchant-policy/v1",
        lifecycle_status="ACTIVE",
        strategy_type="NO_OFFER",
        product_ids_json=[],
        rationale="Alpha conservative baseline",
        provenance_json={"author": "System"},
        created_at=now,
        updated_at=now
    ))
    db.add(MerchantActivePolicy(
        merchant_id="merch_alpha",
        policy_id="cand_alpha_base",
        policy_version="merchant-policy/v1",
        activated_at=now,
        promotion_id="init_baseline"
    ))

    await db.commit()
    print("[Seed] Catalog and policy seeding complete.")


async def run_population_simulation(db: AsyncSession) -> Dict[str, Any]:
    """Execute deterministic AI buyer opportunities through the authoritative runtime pipeline."""
    print("\n" + "=" * 70)
    print("EXECUTING POPULATION-LEVEL CLOSED-LOOP COMMERCE RUN")
    print("=" * 70)

    # 6 Deterministic Context Clusters
    clusters = {
        "CONTEXT_A_BACKPACK_NORMAL": {
            "merchant_id": "merch_atlas_travel",
            "prompt": "I need a travel backpack for a business trip under 8000",
            "budget": 800000,
            "purchase": True,
            "deduct_sku": "prod_travel_backpack"
        },
        "CONTEXT_B_WATERPROOF_ABANDON": {
            "merchant_id": "merch_atlas_travel",
            "prompt": "Need a waterproof travel backpack urgently for travel under 5000",
            "budget": 500000,
            "purchase": False,
            "deduct_sku": None
        },
        "CONTEXT_C_BUNDLE_SEEKER": {
            "merchant_id": "merch_atlas_travel",
            "prompt": "Looking for a travel pack together with laptop sleeve under 6000",
            "budget": 600000,
            "purchase": True,
            "deduct_sku": "prod_travel_backpack"
        },
        "CONTEXT_D_BUDGET_SENSITIVE": {
            "merchant_id": "merch_atlas_travel",
            "prompt": "Cheap travel backpack strictly under 1000 rupees",
            "budget": 100000, # Below catalog price -> NO_OFFER
            "purchase": False,
            "deduct_sku": None
        },
        "CONTEXT_E_LIMITED_STOCK": {
            "merchant_id": "merch_atlas_travel",
            "prompt": "Looking for a limited edition travel vacuum flask strictly under 5000",
            "budget": 500000,
            "purchase": True,
            "deduct_sku": "prod_limited_flask"
        },
        "CONTEXT_F_ALPHA_OUTDOORS": {
            "merchant_id": "merch_alpha",
            "prompt": "Need high quality ultralight alpine expedition travel backpack under 15000",
            "budget": 1500000,
            "purchase": True,
            "deduct_sku": "prod_alpha_tent"
        }
    }

    # Step 1: Pre-run model probe for Atlas Travel Gear (BEFORE learning state)
    print("\n[Probe Before] Checking initial LinUCB model state for Atlas Travel Gear...")
    model_before, _ = await PolicyLearningModelService.get_or_create_model(db, "merch_atlas_travel")
    obs_before = model_before.observation_count
    
    probe_req = CanonicalDecisionRequest(
        merchant_id="merch_atlas_travel",
        request_id=f"req_probe_before_{uuid.uuid4().hex[:6]}",
        opportunity_id="opp_probe_before",
        raw_prompt=clusters["CONTEXT_A_BACKPACK_NORMAL"]["prompt"]
    )
    probe_before_env = await CanonicalDecisionRuntime.decide(db, probe_req)
    probe_pred_before = probe_before_env.scores.predicted_contribution_paise
    print(f"  -> Model Observation Count Before: {obs_before}")
    print(f"  -> LinUCB Predicted Contribution (Context A): INR {probe_pred_before / 100:.2f} ({probe_pred_before} paise)")

    # Population execution plan:
    # 10 Context A (Purchases)
    # 8 Context B (Non-purchases / payment failed)
    # 7 Context C (Bundle Purchases)
    # 4 Context D (Budget Sensitive -> NO_OFFER)
    # 4 Context E (Limited Stock -> 3 purchases deplete stock to 0, 4th triggers SAFETY_REJECTED)
    # 5 Context F (Alpha Tenant -> Multi-tenant isolation)
    # Total = 38 opportunities
    plan = [
        ("CONTEXT_A_BACKPACK_NORMAL", 10),
        ("CONTEXT_B_WATERPROOF_ABANDON", 8),
        ("CONTEXT_C_BUNDLE_SEEKER", 7),
        ("CONTEXT_D_BUDGET_SENSITIVE", 4),
        ("CONTEXT_E_LIMITED_STOCK", 4),
        ("CONTEXT_F_ALPHA_OUTDOORS", 5),
    ]

    metrics = {
        "opportunities_total": 0,
        "decisions_total": 0,
        "exploit_decisions": 0,
        "explore_decisions": 0,
        "no_offer_decisions": 0,
        "executions_completed": 0,
        "safety_rejections": 0,
        "payments_captured": 0,
        "payments_failed": 0,
        "outcomes_processed": 0,
        "valid_evidence_created": 0,
        "memories_created": 0,
        "model_updates_applied": 0,
        "atlas_opportunities": 0,
        "atlas_decisions": 0,
        "atlas_executions": 0,
        "atlas_paid": 0,
        "atlas_expected_contrib_paise": 0,
        "atlas_observed_contrib_paise": 0,
        "alpha_opportunities": 0,
        "alpha_decisions": 0,
        "alpha_paid": 0
    }

    res_mgr = InventoryReservationManager()
    opp_seq = 1
    sample_atlas_execution_id = None
    sample_alpha_execution_id = None

    for cluster_key, count in plan:
        cluster_info = clusters[cluster_key]
        m_id = cluster_info["merchant_id"]

        for idx in range(1, count + 1):
            opp_id = f"opp_{m_id[6:]}_{cluster_key[:9].lower()}_{opp_seq:03d}"
            req_id = f"req_{uuid.uuid4().hex[:8]}"
            opp_seq += 1
            metrics["opportunities_total"] += 1
            if m_id == "merch_atlas_travel":
                metrics["atlas_opportunities"] += 1
            else:
                metrics["alpha_opportunities"] += 1

            # 1. Canonical Decision Runtime
            dec_req = CanonicalDecisionRequest(
                merchant_id=m_id,
                request_id=req_id,
                opportunity_id=opp_id,
                raw_prompt=cluster_info["prompt"]
            )
            envelope = await CanonicalDecisionRuntime.decide(db, dec_req)
            metrics["decisions_total"] += 1
            if m_id == "merch_atlas_travel":
                metrics["atlas_decisions"] += 1
                metrics["atlas_expected_contrib_paise"] += envelope.scores.predicted_contribution_paise
            else:
                metrics["alpha_decisions"] += 1

            if envelope.decision_mode == DecisionMode.EXPLOIT:
                metrics["exploit_decisions"] += 1
            else:
                metrics["explore_decisions"] += 1

            is_no_offer = (
                envelope.selected_policy.strategy_type == "NO_OFFER"
                or envelope.buyer_offer.strategy_type == "NO_OFFER"
                or envelope.selected_policy.candidate_id == "cand_baseline"
            )
            if is_no_offer:
                metrics["no_offer_decisions"] += 1

            # 2. Decision Execution Boundary
            exec_req = DecisionExecuteRequest(
                merchant_id=m_id,
                idempotency_key=f"idem_exec_{opp_id}"
            )
            exec_res = await DecisionExecutionBoundaryService.execute_decision(
                db=db,
                decision_id=envelope.decision_id,
                request=exec_req
            )

            if exec_res.boundary_status == ExecutionBoundaryStatus.EXECUTION_COMPLETED:
                metrics["executions_completed"] += 1
                if m_id == "merch_atlas_travel":
                    metrics["atlas_executions"] += 1
                    sample_atlas_execution_id = exec_res.execution_id
                else:
                    sample_alpha_execution_id = exec_res.execution_id
                
                target_order = await db.get(Order, exec_res.order_id)

                if cluster_info["purchase"]:
                    # PATH A: SUCCESSFUL PURCHASE (Captured Payment)
                    pmt_id = f"pay_{uuid.uuid4().hex[:10]}"
                    payment = Payment(
                        id=pmt_id,
                        order_id=exec_res.order_id,
                        amount_paise=exec_res.authorized_amount_paise,
                        currency="INR",
                        status="captured",
                        method="upi",
                        captured_at=datetime.now(timezone.utc)
                    )
                    db.add(payment)
                    target_order.status = TransactionState.PAID.value
                    
                    if cluster_info["deduct_sku"]:
                        await res_mgr.commit_inventory_deduction(db, {cluster_info["deduct_sku"]: 1})
                    await db.commit()

                    out_req = OutcomeProcessRequest(
                        merchant_id=m_id,
                        execution_id=exec_res.execution_id,
                        idempotency_key=f"idem_out_{exec_res.execution_id}"
                    )
                    out_res = await OutcomeFeedbackService.process_outcome(db, out_req)

                    metrics["payments_captured"] += 1
                    metrics["outcomes_processed"] += 1
                    if m_id == "merch_atlas_travel":
                        metrics["atlas_paid"] += 1
                        metrics["atlas_observed_contrib_paise"] += (out_res.reward_contribution_paise or 0)
                    else:
                        metrics["alpha_paid"] += 1

                    if out_res.evidence_id:
                        metrics["valid_evidence_created"] += 1
                    if out_res.memory_id:
                        metrics["memories_created"] += 1
                    if out_res.learning_eligible:
                        metrics["model_updates_applied"] += 1

                    if opp_seq == 2:  # First executed opportunity is the Canonical Hero Journey
                        print(f"\n========================================================")
                        print(f">>> [HERO DEMO CANONICAL BUYER JOURNEY] <<<")
                        print(f"  Prompt: '{cluster_info['prompt']}'")
                        print(f"  Opportunity ID: {envelope.opportunity_id}")
                        print(f"  Decision ID: {envelope.decision_id}")
                        print(f"  Selected Policy: {envelope.selected_policy.candidate_id} ({envelope.selected_policy.strategy_type})")
                        print(f"  Mode: {envelope.decision_mode.value}")
                        print(f"  Authorized Amount: INR {exec_res.authorized_amount_paise / 100:.2f} ({exec_res.authorized_amount_paise} paise)")
                        print(f"  Execution ID: {exec_res.execution_id}")
                        print(f"  Order ID: {exec_res.order_id}")
                        print(f"  Payment ID: {pmt_id} (Captured: UPI Test Mode)")
                        print(f"  Outcome ID: {out_res.outcome_id} (Status: {out_res.outcome_status.value})")
                        print(f"  Observed Contribution: INR {(out_res.reward_contribution_paise or 0) / 100:.2f}")
                        print(f"  Learning Eligible: {out_res.learning_eligible}")
                        print(f">>> [END HERO DEMO CANONICAL JOURNEY] <<<")
                        print(f"========================================================\n")

                else:
                    # PATH B: BUYER DOES NOT PURCHASE (Failed / Cancelled Payment)
                    pmt_id = f"pay_fail_{uuid.uuid4().hex[:10]}"
                    payment = Payment(
                        id=pmt_id,
                        order_id=exec_res.order_id,
                        amount_paise=exec_res.authorized_amount_paise,
                        currency="INR",
                        status="failed",
                        method="card",
                        error_code="PAYMENT_ABANDONED_BY_BUYER",
                        error_description="Buyer abandoned checkout flow at authorization step."
                    )
                    db.add(payment)
                    target_order.status = TransactionState.FAILED.value
                    
                    # Release inventory
                    if cluster_info["deduct_sku"]:
                        await res_mgr.release_inventory(db, {cluster_info["deduct_sku"]: 1})
                    await db.commit()

                    out_req = OutcomeProcessRequest(
                        merchant_id=m_id,
                        execution_id=exec_res.execution_id,
                        idempotency_key=f"idem_out_{exec_res.execution_id}"
                    )
                    out_res = await OutcomeFeedbackService.process_outcome(db, out_req)

                    metrics["payments_failed"] += 1
                    metrics["outcomes_processed"] += 1
                    if out_res.evidence_id:
                        metrics["valid_evidence_created"] += 1
                    if out_res.memory_id:
                        metrics["memories_created"] += 1
                    if out_res.learning_eligible:
                        metrics["model_updates_applied"] += 1

            else:
                metrics["safety_rejections"] += 1
                print(f"  [EXEC REJECTED: {opp_id}] {exec_res.boundary_status.value} - {exec_res.rejection_reasons}")

    print(f"\n[Run] Simulation complete across {metrics['opportunities_total']} opportunities.")

    # Step 2: Post-run model probe for Atlas Travel Gear (AFTER learning state)
    print("\n[Probe After] Checking learned LinUCB model state for Atlas Travel Gear...")
    model_after, _ = await PolicyLearningModelService.get_or_create_model(db, "merch_atlas_travel")
    obs_after = model_after.observation_count

    probe_req_after = CanonicalDecisionRequest(
        merchant_id="merch_atlas_travel",
        request_id=f"req_probe_after_{uuid.uuid4().hex[:6]}",
        opportunity_id="opp_probe_after",
        raw_prompt=clusters["CONTEXT_A_BACKPACK_NORMAL"]["prompt"]
    )
    probe_after_env = await CanonicalDecisionRuntime.decide(db, probe_req_after)
    probe_pred_after = probe_after_env.scores.predicted_contribution_paise

    print(f"  -> Model Observation Count After: {obs_after} (Delta: +{obs_after - obs_before})")
    print(f"  -> LinUCB Predicted Contribution (Context A): INR {probe_pred_after / 100:.2f} ({probe_pred_after} paise)")
    print(f"  -> Prediction Shift: {probe_pred_after - probe_pred_before:+d} paise")

    # Step 3: Active policy check (proves Model Learning != Active Policy Promotion)
    active_pol = await PolicyLifecycleService.get_active_policy(db, "merch_atlas_travel")
    print(f"  -> Authoritative Active Policy Pointer: {active_pol.policy_id} ({active_pol.promotion_id})")

    # Step 4: Replay / Idempotency & Tenant Isolation Verification
    if sample_atlas_execution_id:
        print("\n[Idempotency Check] Replaying outcome feedback for completed Atlas execution...")
        replay_req = OutcomeProcessRequest(
            merchant_id="merch_atlas_travel",
            execution_id=sample_atlas_execution_id,
            idempotency_key=f"idem_out_{sample_atlas_execution_id}"
        )
        replay_res = await OutcomeFeedbackService.process_outcome(db, replay_req)
        print(f"  -> Replay response received. Outcome ID: {replay_res.outcome_id}, Status: {replay_res.outcome_status.value}")

    if sample_alpha_execution_id:
        print("\n[Tenant Isolation Check] Verifying cross-tenant outcome replay rejection...")
        cross_req = OutcomeProcessRequest(
            merchant_id="merch_atlas_travel",
            execution_id=sample_alpha_execution_id,
            idempotency_key=f"idem_cross_tenant_test"
        )
        try:
            await OutcomeFeedbackService.process_outcome(db, cross_req)
            print("  -> ERROR: Cross-tenant outcome was NOT rejected!")
        except OutcomeTenantViolationError as ex:
            print(f"  -> SUCCESS: Cross-tenant outcome strictly rejected: {ex}")

    # Step 5: Evidence-Gated Promotion Evaluation (Candidate != Active Policy)
    print("\n[Governance Audit] Evaluating candidate policy promotion for Atlas Travel Gear...")
    prom_req = PolicyPromotionRequest(
        merchant_id="merch_atlas_travel",
        candidate_policy_id="cand_54256751",
        candidate_policy_version="merchant-policy/v1",
        reason="Periodic governance evaluation of candidate travel bundle"
    )
    prom_res = await PolicyLifecycleService.promote_policy(db, prom_req)
    print(f"  -> Candidate Policy ID: {prom_res.candidate_policy_id}")
    print(f"  -> Promotion Status: {prom_res.promotion_status.value}")
    print(f"  -> Eligibility: {prom_res.eligibility_status}")
    print(f"  -> Failure Codes: {[f.value for f in prom_res.failure_codes]}")
    print(f"  -> Resulting Active Policy: {prom_res.resulting_active_policy_id}")

    return {
        "metrics": metrics,
        "learning_proof": {
            "obs_before": obs_before,
            "obs_after": obs_after,
            "pred_before_paise": probe_pred_before,
            "pred_after_paise": probe_pred_after,
            "active_policy_id": active_pol.policy_id,
            "promotion_id": active_pol.promotion_id
        }
    }


async def main():
    print("=" * 70)
    print("RAZORPAY AI BUILDATHON 2026 - DEMO POPULATION RUNNER")
    print("=" * 70)

    # Initialize DB schema
    await init_db()

    target_merchants = ["merch_atlas_travel", "merch_alpha"]

    async with AsyncSessionLocal() as db:
        # 1. Reset
        await reset_demo_merchants(db, target_merchants)

        # 2. Seed
        await seed_demo_merchants(db)

        # 3. Run Population Simulation
        results = await run_population_simulation(db)

        # 4. Final Accounting & Database Verification
        print("\n" + "=" * 70)
        print("DATABASE RECORD VERIFICATION & FINAL METRICS AUDIT")
        print("=" * 70)

        for m_id in target_merchants:
            opp_cnt = (await db.execute(
                select(func.count(func.distinct(CanonicalDecisionRecord.opportunity_id)))
                .where(CanonicalDecisionRecord.merchant_id == m_id)
            )).scalar_one()

            dec_cnt = (await db.execute(
                select(func.count(CanonicalDecisionRecord.id))
                .where(CanonicalDecisionRecord.merchant_id == m_id)
            )).scalar_one()

            exec_cnt = (await db.execute(
                select(func.count(DecisionExecutionRecord.id))
                .where(and_(
                    DecisionExecutionRecord.merchant_id == m_id,
                    DecisionExecutionRecord.boundary_status == "EXECUTION_COMPLETED"
                ))
            )).scalar_one()

            paid_cnt = (await db.execute(
                select(func.count(OutcomeFeedbackRecord.id))
                .where(and_(
                    OutcomeFeedbackRecord.merchant_id == m_id,
                    OutcomeFeedbackRecord.outcome_status == "PAYMENT_SUCCESS"
                ))
            )).scalar_one()

            obs_cnt = (await db.execute(
                select(func.count(AppliedModelObservationRecord.id))
                .where(AppliedModelObservationRecord.merchant_id == m_id)
            )).scalar_one()

            mem_cnt = (await db.execute(
                select(func.count(PolicyMemoryRecord.id))
                .where(PolicyMemoryRecord.merchant_id == m_id)
            )).scalar_one()

            evi_cnt = (await db.execute(
                select(func.count(LearningEvidenceRecord.id))
                .where(and_(
                    LearningEvidenceRecord.merchant_id == m_id,
                    LearningEvidenceRecord.evidence_status == "VALID"
                ))
            )).scalar_one()

            obs_sum_paise = (await db.execute(
                select(func.coalesce(func.sum(OutcomeFeedbackRecord.reward_contribution_paise), 0))
                .where(and_(
                    OutcomeFeedbackRecord.merchant_id == m_id,
                    OutcomeFeedbackRecord.outcome_status == "PAYMENT_SUCCESS"
                ))
            )).scalar_one()

            exp_sum_paise = (await db.execute(
                select(func.coalesce(func.sum(CanonicalDecisionRecord.predicted_contribution_paise), 0))
                .where(CanonicalDecisionRecord.merchant_id == m_id)
            )).scalar_one()

            print(f"\n[Tenant Audit: {m_id}]")
            print(f"  - Opportunities: {opp_cnt}")
            print(f"  - Decisions Evaluated: {dec_cnt}")
            print(f"  - Decision Rate: {round(dec_cnt / opp_cnt * 100.0, 1) if opp_cnt > 0 else 0.0}%")
            print(f"  - Authorized Executions: {exec_cnt}")
            print(f"  - Paid Transactions: {paid_cnt}")
            print(f"  - Valid Learning Evidence: {evi_cnt}")
            print(f"  - Policy Memory Records: {mem_cnt}")
            print(f"  - Applied Model Observations: {obs_cnt}")
            print(f"  - Expected Contribution: INR {exp_sum_paise / 100:.2f} ({exp_sum_paise} paise)")
            print(f"  - Observed Test-Mode Contribution: INR {obs_sum_paise / 100:.2f} ({obs_sum_paise} paise)")

    print("\n[Complete] Demo population script finished successfully.")
    print("[Ready] The live dashboard at http://localhost:3000 is now populated with genuine persistent data.\n")


if __name__ == "__main__":
    asyncio.run(main())
