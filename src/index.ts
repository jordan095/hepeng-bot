// src/index.ts - Hepeng Bot Main Entry Point
import 'dotenv/config';
import type { WASocket, proto } from '@whiskeysockets/baileys';
import {
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    getContentType,
    extractMessageContent,
    makeWASocket
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode-terminal';

import { CONFIG } from './config/index.js';
import type { MessageContext } from './types/index.js';
import { log, getJakartaTime } from './utilities.js';
import { routeMessage } from './handlers/index.js';

const MAX_RECONNECT = 5;
let reconnectAttempts = 0;

// ─── Role Resolver ────────────────────────────────────────────────────────

function getUserRole(sender: string): 'Owner' | 'Viewer' {
    const clean = sender.replaceAll(/\D/g, '');
    const isOwner = CONFIG.OWNER_NUMBERS.some(n => n.replaceAll(/\D/g, '') === clean);
    return isOwner ? 'Owner' : 'Viewer';
}

// ─── Message Processing ───────────────────────────────────────────────────

async function processMessage(sock: WASocket, msg: proto.IWebMessageInfo): Promise<void> {
    const from = msg.key?.remoteJid;
    if (!from) return;

    const messageContent = extractMessageContent(msg.message || {}) || {};
    const messageType = getContentType(messageContent);

    const text = extractText(messageContent, messageType);
    if (!text.trim()) return;

    const sender = getSender(msg);
    const userRole = getUserRole(sender);
    const jkt = getJakartaTime();

    log(`[${jkt.tanggal}/${jkt.bulan} ${jkt.jam}:00] ${sender} (${userRole}): ${text}`, 'info');

    const context: MessageContext = {
        sock,
        msg,
        from,
        sender,
        text: text.trim(),
        userRole
    };

    await routeMessage(context);
}

function extractText(messageContent: proto.IMessage, messageType: string | undefined): string {
    if (messageType === 'conversation') {
        return messageContent.conversation || '';
    }
    if (messageType === 'extendedTextMessage') {
        return messageContent.extendedTextMessage?.text || '';
    }
    return '';
}

function getSender(msg: proto.IWebMessageInfo): string {
    const candidates = [
        msg.key?.participant,
        (msg as { senderPn?: string }).senderPn,
        msg.key?.remoteJid
    ].filter((jid): jid is string => Boolean(jid));

    for (const jid of candidates) {
        const clean = jid.split('@')[0] || '';
        if (clean && !clean.includes('lid') && !clean.includes('g.us')) {
            return clean;
        }
    }
    return msg.key?.remoteJid?.split('@')[0] || 'unknown';
}

// ─── Deduplication ───────────────────────────────────────────────────────

const processedMessages = new Set<string>();

function isDuplicate(msgId: string | null | undefined): boolean {
    if (!msgId) return false;
    if (processedMessages.has(msgId)) return true;
    processedMessages.add(msgId);
    setTimeout(() => processedMessages.delete(msgId), 10_000);
    return false;
}

// ─── Event Handlers ───────────────────────────────────────────────────────

function handleMessagesUpsert(sock: WASocket, messages: proto.IWebMessageInfo[]): void {
    const msg = messages?.[0];
    if (!msg?.message || msg.key?.fromMe) return;
    if (isDuplicate(msg.key?.id)) return;

    processMessage(sock, msg).catch(err => {
        log(`Error processing message: ${err}`, 'error');
    });
}

export function handleConnectionUpdate(update: Partial<import('@whiskeysockets/baileys').ConnectionState>, sock: WASocket): void {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
        log('Scan QR Code untuk login:', 'info');
        qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
        const err = lastDisconnect?.error as Boom;
        const shouldReconnect = err?.output?.statusCode !== DisconnectReason.loggedOut;
        if (shouldReconnect && reconnectAttempts < MAX_RECONNECT) {
            reconnectAttempts++;
            log(`Reconnecting... attempt ${reconnectAttempts}/${MAX_RECONNECT}`, 'info');
            setTimeout(() => void connectToWhatsApp(), 5_000);
        } else {
            log('Koneksi ditutup. Tidak akan reconnect.', 'error');
        }
    } else if (connection === 'open') {
        reconnectAttempts = 0;
        log('🤖 Hepeng Bot WhatsApp terhubung!', 'success');
        log(`📋 Sheet ID: ${CONFIG.SHEET_ID}`, 'info');
        log(`👤 Owner numbers: ${CONFIG.OWNER_NUMBERS.join(', ')}`, 'info');
    }
}

// ─── Connect ──────────────────────────────────────────────────────────────

export async function connectToWhatsApp(): Promise<void> {
    try {
        log('🚀 Starting Hepeng Bot...', 'info');

        const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

        let waVersion: [number, number, number] = [2, 3000, 1015901307];
        try {
            const v = await fetchLatestBaileysVersion();
            if (v.version) {
                waVersion = v.version;
            }
        } catch {
            log('Could not fetch latest WA version, using fallback', 'info');
        }

        const sock = makeWASocket({
            auth: state,
            logger: pino({ level: 'silent' }) as unknown as import('pino').Logger,
            printQRInTerminal: false,
            browser: ['Hepeng Bot', 'Chrome', '20.0.04'],
            version: waVersion
        });

        sock.ev.on('creds.update', saveCreds);
        sock.ev.on('connection.update', update => handleConnectionUpdate(update, sock));
        sock.ev.on('messages.upsert', ({ messages }) => handleMessagesUpsert(sock, messages));
    } catch (error) {
        log(`Error creating socket: ${error}`, 'error');
    }
}

if (process.env.NODE_ENV !== 'test') {
    await connectToWhatsApp();
}
