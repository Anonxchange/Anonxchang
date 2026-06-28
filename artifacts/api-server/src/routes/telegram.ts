import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, claimsTable, userTasksTable } from "@workspace/db/schema";
import { eq, and, count } from "drizzle-orm";
import { sendMessage, answerCallbackQuery, miniAppButton, setWebhook, sanitizeWebhookSecret } from "../lib/telegram";
import { logger } from "../lib/logger";

const router = Router();

const MINI_APP_URL = process.env.MINI_APP_URL || "https://best--airdropper.replit.app";

function generateReferralCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

async function getOrCreateUser(telegramUser: {
  id: number;
  username?: string;
  first_name?: string;
  last_name?: string;
  referralCode?: string;
}) {
  const telegramId = String(telegramUser.id);

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.telegramId, telegramId))
    .limit(1);

  if (existing.length > 0) return { user: existing[0], isNew: false };

  let uniqueCode = generateReferralCode();
  for (let i = 0; i < 5; i++) {
    const conflict = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.referralCode, uniqueCode))
      .limit(1);
    if (conflict.length === 0) break;
    uniqueCode = generateReferralCode();
  }

  const [user] = await db
    .insert(usersTable)
    .values({
      telegramId,
      username: telegramUser.username ?? null,
      firstName: telegramUser.first_name ?? null,
      lastName: telegramUser.last_name ?? null,
      referralCode: uniqueCode,
      referredBy: telegramUser.referralCode ?? null,
      claimStatus: "pending",
      totalRewards: "0",
    })
    .returning();

  return { user, isNew: true };
}

async function handleStart(chatId: number, tgUser: any, payload?: string) {
  const { user, isNew } = await getOrCreateUser({
    id: tgUser.id,
    username: tgUser.username,
    first_name: tgUser.first_name,
    last_name: tgUser.last_name,
    referralCode: payload || undefined,
  });

  const firstName = tgUser.first_name || "there";
  const allocation = "900,000";

  if (isNew) {
    await sendMessage(
      chatId,
      `👋 <b>Welcome to NOVA Airdrop, ${firstName}!</b>\n\n` +
      `🎯 Your allocation has been reserved:\n` +
      `<b>${allocation} NOVA tokens</b>\n\n` +
      `Complete tasks and invite friends to boost your rewards.\n\n` +
      `👇 Tap below to open the NOVA Airdrop app:`,
      { reply_markup: miniAppButton("🚀 Open NOVA Airdrop", MINI_APP_URL) }
    );
  } else {
    const claims = await db
      .select({ status: claimsTable.status })
      .from(claimsTable)
      .where(eq(claimsTable.telegramId, String(tgUser.id)))
      .limit(1);

    const claim = claims[0];
    const statusLine = claim
      ? `\n📋 Claim status: <b>${claim.status}</b>`
      : `\n📋 Claim status: <b>Pending</b>`;

    await sendMessage(
      chatId,
      `👋 <b>Welcome back, ${firstName}!</b>\n\n` +
      `🪙 Your allocation: <b>${allocation} NOVA</b>` +
      statusLine + `\n\n` +
      `Referral code: <code>${user.referralCode}</code>\n\n` +
      `👇 Open the app to claim:`,
      { reply_markup: miniAppButton("🚀 Open NOVA Airdrop", MINI_APP_URL) }
    );
  }
}

