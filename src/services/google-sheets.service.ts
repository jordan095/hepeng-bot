// src/services/google-sheets.service.ts - Google Sheets connection (reused from ipl-bot)

import { google } from 'googleapis';
import { log } from '../utilities.js';

let sheetsInstance: ReturnType<typeof google.sheets> | null = null;

function createServiceAuth() {
    const credentials = process.env.GOOGLE_CREDENTIALS;
    const scopes = ['https://www.googleapis.com/auth/spreadsheets'];

    if (credentials) {
        return new google.auth.GoogleAuth({
            credentials: JSON.parse(credentials),
            scopes
        });
    }
    return new google.auth.GoogleAuth({
        keyFile: './credentials.json',
        scopes
    });
}

export async function getGoogleSheets() {
    if (!sheetsInstance) {
        const auth = createServiceAuth();
        sheetsInstance = google.sheets({ version: 'v4', auth: auth as any });
        log('Google Sheets client initialized', 'info');
    }
    return { sheets: sheetsInstance };
}

// Reset singleton (for testing)
export function resetSheetsInstance(): void {
    sheetsInstance = null;
}
