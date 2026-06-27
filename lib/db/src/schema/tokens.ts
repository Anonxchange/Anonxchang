import { pgTable, serial, varchar, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const airdropTokensTable = pgTable("airdrop_tokens", {
  id: serial("id").primaryKey(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  logoUrl: varchar("logo_url", { length: 256 }).notNull(),
  network: varchar("network", { length: 64 }).notNull(),
  totalSupply: varchar("total_supply", { length: 64 }).notNull(),
  airdropAmount: varchar("airdrop_amount", { length: 64 }).notNull(),
  feeRequired: varchar("fee_required", { length: 64 }).notNull(),
  feeToken: varchar("fee_token", { length: 20 }).notNull().default("ETH"),
  claimDeadline: timestamp("claim_deadline"),
  totalParticipants: integer("total_participants").notNull().default(0),
  description: text("description").notNull(),
  website: varchar("website", { length: 256 }),
  isFeatured: boolean("is_featured").notNull().default(false),
});

export const insertAirdropTokenSchema = createInsertSchema(airdropTokensTable).omit({ id: true });
export type InsertAirdropToken = z.infer<typeof insertAirdropTokenSchema>;
export type AirdropToken = typeof airdropTokensTable.$inferSelect;
