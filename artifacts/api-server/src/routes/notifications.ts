import { Router } from "express";
import { db } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

router.post("/token-notify", async (req, res) => {
  const { telegramId, tokenSymbol } = req.body ?? {};
  if (!telegramId || !tokenSymbol) {
    return res.status(400).json({ error: "telegramId and tokenSymbol are required" });
  }
  await db.execute(sql`
    INSERT INTO token_notifications (telegram_id, token_symbol)
    VALUES (${telegramId}, ${tokenSymbol})
    ON CONFLICT (telegram_id, token_symbol) DO NOTHING
  `);
  return res.json({ success: true });
});

router.get("/token-notify/:telegramId", async (req, res) => {
  const { telegramId } = req.params;
  const rows = await db.execute(sql`
    SELECT token_symbol FROM token_notifications WHERE telegram_id = ${telegramId}
  `);
  const symbols = (rows.rows as any[]).map((r: any) => r.token_symbol);
  return res.json({ symbols });
});

export default router;
