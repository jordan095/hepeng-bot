import { describe, it, expect } from 'vitest';
import { extractCategory } from './shared.parser.js';

describe('extractCategory', () => {
    it('matches exact category case-insensitive and returns remainder', () => {
        const text = 'MAKANAN luar the grace';
        const knownCategories = ['Makanan', 'Minuman'];
        const result = extractCategory(text, knownCategories);
        expect(result).toEqual({
            category: 'Makanan',
            remainder: 'luar the grace'
        });
    });

    it('matches the longest category when multiple match', () => {
        const text = 'Makanan Luar warteg';
        const knownCategories = ['Makanan', 'Makanan Luar'];
        const result = extractCategory(text, knownCategories);
        expect(result).toEqual({
            category: 'Makanan Luar',
            remainder: 'warteg'
        });
    });

    it('returns null when there is no match', () => {
        const text = 'Transportasi ojol';
        const knownCategories = ['Makanan', 'Minuman'];
        const result = extractCategory(text, knownCategories);
        expect(result).toBeNull();
    });

    it('returns null for empty text', () => {
        const text = '';
        const knownCategories = ['Makanan', 'Minuman'];
        const result = extractCategory(text, knownCategories);
        expect(result).toBeNull();
    });

    it('returns null for empty categories list', () => {
        const text = 'Makanan luar';
        const knownCategories: string[] = [];
        const result = extractCategory(text, knownCategories);
        expect(result).toBeNull();
    });

    it('slices remainder correctly even without space', () => {
        const text = 'MakananLuar';
        const knownCategories = ['Makanan'];
        const result = extractCategory(text, knownCategories);
        expect(result).toEqual({
            category: 'Makanan',
            remainder: 'Luar'
        });
    });
});
