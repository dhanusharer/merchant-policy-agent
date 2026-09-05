# System Specification & Semantic Rules

> **Razorpay AI Buildathon 2026 — Track 01: AI Growth & Agentic Commerce**  
> **Component**: Specification of Contracts, Semantics, and Razorpay Integration

---

## 1. Frozen System Contracts

The system enforces 14 versioned contracts across all layers:

1. `buyer-intent/v1`: Schema for extracted intent (category, budget, constraints).
2. `merchant-policy/v1`: Schema for generated candidate commercial policies.
3. `execution-gate/v1`: Schema for safety checks and admission status.
4. `buyer-selection/v1`: Schema for simulated buyer choice and acceptance probability.
5. `policy-experiment/v1`: Schema for controlled A/B and multi-armed bandit experiments.
6. `merchant-learning/v1`: Schema for structured learning evidence.
7. `merchant-reward/v1`: Specification of the gross contribution reward formula.
8. `merchant-memory/v1`: Schema for immutable policy memory records.
9. `learning-algorithm/v1`: Specification of the LinUCB ridge regression algorithm.
10. `feature-schema/v1`: 19-dimensional feature vector specification.
11. `learning-model/v1`: Storage schema for model weights, covariance matrix, and bias.
12. `policy-selection/v1`: Specification of candidate ranking and selection.
13. `policy-safety/v1`: Pre-execution and execution-gate safety checks.
14. `canonical-decision/v1`: Schema for the complete DecisionEnvelope.

---

## 2. The Role of Razorpay in the Closed Loop

Razorpay serves as the **financial truth engine** of the Merchant Policy Agent:

1. **Order Creation Authority**:
   - An authorized decision generates a real Razorpay Order via `RazorpayClient.create_order`.
   - Order amount is strictly an integer in paise.
   - Idempotency is guaranteed through client-provided idempotency keys.

2. **Payment State Resolution**:
   - The agent does NOT assume payment upon order creation (`EXECUTION_COMPLETED != PAYMENT_SUCCESS`).
   - Payment status is authoritatively resolved through Razorpay payment webhooks or test payment capture endpoints (`status: "captured"` vs `status: "failed"`).

3. **Closed-Loop Feedback Trigger**:
   - The authoritative `OutcomeFeedbackService` consumes the verified payment state to calculate the real economic reward.
   - Abandoned checkouts, failed cards, or cancelled UPI payments yield exactly ₹0 reward.

---

## 3. Strict Semantic Distinctions

The Control Center dashboard and API adhere to rigorous semantic invariants:

- **Execution Completed != Payment Success**:
  An order may be created and authorized (execution completed), but the customer may abandon payment at the checkout gateway.
- **Payment Failed != No Execution**:
  A payment failure is an active commercial observation: an order was created, stock was reserved, and the customer refused to complete payment. This provides critical negative signal to the bandit model.
- **Predicted Contribution != Observed Contribution**:
  - Predicted: Model expectation at decision time.
  - Observed: Realized revenue minus realized COGS after payment capture.
- **Ranking Score != Predicted Contribution**:
  The ranking score combines predicted contribution with the LinUCB exploration bonus ($\alpha \cdot \text{uncertainty}$).
- **Learning != Promotion**:
  Model parameter updates occur automatically on every transaction. Policy version promotion to become the merchant's active commercial baseline requires satisfying formal governance criteria.
- **Zero != Missing**:
  A 0% discount is an intentional commercial stance (`NO_OFFER`), not a missing value.
- **N/A != Satisfied**:
  Unchecked criteria are marked pending or not applicable, never assumed to be met.

---

## 4. Key Performance Indicators (KPIs)

- **AI Buyer Opportunities**: Count of distinct commercial opportunities submitted.
- **Decision Count**: Total canonical decisions evaluated.
- **Decision Rate**: Percentage of opportunities resulting in an evaluated decision (target: 100%).
- **Authorized Executions**: Decisions that passed fresh safety validation and were submitted to the gateway.
- **Paid Transactions**: Authoritatively captured payment transactions in Razorpay Test Mode.
- **Observed Contribution**: Total sum of realized gross margin across paid orders (paise).
- **Expected Contribution**: Total sum of LinUCB predicted contribution across evaluated opportunities (paise).
