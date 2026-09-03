import 'server-only';
import { createHash } from 'crypto';

// ----------------------------------------------------------------------------
// SCAFFOLDING ONLY. Nothing in the app calls computeRecordHash() at order
// time yet, and nothing writes to the FinancialRecordHash table. This file
// exists so the hash-chain shape is settled before that wiring gets built —
// see the Phase 2 summary for the full list of what's still missing before
// this satisfies Spain's VeriFactu/SIF regulation:
//
//   - Deciding real-time "Veri*Factu" submission (QR codes on tickets,
//     near-real-time XML to AEAT) vs "SIF, no submission" (same integrity
//     requirements, retained locally). This is a business decision, not a
//     code decision — nothing here should be read as having made it.
//   - A real invoice numbering/series scheme. sequenceNumber below is a
//     provisional per-restaurant gapless counter, not a designed invoice
//     series.
//   - Actually calling computeRecordHash() when an order is finalized, and
//     persisting the result to FinancialRecordHash.
//   - If Veri*Factu (not SIF) is chosen: QR code generation and the AEAT
//     XML submission integration itself — deliberately not started here.
//     Evaluate an established Spanish e-invoicing/VeriFactu compliance
//     provider before hand-rolling the AEAT protocol.
// ----------------------------------------------------------------------------

export type FinancialRecordHashInput = {
  taxId: string;
  sequenceNumber: number;
  recordDate: Date;
  totalCents: number;
  previousHash: string | null;
};

/**
 * The hash for one link in the chain: restaurant tax ID, invoice
 * number/series (sequenceNumber, provisionally), date, total, and the
 * previous record's hash — so tampering with any past record, or
 * reordering/deleting one, breaks every hash after it.
 *
 * The exact field order and separator here are part of the hash's
 * definition: once any real record has been hashed with this format,
 * changing it invalidates the ability to re-verify every record hashed
 * before the change. Treat this function as frozen the moment it's first
 * used for a real record.
 */
export function computeRecordHash(input: FinancialRecordHashInput): string {
  const canonical = [
    input.taxId,
    String(input.sequenceNumber),
    input.recordDate.toISOString(),
    String(input.totalCents),
    input.previousHash ?? '',
  ].join('|');

  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

export type ChainLink = {
  sequenceNumber: number;
  recordHash: string;
  previousHash: string | null;
};

/**
 * Structural integrity check: given every link in a restaurant's chain,
 * confirms the sequence has no gaps and each link's previousHash actually
 * points at the prior link's recordHash. This does NOT recompute
 * recordHash from source data (taxId/date/total aren't available from a
 * ChainLink alone) — it only proves the chain hasn't been reordered,
 * had a link deleted, or had a previousHash pointer forged. A full
 * verifier that also recomputes and compares recordHash is future work,
 * once records actually exist to verify.
 */
export function verifyChainLinkage(links: ChainLink[]): boolean {
  if (links.length === 0) return true;

  const sorted = [...links].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

  if (sorted[0].sequenceNumber !== 1) return false;

  for (let i = 0; i < sorted.length; i += 1) {
    if (i > 0 && sorted[i].sequenceNumber !== sorted[i - 1].sequenceNumber + 1) {
      return false; // gap in the sequence
    }

    const expectedPrevious = i === 0 ? null : sorted[i - 1].recordHash;
    if (sorted[i].previousHash !== expectedPrevious) return false;
  }

  return true;
}
