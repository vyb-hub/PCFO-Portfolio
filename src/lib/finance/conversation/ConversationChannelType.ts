/**
 * Which delivery channel a ConversationSession/adapter belongs to.
 *
 * Only TELEGRAM has an adapter implementation this milestone (EC-012).
 * The rest are declared now so the enum reflects the platform's intended
 * long-term shape (per the EC-012 charter) — adding a real implementation
 * later means one new file under conversation/adapters/, not a type change.
 */
export enum ConversationChannelType {
  TELEGRAM = "TELEGRAM",
  WHATSAPP = "WHATSAPP",
  EMAIL = "EMAIL",
  VOICE = "VOICE",
  SLACK = "SLACK",
  PUSH_NOTIFICATION = "PUSH_NOTIFICATION",
  WEB_CHAT = "WEB_CHAT",
  API = "API",
}
