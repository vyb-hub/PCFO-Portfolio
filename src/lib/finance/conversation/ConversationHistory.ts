import type { IFinancialMemoryService } from "../memory/IFinancialMemoryService";
import type { FinancialMemoryEntry } from "../memory/FinancialMemoryEntry";
import { MemoryEntryType } from "../memory/MemoryEntry";
import type { ConversationChannelType } from "./ConversationChannelType";

/**
 * Thin wrapper delegating conversation-turn persistence/retrieval to the
 * existing Financial Memory Platform — deliberately NOT a new store, per
 * the charter's "do not duplicate retrieval logic" instruction.
 *
 * No separate interface: only one implementation is planned, and the class
 * itself is a two-method pass-through — an interface would be an
 * abstraction with no second implementation to justify it (see ADR-020).
 */
export class ConversationHistory {
  constructor(private readonly memoryService: IFinancialMemoryService) {}

  async record(
    userId: string,
    rawInput: string,
    responseText: string,
    channel: ConversationChannelType,
  ): Promise<FinancialMemoryEntry> {
    return this.memoryService.storeConversationNote(
      userId,
      `User asked: "${rawInput}". Replied: "${responseText}"`,
      [`channel:${channel.toLowerCase()}`],
    );
  }

  async recent(userId: string, limit = 10): Promise<ReadonlyArray<FinancialMemoryEntry>> {
    const all = await this.memoryService.getAll(userId, [MemoryEntryType.CONVERSATION_NOTE]);
    return all.slice(0, limit);
  }
}
