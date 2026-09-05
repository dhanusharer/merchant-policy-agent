# Merchant Policy Agent: Autonomous Commercial Learning for Agentic Commerce

> **Razorpay AI Buildathon 2026 — Track 01: AI Growth & Agentic Commerce**  
> **Repository Release**: 1.0.0-rc  
> **Status**: Production Release Candidate Audited & Frozen (Phases 0–12.1 COMPLETE)  
> **Target Audience**: Judges, Solution Architects, Commerce Engineering Teams

---

## 1. Executive Summary

As AI agents increasingly act as buyers in digital commerce, traditional consumer e-commerce heuristics (clickstreams, promotional banners, checkout popups) fail. AI buyers interact through programmatic interfaces, strict utility optimization, and deterministic semantic constraints.

The **Merchant Policy Agent** provides merchants with an autonomous, closed-loop commercial policy learning system. It autonomously discovers, tests, and evaluates commercial strategies (e.g. complementary product bundling, bounded volume discounts, alternative recommendations) while strictly enforcing financial safety boundaries (margin floors, discount ceilings, real-time inventory gates) and verifying all outcomes through **Razorpay Test Mode transactions**.

### Core Architecture Invariant
```
LLM Proposes ➔ Code Validates ➔ Code Executes ➔ Razorpay Reports ➔ Agent Learns
```
- **The LLM is NEVER an execution authority**: It cannot invent prices, mutate catalog records, bypass margin limits, or self-promote experimental policies.
- **Razorpay is the source of financial truth**: Orders, payments, and refunds are authoritative signals.
- **Adaptive Exploration is bounded**: Bandit exploration (LinUCB) learns context-sensitive policy value without endangering commercial solvency.
- **Learning != Promotion**: A model update reinforces future probability; policy promotion requires immutable governance gates with strict statistical evidence.

---

## 2. Problem & Insight

### The Problem: The Emergence of the AI Buyer
Traditional digital commerce assumes a human in the loop: browsing visual storefronts, influenced by psychological urgency cues, and making impulsive trade-offs. 
When an AI agent acts as the buyer on behalf of a human or enterprise:
1. **Zero Emotional Susceptibility**: AI buyers evaluate strict constraint satisfaction (budget, specs, arrival time).
2. **Context-Specific Utilities**: An AI buyer booking an urgent business trip values fast delivery and laptop compatibility; an AI buyer shopping for leisure values budget optimization.
3. **Margin Erosion Risk**: Uncontrolled dynamic pricing by LLMs can rapidly lead to negative-margin transactions, inventory wipeouts, or predatory discount exploitation.

### The Insight: Commercial Learning Grounded in Payment Authority
Merchants need to teach AI agents how their specific business wins. Rather than a static rulebook or a black-box LLM, merchants require an **adaptive policy engine** that learns from commercial outcomes while keeping financial authority in deterministic code.

---

## 3. The 5-Stage Closed Loop

```
  [ 1. BUYER INTENT ]
  AI Buyer prompt parsed into structured BuyerIntent (budget, constraints, urgency)
          │
          ▼
  [ 2. COMMERCIAL DECISION ]
  Context-sensitive LinUCB bandit scores admissible candidate policies
  (Bundle, Discount, Alternative, Cross-sell, NO_OFFER)
          │
          ▼
  [ 3. FRESH SAFETY & EXECUTION GATE ]
  Deterministic code validates margin floor, discount ceiling, real-time stock
  Razorpay Order created in Test Mode (amount strictly in paise)
          │
          ▼
  [ 4. TEST-MODE TRANSACTION & OUTCOME ]
  Payment capture / failure webhook triggers authoritative OutcomeFeedback
  Reward formula computes exact gross contribution: realized_rev - realized_cogs
          │
          ▼
  [ 5. POLICY MEMORY & LEARNING UPDATE ]
  Immutable PolicyMemoryRecord stored; LinUCB model parameters updated;
  Candidate policy evaluated against promotion gating criteria.
```

---

## 4. Key Differentiators

| Dimension | Generic AI Checkout / Chatbot | Merchant Policy Agent (Track 01) |
| :--- | :--- | :--- |
| **Authority** | LLM generates final response & price | LLM proposes; deterministic code validates & executes |
| **Financial Safety** | Prompt instructions ("please don't discount > 10%") | Hardcoded mathematical boundary; rejects invalid proposals |
| **Outcome Feedback** | Session termination / user feedback score | Authoritative Razorpay Test Mode payment webhook verification |
| **Learning Engine** | Ad-hoc fine-tuning or prompt editing | Online contextual bandit (LinUCB with Ridge regularizer) |
| **Policy Lifecycle** | Immediate unversioned prompt changes | Strict candidate versioning with formal sample-size/margin gates |
| **Multi-Tenancy** | Single prompt space | Strict tenant isolation with distinct models and catalogs |

---

## 5. Hero Demo: Atlas Travel Gear

The demo environment is centered on a realistic, multi-category travel lifestyle merchant:

