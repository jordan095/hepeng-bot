// src/config/config.ts - Centralized configuration

export interface Config {
    SHEET_ID: string;
    OWNER_NUMBERS: string[];
}

export const CONFIG: Config = {
    SHEET_ID: process.env.GOOGLE_SHEET_ID || '1qic764IauJSbNEgBhhLxT9qE-_6noBIjmNwWou-I044',
    OWNER_NUMBERS: process.env.OWNER_NUMBERS
        ? process.env.OWNER_NUMBERS.split(',').map(n => n.trim())
        : [],
};
