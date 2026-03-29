// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        environment: 'node',
        include: ['src/**/*.test.ts'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['src/parsers/**', 'src/utilities.ts'],
            exclude: ['src/index.ts', 'src/services/**', 'src/handlers/**', 'src/config/**']
        }
    }
});
