/**
 * Local WhatsApp Web Connector for Merchant Growth Agent.
 *
 * Connects via whatsapp-web.js, renders terminal QR code for authentication,
 * receives inbound WhatsApp messages, forwards them to the FastAPI backend,
 * and replies automatically using real database data and policy guardrails.
 */

require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000/api/v1/whatsapp/connector-inbound';
const TARGET_MERCHANT_PHONE = (process.env.TARGET_MERCHANT_PHONE || '+919113960498').replace(/[^\d+]/g, '');
const TARGET_DIGITS = TARGET_MERCHANT_PHONE.replace(/[^\d]/g, '').slice(-10); // '9113960498'
const AUTHORIZED_LIDS = ['125413632262289', '242944858702010'];

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

const isHeadless = process.env.HEADLESS !== 'false';
const puppeteerOptions = {
    headless: isHeadless,
    args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-blink-features=AutomationControlled',
        '--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
    ]
};

if (chromePath) {
    puppeteerOptions.executablePath = chromePath;
}

// Track authentication state
let client = null;
let isAuthenticated = false;
let hasRequestedPairingCode = false;
let storedPairingCodeHtml = '';

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

// Track bot's outbound message IDs to prevent infinite loops
const botSentMessageIds = new Set();

function initClient() {
    hasRequestedPairingCode = false;
    
    client = new Client({
        authStrategy: new LocalAuth({
            dataPath: './.wwebjs_auth'
        }),
        puppeteer: puppeteerOptions,
        webVersionCache: {
            type: 'none'
        }
    });

    client.on('qr', async (qr) => {
        console.log('\n📱 SCAN THE QR CODE BELOW WITH WHATSAPP ON YOUR AGENT PHONE:');
        console.log('(Open WhatsApp > Linked Devices > Link a Device)\n');
        qrcode.generate(qr, { small: true });

        // Support phone number pairing code (Link with phone number instead)
        const agentPhone = process.env.AGENT_PHONE;
        if (agentPhone && !hasRequestedPairingCode) {
            hasRequestedPairingCode = true;
            try {
                const cleanPhone = agentPhone.replace(/[^\d]/g, '');
                console.log(`\n⏳ Requesting 8-digit pairing code from WhatsApp for ${cleanPhone}...`);
                const pCode = await client.requestPairingCode(cleanPhone);
                console.log('\n' + '*'.repeat(55));
                console.log(`🔑 WHATSAPP PAIRING CODE FOR ${cleanPhone}: ${pCode}`);
                console.log('⚡ ENTER THIS ON PHONE WITHIN 20 SECONDS!');
                console.log('(On phone: Linked Devices > Link a Device > Link with phone number instead)');
                console.log('*'.repeat(55) + '\n');
                storedPairingCodeHtml = `<div style="margin:16px 0;padding:16px;background:#0284c7;border-radius:10px;font-size:26px;font-weight:bold;letter-spacing:4px;color:#ffffff;border:2px solid #38bdf8;">PAIRING CODE: ${pCode}</div><p style="color:#f59e0b;font-weight:bold;font-size:16px;">⚡ Enter on phone: Linked Devices &gt; Link with phone number instead</p>`;
            } catch (pairErr) {
                console.warn('⚠️ Pairing code request note:', pairErr.message);
            }
        }

        try {
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&margin=20&data=${encodeURIComponent(qr)}`;
            const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>WhatsApp Agent QR Code</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="15">
  <style>
    body { display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;background:#0b0f19;color:#f1f5f9;text-align:center; }
    .card { background:#1e293b;padding:28px;border-radius:16px;box-shadow:0 20px 40px rgba(0,0,0,0.6);border:1px solid #334155;max-width:440px;width:90%; }
    .qr-box { background:#ffffff;padding:16px;border-radius:12px;display:inline-block;margin-top:16px; }
    h2 { margin:0 0 8px 0;font-size:22px;color:#38bdf8; }
    p { margin:4px 0;color:#94a3b8;font-size:14px; }
  </style>
</head>
<body>
  <div class="card">
    <h2>📱 Link WhatsApp Agent</h2>
    <p>Open WhatsApp on your Agent Phone (<b>${process.env.AGENT_PHONE || 'New Agent Phone'}</b>)</p>
    <p>Go to <b>Linked Devices</b> &gt; <b>Link a Device</b></p>
    ${storedPairingCodeHtml}
    <p style="margin-top:12px;font-weight:600;color:#e2e8f0;">— OR SCAN QR CODE DIRECTLY —</p>
    <div class="qr-box">
      <img src="${qrUrl}" alt="WhatsApp Web QR Code" width="350" height="350" />
    </div>
    <p style="margin-top:16px;font-size:12px;color:#64748b;">Auto-refreshes every 15s • Session will persist automatically</p>
  </div>
</body>
</html>`;
            fs.writeFileSync('./qr.html', html);
            try { fs.writeFileSync('../qr.html', html); } catch(e) {}
            console.log('🌐 Web QR Code viewer written to ./qr.html and ../qr.html');
        } catch (e) {
            // ignore
        }

        console.log('\n⏳ Waiting for QR code scan or pairing code...');
    });

    client.on('ready', () => {
        isAuthenticated = true;
        console.log('\n' + '='.repeat(65));
        console.log('✅ WhatsApp Web Client is ONLINE and READY!');
        console.log(`💬 Send messages from ${TARGET_MERCHANT_PHONE} to this WhatsApp account.`);
        console.log('='.repeat(65) + '\n');
    });

    client.on('authenticated', () => {
        isAuthenticated = true;
        console.log('🔐 Authentication successful! Session persisted in ./.wwebjs_auth');
    });

    client.on('auth_failure', (msg) => {
        console.error('❌ Authentication failed:', msg);
    });

    client.on('disconnected', async (reason) => {
        console.warn('⚠️ Client was disconnected:', reason);
        try {
            await client.destroy();
        } catch (e) {}
        
        if (!isAuthenticated) {
            console.log('🔄 Session timed out before pairing. Regenerating fresh code in 2s...');
            setTimeout(initClient, 2000);
        } else {
            console.log('🔄 Reconnecting in 3 seconds...');
            setTimeout(initClient, 3000);
        }
    });

// ---------------------------------------------------------------------------
// Inbound Message Handler
// ---------------------------------------------------------------------------

// Clean digits of authorized merchant phone (+919113960498 -> 919113960498)
const TARGET_DIGITS = TARGET_MERCHANT_PHONE.replace(/[^\d]/g, '');

// Track bot's outbound message IDs to prevent infinite loops in "Message yourself"
const botSentMessageIds = new Set();

client.on('message_create', async (msg) => {
    try {
        const msgId = msg.id.id || msg.id._serialized || `msg_${Date.now()}`;
        let rawBody = (msg.body || '').trim();
        if ((!rawBody || rawBody.length === 0) && msg.hasMedia && (msg.type === 'audio' || msg.type === 'ptt')) {
            rawBody = 'Voice note received from merchant';
        }

        // 1. Loop Prevention: Ignore messages generated by the bot itself
        if (botSentMessageIds.has(msgId)) {
            return;
        }

        // 1b. Self-Echo Loop Prevention: If fromMe, NEVER process bot reports or formatted messages!
        if (msg.fromMe) {
            if (rawBody.length > 160) {
                return;
            }
            if (/^[📊📦🏷️🎯📝👋⚠️✅❌ℹ️💡]/.test(rawBody)) {
                return;
            }
        }

        // 2. Ignore WhatsApp Status / Stories, Broadcasts, Group Chats, and Twilio/automated auto-replies
        if (msg.isStatus || msg.from === 'status@broadcast' ||
            (msg.from && msg.from.includes('@g.us')) ||
            (msg.to && msg.to.includes('@g.us')) ||
            rawBody.includes('Standard auto-reply') ||
            rawBody.includes('Tryout UI')) {
            return;
        }

        // 3. Extract sender & recipient pure digits (strip :device_id and @domain)
        const senderDigits = (msg.from || '').split('@')[0].split(':')[0].replace(/[^\d]/g, '');
        const recipientDigits = (msg.to || '').split('@')[0].split(':')[0].replace(/[^\d]/g, '');
        const myWidDigits = client.info && client.info.wid ? (client.info.wid.user || '').replace(/[^\d]/g, '') : '';
        const isLid = (msg.from || '').includes('@lid') || (msg.to || '').includes('@lid');

        // Resolve contact phone number if LID is used
        let contactDigits = '';
        try {
            const contact = await msg.getContact();
            if (contact && contact.number) {
                contactDigits = contact.number.replace(/[^\d]/g, '');
            }
        } catch (cErr) {
            // ignore
        }

        // If msg.fromMe is true, it is outgoing activity initiated by the friend on his phone. Ignore completely!
        if (msg.fromMe) {
            return;
        }

        // STRICT SECURITY WHITELIST:
        // The bot MUST ONLY respond to the authorized merchant number (+919113960498).
        // If ANY other person, friend, family member, group, or stranger texts the friend's phone,
        // it must be completely IGNORED and NEVER replied to!
        const isAuthorizedSender = 
            senderDigits.endsWith(TARGET_DIGITS) || 
            contactDigits.endsWith(TARGET_DIGITS) || 
            AUTHORIZED_LIDS.some(lid => (msg.from || '').includes(lid));

        if (!isAuthorizedSender) {
            console.log(`🔒 [STRICT PRIVACY IGNORE] Blocked message from non-authorized contact: ${senderDigits || msg.from} | Name: "${contactDigits || 'Friend Contact'}" | Body: "${rawBody.substring(0, 30)}". ZERO reply sent.`);
            return;
        }

        // 4. Deduplication Check
        if (isDuplicate(msgId)) {
            console.log(`[Deduplicate] Ignoring already processed message ID: ${msgId}`);
            return;
        }

        if (!rawBody) {
            return;
        }

        const normalizedPhone = `+${TARGET_DIGITS}`;
        console.log(`\n📥 [INBOUND FROM AUTHORIZED MERCHANT] From: ${msg.from} (Resolved: ${normalizedPhone}) | Text: "${rawBody}"`);

        // 5. Forward to FastAPI backend
        let response;
        try {
            response = await axios.post(BACKEND_URL, {
                sender_phone: `+${TARGET_DIGITS}`,
                message_text: rawBody,
                message_id: msgId
            }, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 15000
            });
        } catch (networkErr) {
            console.error(`❌ [BACKEND ERROR] Failed to reach ${BACKEND_URL}:`, networkErr.message);
            const errReply = await msg.reply('⚠️ Assistant service is currently busy or starting up. Please try again in a few seconds.');
            if (errReply && errReply.id) botSentMessageIds.add(errReply.id.id || errReply.id._serialized);
            return;
        }

        // 6. Send replies back to WhatsApp sender
        const replyText = response.data && response.data.reply;
        const detectedIntent = (response.data && response.data.intent) || 'UNKNOWN';

        // 6A. Send Text Reply
        if (replyText) {
            console.log(`📤 [OUTBOUND TEXT REPLY] (${detectedIntent}):\n${replyText}\n`);
            const sent = await msg.reply(replyText);
            if (sent && sent.id) {
                const sentId = sent.id.id || sent.id._serialized;
                botSentMessageIds.add(sentId);
            }
        } else {
            console.log(`ℹ️ [NO REPLY NEEDED] Backend status: ${response.data.status}`);
        }

        // Target recipient chat ID for media:
        // In WhatsApp multi-device, @lid chats can fail media upload memoization in the web client.
        // We use the merchant's canonical @c.us JID (919113960498@c.us) to ensure proper store lookup.
        const merchantCusJid = `${TARGET_DIGITS}@c.us`;
        const mediaChatId = msg.from.includes('@lid') ? merchantCusJid : msg.from;

        async function sendMediaSafe(mediaPath, options, label) {
            if (!mediaPath || !fs.existsSync(mediaPath)) return;
            console.log(`📤 [OUTBOUND ${label}] Dispatching: ${mediaPath}`);
            const media = MessageMedia.fromFilePath(mediaPath);
            try {
                // Dispatch directly to the active conversation
                const sent = await msg.reply(media, undefined, options);
                if (sent && sent.id) botSentMessageIds.add(sent.id.id || sent.id._serialized);
                console.log(`✅ [SUCCESS ${label}] Dispatched via msg.reply`);
            } catch (err1) {
                console.warn(`⚠️ [RETRY ${label}] msg.reply failed: ${err1.message}. Retrying via client.sendMessage to ${mediaChatId}...`);
                try {
                    const sent2 = await client.sendMessage(mediaChatId, media, options);
                    if (sent2 && sent2.id) botSentMessageIds.add(sent2.id.id || sent2.id._serialized);
                    console.log(`✅ [SUCCESS ${label}] Dispatched to ${mediaChatId}`);
                } catch (err2) {
                    console.error(`❌ [FAILED ${label}] Both dispatch methods failed:`, err2.message);
                }
            }
        }

        // 6B. Send Visual Infographic Dashboard Card Images (Single or Multi-Image Stack)
        const imagePaths = (response.data && response.data.image_paths) || (response.data && response.data.image_path ? [response.data.image_path] : []);
        for (let i = 0; i < imagePaths.length; i++) {
            const imgPath = imagePaths[i];
            const baseName = path.basename(imgPath);
            let chartLabel = '📈 *Vastram Retail — Visual Intelligence Dashboard*';
            if (baseName.includes('Marketplace')) {
                chartLabel = '🛍️ *Vastram Retail — Multi-Channel Marketplace Economics (Amazon vs Flipkart vs ONDC vs WhatsApp)*';
            } else if (baseName.includes('Payment')) {
                chartLabel = '⚠️ *Vastram Retail — Payment Failure & Checkout Recovery Funnel*';
            } else if (baseName.includes('Inventory')) {
                chartLabel = '📦 *Vastram Retail — SKU Inventory Stack & Safety Buffer Health*';
            } else if (baseName.includes('Sales')) {
                chartLabel = '📊 *Vastram Retail — Executive Sales & Revenue Breakdown*';
            }
            const stackTag = imagePaths.length > 1 ? ` [${i+1}/${imagePaths.length}]` : '';
            await sendMediaSafe(imgPath, { caption: `${chartLabel}${stackTag}` }, `CHART IMAGE ${i+1}`);
        }

        // 6C. Send PDF Sales Report Document if generated
        const pdfPath = response.data && response.data.pdf_path;
        await sendMediaSafe(pdfPath, { caption: '📊 *Vastram Retail — Official Sales & Revenue Ledger (PDF)*' }, 'SALES PDF REPORT');

        // 6D. Send Audio Voice Summary (Playable audio player with scrubber & play button)
        const voicePath = response.data && response.data.voice_path;
        await sendMediaSafe(voicePath, { caption: '🎙️ *Vastram Retail — Audio Executive Summary (Tap Play to Listen)*' }, 'VOICE NOTE AUDIO');

        // Keep bounded deduplication set
        if (botSentMessageIds.size > 500) {
            const oldest = botSentMessageIds.values().next().value;
            botSentMessageIds.delete(oldest);
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
        console.error('❌ Failed to initialize client:', err.message);
        setTimeout(initClient, 4000);
    });
}

// Start first client instance
initClient();

// Graceful process shutdown
const handleExit = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Shutting down WhatsApp Web Connector...`);
    try {
        await client.destroy();
        console.log('✅ Client session terminated cleanly.');
    } catch (e) {
        // ignore
    }
    process.exit(0);
};

process.on('SIGINT', () => handleExit('SIGINT'));
process.on('SIGTERM', () => handleExit('SIGTERM'));
