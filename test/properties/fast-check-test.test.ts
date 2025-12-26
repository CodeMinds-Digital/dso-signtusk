import { describe, it, expect } from 'vitest';
import fc from 'fast-check';

describe('Fast Check Test', () => {
    it('should work with fast-check', () => {
        fc.assert(
            fc.property(
                fc.integer(),
                fc.integer(),
                (a, b) => {
                    expect(a + b).toBe(b + a);
                    return true;
                }
            ),
            { numRuns: 10 }
        );
    });
});