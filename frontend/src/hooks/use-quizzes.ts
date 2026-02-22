import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

/*
Normalize MongoDB _id → id safely
Handles missing fields without crashing frontend
*/
function normalizeQuiz(quiz: any) {

  if (!quiz) return null;

  return {
    ...quiz,

    // ensure consistent id field
    id: quiz._id || quiz.id,

    // ensure facultyName always exists for student dashboard
    facultyName:
      quiz.facultyName ||
      quiz.facultyId?.name ||
      "Unknown",

    // ensure questions always exists
    questions: quiz.questions || [],

    // ensure availability fields exist
    isAlwaysAvailable:
      quiz.isAlwaysAvailable ?? true,

    availableFrom:
      quiz.availableFrom ?? null,

    availableUntil:
      quiz.availableUntil ?? null,

    // ensure new fields exist
    durationMinutes:
      quiz.durationMinutes ?? null,

    hasAccessCode:
      quiz.hasAccessCode ?? false,

  };
}

/*
Get all quizzes
*/
export function useQuizzes() {

  return useQuery({

    queryKey: ["quizzes"],

    queryFn: async () => {

      const res = await apiRequest(
        "GET",
        "/api/quizzes"
      );

      const data = await res.json();

      if (!Array.isArray(data)) {
        console.error("Invalid quizzes response:", data);
        return [];
      }

      return data
        .map(normalizeQuiz)
        .filter(Boolean);
    },

  });
}

/*
Create quiz
*/
export function useCreateQuiz() {

  const queryClient = useQueryClient();

  return useMutation({

    mutationFn: async (quizData: any) => {

      const res = await apiRequest(
        "POST",
        "/api/quizzes",
        quizData
      );

      const created = await res.json();

      if (!created.success) {
        throw new Error("Failed to publish quiz");
      }

      return normalizeQuiz(created);
    },

    onSuccess: async () => {

      /*
      CRITICAL: refresh quizzes everywhere
      */
      await queryClient.invalidateQueries({
        queryKey: ["quizzes"],
      });

      await queryClient.refetchQueries({
        queryKey: ["quizzes"],
      });

    },

  });
}

/*
Get single quiz
*/
export function useQuiz(id: string) {

  return useQuery({

    queryKey: ["quiz", id],

    queryFn: async () => {

      const res = await apiRequest(
        "GET",
        `/api/quizzes/${id}`
      );

      const quiz = await res.json();

      return normalizeQuiz(quiz);
    },

    enabled: !!id,

  });
}


