import type { ChecklistItem } from "./ChecklistItem";
import { ChecklistItemStatus } from "./ChecklistItemStatus";
import type { RequiredStatementType } from "./RequiredStatementType";

/** What's known about an uploaded statement, already translated from the
 * Prisma StatementAccountType at the infrastructure boundary — this class
 * stays domain-pure and never sees a Prisma enum. */
export interface UploadMatchCandidate {
  readonly accountType: RequiredStatementType | null;
  readonly institutionName: string | null;
}

/**
 * Pure, deterministic suggestion — never a blind auto-complete. Per the
 * resolved "upload matching" fork (ADR-021): a financial-trust product
 * shouldn't silently mark a checklist item complete on a heuristic guess, so
 * this returns the best candidate for the caller to confirm, or null when
 * there's nothing to suggest or the match is ambiguous.
 *
 * Scoring: exact institution-name match among same-type pending items wins;
 * otherwise a single unambiguous same-type pending item; otherwise null
 * (no type match, or multiple same-type candidates with no institution to
 * disambiguate).
 */
export class StatementMatcher {
  suggestMatch(upload: UploadMatchCandidate, items: ReadonlyArray<ChecklistItem>): ChecklistItem | null {
    if (!upload.accountType) return null;

    const pending = items.filter(i => i.status === ChecklistItemStatus.PENDING);
    const typeMatches = pending.filter(i => i.statementType === upload.accountType);
    if (typeMatches.length === 0) return null;

    if (upload.institutionName) {
      const needle = upload.institutionName.toLowerCase();
      const exact = typeMatches.find(i => i.label.toLowerCase().includes(needle));
      if (exact) return exact;
    }

    return typeMatches.length === 1 ? typeMatches[0]! : null;
  }
}
