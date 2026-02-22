import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// === TABLE DEFINITIONS ===

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role", { enum: ["student", "faculty"] }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const quizzes = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  facultyId: integer("faculty_id").notNull(),
  questions: jsonb("questions").$type<{
    questionText: string;
    options: string[];
    correctAnswerIndex: number;
  }[]>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const attempts = pgTable("attempts", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull(),
  studentId: integer("student_id").notNull(),
  answers: jsonb("answers").$type<number[]>().notNull(), // Array of selected indices
  score: integer("score").notNull(),
  totalQuestions: integer("total_questions").notNull(),
  terminated: boolean("terminated").default(false),
  terminationReason: text("termination_reason"),
  completedAt: timestamp("completed_at").defaultNow(),
});

// === RELATIONS ===

export const usersRelations = relations(users, ({ many }) => ({
  quizzes: many(quizzes),
  attempts: many(attempts),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  faculty: one(users, {
    fields: [quizzes.facultyId],
    references: [users.id],
  }),
  attempts: many(attempts),
}));

export const attemptsRelations = relations(attempts, ({ one }) => ({
  quiz: one(quizzes, {
    fields: [attempts.quizId],
    references: [quizzes.id],
  }),
  student: one(users, {
    fields: [attempts.studentId],
    references: [users.id],
  }),
}));

// === SCHEMAS ===

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertQuizSchema = createInsertSchema(quizzes).omit({ id: true, createdAt: true });
export const insertAttemptSchema = createInsertSchema(attempts).omit({ id: true, completedAt: true });

// === TYPES ===

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Quiz = typeof quizzes.$inferSelect;
export type InsertQuiz = z.infer<typeof insertQuizSchema>;

export type Attempt = typeof attempts.$inferSelect;
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;

// Custom Types for API
export type Question = {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
};

export type QuizWithFaculty = Quiz & { facultyName: string };
export type AttemptWithDetails = Attempt & { quizTitle: string; studentName: string; studentEmail: string };
