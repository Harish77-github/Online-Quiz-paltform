import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { ReactNode } from "react";

type Role = "student" | "faculty";

interface ProtectedRouteProps {
  path: string;
  component: () => ReactNode;
  allowedRoles?: Role[];
}

export function ProtectedRoute({ path, component: Component, allowedRoles }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  return (
    <Route path={path}>
      {() => {
        if (isLoading) {
          return (
            <div className="flex items-center justify-center min-h-screen bg-background">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          );
        }

        if (!user) {
          return <Redirect to="/login" />;
        }

        if (allowedRoles && !allowedRoles.includes(user.role as Role)) {
          return <Redirect to="/" />;
        }

        return <Component />;
      }}
    </Route>
  );
}
