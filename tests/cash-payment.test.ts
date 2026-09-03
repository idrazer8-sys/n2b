import { describe, expect, it } from 'vitest';
import {
  parseCashSplits,
  isSplitBill,
  parseCashTenderedCents,
  splitsSumMatchesTotal,
  computeChangeDueCents,
} from '../src/lib/cash-payment';

describe('parseCashSplits', () => {
  it('returns nothing when the collection method is not CASH', () => {
    expect(
      parseCashSplits([{ shareCents: 500 }, { shareCents: 500 }], 'CARD')
    ).toEqual([]);
  });

  it('returns nothing when the raw value is not an array', () => {
    expect(parseCashSplits('not-an-array', 'CASH')).toEqual([]);
    expect(parseCashSplits(undefined, 'CASH')).toEqual([]);
    expect(parseCashSplits(null, 'CASH')).toEqual([]);
  });

  it('parses valid split entries with tendered amounts and labels', () => {
    const result = parseCashSplits(
      [
        { shareCents: 500, tenderedCents: 1000, label: 'Alice' },
        { shareCents: 750, tenderedCents: null, label: 'Bob' },
      ],
      'CASH'
    );

    expect(result).toEqual([
      { personIndex: 0, label: 'Alice', shareCents: 500, tenderedCents: 1000 },
      { personIndex: 1, label: 'Bob', shareCents: 750, tenderedCents: null },
    ]);
  });

  it('drops entries with a non-positive shareCents', () => {
    const result = parseCashSplits(
      [{ shareCents: 0 }, { shareCents: -100 }, { shareCents: 500 }],
      'CASH'
    );

    expect(result).toHaveLength(1);
    expect(result[0].shareCents).toBe(500);
  });

  it('drops non-object entries', () => {
    const result = parseCashSplits([null, 'garbage', 42, { shareCents: 500 }], 'CASH');
    expect(result).toHaveLength(1);
  });

  it('treats a missing or unparseable tenderedCents as null, not zero', () => {
    const result = parseCashSplits(
      [
        { shareCents: 500 },
        { shareCents: 500, tenderedCents: 'not-a-number' },
        { shareCents: 500, tenderedCents: undefined },
      ],
      'CASH'
    );

    expect(result.every((s) => s.tenderedCents === null)).toBe(true);
  });

  it('rounds fractional cent amounts', () => {
    const result = parseCashSplits(
      [{ shareCents: 500.6, tenderedCents: 1000.4 }],
      'CASH'
    );

    expect(result[0].shareCents).toBe(501);
    expect(result[0].tenderedCents).toBe(1000);
  });

  it('truncates an overly long label to 60 characters', () => {
    const longLabel = 'x'.repeat(100);
    const result = parseCashSplits([{ shareCents: 500, label: longLabel }], 'CASH');
    expect(result[0].label).toHaveLength(60);
  });

  it('treats a blank label as null', () => {
    const result = parseCashSplits([{ shareCents: 500, label: '   ' }], 'CASH');
    expect(result[0].label).toBeNull();
  });
});

describe('isSplitBill', () => {
  it('is false for zero or one payer', () => {
    expect(isSplitBill([])).toBe(false);
    expect(isSplitBill([{ personIndex: 0, label: null, shareCents: 500, tenderedCents: null }])).toBe(
      false
    );
  });

  it('is true for two or more payers', () => {
    expect(
      isSplitBill([
        { personIndex: 0, label: null, shareCents: 500, tenderedCents: null },
        { personIndex: 1, label: null, shareCents: 500, tenderedCents: null },
      ])
    ).toBe(true);
  });
});

describe('parseCashTenderedCents', () => {
  it('is null for a non-CASH method', () => {
    expect(parseCashTenderedCents(1000, 'CARD', false)).toBeNull();
    expect(parseCashTenderedCents(1000, null, false)).toBeNull();
  });

  it('is null when the bill is split, even if a raw amount was sent', () => {
    expect(parseCashTenderedCents(1000, 'CASH', true)).toBeNull();
  });

  it('parses and rounds a valid cash amount on a non-split bill', () => {
    expect(parseCashTenderedCents(1000.5, 'CASH', false)).toBe(1001);
  });

  it('is null for a non-number raw value', () => {
    expect(parseCashTenderedCents('20', 'CASH', false)).toBeNull();
    expect(parseCashTenderedCents(undefined, 'CASH', false)).toBeNull();
    expect(parseCashTenderedCents(Number.NaN, 'CASH', false)).toBeNull();
  });
});

describe('splitsSumMatchesTotal', () => {
  it('matches an exact sum', () => {
    expect(
      splitsSumMatchesTotal([{ shareCents: 500 }, { shareCents: 500 }], 1000)
    ).toBe(true);
  });

  it('tolerates rounding slack up to the number of splits', () => {
    // 3-way split of 1000: 334 + 333 + 333 = 1000 exactly, but even a 2-cent
    // total drift across 3 people should still pass.
    expect(
      splitsSumMatchesTotal(
        [{ shareCents: 334 }, { shareCents: 334 }, { shareCents: 334 }],
        1000
      )
    ).toBe(true); // sum=1002, drift=2, tolerance=3
  });

  it('rejects a sum that drifts beyond the tolerance', () => {
    expect(
      splitsSumMatchesTotal([{ shareCents: 400 }, { shareCents: 400 }], 1000)
    ).toBe(false); // sum=800, drift=200, tolerance=2
  });

  it('is trivially true for an empty split list', () => {
    expect(splitsSumMatchesTotal([], 1000)).toBe(true);
  });
});

describe('computeChangeDueCents', () => {
  it('is null for a non-CASH method', () => {
    expect(computeChangeDueCents('CARD', 2000, 1550)).toBeNull();
    expect(computeChangeDueCents(null, 2000, 1550)).toBeNull();
  });

  it('is null when nothing was tendered yet', () => {
    expect(computeChangeDueCents('CASH', null, 1550)).toBeNull();
  });

  it('computes change owed when the customer overpays', () => {
    expect(computeChangeDueCents('CASH', 2000, 1550)).toBe(450);
  });

  it('computes a negative value when the customer underpays', () => {
    // Callers (the API route, the waiter's change calculator UI) are
    // responsible for surfacing this as "not enough cash" rather than a
    // negative amount to hand back — this function just does the subtraction.
    expect(computeChangeDueCents('CASH', 1000, 1550)).toBe(-550);
  });

  it('is zero for an exact payment', () => {
    expect(computeChangeDueCents('CASH', 1550, 1550)).toBe(0);
  });
});
