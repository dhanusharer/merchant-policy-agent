<div align="center">

# 🛒 Merchant Policy Agent
### *Autonomous Commercial Intelligence for the Agentic Commerce Era*

[![Razorpay AI Buildathon 2026](https://img.shields.io/badge/Razorpay_AI_Buildathon_2026-Track_01:_Agentic_Commerce-0C2340?style=for-the-badge&logo=razorpay&logoColor=3395FF)](https://razorpay.com)
[![Tests Passing](https://img.shields.io/badge/Tests-942%20Passed%20(100%25)-00C853?style=for-the-badge&logo=pytest&logoColor=white)](docs/verification.md)
[![Unit Tests](https://img.shields.io/badge/Unit_Tests-562%20Hermetic-00E676?style=for-the-badge&logo=pytest&logoColor=white)](docs/verification.md)
[![Integration Tests](https://img.shields.io/badge/Integration_Tests-380%20Passed-00B0FF?style=for-the-badge&logo=pytest&logoColor=white)](docs/verification.md)
[![MCP 2026](https://img.shields.io/badge/MCP-2026_Compliant-blueviolet?style=for-the-badge&logo=anthropic&logoColor=white)](docs/mcp-specification.md)
[![Release Candidate](https://img.shields.io/badge/Release_Candidate-v1.0.0--rc-651FFF?style=for-the-badge&logo=git&logoColor=white)](https://github.com/dhanusharer/merchant-policy-agent)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111.0-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js 16](https://img.shields.io/badge/Next.js-16.3.4-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org)

<br/>

**Enables merchants to negotiate and sell profitably to autonomous AI buyer agents — validated by deterministic guardrails, Model Context Protocol (MCP), and closed-loop Razorpay financial truth.**

```text
LLM Proposes ➔ Code Validates ➔ Code Executes ➔ Razorpay Reports ➔ Agent Learns
```

<br/>

[Executive Summary](#-executive-summary) •
[Core Invariants](#-golden-architectural-invariants) •
[MCP AI Buyer](#-external-ai-buyer--mcp-commerce-interface) •
[Architecture](#-system-architecture) •
[Quickstart (60s)](#-quickstart--verification) •
[Razorpay Closed Loop](#-razorpay-closed-loop-integration) •
[Control Center UI](#-operator-control-center) •
[Documentation Index](#-core-documentation-index)

<br/>

<img src="submission/screenshots/overview_dashboard.png" alt="Merchant AI Control Center Overview Dashboard" width="100%" style="border-radius: 12px; box-shadow: 0 12px 40px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.15);" />

</div>

---

## 📌 Executive Summary

As autonomous AI agents replace human consumers as purchasing intermediaries, traditional e-commerce paradigms (visual banners, countdown timers, emotional copywriting) fail. AI buyer agents evaluate hard specifications, budget ceilings, and delivery timelines across dozens of merchants simultaneously in milliseconds.

Merchants face a critical dilemma:
1. **The Static Store Trap**: Offering rigid retail prices loses deals to competitors who dynamically bundle products.
2. **The Unbounded LLM Trap**: Letting an unconstrained generative model negotiate prices causes catastrophic margin collapse through hallucinated discounts or oversold stock.

The **Merchant Policy Agent** solves this through a strictly decoupled, dual-engine architecture:
- **Advisory Generation (Dual-Engine)**: A specialized LLM client powered by **Google Gemini** (`gemini-1.5-flash`) proposes tailored commercial candidate strategies (complementary bundles, volume incentives, value options). If the LLM is unconfigured or unavailable, it transparently falls back to deterministic heuristic generation.
- **Deterministic Validation**: Pure, hardcoded Python validation gates enforce non-negotiable merchant bounds (minimum 25.00% gross margin, maximum 20.00% discount, integer stock availability).
- **Authoritative Razorpay Execution**: Validated proposals generate authentic Razorpay Test Mode orders via signed single-use execution tokens.
- **Closed-Loop Online Learning**: Verified webhook events (`payment.captured`) feed an online **Contextual Linear Upper Confidence Bound (LinUCB)** multi-armed bandit algorithm. Unpaid or abandoned carts never train the model.

---

## 🏛️ Golden Architectural Invariants

| # | Invariant | Enforcement Mechanism | Failure Mode Prevented |
| :--- | :--- | :--- | :--- |
| **1** | **LLM Advisory Only** | Generative models propose candidates; deterministic code validates and executes. | Hallucinated pricing or commitments reaching buyers. |
| **2** | **Integer Paise Arithmetic** | All monetary amounts stored as integer `paise` (1 INR = 100 paise) via `Decimal` margins. | IEEE-754 floating-point rounding errors and fractional paise leakage. |
| **3** | **Single-Use Execution Tokens** | HMAC-SHA256 tokens bound to `decision_id`, `opportunity_id`, amount, and expiration. | Replay attacks, front-running, and price tampering. |
| **4** | **Authoritative Payment Ground Truth** | Only cryptographically verified Razorpay webhooks (`payment.captured`) trigger learning. | Learning from uncollected revenue or simulated signals. |
| **5** | **Strict Multi-Tenant Isolation** | All queries enforce tenant foreign keys; models are trained per-merchant without cross-tenant leakage. | Competitor policy leakage and data poisoning. |
| **6** | **Zero Direct AI Authority & Firewall** | External AI buyers can only REQUEST; code AUTHORIZES. Unit economics (COGS, margins) are strictly concealed. | Exploitative pricing extraction and unauthorized merchant balance drains. |

---

## 🔌 External AI Buyer / MCP Commerce Interface

The system implements the **Model Context Protocol (MCP 2026 specification)**, transforming the Merchant Policy Agent into a native peer for external autonomous AI buyers (such as **Claude Desktop**, procurement agents, or multi-agent shopping swarms).

### Architectural Boundary: The Thin Protocol Adapter

```text
External AI Buyer (Claude Desktop / Shopping Bot)
                      ↓
       Model Context Protocol (JSON-RPC 2.0 / SSE / Stdio)
                      ↓
          Buyer Response Firewall (Conceals COGS & Margins)
                      ↓
     Authoritative Runtime Services (Commerce, Intent, Decision, Boundary, Orders)
                      ↓
         Razorpay Test Mode Order (Integer Paise Execution)
```

The MCP layer is strictly a **thin protocol adapter**—it contains **zero duplicate business logic, zero pricing formulas, and zero direct execution privileges**. All operations delegate directly to existing authoritative services.

### The 6 Conceptual MCP Tools

| Tool | Category | Invariant Enforced |
| :--- | :--- | :--- |
| `search_catalog` | Discovery | Filters active inventory; returns buyer-safe product cards. |
| `get_product` | Discovery | Wholesale COGS / cost strictly stripped by egress firewall. |
| `evaluate_buyer_intent` | Negotiation | Natural language parsed into hard constraints; scrubbed of prompt injections. |
| `get_offer` | Pricing & Policy | Evaluates LinUCB multi-armed bandit; enforces 25% margin floor and 20% discount cap. |
| `request_checkout` | Execution | Atomically locks stock `FOR UPDATE`; generates signed Razorpay Test Order. |
| `get_order_status` | Post-Purchase | Scoped strictly to merchant tenant; returns verified payment & tracking status. |

### Read-Only Resources

- `merchant://capabilities`: Merchant policy capabilities, supported currencies (INR), and transport versions.
- `merchant://catalog`: Real-time public catalog snapshot formatted as buyer-safe markdown tables.

### Claude Desktop Integration

To connect Claude Desktop to your local Merchant Policy Agent instance, add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "merchant-policy-agent": {
      "command": "python",
      "args": ["-m", "services.mcp.server"],
      "cwd": "C:\\path\\to\\merchant-policy-agent",
      "env": {
        "MERCHANT_ID": "merch_atlas_travel",
        "PYTHONPATH": "."
      }
    }
  }
}
```

Or connect over HTTP / Server-Sent Events (SSE) when running FastAPI:
- **JSON-RPC Endpoint**: `POST http://127.0.0.1:8000/api/v1/mcp/jsonrpc`
- **SSE Stream**: `GET http://127.0.0.1:8000/api/v1/mcp/sse`

---

## ⚡ Quickstart & Verification

### Clean-Room Reproduction in < 60 Seconds

```powershell
# 1. Clone the repository
git clone https://github.com/dhanusharer/merchant-policy-agent.git
cd merchant-policy-agent

# 2. Set up Python virtual environment
python -m venv .venv
.venv\Scripts\activate
pip install -e ".[dev]"

# 3. Initialize configuration
cp .env.example .env

# 4. Run full hermetic unit test suite (562 tests, 0 failures, 100% in-memory)
pytest tests/unit -v --tb=short

# 5. Run full integration test suite (380 tests)
pytest tests/integration -q

# 6. Run canonical autonomous AI buyer MCP journey demo
python scripts/run_mcp_buyer_demo.py
```

**Total automated tests passing:** **942 tests** (562 unit + 380 integration) in ~2 minutes.

---

## 🧭 System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. AI BUYER QUERY                                                                           │
│    "Looking for a travel backpack under ₹5,000 for weekend trips"                           │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 2. BUYER INTENT & COMMERCE CONTEXT                                                          │
│    • Intent Extraction: budget_ceiling = 500000 paise, category = "travel_backpack"         │
│    • Merchant Context: wholesale COGS, margin floor = 25.00%, discount ceiling = 20.00%     │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 3. DUAL-ENGINE POLICY AGENT (services/policy/agent.py)                                      │
│    • Primary: Google Gemini (gemini-1.5-flash) via structured JSON schema prompt            │
│    • Fallback: Deterministic heuristic engine if offline/unconfigured                       │
│    • Candidates: COMPLEMENTARY_BUNDLE, BOUNDED_DISCOUNT, SINGLE_PRODUCT, NO_OFFER           │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 4. DETERMINISTIC SAFETY & SELECTION GATE (services/safety/validator.py)                     │
│    • Rejects any candidate with gross margin < 25.00% or discount > 20.00%                  │
│    • Evaluates LinUCB multi-armed bandit score over 19-dimensional context feature vector   │
│    • Emits CanonicalDecisionRecord with HMAC-signed single-use execution token              │
└──────────────────────────────────────────────┬──────────────────────────────────────────────┘
                                               ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 5. RAZORPAY TEST MODE EXECUTION & RECONCILIATION                                            │
│    • Atomic stock verification and order creation (POST https://api.razorpay.com/v1/orders) │
│    • Buyer completes payment via test card/UPI                                              │
│    • Webhook Listener validates HMAC-SHA256 signature and ingests payment.captured          │
│    • Model update: LinUCB bandit updates A matrix and b vector with realized contribution   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

For full deep-dive architectural specifications and diagrams, see [ARCHITECTURE.md](ARCHITECTURE.md).

---

## 💳 Razorpay Closed-Loop Integration

The integration with Razorpay is not a simple payment link—it forms the **authoritative truth provider** for the autonomous reinforcement loop:

1. **Order Creation (`services/razorpay/client.py`)**:
   - Transmits exact integer paise amounts to `https://api.razorpay.com/v1/orders`.
   - Embeds deterministic metadata notes (`decision_id`, `policy_id`, `opportunity_id`).
2. **Signature Verification (`services/webhook_service.py`)**:
   - Verifies raw webhook payload using HMAC-SHA256 against `RAZORPAY_WEBHOOK_SECRET`.
   - Protects against replay attacks through idempotent processing (`processed_webhook_events` table).
3. **Automated Reconciliation (`services/razorpay/reconciliation.py`)**:
   - Polling fallback synchronizes orders if webhooks are delayed or dropped.
4. **Learning Feedback (`services/outcome/service.py`)**:
   - `payment.captured` resolves the observation as verified financial contribution ($Revenue - COGS$).
   - Failed, refunded, or abandoned transactions are recorded for safety analytics but excluded from positive reward updates.

---

## 🖥️ Operator Control Center

The system includes a production-grade **Next.js 16** dark-mode operations dashboard running against the FastAPI backend:

- **Overview Dashboard (`/`)**: Real-time KPI cards (AI Buyer Opportunities, Conversion Rate, Realized Contribution, Active Policies) and live interaction timeline.
- **Decision Audit Ledger (`/decisions`)**: Complete audit trace for every canonical decision, displaying candidates considered, LinUCB scores, safety status, and single-use execution tokens.
- **Policy Management (`/policies`)**: Active policy catalog, candidate policy evaluation sandbox, and statistical promotion gate metrics.
- **Learning Center (`/learning`)**: Bandit covariance matrix diagnostics, feature weights, and learning opportunity counters.

### Starting the Local Services

```powershell
# Terminal 1: Launch Backend API (FastAPI)
.venv\Scripts\activate
uvicorn apps.api.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Launch Frontend Control Center (Next.js)
cd apps/web
npm install
npm run dev
# Accessible at http://localhost:3000
```

---

## 📚 Core Documentation Index

To maintain clarity and accessibility, verbose phase-by-phase iteration logs have been consolidated into `docs/archive/phase_logs/`. Core documentation is organized into authoritative manuals:

| Document | Purpose |
| :--- | :--- |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Complete system architecture, execution/learning planes, and data contracts. |
| [docs/mcp-specification.md](docs/mcp-specification.md) | Model Context Protocol (MCP 2026) specification, tools, firewall, and Claude integration. |
| [docs/verification.md](docs/verification.md) | Clean-room reproduction, test suite breakdown (942 tests), and hermeticity guarantees. |
| [docs/economics-model.md](docs/economics-model.md) | Mathematical formulation of integer paise arithmetic, margin floors, and contribution. |
| [docs/security.md](docs/security.md) | Single-use execution token specs, webhook signature validation, and tenant isolation. |
| [docs/failure-recovery.md](docs/failure-recovery.md) | Dead-letter queues, idempotent retry loops, and out-of-order webhook reconciliation. |
| [submission/limitations.md](submission/limitations.md) | Transparent engineering audit of current limitations, trade-offs, and future roadmap. |

---

## ⚖️ License

MIT License. Developed for the Razorpay AI Buildathon 2026 — Track 01 (Agentic Commerce).
