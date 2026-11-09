// Enums
export { ConversationIntentType } from "./ConversationIntentType";
export { ConversationChannelType } from "./ConversationChannelType";

// Core domain types
export type { ConversationIntent } from "./ConversationIntent";
export type { ConversationEngineInput } from "./ConversationEngineInput";
export type { ConversationContext } from "./ConversationContext";
export type { ConversationResponse } from "./ConversationResponse";
export type { FormattedMessage, ConversationQuickReply } from "./FormattedMessage";
export { quickReply } from "./FormattedMessage";

// Intent resolution
export type { IConversationIntentResolver } from "./IConversationIntentResolver";
export { ConversationIntentResolver } from "./ConversationIntentResolver";

// Context + formatting
export { ConversationContextBuilder } from "./ConversationContextBuilder";
export { ConversationFormatter } from "./ConversationFormatter";

// AI extension seam
export type { IConversationResponder } from "./IConversationResponder";
export { NullConversationResponder } from "./NullConversationResponder";

// Engine
export type { IConversationEngine } from "./IConversationEngine";
export { ConversationEngine } from "./ConversationEngine";

// Shared context -> response composition (engine + proactive event path)
export { composeConversationResponse } from "./ConversationResponseComposer";
export type { ConversationResponseMeta } from "./ConversationResponseComposer";

// History (delegates to memory/)
export { ConversationHistory } from "./ConversationHistory";

// Delivery (record + send — shared by the webhook route and proactive events)
export { ConversationDeliveryService } from "./ConversationDeliveryService";

// Adapters
export type { IConversationAdapter } from "./IConversationAdapter";
export { TelegramAdapter } from "./adapters/TelegramAdapter";

// Wiring
export { createDefaultConversationEngine } from "./ConversationFactory";