- **Merchant**: Atlas Travel Gear (`merch_atlas_travel`)
- **Currency**: INR (Paise representation throughout backend)
- **Margin Floor**: 25.00%
- **Discount Ceiling**: 20.00%
- **Active Governed Baseline**: `cand_base_no_offer` (`NO_OFFER` baseline policy)
- **Candidate Policy under Test**: `cand_54256751` (Complementary Bundle: Backpack + Laptop Sleeve)

### The Canonical Buyer Journey
**Buyer Prompt**: `"I need a travel backpack for a business trip under ₹8,000."`
1. **AI Intent Extraction**: Categorized as `travel_backpack`, use case `travel`, budget `800,000 paise` (₹8,000).
2. **Context Resolution**: Evaluated in context cluster `TIER_PREMIUM_GT6K`.
3. **Candidate Generation**: Generates 3 admissible candidates within margin/discount constraints.
4. **Bandit Selection**: Explores candidate policy with highest upper-confidence bound.
5. **Fresh Safety Validation**: Verifies backpack inventory > 0, margin >= 25%, discount <= 20%. Execution authorized.
6. **Razorpay Test Mode Execution**: Order created, simulated UPI test payment captured.
7. **Outcome & Reward**: Gross contribution calculated, LinUCB covariance matrix updated.
8. **Governance Gating**: Candidate evaluated for promotion; rejected cleanly due to `INSUFFICIENT_SAMPLE_SIZE` (safe rejection audit record generated).

---

## 6. Merchant AI Control Center (Dashboard)

The frontend is a dedicated operator control plane built with Next.js and Tailwind CSS (running at `http://localhost:3000`):

1. **Overview Dashboard (`/`)**: Executive KPIs, decision rate, authorized execution rate, test-mode observed contribution, contextual learning insights, and active policy status.
2. **AI Decisions Ledger (`/decisions`)**: Real-time ledger of evaluated opportunities with comprehensive 11-stage decision lineage drawers.
3. **Policy Governance (`/policies`)**: Active baseline pointer, candidate registry, promotion criteria evaluation, manual promote/rollback controls with audit logging.
4. **Learning Center (`/learning`)**: Contextual preference breakdown, LinUCB model health counters, feature dimension weights, and statistical learning indicators.
5. **Activity Audit (`/activity`)**: Append-only immutable log of safety rejections, promotion attempts, and execution lifecycle events.

---

## 7. Automated Test & Validation Accounting

Authoritative regression suites executed directly against active system:

| Test Suite | Unique Tests | Status | Scope |
| :--- | :--- | :--- | :--- |
| **`pytest tests/unit`** | **541** | **PASSED (100%)** | Domain models, intent parser, selection ranking, safety validators, bandit math, lifecycle rules |
| **`pytest tests/integration`** | **364** | **PASSED (100%)** | Runtime pipeline, Razorpay adapter, execution gate, learning feedback, semantic reconciliation, demo environment |
| **`Playwright E2E`** | **21** | **PASSED (100%)** | Full browser flows: overview, ledger drawers, policy governance, tenant isolation, responsive layouts |
| **Total Unique Automated Tests** | **926** | **0 Failures, 0 Errors, 0 Skips** | End-to-end verified release candidate |

*Note: Phase 11 adversarial benchmark scenarios (49 tests) are executed as an authoritative subset of `tests/integration`.*

---

## 8. Quickstart & Demo Verification

### Prerequisites
- Python 3.11+
- Node.js 20+
- SQLite3

### 1. Backend Setup
```bash
# Activate virtual environment
.\.venv\Scripts\activate

# Apply migrations
alembic upgrade head

# Seed deterministic demo state
python scripts/run_demo_population.py

# Start API server (port 8000)
uvicorn apps.api.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Setup
```bash
cd apps/web
npm install
npm run dev
# Dashboard available at http://localhost:3000
```

### 3. Run Full Automated Test Suite
```bash
# 1. Unit Tests
pytest tests/unit -q

# 2. Integration Tests
pytest tests/integration -q

# 3. Playwright E2E Tests
cd apps/web
npx playwright test
```

---

## 9. Submission Package Structure

```
/submission
  ├── README.md                     # This document (executive overview & quickstart)
  ├── architecture.md               # System architecture & closed-loop dataflow specification
  ├── limitations.md                # Transparent disclosure of assumptions & constraints
  ├── demo/
  │   ├── DEMO_SCRIPT.md            # 3-minute video presentation script & speaking notes
  │   └── COMMANDS.md               # Exact verified command sequences for evaluation
  ├── docs/
  │   └── SYSTEM_SPECIFICATION.md   # Detailed contract specifications & Razorpay role
  ├── evidence/
  │   └── VALIDATION_REPORT.md      # Test accounting, audit reports, regression evidence
  ├── benchmark/
  │   └── BENCHMARK_RESULTS.md      # Repeatable Phase 11 benchmark run reports
  └── screenshots/                  # Verified full-resolution UI recordings & screenshots
```
