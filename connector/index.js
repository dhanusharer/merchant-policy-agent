/**
 * Local WhatsApp Web Connector for Merchant Growth Agent.
 *
 * Connects via whatsapp-web.js, renders terminal QR code for authentication,
 * receives inbound WhatsApp messages, forwards them to the FastAPI backend,
 * and replies automatically using real database data and policy guardrails.
 */

require('dotenv').config();
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const fs = require('fs');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000/api/v1/whatsapp/connector-inbound';
const TARGET_MERCHANT_PHONE = (process.env.TARGET_MERCHANT_PHONE || '+919113960498').replace(/[^\d+]/g, '');

// Detect Chrome path on Windows if available
let chromePath = process.env.CHROME_PATH;
if (!chromePath) {
    const defaultChrome = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    const defaultEdge = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    if (fs.existsSync(defaultChrome)) {
        chromePath = defaultChrome;
    } else if (fs.existsSync(defaultEdge)) {
        chromePath = defaultEdge;
    }
}

console.log('='.repeat(65));
console.log('🚀 Vastram Merchant Growth Agent — WhatsApp Web Connector');
console.log('='.repeat(65));
console.log(`📡 Backend Webhook URL : ${BACKEND_URL}`);
console.log(`📱 Authorized Merchant : ${TARGET_MERCHANT_PHONE}`);
if (chromePath) {
    console.log(`🌐 Browser Engine      : ${chromePath}`);
}
console.log('='.repeat(65));

// Initialize WhatsApp Web Client with LocalAuth for session persistence
const puppeteerOptions = {
    headless: true,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
    ]
};

if (chromePath) {
    puppeteerOptions.executablePath = chromePath;
}

const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './.wwebjs_auth'
    }),
    puppeteer: puppeteerOptions
});

// Deduplication cache (last 500 message IDs)
const processedMessageIds = new Set();
function isDuplicate(msgId) {
    if (processedMessageIds.has(msgId)) return true;
    processedMessageIds.add(msgId);
    if (processedMessageIds.size > 500) {
        const oldestKey = processedMessageIds.values().next().value;
        processedMessageIds.delete(oldestKey);
    }
    return false;
}

// ---------------------------------------------------------------------------
// Lifecycle Event Handlers
// ---------------------------------------------------------------------------

client.on('qr', (qr) => {
    console.log('\n📱 SCAN THE QR CODE BELOW WITH WHATSAPP ON YOUR AGENT PHONE:');
    console.log('(Open WhatsApp > Linked Devices > Link a Device)\n');
    qrcode.generate(qr, { small: true });
    console.log('\n⏳ Waiting for QR code scan...');
});

client.on('ready', () => {
    console.log('\n' + '='.repeat(65));
    console.log('✅ WhatsApp Web Client is ONLINE and READY!');
    console.log(`💬 Send messages from ${TARGET_MERCHANT_PHONE} to this WhatsApp account.`);
    console.log('='.repeat(65) + '\n');
});

client.on('authenticated', () => {
    console.log('🔐 Authentication successful! Session persisted in ./.wwebjs_auth');
});

client.on('auth_failure', (msg) => {
    console.error('❌ Authentication failed:', msg);
});

client.on('disconnected', (reason) => {
    console.warn('⚠️ Client was disconnected:', reason);
    console.log('🔄 Reconnecting...');
    client.initialize();
});

// ---------------------------------------------------------------------------
// Inbound Message Handler
// ---------------------------------------------------------------------------

client.on('message', async (msg) => {
    try {
        // 1. Loop Prevention: Ignore messages sent by self
        if (msg.fromMe) {
            return;
        }

        // 2. Ignore WhatsApp Status / Stories and Broadcasts
        if (msg.isStatus || msg.from === 'status@broadcast') {
            return;
        }

        // 3. Deduplication Check
        const msgId = msg.id.id || msg.id._serialized || `msg_${Date.now()}`;
        if (isDuplicate(msgId)) {
            console.log(`[Deduplicate] Ignoring already processed message ID: ${msgId}`);
            return;
        }

        // 4. Extract and normalize phone number
        // WhatsApp Web sender format: '919113960498@c.us'
        const rawSender = msg.from.split('@')[0];
        const normalizedPhone = rawSender.startsWith('+') ? rawSender : `+${rawSender}`;

        const messageText = (msg.body || '').trim();
        if (!messageText) {
            return;
        }

        console.log(`\n📥 [INBOUND] From: ${normalizedPhone} | Text: "${messageText}"`);

        // 5. Forward to FastAPI backend
        let response;
        try {
            response = await axios.post(BACKEND_URL, {
                sender_phone: normalizedPhone,
                message_text: messageText,
                message_id: msgId
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000
            });
        } catch (networkErr) {
            console.error(`❌ [BACKEND ERROR] Failed to reach ${BACKEND_URL}:`, networkErr.message);
            await msg.reply('⚠️ Assistant service is currently busy or starting up. Please try again in a few seconds.');
            return;
        }

        // 6. Send reply back to WhatsApp sender
        const replyText = response.data && response.data.reply;
        const detectedIntent = (response.data && response.data.intent) || 'UNKNOWN';

        if (replyText) {
            console.log(`📤 [OUTBOUND REPLY] (${detectedIntent}):\n${replyText}\n`);
            await msg.reply(replyText);
        } else {
            console.log(`ℹ️ [NO REPLY NEEDED] Backend status: ${response.data.status}`);
        }

    } catch (err) {
        console.error('❌ Error handling incoming message:', err);
    }
});

// ---------------------------------------------------------------------------
// Process Initialization
// ---------------------------------------------------------------------------

console.log('🔄 Initializing WhatsApp Web Client...');
client.initialize().catch((err) => {
    console.error('❌ Failed to initialize client:', err);
});
