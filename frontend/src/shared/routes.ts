import { z } from "zod";
import {
  insertUserSchema,
  insertQuizSchema,
  type User,
  type Quiz,
  type Attempt,
  type QuizWithFaculty,
  type AttemptWithDetails,
} from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  unauthorized: z.object({ message: z.string() }),
  notFound: z.object({ message: z.string() }),
  internal: z.object({ message: z.string() }),
};

export const registerSchema = insertUserSchema.extend({
  facultySecret: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const api = {
  auth: {
    register: {
      method: "POST" as const,
      path: "/api/auth/register" as const,
      input: registerSchema,
      responses: {
        201: z.custom<User>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: "POST" as const,
      path: "/api/auth/login" as const,
      input: loginSchema,
      responses: {
        200: z.object({
          token: z.string(),
          user: z.custom<User>(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    me: {
      method: "GET" as const,
      path: "/api/auth/me" as const,
      responses: {
        200: z.custom<User>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  quizzes: {
    list: {
      method: "GET" as const,
      path: "/api/quizzes" as const,
      responses: {
        200: z.array(z.custom<QuizWithFaculty>()),
      },
    },
    create: {
      method: "POST" as const,
      path: "/api/quizzes" as const,
      input: insertQuizSchema.omit({ facultyId: true }),
      responses: {
        201: z.custom<Quiz>(),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: "GET" as const,
      path: "/api/quizzes/:id" as const,
      responses: {
        200: z.custom<Quiz>(),
        404: errorSchemas.notFound,
      },
    },
  },
  attempts: {
    create: {
      method: "POST" as const,
      path: "/api/quizzes/:id/attempt" as const,
      input: z.object({
        answers: z.array(z.number()),
        terminated: z.boolean().default(false),
        terminationReason: z.string().optional(),
      }),
      responses: {
        201: z.custom<Attempt>(),
        401: errorSchemas.unauthorized,
      },
    },
    myAttempts: {
      method: "GET" as const,
      path: "/api/attempts/my" as const,
      responses: {
        200: z.array(z.custom<Attempt & { quizTitle: string }>()),
      },
    },
    byQuiz: {
      method: "GET" as const,
      path: "/api/quizzes/:id/attempts" as const,
      responses: {
        200: z.array(z.custom<Attempt & { studentName: string; studentEmail: string }>()),
        403: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
