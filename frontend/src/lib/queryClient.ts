import { QueryClient, QueryFunction } from "@tanstack/react-query";

/*
Central auth header builder
*/
function getAuthHeaders(): Record<string, string> {

  const token = sessionStorage.getItem("token");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
}

/*
Error handler
*/
async function throwIfResNotOk(res: Response) {

  if (!res.ok) {

    const text = await res.text();

    throw new Error(text || res.statusText);
  }
}

/*
Main API request
*/
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown
): Promise<Response> {

  const res = await fetch(url, {
    method,
    headers: getAuthHeaders(),
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);

  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

/*
React Query default fetch
*/
export const getQueryFn =
  <T>({ on401 }: { on401: UnauthorizedBehavior }): QueryFunction<T> =>
  async ({ queryKey }) => {

    const res = await fetch(queryKey.join("/") as string, {
      headers: getAuthHeaders(),
    });

    if (res.status === 401 && on401 === "returnNull") {
      return null as T;
    }

    await throwIfResNotOk(res);

    return res.json();
  };

export const queryClient = new QueryClient({

  defaultOptions: {

    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      staleTime: 30000,
      retry: false,
    },

    mutations: {
      retry: false,
    },

  },

});
