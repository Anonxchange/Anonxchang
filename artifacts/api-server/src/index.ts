import app from "./app";
import { logger } from "./lib/logger";
import { setWebhook } from "./lib/telegram";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

app.listen(port, async (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");

  const replitDomain = process.env.REPLIT_DOMAINS?.split(",")[0]?.trim();
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (botToken && replitDomain) {
    if (!process.env.TELEGRAM_WEBHOOK_SECRET) {
      logger.warn(
        "TELEGRAM_WEBHOOK_SECRET is not set — the /api/telegram/webhook endpoint will accept " +
        "unauthenticated requests. Set this secret and re-register the webhook to secure the bot."
      );
    }
    const webhookUrl = `https://${replitDomain}/api/telegram/webhook`;
    try {
      const result = await setWebhook(webhookUrl);
      logger.info({ webhookUrl, result }, "Telegram webhook registered");
    } catch (e) {
      logger.warn({ e }, "Failed to register Telegram webhook");
    }
  } else {
    logger.info("Skipping webhook registration (no REPLIT_DOMAINS or TELEGRAM_BOT_TOKEN)");
  }
});
