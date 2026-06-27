import { Router } from "express";
import { supabase } from "../lib/supabase";
import { sendMessage, answerCallbackQuery, miniAppButton, setWebhook } from "../lib/telegram";
import { logger } from "../lib/logger";

const router = Router();

const MINI_APP_URL = process.env.MINI_APP_URL || "https://nova-airdrop.replit.app";

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

  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", telegramId)
    .single();

  if (existing) return { user: existing, isNew: false };

  let uniqueCode = generateReferralCode();
  for (let i = 0; i < 5; i++) {
    const { data: conflict } = await supabase
      .from("users")
      .select("id")
      .eq("referral_code", uniqueCode)
      .single();
    if (!conflict) break;
    uniqueCode = generateReferralCode();
  }

  const { data: user, error } = await supabase
    .from("users")
    .insert({
      telegram_id: telegramId,
      username: telegramUser.username ?? null,
      first_name: telegramUser.first_name ?? null,
      last_name: telegramUser.last_name ?? null,
      referral_code: uniqueCode,
      referred_by: telegramUser.referralCode ?? null,
      claim_status: "pending",
      total_rewards: "0",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
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
    const { data: claim } = await supabase
      .from("claims")
      .select("status")
      .eq("telegram_id", String(tgUser.id))
      .single();

    const statusLine = claim
      ? `\n📋 Claim status: <b>${claim.status}</b>`
      : `\n📋 Claim status: <b>Pending</b>`;

    await sendMessage(
      chatId,
      `👋 <b>Welcome back, ${firstName}!</b>\n\n` +
      `🪙 Your allocation: <b>${allocation} NOVA</b>` +
      statusLine + `\n\n` +
      `Referral code: <code>${user.referral_code}</code>\n\n` +
      `👇 Open the app to claim:`,
      { reply_markup: miniAppButton("🚀 Open NOVA Airdrop", MINI_APP_URL) }
    );
  }
}

async function handleStatus(chatId: number, telegramId: number) {
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", String(telegramId))
    .single();

  if (!user) {
    await sendMessage(chatId, `❌ You're not registered yet. Send /start to begin.`);
    return;
  }

  const { data: claim } = await supabase
    .from("claims")
    .select("*")
    .eq("telegram_id", String(telegramId))
    .single();

  const { data: tasks } = await supabase
    .from("user_tasks")
    .select("id")
    .eq("telegram_id", String(telegramId))
    .eq("is_completed", true);

  const { count: referralCount } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .eq("referred_by", user.referral_code);

  const claimStatus = claim ? claim.status : "Not claimed";
  const tasksDone = tasks?.length || 0;
  const refs = referralCount || 0;
  const bonusNova = refs * 500_000;

  await sendMessage(
    chatId,
    `📊 <b>Your NOVA Airdrop Status</b>\n\n` +
    `🪙 Base Allocation: <b>900,000 NOVA</b>\n` +
    `🎁 Referral Bonus: <b>+${bonusNova.toLocaleString()} NOVA</b>\n` +
    `✅ Tasks Completed: <b>${tasksDone}</b>\n` +
    `👥 Referrals: <b>${refs}</b>\n` +
    `📋 Claim Status: <b>${claimStatus}</b>\n\n` +
    `🔗 Your referral code: <code>${user.referral_code}</code>`,
    { reply_markup: miniAppButton("🚀 Open App", MINI_APP_URL) }
  );
}

async function handleReferral(chatId: number, telegramId: number) {
  const { data: user } = await supabase
    .from("users")
    .select("referral_code")
    .eq("telegram_id", String(telegramId))
    .single();

  if (!user) {
    await sendMessage(chatId, `❌ Send /start first to get your referral link.`);
    return;
  }

  const link = `https://t.me/${process.env.BOT_USERNAME || "Airdropperxbot"}?start=${user.referral_code}`;

  await sendMessage(
    chatId,
    `🔗 <b>Your Referral Link</b>\n\n` +
    `<code>${link}</code>\n\n` +
    `💰 Earn <b>+500,000 NOVA</b> for every qualified friend you invite.\n` +
    `🏆 Invite 10 friends to unlock the MAX tier bonus of <b>5,000,000 NOVA</b>!`,
    { reply_markup: miniAppButton("📤 Share Link", `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Join NOVA Airdrop and claim your free tokens!")}`) }
  );
}

router.post("/webhook", async (req, res) => {
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