async function handleStatus(chatId: number, telegramId: number) {
  const users = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.telegramId, String(telegramId)))
    .limit(1);

  if (users.length === 0) {
    await sendMessage(chatId, `❌ You're not registered yet. Send /start to begin.`);
    return;
  }

  const user = users[0];

  const [claims, tasks, [{ total: referralCount }]] = await Promise.all([
    db.select().from(claimsTable).where(eq(claimsTable.telegramId, String(telegramId))).limit(1),
    db.select({ id: userTasksTable.id }).from(userTasksTable).where(
      and(eq(userTasksTable.telegramId, String(telegramId)), eq(userTasksTable.isCompleted, true))
    ),
    db.select({ total: count() }).from(usersTable).where(eq(usersTable.referredBy, user.referralCode)),
  ]);

  const claim = claims[0];
  const claimStatus = claim ? claim.status : "Not claimed";
  const tasksDone = tasks.length;
  const refs = Number(referralCount) || 0;
  const bonusNova = refs * 90_000;

  await sendMessage(
    chatId,
    `📊 <b>Your NOVA Airdrop Status</b>\n\n` +
    `🪙 Base Allocation: <b>900,000 NOVA</b>\n` +
    `🎁 Referral Bonus: <b>+${bonusNova.toLocaleString()} NOVA</b>\n` +
    `✅ Tasks Completed: <b>${tasksDone}</b>\n` +
    `👥 Referrals: <b>${refs}</b>\n` +
    `📋 Claim Status: <b>${claimStatus}</b>\n\n` +
    `🔗 Your referral code: <code>${user.referralCode}</code>`,
    { reply_markup: miniAppButton("🚀 Open App", MINI_APP_URL) }
  );
}

async function handleReferral(chatId: number, telegramId: number) {
  const users = await db
    .select({ referralCode: usersTable.referralCode })
    .from(usersTable)
    .where(eq(usersTable.telegramId, String(telegramId)))
    .limit(1);

  if (users.length === 0) {
    await sendMessage(chatId, `❌ Send /start first to get your referral link.`);
    return;
  }

  const { referralCode } = users[0];
  const link = `https://t.me/${process.env.BOT_USERNAME || "Airdropperxbot"}?start=${referralCode}`;

  await sendMessage(
    chatId,
    `🔗 <b>Your Referral Link</b>\n\n` +
    `<code>${link}</code>\n\n` +
    `💰 Earn <b>+90,000 NOVA</b> for every qualified friend you invite.\n` +
    `🏆 Invite 10 friends to unlock the MAX tier bonus of <b>5,000,000 NOVA</b>!`,
    { reply_markup: miniAppButton("📤 Share Link", `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Join NOVA Airdrop and claim your free tokens!")}`) }
  );
}

router.post("/webhook", async (req, res) => {
  // Verify Telegram webhook secret token if configured
  const rawSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (rawSecret) {
    const webhookSecret = sanitizeWebhookSecret(rawSecret);
    const incomingSecret = req.headers["x-telegram-bot-api-secret-token"];
    if (incomingSecret !== webhookSecret) {
      res.sendStatus(403);
      return;
    }
  }

  res.sendStatus(200);

  const update = req.body;

  try {
    if (update.message) {
      const msg = update.message;
      const chatId = msg.chat.id;
      const tgUser = msg.from;
      const text: string = msg.text || "";

      if (text.startsWith("/start")) {
        const payload = text.split(" ")[1] || "";
        await handleStart(chatId, tgUser, payload);
      } else if (text === "/status") {
        await handleStatus(chatId, tgUser.id);
      } else if (text === "/referral") {
        await handleReferral(chatId, tgUser.id);
      } else if (text === "/help") {
        await sendMessage(
          chatId,
          `📖 <b>NOVA Airdrop Bot Commands</b>\n\n` +
          `/start — Register and open the app\n` +
          `/status — Check your allocation &amp; claim status\n` +
          `/referral — Get your referral link\n` +
          `/help — Show this message`,
          { reply_markup: miniAppButton("🚀 Open App", MINI_APP_URL) }
        );
      } else {
        await sendMessage(
          chatId,
          `Use /start to open NOVA Airdrop or /help for all commands.`,
          { reply_markup: miniAppButton("🚀 Open App", MINI_APP_URL) }
        );
      }
    } else if (update.callback_query) {
      await answerCallbackQuery(update.callback_query.id);
    }
  } catch (err) {
    logger.error({ err }, "Telegram webhook error");
  }
});

router.get("/set-webhook", async (req, res) => {
  const domain = process.env.REPLIT_DEV_DOMAIN;
  if (!domain) return res.status(500).json({ error: "REPLIT_DEV_DOMAIN not set" });

  const webhookUrl = `https://${domain}/api/telegram/webhook`;
  const result = await setWebhook(webhookUrl);
  logger.info({ webhookUrl, result }, "Webhook set");
  return res.json({ webhookUrl, result });
});

export default router;
