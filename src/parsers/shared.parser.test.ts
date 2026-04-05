import { describe, it, expect } from 'vitest';
import { extractMetode } from './shared.parser.js';

describe('extractMetode', () => {
    it('returns empty string if no payment method is found', () => {
        const result = extractMetode('makan siang');
        expect(result).toEqual({ metode: '', cleanText: 'makan siang' });
    });

    it('extracts payment method exactly at the end of the text', () => {
        const result = extractMetode('makan siang bca');
        expect(result).toEqual({ metode: 'BCA', cleanText: 'makan siang' });
    });

    it('longer method names take precedence', () => {
        const result = extractMetode('belanja cc visa bca');
        expect(result).toEqual({ metode: 'CC VISA BCA', cleanText: 'belanja' });
    });

    it('is case-insensitive', () => {
        const result = extractMetode('beli pulsa ManDiri');
        expect(result).toEqual({ metode: 'Mandiri', cleanText: 'beli pulsa' });
    });

    it('does not extract keyword if it is placed in the middle or beginning of the string', () => {
        const result = extractMetode('bca transfer ke teman');
        expect(result).toEqual({ metode: '', cleanText: 'bca transfer ke teman' });

        const result2 = extractMetode('bayar cash ke abang');
        expect(result2).toEqual({ metode: '', cleanText: 'bayar cash ke abang' });
    });
});
