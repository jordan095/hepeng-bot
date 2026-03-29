// src/handlers/command-router.ts - Chain of Responsibility command routing

import type { MessageContext, CommandHandler } from '../types/index.js';
import { BantuanHandler } from './bantuan.handler.js';
import { IncomeHandler } from './income.handler.js';
import { ExpenseHandler } from './expense.handler.js';
import { LaporanHandler } from './laporan.handler.js';
import { RekapHandler } from './rekap.handler.js';
import { UndoHandler } from './undo.handler.js';

const handlers: CommandHandler[] = [
    new BantuanHandler(),
    new UndoHandler(),
    new LaporanHandler(),
    new RekapHandler(),
    new IncomeHandler(),
    new ExpenseHandler(),
];

export async function routeMessage(context: MessageContext): Promise<void> {
    const cleanText = context.text.trim();

    for (const handler of handlers) {
        if (handler.canHandle(cleanText)) {
            const handled = await handler.handle({ ...context, text: cleanText });
            if (handled !== false) return;
        }
    }
}
