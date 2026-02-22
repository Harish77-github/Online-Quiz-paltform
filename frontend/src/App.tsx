import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import toast from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Navigation } from "@/components/Navigation";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useState, useEffect } from "react";

import NotFound from "@/pages/not-found";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import VerifyEmail from "@/pages/VerifyEmail";
import ForgotPassword from "@/pages/ForgotPassword";
import ResetPassword from "@/pages/ResetPassword";
import StudentDashboard from "@/pages/StudentDashboard";
import FacultyDashboard from "@/pages/FacultyDashboard";
import CreateQuiz from "@/pages/CreateQuiz";
import TakeQuiz from "@/pages/TakeQuiz";
import StudentHistory from "@/pages/StudentHistory";
import QuizAttempts from "@/pages/QuizAttempts";

// Wrapper to handle dashboard redirection based on role
function DashboardRouter() {
  const { user } = useAuth();
  
  if (!user) return <Redirect to="/login" />;
  
  if (user.role === "faculty") {
    return <FacultyDashboard />;
  }
  
  return <StudentDashboard />;
}

// Global session expiration check
function useSessionExpiryCheck() {
  useEffect(() => {
    const checkSession = () => {
      const token = sessionStorage.getItem("token");
      const loginTime = sessionStorage.getItem("loginTime");

      if (token && loginTime) {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;

        if (now - parseInt(loginTime, 10) > oneDay) {
          sessionStorage.clear();
          toast.error("Session expired! Please login again.");
          window.location.href = "/login";
        }
      }
    };

    // Check on mount
    checkSession();

    // Check every 60 seconds
    const interval = setInterval(checkSession, 60 * 1000);
    return () => clearInterval(interval);
  }, []);
}

function Router() {
  useSessionExpiryCheck();
  const [isFullscreen, setIsFullscreen] = useState(!!document.fullscreenElement);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      {!isFullscreen && <Navigation />}
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/verify-email" component={VerifyEmail} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />
        
        {/* Protected Routes */}
        <ProtectedRoute path="/dashboard" component={DashboardRouter} />
        <ProtectedRoute path="/" component={() => <Redirect to="/dashboard" />} />
        
        {/* Faculty Routes */}
        <ProtectedRoute 
          path="/create-quiz" 
          component={CreateQuiz} 
          allowedRoles={["faculty"]} 
        />
        <ProtectedRoute 
          path="/quiz/:id/attempts" 
          component={QuizAttempts} 
          allowedRoles={["faculty"]} 
        />

        {/* Student Routes */}
        <ProtectedRoute 
          path="/quiz/:id" 
          component={TakeQuiz} 
          allowedRoles={["student"]} 
        />
        <ProtectedRoute 
          path="/history" 
          component={StudentHistory} 
          allowedRoles={["student"]} 
        />

        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster
            position="bottom-right"
            reverseOrder={false}
            toastOptions={{
              duration: 4000,
              style: {
                background: "#111827",
                color: "#fff",
                borderRadius: "8px",
              },
              success: {
                style: {
                  border: "1px solid #22c55e",
                },
              },
              error: {
                style: {
                  border: "1px solid #ef4444",
                },
              },
            }}
          />
          <Router />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
