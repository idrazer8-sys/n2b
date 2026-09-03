import { describe, it, expect } from 'vitest';
import { computeRecordHash, verifyChainLinkage } from '../src/lib/verifactu';

describe('computeRecordHash', () => {
  const base = {
    taxId: 'B12345678',
    sequenceNumber: 1,
    recordDate: new Date('2026-01-01T12:00:00.000Z'),
    totalCents: 1000,
    previousHash: null,
  };

  it('is deterministic for identical input', () => {
    expect(computeRecordHash(base)).toBe(computeRecordHash({ ...base }));
  });

  it('produces a 64-character hex SHA-256 digest', () => {
    const hash = computeRecordHash(base);
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('changes when taxId changes', () => {
    expect(computeRecordHash(base)).not.toBe(computeRecordHash({ ...base, taxId: 'B87654321' }));
  });

  it('changes when sequenceNumber changes', () => {
    expect(computeRecordHash(base)).not.toBe(computeRecordHash({ ...base, sequenceNumber: 2 }));
  });

  it('changes when the date changes', () => {
    expect(computeRecordHash(base)).not.toBe(
      computeRecordHash({ ...base, recordDate: new Date('2026-01-02T12:00:00.000Z') })
    );
  });

  it('changes when totalCents changes', () => {
    expect(computeRecordHash(base)).not.toBe(computeRecordHash({ ...base, totalCents: 1001 }));
  });

  it('changes when previousHash changes — this is what makes the chain tamper-evident', () => {
    const withPrev = computeRecordHash({ ...base, previousHash: 'a'.repeat(64) });
    const withoutPrev = computeRecordHash({ ...base, previousHash: null });
    expect(withPrev).not.toBe(withoutPrev);
  });

});

describe('verifyChainLinkage', () => {
  it('accepts an empty chain', () => {
    expect(verifyChainLinkage([])).toBe(true);
  });

  it('accepts a single valid first link', () => {
    expect(verifyChainLinkage([{ sequenceNumber: 1, recordHash: 'h1', previousHash: null }])).toBe(true);
  });

  it('rejects a chain that does not start at sequence 1', () => {
    expect(verifyChainLinkage([{ sequenceNumber: 2, recordHash: 'h2', previousHash: null }])).toBe(false);
  });

  it('accepts a correctly linked multi-record chain', () => {
    const chain = [
      { sequenceNumber: 1, recordHash: 'h1', previousHash: null },
      { sequenceNumber: 2, recordHash: 'h2', previousHash: 'h1' },
      { sequenceNumber: 3, recordHash: 'h3', previousHash: 'h2' },
    ];
    expect(verifyChainLinkage(chain)).toBe(true);
  });

  it('is order-independent — sorts by sequenceNumber before checking', () => {
    const chain = [
      { sequenceNumber: 3, recordHash: 'h3', previousHash: 'h2' },
      { sequenceNumber: 1, recordHash: 'h1', previousHash: null },
      { sequenceNumber: 2, recordHash: 'h2', previousHash: 'h1' },
    ];
    expect(verifyChainLinkage(chain)).toBe(true);
  });

  it('rejects a chain with a gap in the sequence', () => {
    const chain = [
      { sequenceNumber: 1, recordHash: 'h1', previousHash: null },
      { sequenceNumber: 3, recordHash: 'h3', previousHash: 'h1' },
    ];
    expect(verifyChainLinkage(chain)).toBe(false);
  });

  it('rejects a chain where a previousHash pointer has been forged/broken', () => {
    const chain = [
      { sequenceNumber: 1, recordHash: 'h1', previousHash: null },
      { sequenceNumber: 2, recordHash: 'h2', previousHash: 'NOT_h1' },
    ];
    expect(verifyChainLinkage(chain)).toBe(false);
  });

  it('rejects a chain where a middle record was deleted, leaving a hash mismatch', () => {
    // Record 2 was removed; record 3 still points at record 2's hash,
    // which no longer appears anywhere in the remaining chain.
    const chain = [
      { sequenceNumber: 1, recordHash: 'h1', previousHash: null },
      { sequenceNumber: 3, recordHash: 'h3', previousHash: 'h2' },
    ];
    expect(verifyChainLinkage(chain)).toBe(false);
  });
});
