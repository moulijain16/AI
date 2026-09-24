import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const assessmentSubmissions = pgTable("assessment_submissions", {
	id: uuid("id").defaultRandom().primaryKey(),
	learnerId: text("learner_id").notNull().default("anonymous"),
	sessionId: text("session_id").notNull(),
	assessmentId: text("assessment_id").notNull(),
	answer: text("answer"),
	uploadedImage: text("uploaded_image"),
	score: integer("score").notNull(),
	feedback: text("feedback").notNull(),
	strengths: text("strengths").notNull(),
	improvements: text("improvements").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Export your models here. Add one export per file
// export * from "./posts";
//
// Each model/table should ideally be split into different files.
// Each model/table should define a Drizzle table, insert schema, and types:
//
//   import { pgTable, text, serial } from "drizzle-orm/pg-core";
//   import { createInsertSchema } from "drizzle-zod";
//   import { z } from "zod/v4";
//
//   export const postsTable = pgTable("posts", {
//     id: serial("id").primaryKey(),
//     title: text("title").notNull(),
//   });
//
//   export const insertPostSchema = createInsertSchema(postsTable).omit({ id: true });
//   export type InsertPost = z.infer<typeof insertPostSchema>;
//   export type Post = typeof postsTable.$inferSelect;

export {}