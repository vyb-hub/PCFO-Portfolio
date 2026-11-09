import { describe, it, expect, vi } from "vitest";
import { TelegramAdapter } from "../TelegramAdapter";

function fakeFetch(ok = true, status = 200) {
  return vi.fn().mockResolvedValue({
    ok,
    status,
    text: async () => (ok ? "" : "Bad Request: chat not found"),
  }) as unknown as typeof fetch;
}

describe("TelegramAdapter — send()", () => {
  it("POSTs to the Telegram Bot API with the correct chat_id and text", async () => {
    const fetchFn = fakeFetch();
    const adapter = new TelegramAdapter("TEST_TOKEN", fetchFn);

    await adapter.send("chat123", { title: "Largest Expense", text: "Body text", quickReplies: [] });

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const [url, options] = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.telegram.org/botTEST_TOKEN/sendMessage");
    const body = JSON.parse(options.body as string);
    expect(body.chat_id).toBe("chat123");
    expect(body.text).toBe("Largest Expense\n\nBody text");
  });

  it("omits the title line when there is none", async () => {
    const fetchFn = fakeFetch();
    const adapter = new TelegramAdapter("TEST_TOKEN", fetchFn);

    await adapter.send("chat123", { title: null, text: "Just body", quickReplies: [] });

    const [, options] = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.text).toBe("Just body");
  });

  it("renders quickReplies as an inline keyboard", async () => {
    const fetchFn = fakeFetch();
    const adapter = new TelegramAdapter("TEST_TOKEN", fetchFn);

    await adapter.send("chat123", {
      title: null,
      text: "Body",
      quickReplies: [{ label: "Explain more", callbackData: "EXPLAIN_RECOMMENDATION:REC_1" }],
    });

    const [, options] = (fetchFn as ReturnType<typeof vi.fn>).mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(options.body as string);
    expect(body.reply_markup.inline_keyboard).toEqual([[{ text: "Explain more", callback_data: "EXPLAIN_RECOMMENDATION:REC_1" }]]);
  });

  it("splits messages longer than 4096 characters into multiple sends", async () => {
    const fetchFn = fakeFetch();
    const adapter = new TelegramAdapter("TEST_TOKEN", fetchFn);
    const longText = "x".repeat(9000);

    await adapter.send("chat123", { title: null, text: longText, quickReplies: [] });

    expect(fetchFn).toHaveBeenCalledTimes(3);
  });

  it("attaches quickReplies only to the final chunk", async () => {
    const fetchFn = fakeFetch();
    const adapter = new TelegramAdapter("TEST_TOKEN", fetchFn);
    const longText = "x".repeat(5000);

    await adapter.send("chat123", { title: null, text: longText, quickReplies: [{ label: "Next", callbackData: "TOP_RISK" }] });

    const calls = (fetchFn as ReturnType<typeof vi.fn>).mock.calls as [string, RequestInit][];
    const firstBody = JSON.parse(calls[0]![1].body as string);
    const secondBody = JSON.parse(calls[1]![1].body as string);
    expect(firstBody.reply_markup).toBeUndefined();
    expect(secondBody.reply_markup).toBeDefined();
  });

  it("throws with the response body when Telegram returns a non-2xx status", async () => {
    const fetchFn = fakeFetch(false, 400);
    const adapter = new TelegramAdapter("TEST_TOKEN", fetchFn);

    await expect(adapter.send("chat123", { title: null, text: "hi", quickReplies: [] }))
      .rejects.toThrow(/400.*chat not found/);
  });
});
