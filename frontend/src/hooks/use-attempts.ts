import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

/*
Attempt type for frontend
*/
export interface AttemptPayload {

  quizId: string;   // FIXED: string for MongoDB ObjectId

  answers: number[];

  terminated?: boolean;

  terminationReason?: string;

  violations?: number;

  isAutoSubmitted?: boolean;

  accessCode?: string;

  startedAt?: string;

}

/*
Submit attempt
*/
export function useSubmitAttempt() {

  return useMutation({

    mutationFn: async (data: AttemptPayload) => {

      const res = await apiRequest(

        "POST",

        `/api/quizzes/${data.quizId}/attempts`,

        {

          answers: data.answers,

          terminated: data.terminated || false,

          terminationReason: data.terminationReason || null,

          violations: data.violations || 0,

          isAutoSubmitted: data.isAutoSubmitted || false,

          accessCode: data.accessCode || undefined,

          startedAt: data.startedAt || undefined,

        }

      );

      return res.json();

    },

  });

}

/*
Student attempt history
*/
export function useMyAttempts() {

  return useQuery({

    queryKey: ["/api/my-attempts"],

    queryFn: async () => {

      const res = await apiRequest(

        "GET",

        "/api/my-attempts"

      );

      return res.json();

    },

  });

}

/*
Faculty quiz attempts
*/
export function useQuizAttempts(quizId: string) {

  return useQuery({

    queryKey: [`/api/quizzes/${quizId}/attempts`],

    queryFn: async () => {

      const res = await apiRequest(

        "GET",

        `/api/quizzes/${quizId}/attempts`

      );

      return res.json();

    },

    enabled: !!quizId,

  });

}