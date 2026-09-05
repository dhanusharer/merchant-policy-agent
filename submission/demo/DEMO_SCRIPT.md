# Demo Presentation Script & Speaking Flow

> **Razorpay AI Buildathon 2026 — Track 01: AI Growth & Agentic Commerce**  
> **Format**: 3-Minute Video Walkthrough + Technical Depth Addendum

---

## 3-Minute Video Script

### Segment 1: The Problem (0:00 – 0:25)
- **Visual**: Show traditional web storefront vs. a terminal/API interface showing programmatic AI buyer queries.
- **Narrator**:
  > "Commerce is undergoing a fundamental shift: AI agents are increasingly becoming the buyers. Unlike human shoppers who respond to countdown timers and visual banners, AI buyers operate on strict utility functions, constraints, and budgets. 
  > If a merchant relies on static rules or unconstrained LLMs, they either lose high-intent AI traffic or leak profit through uncontrolled discounting. Merchants need a way to teach AI how their specific business wins."

---

### Segment 2: System Thesis & Architecture (0:25 – 0:50)
- **Visual**: Show the Architecture Invariant diagram:
  `LLM Proposes ➔ Code Validates ➔ Code Executes ➔ Razorpay Reports ➔ Agent Learns`
- **Narrator**:
  > "Meet the Merchant Policy Agent. Our core thesis is simple: The LLM proposes commercial strategies, but deterministic code validates and executes them, and Razorpay provides the authoritative financial truth.
  > The LLM is never given financial authority. It cannot invent prices or bypass margin floors. Every decision is grounded in real unit economics and verified through Razorpay transactions."

---

### Segment 3: Canonical Buyer Journey (0:50 – 1:40)
- **Visual**: Switch to the **AI Decisions Ledger** (`/decisions`) in the Merchant Control Center. Open the drawer for the hero opportunity (`"I need a travel backpack for a business trip under ₹8,000"`).
- **Narrator**:
  > "Let's see this in action for our hero merchant, Atlas Travel Gear. 
  > An AI buyer submits a request for a business travel backpack under ₹8,000. 
  > Our intent engine extracts the category, specs, and budget. The policy agent generates commercial candidates: a standalone backpack, an alternative, and a complementary bundle with a laptop sleeve.
  > The contextual bandit selects the bundle strategy. Before anything is offered, our deterministic safety gate re-evaluates the catalog in real time: margin floor of 25% is satisfied, discount ceiling of 20% is respected, and physical inventory is atomically reserved.
  > An order is created through Razorpay in Test Mode for ₹3,499."

---

### Segment 4: Authoritative Outcome & Learning (1:40 – 2:15)
- **Visual**: Show the **Decision Lineage Drawer** highlighting Stages 8 to 11 (Razorpay Payment ID ➔ Outcome Feedback ➔ Realized Contribution ➔ LinUCB Update). Then transition to the **Learning Center** (`/learning`).
- **Narrator**:
  > "Here is the closed-loop differentiator: The execution is not the end. When Razorpay confirms payment capture via webhook, our Outcome Feedback service calculates the exact gross economic contribution: ₹3,499 realized revenue minus ₹1,900 COGS equals ₹1,599 realized profit.
  > This authoritative reward updates our online LinUCB learning model. 
  > Notice in the Learning Center: The model now has a stronger learned affinity for bundling laptop sleeves in business travel contexts. But critically, learning does NOT automatically mutate the merchant's governed commercial policy."

---

### Segment 5: Governance Plane & Control Center (2:15 – 2:40)
- **Visual**: Switch to **Policy Governance** (`/policies`). Show candidate `cand_54256751` and click 'Evaluate Promotion' to show the modal rejecting with `INSUFFICIENT_EVIDENCE`.
- **Narrator**:
  > "In the Policy Governance tab, merchants retain total control. Experimental candidates are tracked in an isolated candidate registry. 
  > When we evaluate this bundle policy for promotion to become the merchant's active baseline, the system strictly rejects it: sample size is insufficient. 
  > An AI hypothesis cannot self-promote into production without proving statistical significance and financial safety. The merchant's baseline remains safe."

---

### Segment 6: Differentiation & Close (2:40 – 3:00)
- **Visual**: Show the **Overview Dashboard** (`/`) with live KPIs (35 opportunities, 17 paid transactions, ₹19,529.05 observed contribution) and the automated test accounting badge (926 passed).
- **Narrator**:
  > "This is not a generic chatbot or a static recommender. It is an autonomous commercial policy learning loop designed specifically for the agentic commerce era—backed by 926 rigorous automated tests, zero fake metrics, and the financial authority of Razorpay.
  > Thank you."

---

## Technical Walkthrough Addendum (For Deep-Dive Evaluation)

If technical evaluators require an extended 10-minute code walkthrough:

1. **Unit Economics & Commerce Primitives**:
   - Inspect `domain/models.py` (`Merchant`, `Product`, `ProductAffinity`).
   - Demonstrate that integer paise arithmetic prevents floating-point rounding errors.
2. **Intent & Candidate Generation**:
   - Inspect `services/intent/extractor.py` and `services/agent/policy_agent.py`.
   - Show how candidate generation creates typed `PolicyProposal` instances.
3. **Execution Gate & Razorpay Client**:
   - Inspect `services/boundary/service.py` and `services/razorpay/client.py`.
   - Show how orders are created via the official Razorpay test credentials.
4. **Bandit Learning Math**:
   - Inspect `services/learning/model_service.py` and `services/learning/schemas.py`.
   - Show the LinUCB ridge regression matrix update: $A \leftarrow A + x x^T$ and $b \leftarrow b + r x$.
5. **Multi-Tenant Isolation**:
   - Show cross-tenant query rejection between `merch_atlas_travel` and `merch_alpha`.
