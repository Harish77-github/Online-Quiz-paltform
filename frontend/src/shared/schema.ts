import { z } from "zod";

// ─── Question type ───────────────────────────────────────────────
export type Question = {
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
};

// ─── User ────────────────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: "student" | "faculty";
  isVerified?: boolean;
  createdAt?: string | null;
}

export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  name: z.string().min(1),
  role: z.enum(["student", "faculty"]),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

// ─── Quiz ────────────────────────────────────────────────────────
export interface Quiz {
  id: string;
  title: string;
  description: string;
  facultyId: string;
  questions: Question[];
  availableFrom?: string | null;
  availableUntil?: string | null;
  isAlwaysAvailable?: boolean;
  durationMinutes?: number | null;
  accessCode?: string | null;
  hasAccessCode?: boolean;
  published?: boolean;
  createdAt?: string | null;
}

export const insertQuizSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  facultyId: z.string().optional(),
  questions: z.array(
    z.object({
      questionText: z.string().min(1),
      options: z.array(z.string()),
      correctAnswerIndex: z.number(),
    })
  ),
  availableFrom: z.string().nullable().optional(),
  availableUntil: z.string().nullable().optional(),
  isAlwaysAvailable: z.boolean().optional(),
  durationMinutes: z.number().nullable().optional(),
  accessCode: z.string().nullable().optional(),
  published: z.boolean().optional(),
});

export type InsertQuiz = z.infer<typeof insertQuizSchema>;

// ─── Attempt ─────────────────────────────────────────────────────
export interface DetailedAnswer {
  questionId?: string;
  questionText: string;
  selectedAnswer: string | null;
  correctAnswer: string;
  isCorrect: boolean;
}

export interface Attempt {
  id: string;
  quizId: string;
  studentId: string;
  answers: DetailedAnswer[] | number[];
  score: number;
  totalQuestions: number;
  terminated?: boolean;
  terminationReason?: string | null;
  violations?: number;
  isLocked?: boolean;
  isAutoSubmitted?: boolean;
  startedAt?: string | null;
  expiresAt?: string | null;
  timeTakenSeconds?: number | null;
  completedAt?: string | null;
}

export const insertAttemptSchema = z.object({
  quizId: z.string(),
  studentId: z.string(),
  answers: z.array(z.number()),
  score: z.number(),
  totalQuestions: z.number(),
  terminated: z.boolean().optional(),
  terminationReason: z.string().nullable().optional(),
});

export type InsertAttempt = z.infer<typeof insertAttemptSchema>;

// ─── Composite types ─────────────────────────────────────────────
export type QuizWithFaculty = Quiz & { facultyName: string };
export type AttemptWithDetails = Attempt & { quizTitle: string; studentName: string; studentEmail: string };
