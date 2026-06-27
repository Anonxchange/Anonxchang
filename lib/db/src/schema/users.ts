import { pgTable, text, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  telegramId: varchar("telegram_id", { length: 64 }).notNull().unique(),
  username: varchar("username", { length: 128 }),
  firstName: varchar("first_name", { length: 128 }),
  lastName: varchar("last_name", { length: 128 }),
  walletAddress: varchar("wallet_address", { length: 42 }),
  referralCode: varchar("referral_code", { length: 16 }).notNull().unique(),
  referredBy: varchar("referred_by", { length: 16 }),
  claimStatus: varchar("claim_status", { length: 16 }).notNull().default("pending"),
  totalRewards: varchar("total_rewards", { length: 64 }).notNull().default("0"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
