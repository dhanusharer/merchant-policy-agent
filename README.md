# Merchant Policy Agent

> **Razorpay AI Buildathon 2026 — Track 01: AI Growth & Agentic Commerce**  
> An autonomous commercial policy learning system for merchants selling to AI buyers, anchored by Razorpay’s transaction and economic feedback layer.  
> **Release Candidate**: 1.0.0-rc (Phases 0–12.1 Audited, Tested & Frozen)

---

## 1. System Thesis & Architecture Invariant

```text
LLM Proposes ➔ Code Validates ➔ Code Executes ➔ Razorpay Reports ➔ Agent Learns
```

The **Merchant Policy Agent** enables merchants to teach AI what makes their business win. As AI agents increasingly act as autonomous buyers on behalf of humans, traditional e-commerce visual heuristics (popups, urgency banners, click-through tracking) fail completely. AI buyers evaluate strict constraint satisfaction, utility functions, and deterministic pricing.

To win in agentic commerce without sacrificing margins or solvency:
1. **The LLM is NEVER an Execution Authority**: The LLM proposes commercial strategies (bundles, bounded discounts, alternative recommendations), but deterministic code validates margin floors, discount ceilings, and real-time inventory.
2. **Razorpay is Financial Ground Truth**: Orders, payments, and refunds are authoritative signals. An order authorization (`EXECUTION_COMPLETED`) is distinct from payment capture (`PAYMENT_SUCCESS`). Abandoned checkouts or failed payments yield ₹0 reward.
3. **Adaptive Economic Learning**: An online contextual bandit (LinUCB with Ridge regression) continuously learns context-sensitive policy value based on realized gross economic contribution ($Realized Revenue - Realized COGS$).
4. **Learning != Promotion**: Online learning continuously refines prediction models; however, promoting an experimental policy into the merchant's active baseline requires strict, immutable governance gates with sample-size and economic verification.

---

## 2. Authoritative Test Accounting & Regression Status

The repository is protected by **926 unique automated tests** across all parent suites, with **zero failures, zero errors, and zero skips**:

| Test Suite | Command | Tests | Status | Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Unit Test Suite** | `pytest tests/unit` | **541** | **PASSED (100%)** | Domain models, intent parser, selection ranking, safety validators, bandit math, lifecycle rules |
| **Integration Test Suite** | `pytest tests/integration` | **364** | **PASSED (100%)** | Runtime pipeline, Razorpay adapter, execution gate, learning feedback, semantic reconciliation, demo environment |
| **Playwright E2E Suite** | `npx playwright test` | **21** | **PASSED (100%)** | Full browser flows: overview, ledger drawers, policy governance, tenant isolation, responsive layouts |
| **Phase 11 Benchmark & Adversarial** | *(subset of integration)* | **49** | **PASSED (100%)** | Golden scenarios, economic boundary hardening, adaptive learning, anti-temporal leakage, lifecycle & concurrency |
| **Total Parent Test Accounting** | | **926** | **0 Failures, 0 Errors, 0 Skips** | **100% Green Release Candidate** |

---

## 3. The 5-Stage Closed Loop

```text
       ┌─────────────────────────────────────────────────────────────┐
       │                          AI BUYER                           │
       │  (Autonomous agent with budget, constraints, use case)      │
       └──────────────────────────────┬──────────────────────────────┘
                                      │ Natural Language Prompt / API
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │                   STAGE 1: BUYER INTENT                     │
       │  IntentExtractor parses category, budget, specs, urgency    │
       └──────────────────────────────┬──────────────────────────────┘
                                      │ Structured BuyerIntent
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │               STAGE 2: MERCHANT POLICY AGENT                │
       │  MerchantPolicyAgent reads catalog, unit economics, affinities│
       └──────────────────────────────┬──────────────────────────────┘
                                      │ Generates Candidates
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │              STAGE 3: CANDIDATE STRATEGIES                  │
       │  (Bundle, Bounded Discount, Alternative, Cross-sell, Baseline)│
       └──────────────────────────────┬──────────────────────────────┘
                                      │ Admissibility Filtering
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │             STAGE 4: DETERMINISTIC VALIDATION               │
       │  Margin floor check, discount ceiling check, inventory check│
       └──────────────────────────────┬──────────────────────────────┘
                                      │ Approved Candidates
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │                 STAGE 5: POLICY SELECTION                   │
       │  Contextual LinUCB bandit scores UCB = predicted + alpha*std│
       │  Selects Exploit vs. Explore based on uncertainty           │
       └──────────────────────────────┬──────────────────────────────┘
                                      │ Chosen Policy Proposal
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │                   STAGE 6: FRESH SAFETY                     │
       │  Re-verifies real-time stock & margin floors at execution   │
       └──────────────────────────────┬──────────────────────────────┘
                                      │ Authorized Execution Request
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │               STAGE 7: EXECUTION BOUNDARY                   │
       │  Atomically reserves inventory; creates Razorpay Order      │
       └──────────────────────────────┬──────────────────────────────┘
                                      │ Order ID & Amount (Paise)
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │              STAGE 8: RAZORPAY TEST MODE                    │
       │  Real test gateway: order creation, payment capture/fail    │
       └──────────────────────────────┬──────────────────────────────┘
                                      │ Authorized Payment Webhook
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │                   STAGE 9: OUTCOME FEEDBACK                 │
       │  OutcomeFeedbackService resolves transaction state (PAID)   │
       └──────────────────────────────┬──────────────────────────────┘
                                      │ Realized Revenue & COGS
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │                    STAGE 10: REWARD ENGINE                  │
       │  Reward Formula = Realized Revenue - Realized COGS (Paise)  │
       └──────────────────────────────┬──────────────────────────────┘
                                      │ Observed Economic Contribution
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │                   STAGE 11: POLICY MEMORY                   │
       │  Stores immutable PolicyMemoryRecord & LearningEvidence     │
       └──────────────────────────────┬──────────────────────────────┘
                                      │ Evidence Record
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │                 STAGE 12: LinUCB LEARNING                   │
       │  Updates covariance matrix A and feature vector b           │
       └──────────────────────────────┬──────────────────────────────┘
                                      │ Updated Bandit Model
                                      ▼
       ┌─────────────────────────────────────────────────────────────┐
       │              STAGE 13: EXPLORATION / LIFECYCLE              │
       │  Updates exploration budget; evaluates candidate promotion  │
       └──────────────────────────────┬──────────────────────────────┘
                                      ↺ Closed Loop Iteration
```

