import type { CoachMessage } from "./CoachMessage";

export enum CoachSessionStatus {
  ACTIVE = "ACTIVE",
  ENDED = "ENDED",
}

/**
 * A coaching conversation thread for a single user.
 *
 * A session is an append-only sequence of CoachMessages scoped to one user.
 * Sessions are immutable snapshots — the CoachService maintains internal
 * mutable state and produces a fresh CoachSession value on every read.
 */
export interface CoachSession {
  readonly id: string;
  readonly userId: string;
  readonly status: CoachSessionStatus;
  readonly messages: ReadonlyArray<CoachMessage>;
  readonly startedAt: Date;
  readonly endedAt: Date | null;
}
