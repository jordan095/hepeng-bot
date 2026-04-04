// src/config/config.ts - Centralized configuration

export interface Config {
    SHEET_ID: string;
    OWNER_NUMBERS: string[];
}

export const CONFIG: Config = {
    SHEET_ID: process.env.GOOGLE_SHEET_ID || '',
    OWNER_NUMBERS: process.env.OWNER_NUMBERS
        ? process.env.OWNER_NUMBERS.split(',').map(n => n.trim())
        : [],
};