---

## 4. Hero Demo: Atlas Travel Gear

- **Primary Hero Merchant**: Atlas Travel Gear (`merch_atlas_travel`)
- **Secondary Isolation Merchant**: Alpha Outfitters (`merch_alpha`)
- **Canonical Buyer Prompt**: `"I need a travel backpack for a business trip under 8000"`
- **Active Governed Baseline**: `cand_base_no_offer` (`NO_OFFER` baseline policy)
- **Candidate Policy under Test**: `cand_54256751` (Complementary Bundle: Backpack + Laptop Sleeve)

### Persistent Demo Dataset Summary
- **Opportunities Evaluated**: 35 (Atlas) + 5 (Alpha)
- **Decision Rate**: 100.0%
- **Authorized Executions**: 25 (Atlas) + 5 (Alpha)
- **Paid Transactions**: 17 (Atlas) + 5 (Alpha)
- **Observed Test-Mode Contribution**: ₹19,529.05 (Atlas) + ₹20,695.20 (Alpha)
- **Valid Learning Evidence Records**: 25 (Atlas)
- **Applied Model Updates**: 25 (Atlas)
- **Governance Gate Audit**: Evaluated candidate promotion for `cand_54256751`, resulting in deterministic rejection (`INSUFFICIENT_SAMPLE_SIZE`) and immutable audit record.

---

## 5. Control Center Dashboard

The operator control plane runs on Next.js (`http://localhost:3000`):

- **Overview (`/`)**: KPIs, decision rate, authorized execution rate, test-mode observed contribution, contextual learning insights, and active policy status.
- **AI Decisions Ledger (`/decisions`)**: 11-stage lineage drawer tracking every opportunity from prompt to learning update.
- **Policy Governance (`/policies`)**: Candidate registry, active policy pointer, promote/rollback actions, and criteria evaluation modal.
- **Learning Center (`/learning`)**: Model health counters, feature dimension weights, and contextual segment signals.
- **Activity Audit (`/activity`)**: Append-only log of promotion attempts, safety rejections, and execution events.

---

## 6. Quickstart

### 1. Environment Setup
```bash
# Activate virtual environment
.\.venv\Scripts\activate

# Install dependencies (if not installed)
pip install -e ".[dev]"

# Apply database migrations
alembic upgrade head
```

### 2. Seed Deterministic Demo Dataset
```bash
python scripts/run_demo_population.py
```

### 3. Start Backend & Frontend
```bash
# Terminal 1: Backend API (port 8000)
uvicorn apps.api.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Frontend Dashboard (port 3000)
cd apps/web
npm run dev
```

### 4. Run Verification Suites
```bash
# Run unit tests (541 tests)
pytest tests/unit -q

# Run integration tests (364 tests)
pytest tests/integration -q

# Run Playwright E2E tests (21 tests)
cd apps/web
npx playwright test
```

---

## 7. Submission Package & Documentation Directory

Detailed submission assets are packaged in `/submission`:

- [`/submission/README.md`](file:///c:/Users/DHANUSH%20A%20G/Desktop/razopay_new/submission/README.md): Executive overview & judge evaluation guide.
- [`/submission/architecture.md`](file:///c:/Users/DHANUSH%20A%20G/Desktop/razopay_new/submission/architecture.md): Full architectural specification & invariants.
- [`/submission/limitations.md`](file:///c:/Users/DHANUSH%20A%20G/Desktop/razopay_new/submission/limitations.md): Explicit disclosure of boundaries & assumptions.
- [`/submission/demo/DEMO_SCRIPT.md`](file:///c:/Users/DHANUSH%20A%20G/Desktop/razopay_new/submission/demo/DEMO_SCRIPT.md): 3-minute video presentation script.
- [`/submission/demo/COMMANDS.md`](file:///c:/Users/DHANUSH%20A%20G/Desktop/razopay_new/submission/demo/COMMANDS.md): Exact verified terminal commands.
- [`/submission/docs/SYSTEM_SPECIFICATION.md`](file:///c:/Users/DHANUSH%20A%20G/Desktop/razopay_new/submission/docs/SYSTEM_SPECIFICATION.md): Versioned contracts & semantic rules.
- [`/submission/evidence/VALIDATION_REPORT.md`](file:///c:/Users/DHANUSH%20A%20G/Desktop/razopay_new/submission/evidence/VALIDATION_REPORT.md): Comprehensive test accounting.
- [`/submission/benchmark/BENCHMARK_RESULTS.md`](file:///c:/Users/DHANUSH%20A%20G/Desktop/razopay_new/submission/benchmark/BENCHMARK_RESULTS.md): Phase 11 adversarial benchmark results.
- [`/submission/screenshots/`](file:///c:/Users/DHANUSH%20A%20G/Desktop/razopay_new/submission/screenshots): Full-resolution UI recordings and screenshots.
