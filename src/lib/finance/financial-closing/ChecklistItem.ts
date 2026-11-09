import type { ChecklistItemStatus } from "./ChecklistItemStatus";
import type { RequiredStatementType } from "./RequiredStatementType";

/**
 * Per-month instantiation of a UserStatementRequirement, tracking completion
 * for that month only. `label`/`statementType` are denormalized from the
 * source requirement at instantiation time so StatementMatcher and the
 * dashboard never need a second lookup to render or score a checklist item.
 */
export interface ChecklistItem {
  readonly id: string;
  readonly requirementId: string;
  readonly label: string;
  readonly statementType: RequiredStatementType;
  readonly status: ChecklistItemStatus;
  readonly matchedStatementUploadId: string | null;
  readonly satisfiedAt: Date | null;
}
