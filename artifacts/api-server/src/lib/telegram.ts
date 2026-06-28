const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TG_API = `https://api.telegram.org/bot${BOT_TOKEN}`;

/**
 * Telegram only allows [A-Za-z0-9_-] in secret_token (max 256 chars).
 * Strip any other characters from the env value before using it.
 */
export function sanitizeWebhookSecret(raw: string): string {
  return raw.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 256);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function tgCall(method: string, body: Record<string, unknown>): Promise<any> {
  const res = await fetch(`${TG_API}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json() as Promise<any>;
}

export async function sendMessage(
  chatId: number | string,
  text: string,
  extra: Record<string, unknown> = {}
) {
  return tgCall("sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    ...extra,
  });
}

export async function setWebhook(url: string) {
  const raw = process.env.TELEGRAM_WEBHOOK_SECRET;
  const secret = raw ? sanitizeWebhookSecret(raw) : undefined;
  return tgCall("setWebhook", {
    url,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
    ...(secret ? { secret_token: secret } : {}),
  });
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  return tgCall("answerCallbackQuery", {
    callback_query_id: callbackQueryId,
    text,
  });
}

export function miniAppButton(text: string, url: string) {
  return {
    inline_keyboard: [[{ text, web_app: { url } }]],
  };
}

export function inlineButtons(rows: { text: string; data: string }[][]) {
  return {
    inline_keyboard: rows.map((row) =>
      row.map((btn) => ({ text: btn.text, callback_data: btn.data }))
    ),
  };
}
