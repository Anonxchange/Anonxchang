import { pgTable, serial, varchar, boolean, integer, timestamp, text } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const tasksTable = pgTable("tasks", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 32 }).notNull(),
  title: varchar("title", { length: 128 }).notNull(),
  description: text("description").notNull(),
  rewardAmount: varchar("reward_amount", { length: 64 }).notNull(),
  rewardToken: varchar("reward_token", { length: 20 }).notNull(),
  requiredCount: integer("required_count"),
  actionUrl: varchar("action_url", { length: 256 }),
  isActive: boolean("is_active").notNull().default(true),
});

export const userTasksTable = pgTable("user_tasks", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  telegramId: varchar("telegram_id", { length: 64 }).notNull(),
  isCompleted: boolean("is_completed").notNull().default(false),
  completedAt: timestamp("completed_at"),
  proof: varchar("proof", { length: 256 }),
});

export const insertTaskSchema = createInsertSchema(tasksTable).omit({ id: true });
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasksTable.$inferSelect;

export const insertUserTaskSchema = createInsertSchema(userTasksTable).omit({ id: true });
export type InsertUserTask = z.infer<typeof insertUserTaskSchema>;
export type UserTask = typeof userTasksTable.$inferSelect;
