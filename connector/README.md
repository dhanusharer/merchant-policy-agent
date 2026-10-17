# WhatsApp Web Local Connector — Merchant Growth Agent

This connector provides a direct, zero-cost conversational interface for the **Vastram Merchant Growth Agent** using `whatsapp-web.js`.

It connects to WhatsApp Web via a headless Chromium session, displays a scannable QR code in your terminal, and forwards messages between your mobile phone and the FastAPI backend.

---

## Architecture

```
[Merchant Mobile WhatsApp]  (+919113960498)
           │
           │ WhatsApp Messages
           ▼
[Agent WhatsApp Account / WhatsApp Web]
           │
           │ whatsapp-web.js (LocalAuth session)
           ▼
[connector/index.js]
           │
           │ POST /api/v1/whatsapp/connector-inbound
           ▼
[FastAPI Backend :8000]
  ├── Intent Parser (English, Kannada, Hindi)
  ├── Policy Guardrails (Margin Floor enforcement)
  ├── 15-Minute Single-Use Confirmation Tokens
  └── Database (Orders, Products, Audit Ledger)
           │
           │ Returns JSON { reply, intent }
           ▼
[connector/index.js]
           │
           │ msg.reply(replyText)
           ▼
[Merchant Mobile WhatsApp]
```

---

## Quick Setup & Launch

### Step 1: Install Dependencies
Open a terminal in the `connector/` directory:
```bash
cd connector
npm install
```

### Step 2: Ensure FastAPI Backend is Running
In the root directory, ensure the backend dev server is active:
```powershell
.\.venv\Scripts\python.exe -m uvicorn apps.api.main:app --host 0.0.0.0 --port 8000 --reload
```

### Step 3: Launch Connector
In the `connector/` directory:
```bash
node index.js
```

### Step 4: Scan the QR Code
1. A QR code will render in your terminal.
2. Open WhatsApp on the phone number you want to act as the **Agent** (or a second WhatsApp account).
3. Go to **Settings** > **Linked Devices** > **Link a Device**.
4. Scan the terminal QR code.
5. The terminal will log:
   ```
   🔐 Authentication successful! Session persisted in ./.wwebjs_auth
   ✅ WhatsApp Web Client is ONLINE and READY!
   ```
   *(Subsequent launches will re-use the stored session without re-scanning).*

---

## Demo Test Commands (From Your Phone: `+919113960498`)

Send any of the following commands in WhatsApp to the Agent number:

1. **Sales & Revenue Report**:
   ```
   Download the previous week sales report
   ```
   *Returns real revenue (₹48,081), prepaid/COD split, top products, and order ledger link.*

2. **Catalog Overview**:
   ```
   Show my products
   ```
   *Returns all 6 products with prices, unit costs, gross margins, and live inventory.*

3. **Margin Economics & Health Check**:
   ```
   Which products have low margins?
   ```
   *Ranks items by margin against the minimum margin floor (18%) and provides AI growth advice.*

4. **AI Offer Recommendation**:
   ```
   Suggest an offer for Product A
   ```
   *Calculates a safe discount (10% OFF at ₹2,249) that complies with policy floors.*

5. **Inventory Update (with Confirmation Guardrail)**:
   ```
   Update Product A stock to 25
   ```
   *Generates a 15-minute confirmation PIN and asks for confirmation.*
   *Reply `YES` to apply.*

6. **Price Change & Policy Guardrail**:
   ```
   Change Product A price to 499
   ```
   *Catches margin floor violation (margin would be -84.4%), calculates the safe compliant price (₹1,122), and offers alternative confirmation.*
   *Reply `YES` to accept.*

---

## Security & Reliability Features

- **Infinite Loop Prevention**: Checks `msg.fromMe` and ignores all outgoing messages sent by the bot.
- **Message Deduplication**: Tracks message IDs to prevent duplicate webhook dispatches.
- **Session Persistence**: Stored in `.wwebjs_auth/` (ignored from git via `.gitignore`).
- **Audit Logging**: Every inbound and outbound message is recorded in SQLite/PostgreSQL `whatsapp_webhook_logs` and `whatsapp_outbound_messages`.
- **Policy Guardrails**: Cannot lower prices below the configured minimum margin floor without explicit confirmation and compliant price calculations.
