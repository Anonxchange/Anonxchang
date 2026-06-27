import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const claimsTable = pgTable("claims", {
  id: serial("id").primaryKey(),
  telegramId: varchar("telegram_id", { length: 64 }).notNull(),
  walletAddress: varchar("wallet_address", { length: 42 }).notNull(),
  tokenAmount: varchar("token_amount", { length: 64 }).notNull(),
  feePaid: varchar("fee_paid", { length: 64 }).notNull(),
  txHash: varchar("tx_hash", { length: 66 }).notNull(),
  tokenSymbol: varchar("token_symbol", { length: 20 }).notNull().default("NOVA"),
  status: varchar("status", { length: 16 }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertClaimSchema = createInsertSchema(claimsTable).omit({ id: true, createdAt: true });
export type InsertClaim = z.infer<typeof insertClaimSchema>;
export type Claim = typeof claimsTable.$inferSelect;
